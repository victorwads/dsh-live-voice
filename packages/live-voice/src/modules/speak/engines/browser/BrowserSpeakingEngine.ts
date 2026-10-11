// @ts-nocheck
const abortError = () =>
  Object.assign(new Error('Speech playback was cancelled.'), { name: 'AbortError' });

/** Local-only Web Speech synthesis. The browser synthesis queue is shared: use one owner.
 * Inject { globals: { speechSynthesis, SpeechSynthesisUtterance } } for tests.
 * capability() is synchronous; voices() returns native local voices (refresh after voiceschanged).
 * speak() replaces prior speech and resolves only on completion. Cancellation rejects AbortError.
 * voice accepts a listed voice object, voiceURI, or name; no remote/default fallback is used.
 */
export class BrowserSpeakingEngine {
  constructor({ globals = globalThis, lang = 'pt-BR' } = {}) {
    this.globals = globals;
    this.lang = lang;
    this.current = null;
  }

  voices() {
    try {
      return Array.from(this.globals.speechSynthesis?.getVoices?.() ?? []).filter(
        (v) => v.localService === true,
      );
    } catch {
      return [];
    }
  }

  getPlaybackCapabilities() {
    return {
      pause: typeof this.globals.speechSynthesis?.pause === 'function',
      resume: typeof this.globals.speechSynthesis?.resume === 'function',
    };
  }

  capability() {
    const supported =
      typeof this.globals.SpeechSynthesisUtterance === 'function' &&
      typeof this.globals.speechSynthesis?.speak === 'function' &&
      typeof this.globals.speechSynthesis?.cancel === 'function' &&
      this.voices().length > 0;
    return {
      supported,
      local: true,
      voices: this.voices().map((voice) => ({
        name: voice.name,
        voiceURI: voice.voiceURI,
        lang: voice.lang,
      })),
      ...this.getPlaybackCapabilities(),
      ...(supported
        ? {}
        : {
            reason:
              'Local browser speech synthesis is unavailable. Enable an installed local system voice, refresh the voice list, or choose another local speaking engine. Remote voices are not allowed.',
          }),
    };
  }

  /** Inaudible preparation only: Web Speech does not expose pre-synthesized audio. */
  async prepare(text, options = {}) {
    return this._prepare(text, options);
  }

  _prepare(text, { voice, lang = this.lang, rate = 1, signal } = {}) {
    if (signal?.aborted) throw abortError();
    if (typeof text !== 'string') throw new TypeError('Speech text must be a string.');
    if (!Number.isFinite(rate) || rate < 0.1 || rate > 10)
      throw new RangeError('Speech rate must be between 0.1 and 10.');
    const capability = this.capability();
    if (!capability.supported) throw new Error(capability.reason);
    const voices = this.voices();
    const chosen =
      voice == null
        ? (voices.find((v) => v.lang?.toLowerCase() === lang.toLowerCase()) ?? voices[0])
        : voices.find((v) =>
            typeof voice === 'string' ? v.voiceURI === voice || v.name === voice : v === voice,
          );
    if (!chosen)
      throw new Error(
        'The selected voice is not an available local browser voice. Choose a voice from voices().',
      );
    let disposed = false;
    const createUtterance = () => {
      if (disposed) throw abortError();
      // Voice discovery can change while another segment is playing. Never fall back remotely.
      const available = this.voices().find((value) => value.voiceURI === chosen.voiceURI);
      if (!available) throw new Error('The prepared local browser voice is no longer available.');
      const utterance = new this.globals.SpeechSynthesisUtterance(text);
      utterance.voice = available;
      utterance.lang = available.lang || lang;
      utterance.rate = rate;
      return utterance;
    };
    let utterance = createUtterance();
    return {
      text,
      rate,
      takeUtterance: () => {
        if (disposed) throw abortError();
        if (!this.voices().some((value) => value.voiceURI === chosen.voiceURI))
          throw new Error('The prepared local browser voice is no longer available.');
        // A fresh native utterance is required when replaying retained history.
        const next = utterance || createUtterance();
        utterance = null;
        return next;
      },
      dispose() {
        disposed = true;
        utterance = null;
      },
    };
  }

  async speak(text, options = {}) {
    // No await before replacement: concurrent calls cannot enqueue obsolete utterances.
    this.stop();
    return this.playPrepared(this._prepare(text, options), options);
  }

  async playPrepared(prepared, { signal, onPlaybackStart, retainPrepared = false } = {}) {
    this.stop();
    if (signal?.aborted) {
      if (!retainPrepared) prepared?.dispose?.();
      throw abortError();
    }
    if (!prepared || typeof prepared.takeUtterance !== 'function')
      throw new TypeError('Prepared browser speech is required.');
    if (!prepared.text.trim()) {
      if (!retainPrepared) prepared.dispose();
      return;
    }
    const utterance = prepared.takeUtterance();
    return new Promise((resolve, reject) => {
      const finish = (error) => {
        if (this.current !== job) return;
        this.current = null;
        utterance.onstart = null;
        utterance.onend = null;
        utterance.onerror = null;
        signal?.removeEventListener('abort', cancel);
        if (!retainPrepared) prepared.dispose();
        error ? reject(error) : resolve();
      };
      const cancel = () => {
        if (this.current === job) this.stop();
      };
      const job = {
        finish,
        utterance,
        startedAt: null,
        elapsedMs: 0,
        hasStarted: false,
        estimatedDurationSeconds: Math.max(
          1,
          Array.from(prepared.text).length / (14 * prepared.rate),
        ),
      };
      this.current = job;
      utterance.onstart = () => {
        if (this.current === job && !job.hasStarted) {
          job.hasStarted = true;
          onPlaybackStart?.();
          job.startedAt = Date.now();
        }
      };
      utterance.onend = () => finish();
      utterance.onerror = (event) =>
        finish(
          Object.assign(
            new Error('Browser speech synthesis failed: ' + (event.error || 'unknown error')),
            { code: event.error },
          ),
        );
      signal?.addEventListener('abort', cancel, { once: true });
      if (signal?.aborted) {
        cancel();
        return;
      }
      try {
        // cancel() can leave the shared synthesizer paused in some browsers.
        if (this.globals.speechSynthesis.paused) this.globals.speechSynthesis.resume?.();
        this.globals.speechSynthesis.speak(utterance);
      } catch (error) {
        finish(error);
      }
    });
  }

  async stop() {
    if (!this.current) return;
    this.current.finish(abortError());
    // Detach first: cancel may synchronously emit end/error.
    try {
      this.globals.speechSynthesis.cancel();
    } catch {
      /* Already released locally. */
    }
  }

  getPlaybackProgress() {
    const job = this.current;
    if (!job || !job.hasStarted) return null;
    return {
      positionSeconds:
        (job.elapsedMs + (job.startedAt === null ? 0 : Date.now() - job.startedAt)) / 1000,
      durationSeconds: job.estimatedDurationSeconds,
      approximate: true,
    };
  }
  pause() {
    if (!this.current || typeof this.globals.speechSynthesis.pause !== 'function') return false;
    this.globals.speechSynthesis.pause();
    if (this.current.startedAt !== null) {
      this.current.elapsedMs += Date.now() - this.current.startedAt;
      this.current.startedAt = null;
    }
    return true;
  }
  resume() {
    if (!this.current || typeof this.globals.speechSynthesis.resume !== 'function') return false;
    this.globals.speechSynthesis.resume();
    if (this.current.startedAt === null && this.current.hasStarted)
      this.current.startedAt = Date.now();
    return true;
  }
}
