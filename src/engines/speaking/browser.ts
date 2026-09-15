// @ts-nocheck
const abortError = () => Object.assign(new Error('Speech playback was cancelled.'), { name: 'AbortError' });

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
    try { return Array.from(this.globals.speechSynthesis?.getVoices?.() ?? []).filter(v => v.localService === true); }
    catch { return []; }
  }

  capability() {
    const supported = typeof this.globals.SpeechSynthesisUtterance === 'function'
      && typeof this.globals.speechSynthesis?.speak === 'function'
      && typeof this.globals.speechSynthesis?.cancel === 'function' && this.voices().length > 0;
    return { supported, local: true, voices:this.voices().map(voice=>({name:voice.name,voiceURI:voice.voiceURI,lang:voice.lang})), pause:typeof this.globals.speechSynthesis?.pause === 'function', resume:typeof this.globals.speechSynthesis?.resume === 'function', ...(supported ? {} : { reason: 'Local browser speech synthesis is unavailable. Enable an installed local system voice, refresh the voice list, or choose another local speaking engine. Remote voices are not allowed.' }) };
  }

  async speak(text, { voice, rate = 1, signal } = {}) {
    // No await before replacement: concurrent calls cannot enqueue obsolete utterances.
    this.stop();
    if (signal?.aborted) throw abortError();
    if (typeof text !== 'string') throw new TypeError('Speech text must be a string.');
    if (!Number.isFinite(rate) || rate < 0.1 || rate > 10) throw new RangeError('Speech rate must be between 0.1 and 10.');
    const capability = this.capability();
    if (!capability.supported) throw new Error(capability.reason);
    const voices = this.voices();
    const chosen = voice == null
      ? voices.find(v => v.lang?.toLowerCase() === this.lang.toLowerCase()) ?? voices[0]
      : voices.find(v => typeof voice === 'string' ? v.voiceURI === voice || v.name === voice : v === voice);
    if (!chosen) throw new Error('The selected voice is not an available local browser voice. Choose a voice from voices().');
    if (!text.trim()) return;
    const utterance = new this.globals.SpeechSynthesisUtterance(text);
    utterance.voice = chosen;
    utterance.lang = chosen.lang || this.lang;
    utterance.rate = rate;
    return new Promise((resolve, reject) => {
      const finish = error => {
        if (this.current !== job) return;
        this.current = null;
        utterance.onend = null;
        utterance.onerror = null;
        signal?.removeEventListener('abort', cancel);
        error ? reject(error) : resolve();
      };
      const cancel = () => { if (this.current === job) this.stop(); };
      const job = { finish, utterance };
      this.current = job;
      utterance.onend = () => finish();
      utterance.onerror = event => finish(Object.assign(new Error('Browser speech synthesis failed: ' + (event.error || 'unknown error')), { code: event.error }));
      signal?.addEventListener('abort', cancel, { once: true });
      if (signal?.aborted) { cancel(); return; }
      try {
        // cancel() can leave the shared synthesizer paused in some browsers.
        this.globals.speechSynthesis.resume?.();
        this.globals.speechSynthesis.speak(utterance);
      } catch (error) { finish(error); }
    });
  }

  async stop() {
    if (!this.current) return;
    this.current.finish(abortError());
    // Detach first: cancel may synchronously emit end/error.
    try { this.globals.speechSynthesis.cancel(); } catch { /* Already released locally. */ }
  }

  pause() { if (!this.current || typeof this.globals.speechSynthesis.pause !== 'function') return false; this.globals.speechSynthesis.pause(); return true; }
  resume() { if (!this.current || typeof this.globals.speechSynthesis.resume !== 'function') return false; this.globals.speechSynthesis.resume(); return true; }
}
