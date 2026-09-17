// @ts-nocheck
import { TranscriptDraft } from './transcript.ts';
import { normalizeSettings } from './settings.ts';

const message = (error) => error?.message || String(error);
function cancellable(promise, signal) {
  return new Promise((resolve, reject) => {
    const abort = () => reject(Object.assign(new Error('Cancelled'), { name: 'AbortError' }));
    if (signal.aborted) {
      abort();
      return;
    }
    signal.addEventListener('abort', abort, { once: true });
    Promise.resolve(promise)
      .then(resolve, reject)
      .finally(() => signal.removeEventListener('abort', abort));
  });
}

/** Session-owned policy. Input transitions are serialized; generations invalidate late work. */
export class VoiceCoordinator {
  constructor({ recognition, engines, meter, composer, settings = {} }) {
    Object.assign(this, { recognition, engines, meter, composer });
    this.listeners = new Set();
    this.transcript = new TranscriptDraft();
    this.epoch = 0;
    this.speechEpoch = 0;
    this.controlEpoch = 0;
    this.queue = [];
    this.consumed = new Map();
    this.unfinished = new Set();
    this.suppressed = new Set();
    this.inputTail = Promise.resolve();
    this.speechBarrier = Promise.resolve();
    this.disposed = false;
    this.inputReleaseError = null;
    this.speechStopError = null;
    this.snapshot = {
      conversation: false,
      listening: false,
      recognizing: false,
      speaking: false,
      paused: false,
      starting: false,
      error: null,
      activeMessageId: null,
      autoSendAt: null,
      capabilities: {},
      settings: normalizeSettings(settings),
    };
    this.autoSendTimer = null;
    this.autoSendDraft = null;
    this.assistantSpeechTimer = null;
    this.assistantSpeechNotBefore = 0;
    this.recognition.lang = this.snapshot.settings.recognitionLang;
    this.meter.deviceId = this.snapshot.settings.inputDeviceId;
    this.getSnapshot = () => this.snapshot;
    this.subscribe = (listener) => {
      if (this.disposed) return () => {};
      this.listeners.add(listener);
      return () => this.listeners.delete(listener);
    };
  }
  patch(next) {
    this.snapshot = { ...this.snapshot, ...next };
    for (const listener of this.listeners) {
      try {
        listener();
      } catch {
        /* Views do not own resource cleanup. */
      }
    }
  }
  clearError() {
    if (!this.disposed) this.patch({ error: null });
  }
  replaceRecognition(recognition) {
    if (this.disposed || !recognition) return;
    this.recognition = recognition;
    Object.assign(recognition, {
      lang: this.snapshot.settings.recognitionLang,
      processLocally: this.snapshot.settings.recognitionProcessLocally,
      autoInstallLocalPack: this.snapshot.settings.recognitionAutoInstall,
      voiceDetectionPreset: this.snapshot.settings.voiceDetectionPreset,
    });
    this.patch({ capabilities: { ...this.snapshot.capabilities, recognition: undefined } });
  }
  explainRecognition() {
    throw new Error(
      (this.snapshot.capabilities.capture?.reason ||
        this.snapshot.capabilities.recognition?.reason ||
        'Local speech recognition is unavailable.') +
        ' Open Settings → Live Voice to check language and engine availability.',
    );
  }
  updateSettings(next) {
    if (this.disposed) return;
    const settings = normalizeSettings({ ...this.snapshot.settings, ...next });
    this.meter.deviceId = settings.inputDeviceId;
    Object.assign(this.recognition, {
      lang: settings.recognitionLang,
      processLocally: settings.recognitionProcessLocally,
      autoInstallLocalPack: settings.recognitionAutoInstall,
      voiceDetectionPreset: settings.voiceDetectionPreset,
    });
    this.patch({ settings, error: null });
    if (settings.sendingMode === 'manual') this.cancelAutoSend();
    if (Object.hasOwn(next, 'announceAssistantMessages') && !settings.announceAssistantMessages) {
      this.queue = [];
      this.assistantSpeechNotBefore = 0;
      this._cancelAssistantSpeechTimer();
    }
    if (Object.hasOwn(next, 'assistantSpeechDelaySeconds') && this.assistantSpeechNotBefore > 0) {
      this.assistantSpeechNotBefore = Date.now() + settings.assistantSpeechDelaySeconds * 1000;
      this._cancelAssistantSpeechTimer();
      this._drain();
    }
  }
  async refreshCapabilities() {
    const request = (this.capabilityRequest = (this.capabilityRequest || 0) + 1);
    const caps = {};
    const lang = this.snapshot.settings.recognitionLang;
    Object.assign(this.recognition, {
      lang,
      processLocally: this.snapshot.settings.recognitionProcessLocally,
      autoInstallLocalPack: this.snapshot.settings.recognitionAutoInstall,
    });
    const probes = Object.entries(this.engines).map(([id, engine]) => [
      id,
      () => engine.capability?.() ?? engine.getCapabilities(),
    ]);
    probes.push(['recognition', () => this.recognition.capability({ lang })]);
    probes.push(['capture', () => this.meter.capability()]);
    await Promise.all(
      probes.map(async ([id, probe]) => {
        try {
          caps[id] = await probe();
        } catch (error) {
          caps[id] = { supported: false, reason: message(error) };
        }
        // A pending microphone/language check must not hide usable speech engines.
        if (
          !this.disposed &&
          request === this.capabilityRequest &&
          lang === this.snapshot.settings.recognitionLang
        ) {
          this.patch({ capabilities: { ...this.snapshot.capabilities, [id]: caps[id] } });
        }
      }),
    );
    return caps;
  }
  _input(task) {
    const result = this.inputTail.then(task);
    this.inputTail = result.catch(() => {});
    return result;
  }
  async _releaseInput() {
    const results = await Promise.allSettled([
      Promise.resolve().then(() => this.recognition.stop()),
      Promise.resolve().then(() => this.meter.stop()),
    ]);
    const errors = results
      .filter((result) => result.status === 'rejected')
      .map((result) => result.reason);
    if (errors.length) throw new AggregateError(errors, errors.map(message).join('; '));
  }
  startDictation() {
    return this.startListening(false);
  }
  startConversation() {
    return this.startListening(true);
  }
  startListening(conversation = this.snapshot.conversation) {
    if (this.disposed) return Promise.resolve();
    // Reserve input ownership before awaiting any speech teardown.
    this.patch({ error: null });
    const stopped = this.stopSpeech(false);
    return this._startInput(conversation, stopped);
  }
  _startInput(conversation, prerequisite = Promise.resolve()) {
    if (this.disposed) return Promise.resolve();
    const epoch = ++this.epoch;
    this.inputController?.abort();
    const controller = new AbortController();
    this.inputController = controller;
    this.patch({ starting: true, listening: false, recognizing: false, conversation });
    const valid = () => !this.disposed && epoch === this.epoch;
    return this._input(async () => {
      if (!valid()) return;
      try {
        await prerequisite;
        if (!valid()) return;
        if (this.speechStopError) throw this.speechStopError;
        await this._releaseInput();
        if (!valid()) return;
        const lang = this.snapshot.settings.recognitionLang;
        this.recognition.lang = lang;
        const capability = await cancellable(
          this.recognition.capability({ lang }),
          controller.signal,
        );
        if (!valid()) return;
        if (!capability.supported)
          throw new Error(capability.reason || 'Local browser recognition is unavailable.');
        let started;
        try {
          started = await this.meter.start({ signal: controller.signal });
        } catch (error) {
          if (valid())
            this.patch({
              capabilities: {
                ...this.snapshot.capabilities,
                capture: {
                  supported: false,
                  permission: error?.name === 'NotAllowedError' ? 'denied' : 'error',
                  reason:
                    error?.name === 'NotAllowedError'
                      ? 'Microphone permission was denied. Allow it in browser settings, then refresh availability.'
                      : `Microphone capture failed: ${message(error)}`,
                },
              },
            });
          throw error;
        }
        if (!valid()) {
          await this._releaseInput();
          return;
        }
        if (!started) throw new Error('Microphone metering could not start.');
        this.transcript.reset();
        await this.recognition.start({
          lang,
          signal: controller.signal,
          onResult: (result) => {
            if (valid()) this.onResult(result);
          },
          onActivity: (active) => {
            if (!valid()) return;
            if (active) {
              this.cancelAutoSend();
              this.assistantSpeechNotBefore = Infinity;
              this._cancelAssistantSpeechTimer();
            } else
              this.assistantSpeechNotBefore =
                Date.now() + this.snapshot.settings.assistantSpeechDelaySeconds * 1000;
            this.patch({ recognizing: active });
            if (active && this.snapshot.settings.mode === 'headphones') void this.pauseSpeech();
            if (!active) this._drain();
          },
          onError: (error) => {
            if (!valid()) return;
            const ended = this.endConversation();
            this.patch({ error: message(error) });
            void ended;
          },
        });
        if (!valid()) {
          await this._releaseInput();
          return;
        }
        this.patch({ listening: true, starting: false });
        this._drain();
      } catch (error) {
        try {
          await this._releaseInput();
        } catch (cleanup) {
          error = new AggregateError([error, cleanup], message(error) + '; ' + message(cleanup));
        }
        if (valid()) {
          this.queue = [];
          this.patch({
            starting: false,
            listening: false,
            conversation: false,
            recognizing: false,
            error: message(error),
          });
        }
      }
    });
  }
  onResult({ final = '', interim = '' }) {
    if (this.disposed || (!this.snapshot.listening && !this.snapshot.starting)) return;
    if (this.snapshot.speaking && !this.snapshot.paused) {
      if (this.snapshot.settings.mode === 'speaker') return;
      if (final || interim) void this.pauseSpeech();
    }
    // A native event can contain a final result without an interim result. Do not
    // run a second empty hypothesis update: it would replace the just-committed
    // result with a stale composer snapshot before the editor publishes it.
    if (final) {
      const next = this.transcript.update(this.composer.getDraft(), final, true);
      this.composer.setDraft(next);
      if (this.snapshot.settings.sendingMode !== 'manual') this.scheduleAutoSend(next);
    }
    if (interim) {
      this.cancelAutoSend();
      this.composer.setDraft(this.transcript.update(this.composer.getDraft(), interim));
    }
    if (!interim && this.snapshot.recognizing)
      this.assistantSpeechNotBefore =
        Date.now() + this.snapshot.settings.assistantSpeechDelaySeconds * 1000;
    this.patch({ recognizing: !!interim });
    this._drain();
  }
  scheduleAutoSend(draft) {
    this.cancelAutoSend();
    if (!draft.trim() || typeof this.composer.submit !== 'function') return;
    const delay = this.snapshot.settings.autoSendDelaySeconds * 1000;
    this.autoSendDraft = draft;
    this.patch({ autoSendAt: Date.now() + delay });
    this.autoSendTimer = setTimeout(() => {
      this.autoSendTimer = null;
      const expected = this.autoSendDraft;
      this.autoSendDraft = null;
      this.patch({ autoSendAt: null });
      if (
        !this.disposed &&
        this.snapshot.settings.sendingMode !== 'manual' &&
        expected === this.composer.getDraft()
      ) {
        try {
          this.composer.submit(this.snapshot.settings.sendingMode === 'steer' ? 'steer' : 'queue');
          // Web Speech keeps a cumulative native result list for the lifetime of
          // one recognition instance. Start a fresh instance at the turn boundary
          // so the sent utterance cannot prefix the next one.
          this.transcript.reset();
          this.recognition.reset?.();
        } catch (error) {
          this.patch({ error: message(error) });
        }
      }
    }, delay);
  }
  cancelAutoSend() {
    if (this.autoSendTimer !== null) clearTimeout(this.autoSendTimer);
    this.autoSendTimer = null;
    this.autoSendDraft = null;
    if (this.snapshot?.autoSendAt !== null) this.patch({ autoSendAt: null });
  }
  composerChanged(draft) {
    if (this.autoSendDraft !== null && draft !== this.autoSendDraft) this.cancelAutoSend();
  }
  stopListening() {
    this.cancelAutoSend();
    ++this.epoch;
    this.inputController?.abort();
    this.patch({ listening: false, recognizing: false, starting: false });
    return this._input(async () => {
      try {
        await this._releaseInput();
        this.inputReleaseError = null;
      } catch (error) {
        this.inputReleaseError = error;
        this.patch({ error: message(error) });
      }
      this.transcript.reset();
    });
  }
  async cancelDictation() {
    this.composer.setDraft(this.transcript.update(this.composer.getDraft(), '', true));
    await this.stopListening();
  }
  async endConversation() {
    this._cancelAssistantSpeechTimer();
    this.assistantSpeechNotBefore = 0;
    this.patch({ conversation: false });
    await Promise.all([this.stopListening(), this.stopSpeech(false)]);
  }
  _suppressPending() {
    for (const id of this.unfinished) this.suppressed.add(id);
    if (this.snapshot.activeMessageId !== null) this.suppressed.add(this.snapshot.activeMessageId);
    for (const item of this.queue) this.suppressed.add(item.id);
    this.queue = [];
  }
  async stopSpeech(resumeListening = true) {
    const epoch = ++this.speechEpoch;
    ++this.controlEpoch;
    this._suppressPending();
    this.patch({ speaking: false, paused: false, activeMessageId: null });
    const stopped = this.speechBarrier.then(async () => {
      const results = await Promise.allSettled(
        Object.values(this.engines).map((engine) => Promise.resolve().then(() => engine.stop())),
      );
      const failed = results.find((result) => result.status === 'rejected');
      this.speechStopError = failed?.reason ?? null;
      if (failed) throw failed.reason;
    });
    this.speechBarrier = stopped.catch(() => {});
    try {
      await stopped;
    } catch (error) {
      if (epoch === this.speechEpoch) this.patch({ error: message(error) });
      return;
    }
    if (
      epoch === this.speechEpoch &&
      !this.disposed &&
      resumeListening &&
      this.snapshot.conversation &&
      !this.snapshot.listening &&
      !this.snapshot.starting
    )
      await this._startInput(true);
  }
  async pauseSpeech() {
    if (this.disposed || !this.snapshot.speaking || this.snapshot.paused) return;
    const epoch = this.speechEpoch;
    const control = ++this.controlEpoch;
    try {
      const result = await this.engines[this.snapshot.settings.engine].pause();
      if (
        epoch === this.speechEpoch &&
        control === this.controlEpoch &&
        this.snapshot.speaking &&
        result !== false
      )
        this.patch({ paused: true });
    } catch (error) {
      if (epoch === this.speechEpoch) this.patch({ error: message(error) });
    }
  }
  async resumeSpeech() {
    if (this.disposed || !this.snapshot.paused) return;
    const epoch = this.speechEpoch;
    const control = ++this.controlEpoch;
    try {
      if (this.snapshot.settings.mode === 'speaker') {
        await this.stopListening();
        if (this.inputReleaseError) throw this.inputReleaseError;
      }
      if (epoch !== this.speechEpoch || control !== this.controlEpoch) return;
      const result = await this.engines[this.snapshot.settings.engine].resume();
      if (epoch === this.speechEpoch && control === this.controlEpoch && result !== false)
        this.patch({ paused: false });
    } catch (error) {
      if (epoch === this.speechEpoch) this.patch({ error: message(error) });
    }
  }
  async speak(text, messageId = null) {
    if (this.disposed) return;
    const stopped = this.stopSpeech(false);
    const epoch = this.speechEpoch;
    await stopped;
    if (!this.disposed && epoch === this.speechEpoch && !this.speechStopError)
      return this.play(text, messageId);
  }
  async play(text, messageId) {
    if (this.disposed || !text.trim()) return;
    if (this.snapshot.speaking) {
      this.queue.push({ text, id: messageId });
      return;
    }
    const epoch = ++this.speechEpoch;
    const engine = this.engines[this.snapshot.settings.engine];
    if (!engine) {
      this.queue = [];
      this.patch({ error: 'Speech engine unavailable.' });
      return;
    }
    // Reserve playback synchronously so incoming stream chunks cannot overtake gating.
    this.patch({ speaking: true, paused: false, activeMessageId: messageId, error: null });
    let failed = false;
    try {
      await this.speechBarrier;
      if (this.speechStopError) throw this.speechStopError;
      if (epoch !== this.speechEpoch || this.disposed) return;
      if (this.snapshot.settings.mode === 'speaker') {
        await this.stopListening();
        if (this.inputReleaseError) throw this.inputReleaseError;
      }
      if (epoch !== this.speechEpoch || this.disposed) return;
      await engine.speak(text, {
        voice: this.snapshot.settings.voice || undefined,
        rate: this.snapshot.settings.rate,
        outputDeviceId: this.snapshot.settings.outputDeviceId,
      });
    } catch (error) {
      if (epoch === this.speechEpoch) {
        failed = true;
        this._suppressPending();
        if (error.name !== 'AbortError') this.patch({ error: message(error) });
      }
    } finally {
      if (epoch === this.speechEpoch && !this.disposed) {
        this.patch({ speaking: false, paused: false, activeMessageId: null });
        if (!failed && this.queue.length) this._drain();
        else if (this.snapshot.conversation && !this.snapshot.listening && !this.snapshot.starting)
          await this._startInput(true);
      }
    }
  }
  _cancelAssistantSpeechTimer() {
    if (this.assistantSpeechTimer !== null) clearTimeout(this.assistantSpeechTimer);
    this.assistantSpeechTimer = null;
  }
  _drain() {
    if (
      this.disposed ||
      !this.snapshot.conversation ||
      !this.snapshot.settings.announceAssistantMessages ||
      this.snapshot.speaking ||
      this.snapshot.recognizing ||
      this.snapshot.starting ||
      !this.queue.length
    )
      return;
    const wait = this.assistantSpeechNotBefore - Date.now();
    if (wait > 0) {
      if (Number.isFinite(wait) && this.assistantSpeechTimer === null)
        this.assistantSpeechTimer = setTimeout(() => {
          this.assistantSpeechTimer = null;
          this._drain();
        }, wait);
      return;
    }
    this._cancelAssistantSpeechTimer();
    this.assistantSpeechNotBefore = 0;
    const next = this.queue.shift();
    void this.play(next.text, next.id);
  }
  /** Baselines survive conversation toggles; cancelled message IDs remain suppressed. */
  observeMessage(id, text, { complete = false, baseline = false } = {}) {
    if (this.disposed) return;
    if (complete) this.unfinished.delete(id);
    else this.unfinished.add(id);
    if (
      baseline ||
      !this.snapshot.conversation ||
      !this.snapshot.settings.announceAssistantMessages ||
      this.suppressed.has(id)
    ) {
      this.consumed.set(id, text.length);
      return;
    }
    const offset = this.consumed.get(id) || 0;
    if (text.length < offset) {
      this.consumed.set(id, text.length);
      return;
    }
    const remaining = text.slice(offset);
    const boundary = complete
      ? remaining.length
      : Math.max(
          remaining.lastIndexOf('. '),
          remaining.lastIndexOf('? '),
          remaining.lastIndexOf('! '),
          remaining.lastIndexOf('\n'),
        ) + 1;
    if (boundary <= 0) return;
    const chunk = remaining.slice(0, boundary).trim();
    this.consumed.set(id, offset + boundary);
    if (chunk) {
      this.queue.push({ text: chunk, id });
      this._drain();
    }
  }
  async dispose() {
    if (this.disposed) return;
    this.cancelAutoSend();
    this._cancelAssistantSpeechTimer();
    this.disposed = true;
    this.listeners.clear();
    await this.endConversation();
  }
}
