// @ts-nocheck
/** Local-only audio metering. Audio never leaves this module or reaches speakers.
 * start({signal}={}) returns true when ready, false on cancellation/replacement.
 * Permission prompts cannot be dismissed programmatically: late streams are stopped.
 * stop() invalidates immediately; neither pending permission nor context shutdown blocks it.
 */
export class MicrophoneMeter {
  constructor(globals = globalThis) {
    this.g = globals;
    this.epoch = 0;
    this.current = null;
    this.stream = this.context = this.source = this.analyser = this.samples = null;
  }

  async capability() {
    const secure =
      this.g.isSecureContext === true ||
      ['localhost', '127.0.0.1', '::1'].includes(this.g.location?.hostname);
    if (!secure)
      return {
        supported: false,
        permission: 'unavailable',
        reason: 'Microphone capture requires a secure or loopback page.',
      };
    if (typeof this.g.navigator?.mediaDevices?.getUserMedia !== 'function')
      return {
        supported: false,
        permission: 'unavailable',
        reason: 'This browser does not expose microphone capture.',
      };
    const AudioContext = this.g.AudioContext || this.g.webkitAudioContext;
    if (typeof AudioContext !== 'function')
      return {
        supported: false,
        permission: 'unavailable',
        reason: 'This browser does not expose Web Audio for the live waveform.',
      };
    let permission = 'prompt';
    try {
      const status = await this.g.navigator.permissions?.query?.({ name: 'microphone' });
      if (['granted', 'denied', 'prompt'].includes(status?.state)) permission = status.state;
    } catch {
      /* Permission is discovered only when capture is requested. */
    }
    return permission === 'denied'
      ? {
          supported: false,
          permission,
          reason:
            'Microphone permission is denied. Allow it in browser settings, then refresh availability.',
        }
      : { supported: true, permission };
  }

  async start({ signal } = {}) {
    this.stop();
    if (signal?.aborted) return false;
    const job = {
      signal,
      stream: null,
      context: null,
      source: null,
      analyser: null,
      samples: null,
    };
    const cancelled = new Promise((resolve) => {
      job.cancelled = resolve;
    });
    job.cancel = () => {
      if (this.current === job) this.stop();
    };
    this.current = job;
    signal?.addEventListener('abort', job.cancel, { once: true });
    if (signal?.aborted) {
      job.cancel();
      return false;
    }
    const valid = () => this.current === job;
    const capture = async () => {
      try {
        const stream = await this.g.navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        job.stream = stream;
        if (!valid()) {
          this._dispose(job);
          return false;
        }
        this.stream = stream;
        const AudioContext = this.g.AudioContext || this.g.webkitAudioContext;
        job.context = new AudioContext();
        job.analyser = job.context.createAnalyser();
        job.analyser.fftSize = 256;
        job.source = job.context.createMediaStreamSource(stream);
        job.source.connect(job.analyser);
        job.samples = new Float32Array(job.analyser.fftSize);
        this.context = job.context;
        this.source = job.source;
        this.analyser = job.analyser;
        this.samples = job.samples;
        await job.context.resume();
        return valid();
      } catch (error) {
        // A rejected obsolete resume/getUserMedia must never release newer capture.
        if (!valid()) {
          this._dispose(job);
          return false;
        }
        this.current = null;
        this._clear();
        this._dispose(job);
        throw error;
      }
    };
    return Promise.race([capture(), cancelled]);
  }

  level() {
    if (!this.analyser || !this.samples) return 0;
    this.analyser.getFloatTimeDomainData(this.samples);
    return Math.min(
      1,
      Math.sqrt(this.samples.reduce((s, x) => s + x * x, 0) / this.samples.length) * 5,
    );
  }

  _clear() {
    this.stream = this.context = this.source = this.analyser = this.samples = null;
  }

  _dispose(job) {
    job.signal?.removeEventListener('abort', job.cancel);
    const stream = job.stream,
      source = job.source,
      context = job.context;
    job.stream = job.source = job.context = job.analyser = job.samples = null;
    if (stream) {
      for (const track of stream.getTracks()) {
        try {
          track.stop();
        } catch {
          /* Continue releasing remaining tracks. */
        }
      }
    }
    try {
      source?.disconnect();
    } catch {
      /* Already disconnected. */
    }
    try {
      if (context && context.state !== 'closed') Promise.resolve(context.close()).catch(() => {});
    } catch {
      /* Closing an obsolete context must not block future capture. */
    }
  }

  async release() {
    return this.stop();
  }

  async stop() {
    ++this.epoch;
    const job = this.current;
    this.current = null;
    this._clear();
    if (!job) return;
    job.cancelled(false);
    this._dispose(job);
  }
}
