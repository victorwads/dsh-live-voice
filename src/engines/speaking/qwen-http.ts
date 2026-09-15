// @ts-nocheck
const BASE = '/api/dsh-live-voice/qwen';
const cancelled = () => Object.assign(new Error('Speech was cancelled.'), { name: 'AbortError' });

/** Fetches host-local Qwen WAV audio through authenticated DSH and plays it in
 * the user's browser. The resident server owns model lifetime. */
export class QwenHttpSpeakingEngine {
  constructor({ globals = globalThis, lang = 'pt-BR' } = {}) {
    this.g = globals;
    this.lang = lang;
    this.current = null;
  }
  async capability() {
    try {
      const response = await this.g.fetch(BASE + '/capabilities?kind=tts', {
          credentials: 'same-origin',
        }),
        json = await response.json();
      if (!response.ok || !json?.ok)
        throw new Error(json?.error?.message || 'Qwen capability check failed.');
      return { ...json.value, pause: true, resume: true };
    } catch (error) {
      return {
        supported: false,
        local: true,
        location: 'host',
        pause: true,
        resume: true,
        reason: 'Qwen speech server check failed: ' + (error?.message || error),
      };
    }
  }
  async speak(text, { rate = 1, signal, lang = this.lang } = {}) {
    if (typeof text !== 'string') throw new TypeError('Speech text must be a string.');
    if (!Number.isFinite(rate) || rate < 0.1 || rate > 3)
      throw new RangeError('Speech rate must be between 0.1 and 3.');
    if (signal?.aborted) throw cancelled();
    await this.stop();
    if (!text.trim()) return;
    const operation = { abort: new AbortController(), audio: null, url: null };
    this.current = operation;
    const cancel = () => operation.abort.abort();
    signal?.addEventListener('abort', cancel, { once: true });
    if (signal?.aborted) cancel();
    try {
      const response = await this.g.fetch(BASE + '/speech', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text, lang }),
        signal: operation.abort.signal,
      });
      if (!response.ok) {
        let body;
        try {
          body = await response.json();
        } catch {}
        throw new Error(body?.error?.message || `Qwen synthesis failed (${response.status}).`);
      }
      if (operation.abort.signal.aborted) throw cancelled();
      const blob = await response.blob();
      operation.url = this.g.URL.createObjectURL(blob);
      const audio = (operation.audio = new this.g.Audio(operation.url));
      audio.playbackRate = rate;
      await new Promise((resolve, reject) => {
        const done = () => {
            cleanup();
            resolve();
          },
          failed = () => {
            cleanup();
            reject(new Error('The browser could not play Qwen speech audio.'));
          },
          aborted = () => {
            cleanup();
            audio.pause();
            reject(cancelled());
          },
          cleanup = () => {
            audio.removeEventListener('ended', done);
            audio.removeEventListener('error', failed);
            operation.abort.signal.removeEventListener('abort', aborted);
          };
        audio.addEventListener('ended', done, { once: true });
        audio.addEventListener('error', failed, { once: true });
        operation.abort.signal.addEventListener('abort', aborted, { once: true });
        Promise.resolve(audio.play()).catch(failed);
      });
    } catch (error) {
      if (operation.abort.signal.aborted && error?.name !== 'AbortError') throw cancelled();
      throw error;
    } finally {
      signal?.removeEventListener('abort', cancel);
      if (operation.url) this.g.URL.revokeObjectURL(operation.url);
      if (this.current === operation) this.current = null;
    }
  }
  async stop() {
    const operation = this.current;
    if (!operation) return;
    this.current = null;
    operation.abort.abort();
    operation.audio?.pause();
    if (operation.url) {
      this.g.URL.revokeObjectURL(operation.url);
      operation.url = null;
    }
  }
  pause() {
    if (!this.current?.audio || this.current.audio.paused) return false;
    this.current.audio.pause();
    return true;
  }
  async resume() {
    if (!this.current?.audio || !this.current.audio.paused) return false;
    await this.current.audio.play();
    return true;
  }
}
