// @ts-nocheck
import { sileroVadAvailable } from '../../vad/assets.js';
import { defaultSettings, voiceDetectionSilenceMs } from '../../../core/settings.js';
import { acquireSileroVadStream, attachSileroVadCapture } from '../../vad/SileroVadRuntime.js';

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
    voiceDetectionEngine = defaultSettings.voiceDetectionEngine,
    vadFactory = acquireSileroVadStream,
    vadCapture = attachSileroVadCapture,
    vadAvailable = () => sileroVadAvailable(globals.fetch),
    vadErrorMessage = () => 'Silero VAD is unavailable. Select energy detection or retry.',
    voiceDetectionPreset = defaultSettings.voiceDetectionPreset,
    voiceDetectionCustomSilenceMs = defaultSettings.voiceDetectionCustomSilenceMs,
    maxUtteranceSeconds = 60,
  } = {}) {
    this.g = globals;
    this.meter = meter;
    this.voiceDetectionEngine = voiceDetectionEngine;
    this.vadFactory = vadFactory;
    this.vadCapture = vadCapture;
    this.vadAvailable = vadAvailable;
    this.vadErrorMessage = vadErrorMessage;
    this.session = null;
    this.lang = 'pt-BR';
    this.voiceDetectionPreset = voiceDetectionPreset;
    this.voiceDetectionCustomSilenceMs = voiceDetectionCustomSilenceMs;
    this.maxUtteranceSeconds = maxUtteranceSeconds;
    this.route = ROUTE;
  }
  get segmentation() {
    return { silenceMs: voiceDetectionSilenceMs(this) };
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
    const startGeneration = this.startGeneration = (this.startGeneration || 0) + 1;
    if (signal?.aborted) throw abortError();
    const context = this.meter?.context,
      source = this.meter?.source;
    const silero = this.voiceDetectionEngine === 'silero' && (await this.vadAvailable());
    if (signal?.aborted || this.startGeneration !== startGeneration) throw abortError();
    if (!context || !source || (!silero && typeof context.createScriptProcessor !== 'function'))
      throw new Error('This browser cannot capture PCM audio for Whisper HTTP.');
    const sampleRate = silero ? 16000 : context.sampleRate;
    const processor = silero ? null : context.createScriptProcessor(4096, 1, 1),
      gain = silero ? null : context.createGain?.();
    if (processor) {
      if (gain) {
        gain.gain.value = 0;
        processor.connect(gain);
        gain.connect(context.destination);
      } else processor.connect(context.destination);
    }
    const session = {
      operation: id(),
      processor,
      gain,
      detector: silero ? 'silero' : 'energy',
      sampleRate,
      vad: null,
      capture: null,
      preRoll: [],
      speechSamples: 0,
      finished: false,
      chunks: [],
      samples: 0,
      voiced: false,
      startedAt: null,
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
      if (
        !session.voiced ||
        session.samples < sampleRate * 0.25 ||
        (silero && session.speechSamples < sampleRate * 0.25)
      ) {
        session.chunks = [];
        session.startedAt = null;
        session.samples = 0;
        session.voiced = false;
        session.silence = 0;
        session.speechSamples = 0;
        return;
      }
      const samples = new Float32Array(session.samples);
      let at = 0;
      for (const chunk of session.chunks) {
        samples.set(chunk, at);
        at += chunk.length;
      }
      const startedAt = session.startedAt;
      session.startedAt = null;
      session.chunks = [];
      session.samples = 0;
      session.voiced = false;
      session.silence = 0;
      session.speechSamples = 0;
      session.transcriptionQueue.push({ samples, startedAt });
      notifyProcessing();
      void drain();
    };
    const drain = async () => {
      if (session.draining || !valid()) return;
      session.draining = true;
      try {
        while (valid() && session.transcriptionQueue.length) {
          const { samples, startedAt } = session.transcriptionQueue.shift();
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
              body: encodeMonoPcm16Wav(samples, sampleRate),
              signal: request.signal,
            });
            const json = await response.json();
            if (!response.ok || !json?.ok)
              throw new Error(json?.error?.message || 'HTTP transcription failed.');
            if (valid() && json.value.text)
              onResult?.({ final: json.value.text, interim: '', startedAt });
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
    if (!silero)
      processor.onaudioprocess = (event) => {
        if (!valid()) return;
        const data = new Float32Array(event.inputBuffer.getChannelData(0)),
          rms = Math.sqrt(data.reduce((sum, x) => sum + x * x, 0) / data.length);
        if (rms > 0.012) {
          if (!session.voiced)
            session.startedAt = Date.now() - Math.round((data.length / context.sampleRate) * 1000);
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
    session.finish = enqueue;
    session.abort = () => this.stop();
    signal?.addEventListener('abort', session.abort, { once: true });
    if (signal?.aborted || !valid()) {
      await this.stop();
      throw abortError();
    }
    if (!silero) {
      source.connect(processor);
      return;
    }
    const resetSegment = () => {
      session.chunks = [];
      session.samples = session.silence = session.speechSamples = 0;
      session.preRoll = [];
      session.voiced = false;
      session.startedAt = null;
      onActivity?.(false);
    };
    const failVad = (error) => {
      if (!valid() || session.finished) return;
      void this.stop();
      onActivity?.(false);
      onError?.(new Error(this.vadErrorMessage(error)));
    };
    try {
      const vad = this.vadFactory({
        onReset: () => {
          if (valid()) resetSegment();
        },
        onError: failVad,
        onProbability: ({ probability, pcm }) => {
          if (!valid() || session.finished) return;
          // Hysteresis and a bounded 320 ms pre-roll are isolated per source.
          const active = probability >= (session.voiced ? 0.35 : 0.5);
          if (!session.voiced && !active) {
            session.preRoll.push(pcm);
            if (session.preRoll.length > 10) session.preRoll.shift();
            return;
          }
          if (!session.voiced) {
            session.chunks = session.preRoll;
            session.preRoll = [];
            session.samples = session.chunks.reduce((n, frame) => n + frame.length, 0);
            session.startedAt =
              Date.now() - Math.round(((session.samples + pcm.length) / sampleRate) * 1000);
            session.voiced = true;
          }
          if (active) {
            session.speechSamples += pcm.length;
            session.silence = 0;
          } else session.silence += pcm.length;
          onActivity?.(active);
          session.chunks.push(pcm);
          session.samples += pcm.length;
          if (
            session.silence > sampleRate * (this.segmentation.silenceMs / 1000) ||
            session.samples > sampleRate * this.maxUtteranceSeconds
          )
            enqueue();
        },
      });
      session.vad = vad;
      const capture = await this.vadCapture(context, source, vad);
      if (!valid()) {
        capture.release();
        vad.release();
        throw abortError();
      }
      session.capture = capture;
    } catch (error) {
      if (this.session === session) await this.stop();
      if (error.name === 'AbortError' || signal?.aborted) throw abortError();
      throw new Error(this.vadErrorMessage(error));
    }
  }
  finish() {
    const session = this.session;
    if (!session) return;
    session.finished = true;
    session.capture?.release();
    session.vad?.release();
    if (session.processor) session.processor.onaudioprocess = null;
    try {
      if (session.processor) this.meter?.source?.disconnect(session.processor);
    } catch {}
    session.finish?.();
  }
  async stop() {
    this.startGeneration = (this.startGeneration || 0) + 1;
    const session = this.session;
    if (!session) return;
    this.session = null;
    session.signal?.removeEventListener('abort', session.abort);
    session.finished = true;
    session.capture?.release();
    session.vad?.release();
    if (session.processor) session.processor.onaudioprocess = null;
    try {
      if (session.processor) this.meter?.source?.disconnect(session.processor);
    } catch {}
    try {
      session.processor?.disconnect();
      session.gain?.disconnect();
    } catch {}
    session.transcriptionQueue = [];
    session.activeRequest?.abort();
    session.activeRequest = null;
    session.onProcessingChange?.({ queued: 0, active: false, pending: 0 });
  }
}
