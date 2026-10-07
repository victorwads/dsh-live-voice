// @ts-nocheck
import { MicrophoneMeter } from './microphone.js';

/** Display permission must be requested synchronously from a user gesture. */
export function requestSharedAudio(globals = globalThis) {
  return globals.navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
}

export class SharedAudioMeter extends MicrophoneMeter {
  constructor(globals = globalThis) {
    super(globals);
    this.pending = null;
  }
  provide(request) {
    this.pending = Promise.resolve(request);
    this.pending.catch(() => {});
  }
  async capability() {
    return {
      supported:
        typeof this.g.navigator?.mediaDevices?.getDisplayMedia === 'function' &&
        typeof (this.g.AudioContext || this.g.webkitAudioContext) === 'function',
    };
  }
  async stop() {
    const pending = this.pending;
    this.pending = null;
    pending?.then((stream) => stream.getTracks().forEach((track) => track.stop())).catch(() => {});
    return super.stop();
  }
  async start({ signal } = {}) {
    const pending = this.pending;
    this.pending = null;
    await super.stop();
    if (!pending) throw new Error('Shared audio permission was not requested.');
    const job = {
      signal,
      stream: null,
      context: null,
      source: null,
      cancel: () => {
        if (this.current === job) void this.stop();
      },
      cancelled: () => {},
    };
    this.current = job;
    signal?.addEventListener('abort', job.cancel, { once: true });
    try {
      const stream = await pending;
      job.stream = stream;
      if (signal?.aborted || this.current !== job) {
        this._dispose(job);
        return false;
      }
      const tracks = stream.getAudioTracks();
      if (!tracks.length) throw new Error('No shared audio track was returned.');
      const AudioContext = this.g.AudioContext || this.g.webkitAudioContext;
      job.context = new AudioContext();
      // Exclude video and never route captured audio to audible output.
      job.source = job.context.createMediaStreamSource(new this.g.MediaStream(tracks));
      job.analyser = job.context.createAnalyser();
      job.analyser.fftSize = 256;
      job.source.connect(job.analyser);
      job.samples = new Float32Array(job.analyser.fftSize);
      this.stream = stream;
      this.context = job.context;
      this.source = job.source;
      this.analyser = job.analyser;
      this.samples = job.samples;
      await job.context.resume();
      return this.current === job;
    } catch (error) {
      if (this.current === job) {
        this.current = null;
        this._clear();
      }
      this._dispose(job);
      if (signal?.aborted) return false;
      throw error;
    }
  }
}
