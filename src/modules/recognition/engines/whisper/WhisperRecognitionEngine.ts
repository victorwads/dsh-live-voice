// @ts-nocheck
import { voiceDetectionPresets } from '../../../core/settings.js';

const ROUTE = '/api/dsh-live-voice/whisper';
const id = () => globalThis.crypto.randomUUID();
const abortError = () =>
  Object.assign(new Error('Whisper recognition was cancelled.'), { name: 'AbortError' });
export function encodeMonoPcm16Wav(samples, inputRate) {
  const ratio = inputRate / 16000,
    length = Math.floor(samples.length / ratio),
    out = new Int16Array(length);
  for (let i = 0; i < length; i++) {
    const start = Math.floor(i * ratio),
      end = Math.max(start + 1, Math.floor((i + 1) * ratio));
    let sum = 0;
    for (let j = start; j < end && j < samples.length; j++) sum += samples[j];
    const value = Math.max(-1, Math.min(1, sum / (end - start)));
    out[i] = value < 0 ? value * 32768 : value * 32767;
  }
  const buffer = new ArrayBuffer(44 + out.byteLength),
    view = new DataView(buffer),
    text = (at, s) => {
      for (let i = 0; i < s.length; i++) view.setUint8(at + i, s.charCodeAt(i));
    };
  text(0, 'RIFF');
  view.setUint32(4, 36 + out.byteLength, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 16000, true);
  view.setUint32(28, 32000, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  text(36, 'data');
  view.setUint32(40, out.byteLength, true);
  new Int16Array(buffer, 44).set(out);
  return buffer;
}
export class WhisperHttpRecognitionEngine {
  constructor({
    globals = globalThis,
    meter,
    voiceDetectionPreset = 'natural',
    maxUtteranceSeconds = 60,
  } = {}) {
    this.g = globals;
    this.meter = meter;
    this.session = null;
    this.lang = 'pt-BR';
    this.voiceDetectionPreset = voiceDetectionPreset;
    this.maxUtteranceSeconds = maxUtteranceSeconds;
    this.route = ROUTE;
  }
  get segmentation() {
    return voiceDetectionPresets[this.voiceDetectionPreset] || voiceDetectionPresets.natural;
  }
  async capability() {
    try {
      const response = await this.g.fetch(this.route + '/capabilities', {
          credentials: 'same-origin',
        }),
        json = await response.json();
      return json?.ok
        ? json.value
        : {
            supported: false,
            local: true,
            streaming: false,
            reason: json?.error?.message || 'Whisper HTTP host is unavailable.',
          };
    } catch (error) {
      return {
        supported: false,
        local: true,
        streaming: false,
        reason: 'Whisper HTTP host connection failed: ' + error.message,
      };
    }
  }
  async start({
    lang = this.lang,
    signal,
    onResult,
    onActivity,
    onError,
    onProcessingChange,
  } = {}) {
    await this.stop();
    if (signal?.aborted) throw abortError();
    const context = this.meter?.context,
      source = this.meter?.source;
    if (!context || !source || typeof context.createScriptProcessor !== 'function')
      throw new Error('This browser cannot capture PCM audio for Whisper HTTP.');
    const processor = context.createScriptProcessor(4096, 1, 1),
      gain = context.createGain?.();
    if (gain) {
      gain.gain.value = 0;
      processor.connect(gain);
      gain.connect(context.destination);
    } else processor.connect(context.destination);
    const session = {
      operation: id(),
      processor,
      gain,
      chunks: [],
      samples: 0,
      voiced: false,
      silence: 0,
      transcriptionQueue: [],
      activeRequest: null,
      draining: false,
      onResult,
      onActivity,
      onError,
      onProcessingChange,
      lang,
      signal,
    };
    this.session = session;
    const valid = () => this.session === session && !signal?.aborted;
    const notifyProcessing = () =>
      session.onProcessingChange?.({
        queued: session.transcriptionQueue.length,
        active: !!session.activeRequest,
        pending: session.transcriptionQueue.length + (session.activeRequest ? 1 : 0),
      });
    const enqueue = () => {
      if (!session.voiced || session.samples < context.sampleRate * 0.25) {
        session.chunks = [];
        session.samples = 0;
        session.voiced = false;
        session.silence = 0;
        return;
      }
      const samples = new Float32Array(session.samples);
      let at = 0;
      for (const chunk of session.chunks) {
        samples.set(chunk, at);
        at += chunk.length;
      }
      session.chunks = [];
      session.samples = 0;
      session.voiced = false;
      session.silence = 0;
      session.transcriptionQueue.push(samples);
      notifyProcessing();
      void drain();
    };
    const drain = async () => {
      if (session.draining || !valid()) return;
      session.draining = true;
      try {
        while (valid() && session.transcriptionQueue.length) {
          const samples = session.transcriptionQueue.shift();
          const request = new AbortController();
          session.activeRequest = request;
          notifyProcessing();
          try {
            const response = await this.g.fetch(this.route + '/transcribe', {
              method: 'POST',
              credentials: 'same-origin',
              headers: {
                'content-type': 'audio/wav',
                'x-dlv-client-id': session.operation,
                'x-dlv-operation-id': id(),
                'x-dlv-language': lang,
              },
              body: encodeMonoPcm16Wav(samples, context.sampleRate),
              signal: request.signal,
            });
            const json = await response.json();
            if (!response.ok || !json?.ok)
              throw new Error(json?.error?.message || 'HTTP transcription failed.');
            if (valid() && json.value.text) onResult?.({ final: json.value.text, interim: '' });
          } catch (error) {
            if (error.name !== 'AbortError' && valid()) onError?.(error);
          } finally {
            if (session.activeRequest === request) session.activeRequest = null;
            notifyProcessing();
          }
        }
      } finally {
        session.draining = false;
        notifyProcessing();
      }
    };
    processor.onaudioprocess = (event) => {
      if (!valid()) return;
      const data = new Float32Array(event.inputBuffer.getChannelData(0)),
        rms = Math.sqrt(data.reduce((sum, x) => sum + x * x, 0) / data.length);
      if (rms > 0.012) {
        session.voiced = true;
        session.silence = 0;
        onActivity?.(true);
      } else if (session.voiced) {
        session.silence += data.length;
        onActivity?.(false);
      }
      session.chunks.push(data);
      session.samples += data.length;
      if (
        (session.voiced &&
          session.silence > context.sampleRate * (this.segmentation.silenceMs / 1000)) ||
        session.samples > context.sampleRate * this.maxUtteranceSeconds
      )
        enqueue();
    };
    source.connect(processor);
    session.finish = enqueue;
    session.abort = () => this.stop();
    signal?.addEventListener('abort', session.abort, { once: true });
  }
  finish() {
    const session = this.session;
    if (!session) return;
    session.processor.onaudioprocess = null;
    try {
      this.meter?.source?.disconnect(session.processor);
    } catch {}
    session.finish?.();
  }
  async stop() {
    const session = this.session;
    if (!session) return;
    this.session = null;
    session.signal?.removeEventListener('abort', session.abort);
    session.processor.onaudioprocess = null;
    try {
      this.meter?.source?.disconnect(session.processor);
    } catch {}
    try {
      session.processor.disconnect();
      session.gain?.disconnect();
    } catch {}
    session.transcriptionQueue = [];
    session.activeRequest?.abort();
    session.activeRequest = null;
    session.onProcessingChange?.({ queued: 0, active: false, pending: 0 });
  }
}
