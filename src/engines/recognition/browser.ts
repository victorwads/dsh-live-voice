// @ts-nocheck
const abortError = () =>
  Object.assign(new Error('Speech recognition was cancelled.'), { name: 'AbortError' });
const localReason =
  'Local browser speech recognition is unavailable for this language. Install the local language pack, or explicitly turn off local-only processing in Settings if you permit the browser recognition service to process audio.';
const notify = (callback, value) => {
  try {
    callback?.(value);
  } catch {
    /* Consumer errors must not retain microphone ownership. */
  }
};

/** Web Speech recognition with explicit user-selected local-only or browser-service processing.
 * When local-only plus auto-install is selected, the browser's native language-pack install API is used.
 * All browser globals (including optional setTimeout/clearTimeout) are injectable.
 * capability({lang}?) asynchronously returns {supported, local:true, reason?} without starting capture.
 * start({lang,signal,onResult,onActivity,onError}?) resolves when native start() is accepted,
 * not when permission is granted. Native asynchronous errors go to onError(Error).
 * onResult({interim,final}) contains the current interim string and NEW final text only.
 * onActivity(boolean) reports speech activity, not microphone permission/readiness.
 * stop() aborts capture, discards pending results, removes handlers and cancels restarts.
 * Consecutive no-progress restarts are bounded; speech or nonempty results reset the budget.
 * Native start acceptance alone is not progress. Restart delay backs off up to 30 seconds.
 */
export class BrowserRecognitionEngine {
  constructor({
    globals = globalThis,
    lang = 'pt-BR',
    processLocally = true,
    autoInstallLocalPack = true,
    onResult,
    onActivity,
    onError,
    maxRestarts = 3,
    restartDelayMs = 100,
  } = {}) {
    if (!Number.isInteger(maxRestarts) || maxRestarts < 0 || maxRestarts > 100)
      throw new RangeError('maxRestarts must be an integer between 0 and 100.');
    if (!Number.isFinite(restartDelayMs) || restartDelayMs < 0)
      throw new RangeError('restartDelayMs must be nonnegative.');
    Object.assign(this, {
      globals,
      lang,
      processLocally,
      autoInstallLocalPack,
      onResult,
      onActivity,
      onError,
      maxRestarts,
      restartDelayMs,
    });
    this.session = null;
  }

  get active() {
    return this.session !== null;
  }
  get Recognition() {
    try {
      const standard = this.globals?.SpeechRecognition;
      return typeof standard === 'function' ? standard : this.globals?.webkitSpeechRecognition;
    } catch {
      return undefined;
    }
  }

  async capability({ lang = this.lang, processLocally = this.processLocally } = {}) {
    try {
      const Recognition = this.Recognition;
      if (typeof Recognition !== 'function') throw new Error();
      const probe = new Recognition();
      if (typeof probe.start !== 'function' || typeof probe.abort !== 'function') throw new Error();
      if (!processLocally)
        return {
          supported: true,
          local: false,
          reason: 'Browser recognition service may process audio remotely.',
        };
      if (typeof Recognition.available !== 'function' || !('processLocally' in probe))
        throw new Error();
      probe.processLocally = true;
      if (probe.processLocally !== true) throw new Error();
      let availability = await Recognition.available({ langs: [lang], processLocally: true });
      if (availability === 'downloadable' && this.autoInstallLocalPack) {
        const installed = await Recognition.install?.({ langs: [lang], processLocally: true });
        if (installed === true)
          availability = await Recognition.available({ langs: [lang], processLocally: true });
        else
          return {
            supported: false,
            local: true,
            availability,
            reason: `The browser could not install the local ${lang} language pack. Disable local processing to use the browser recognition service, or try again later.`,
          };
      }
      if (availability !== 'available')
        return {
          supported: false,
          local: true,
          availability,
          reason: `Local recognition for ${lang}: ${availability}. ${availability === 'downloadable' ? 'The language pack is not installed; enable automatic installation or browser-service recognition.' : availability === 'downloading' ? 'The browser is still installing the language pack.' : 'The browser cannot currently provide on-device recognition for this language.'}`,
        };
      return { supported: true, local: true };
    } catch {
      return {
        supported: false,
        local: processLocally,
        reason: processLocally
          ? localReason
          : 'Browser speech recognition is unavailable in this browser.',
      };
    }
  }
  async installLocalPack({ lang = this.lang } = {}) {
    const Recognition = this.Recognition;
    if (typeof Recognition?.install !== 'function')
      throw new Error('This browser cannot install local speech-recognition language packs.');
    const result = await Recognition.install({ langs: [lang], processLocally: true });
    if (result !== true) throw new Error(`Local recognition for ${lang} could not be installed.`);
    return this.capability({ lang, processLocally: true });
  }

  async start({
    lang = this.lang,
    signal,
    onResult = this.onResult,
    onActivity = this.onActivity,
    onError = this.onError,
  } = {}) {
    this.stop();
    if (signal?.aborted) throw abortError();
    const session = {
      lang,
      signal,
      onResult,
      onActivity,
      onError,
      restarts: 0,
      timer: null,
      recognition: null,
      speaking: false,
    };
    this.session = session;
    const cancelled = new Promise((resolve, reject) => {
      session.rejectCancelled = reject;
    });
    session.cancel = () => {
      if (this.session === session) this.stop();
    };
    signal?.addEventListener('abort', session.cancel, { once: true });
    const capability = await Promise.race([
      this.capability({ lang, processLocally: this.processLocally }),
      cancelled,
    ]);
    if (this.session !== session || signal?.aborted) {
      session.cancel();
      throw abortError();
    }
    if (!capability.supported) {
      this.stop();
      throw new Error(capability.reason);
    }
    try {
      this._begin(session);
      if (this.session !== session) throw abortError();
    } catch (error) {
      if (this.session === session) this.stop();
      throw error;
    }
  }

  _activity(session, active) {
    if (session.speaking === active) return;
    session.speaking = active;
    notify(session.onActivity, active);
  }

  _detach(recognition) {
    if (!recognition) return;
    for (const name of ['onresult', 'onerror', 'onend', 'onspeechstart', 'onspeechend'])
      recognition[name] = null;
  }

  _fail(session, error) {
    if (this.session !== session) return;
    this.stop();
    notify(session.onError, error);
  }

  _begin(session) {
    if (this.session !== session) return;
    const recognition = new this.Recognition();
    if (this.processLocally) {
      if (!('processLocally' in recognition)) throw new Error(localReason);
      recognition.processLocally = true;
      if (recognition.processLocally !== true) throw new Error(localReason);
    } else if ('processLocally' in recognition) recognition.processLocally = false;
    recognition.lang = session.lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    session.recognition = recognition;
    const finals = new Set();
    const valid = () => this.session === session && session.recognition === recognition;
    recognition.onspeechstart = () => {
      if (!valid()) return;
      session.restarts = 0;
      this._activity(session, true);
    };
    recognition.onspeechend = () => {
      if (valid()) this._activity(session, false);
    };
    recognition.onresult = (event) => {
      if (!valid()) return;
      const interim = [],
        final = [];
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? '';
        if (text.trim()) session.restarts = 0;
        if (result.isFinal) {
          if (!finals.has(i)) {
            finals.add(i);
            final.push(text);
          }
        } else interim.push(text);
      }
      notify(session.onResult, { interim: interim.join(' '), final: final.join(' ') });
    };
    recognition.onerror = (event) => {
      if (!valid()) return;
      const error = Object.assign(
        new Error('Local browser recognition failed: ' + (event.error || 'unknown error')),
        { code: event.error },
      );
      // no-speech is recoverable only when the browser subsequently ends this session.
      if (event.error === 'no-speech') return;
      else this._fail(session, error);
    };
    recognition.onend = () => {
      if (!valid()) return;
      this._detach(recognition);
      session.recognition = null;
      this._activity(session, false);
      if (this.session !== session) return;
      if (session.restarts >= this.maxRestarts) {
        this._fail(
          session,
          Object.assign(
            new Error(
              'Local browser recognition stopped repeatedly. Restart listening manually or choose another local engine.',
            ),
            { code: 'restart-limit' },
          ),
        );
        return;
      }
      session.restarts++;
      session.timer = (this.globals.setTimeout ?? globalThis.setTimeout)(
        () => {
          session.timer = null;
          if (this.session !== session) return;
          try {
            this._begin(session);
          } catch (error) {
            this._fail(session, error);
          }
        },
        Math.min(30_000, this.restartDelayMs * 2 ** Math.min(session.restarts - 1, 20)),
      );
    };
    recognition.start();
  }

  async stop() {
    const session = this.session;
    if (!session) return;
    this.session = null;
    session.rejectCancelled(abortError());
    session.signal?.removeEventListener('abort', session.cancel);
    if (session.timer !== null)
      (this.globals.clearTimeout ?? globalThis.clearTimeout)(session.timer);
    this._detach(session.recognition);
    try {
      session.recognition?.abort();
    } catch {
      /* Browser already ended capture. */
    }
    this._activity(session, false);
  }
}
