// @ts-nocheck
const cancelled = () => Object.assign(new Error('Speech was cancelled.'), { name: 'AbortError' });

/** Browser-owned playback for compact host-synthesized audio. */
export class HostAudioSpeakingEngine {
  constructor({
    endpoint,
    globals = globalThis,
    lang = 'pt-BR',
    capability,
    synthesisRate,
    playbackRate,
    audioFormat = 'audio/mp4',
  } = {}) {
    Object.assign(this, {
      endpoint,
      g: globals,
      lang,
      capabilityEndpoint: capability,
      audioFormat,
    });
    this.synthesisRate = synthesisRate || ((rate) => rate);
    this.playbackRate = playbackRate || ((rate) => rate);
    this.current = null;
  }
  async capability() {
    try {
      const url = this.capabilityEndpoint || this.endpoint.replace(/\/speech$/, '/capabilities');
      const response = await this.g.fetch(url, { credentials: 'same-origin' });
      const json = await response.json();
      if (!response.ok || !json?.ok)
        throw new Error(json?.error?.message || 'Speech capability check failed.');
      return {
        ...json.value,
        local: true,
        location: 'host',
        pause: true,
        resume: true,
        audioFormat: this.audioFormat,
      };
    } catch (error) {
      return {
        supported: false,
        local: true,
        location: 'host',
        pause: true,
        resume: true,
        reason: error?.message || String(error),
      };
    }
  }
  async prepare(text, { voice, lang = this.lang, rate = 1, signal } = {}) {
    if (typeof text !== 'string') throw new TypeError('Speech text must be a string.');
    if (signal?.aborted) throw cancelled();
    const controller = new AbortController();
    const cancel = () => controller.abort();
    signal?.addEventListener('abort', cancel, { once: true });
    try {
      const response = await this.g.fetch(this.endpoint, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text, lang, voice, rate: this.synthesisRate(rate) }),
        signal: controller.signal,
      });
      if (!response.ok) {
        let body;
        try {
          body = await response.json();
        } catch {}
        throw new Error(
          body?.error?.message || 'Host speech synthesis failed (' + response.status + ').',
        );
      }
      if (controller.signal.aborted) throw cancelled();
      const blob = await response.blob();
      if (blob.type && blob.type !== this.audioFormat)
        throw new Error('Host speech returned an unsupported audio format.');
      const url = this.g.URL.createObjectURL(blob);
      let disposed = false;
      return {
        audio: new this.g.Audio(url),
        url,
        dispose: () => {
          if (!disposed) {
            disposed = true;
            this.g.URL.revokeObjectURL(url);
          }
        },
      };
    } catch (error) {
      if (controller.signal.aborted && error?.name !== 'AbortError') throw cancelled();
      throw error;
    } finally {
      signal?.removeEventListener('abort', cancel);
    }
  }
  async playPrepared(prepared, options = {}) {
    const { signal, outputDeviceId = '', rate = 1 } = options;
    const playbackRate = this.playbackRate(rate);
    if (!prepared?.audio) throw new TypeError('Prepared speech audio is required.');
    await this.stop();
    if (signal?.aborted) throw cancelled();
    const operation = { prepared, audio: prepared.audio };
    this.current = operation;
    const audio = operation.audio;
    audio.playbackRate = playbackRate;
    if (outputDeviceId && typeof audio.setSinkId === 'function')
      await audio.setSinkId(outputDeviceId);
    return new Promise((resolve, reject) => {
      const cleanup = () => {
        audio.removeEventListener('ended', done);
        audio.removeEventListener('error', failed);
        signal?.removeEventListener('abort', aborted);
        if (this.current === operation) this.current = null;
        prepared.dispose();
      };
      const done = () => {
        cleanup();
        resolve();
      };
      const failed = () => {
        cleanup();
        reject(new Error('The browser could not play host speech audio.'));
      };
      const aborted = () => {
        audio.pause();
        cleanup();
        reject(cancelled());
      };
      operation.cancel = aborted;
      audio.addEventListener('ended', done, { once: true });
      audio.addEventListener('error', failed, { once: true });
      signal?.addEventListener('abort', aborted, { once: true });
      Promise.resolve(audio.play()).catch(failed);
    });
  }
  async speak(text, options = {}) {
    const prepared = await this.prepare(text, options);
    try {
      return await this.playPrepared(prepared, options);
    } catch (error) {
      prepared.dispose();
      throw error;
    }
  }
  async stop() {
    const operation = this.current;
    if (!operation) return;
    this.current = null;
    if (operation.cancel) operation.cancel();
    else {
      operation.audio.pause();
      operation.prepared.dispose();
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
