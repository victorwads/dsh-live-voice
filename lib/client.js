window.__ModuleLoader__.load({id:"dsh-live-voice",factory:(require)=>{var module={exports:{}};var exports=module.exports;
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.ts
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);
var import_react = __toESM(require("react"), 1);
var import_react_dom = require("react-dom");

// src/core/transcript.ts
var TranscriptDraft = class {
  constructor() {
    this.reset();
  }
  reset() {
    this.owned = null;
    this.edited = false;
  }
  update(current, hypothesis, final = false) {
    if (this.edited) {
      if (final) this.edited = false;
      return current;
    }
    let base = current;
    let at = current.length;
    if (this.owned) {
      const { start, text: text2, before: before2, after: after2 } = this.owned;
      if (current === before2 + text2 + after2) {
        base = before2 + after2;
        at = start;
      } else if (text2 && current.indexOf(text2) >= 0 && current.indexOf(text2) === current.lastIndexOf(text2)) {
        at = current.indexOf(text2);
        base = current.slice(0, at) + current.slice(at + text2.length);
      } else {
        this.owned = null;
        this.edited = !final;
        return current;
      }
    }
    const before = base.slice(0, at);
    const after = base.slice(at);
    const separator = hypothesis && before && !/\s$/.test(before) ? " " : "";
    const text = separator + hypothesis;
    const result = before + text + after;
    this.owned = final ? null : { start: at, text, before, after };
    return result;
  }
};

// src/core/settings.ts
var voiceDetectionPresets = Object.freeze({
  short: Object.freeze({
    silenceMs: 900,
    label: "Short",
    description: "Send quickly after a short pause."
  }),
  natural: Object.freeze({
    silenceMs: 1500,
    label: "Natural",
    description: "Allow normal pauses between phrases."
  }),
  long: Object.freeze({
    silenceMs: 2200,
    label: "Long",
    description: "Wait through longer thinking pauses."
  })
});
var usesPluginVoiceDetection = (engine) => ["whisper-http", "qwen-http"].includes(engine);
var qwenVoices = Object.freeze([
  Object.freeze({ value: "aiden", label: "Aiden \u2014 male, American English" }),
  Object.freeze({ value: "ryan", label: "Ryan \u2014 male, English" }),
  Object.freeze({ value: "uncle_fu", label: "Uncle Fu \u2014 male, Chinese" }),
  Object.freeze({ value: "dylan", label: "Dylan \u2014 male, Beijing Chinese" }),
  Object.freeze({ value: "eric", label: "Eric \u2014 male, Sichuan Chinese" }),
  Object.freeze({ value: "vivian", label: "Vivian \u2014 female, Chinese" }),
  Object.freeze({ value: "serena", label: "Serena \u2014 female, Chinese" }),
  Object.freeze({ value: "ono_anna", label: "Ono Anna \u2014 female, Japanese" }),
  Object.freeze({ value: "sohee", label: "Sohee \u2014 female, Korean" })
]);
var defaultQwenVoice = qwenVoices[0].value;
var defaultSettings = Object.freeze({
  engine: "browser",
  recognitionEngine: "browser",
  recognitionProcessLocally: true,
  recognitionAutoInstall: true,
  voiceDetectionPreset: "natural",
  microphoneEnabled: true,
  announceAssistantMessages: true,
  interruptSpeechOnUserMessage: false,
  sendingMode: "manual",
  autoSendDelaySeconds: 4,
  assistantSpeechDelaySeconds: 3,
  mode: "speaker",
  lang: "pt-BR",
  recognitionLang: "pt-BR",
  voice: "",
  inputDeviceId: "",
  outputDeviceId: "",
  recognitionFilterEnabled: true,
  recognitionMinimumWords: 2,
  voiceCommandsEnabled: true,
  voiceCommandSend: "send, send message",
  voiceCommandQueue: "queue, queue message",
  voiceCommandEnd: "end, end conversation",
  voiceCommandMute: "mute, stop listening",
  voiceCommandResume: "resume, start listening",
  voiceCommandStopSpeaking: "stop talking, stop speaking, shut up",
  voiceCommandClear: "clear all, clear message",
  outputCodeFilterEnabled: true,
  outputCodeMaxLines: 5,
  outputCodeNotice: "Look the code on out conversation",
  rate: 1
});
var normalizeCommandPhrases = (value, fallback) => typeof value === "string" && value.length <= 1e3 && !value.includes("\0") ? value.split(/[,\r\n]+/).map((phrase) => phrase.trim()).filter(Boolean).slice(0, 20).join(", ") : fallback;
function normalizeSettings(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return {
    engine: ["browser", "say", "qwen-http"].includes(source.engine) ? source.engine : defaultSettings.engine,
    recognitionEngine: ["browser", "whisper-http", "qwen-http"].includes(source.recognitionEngine) ? source.recognitionEngine : defaultSettings.recognitionEngine,
    recognitionProcessLocally: typeof source.recognitionProcessLocally === "boolean" ? source.recognitionProcessLocally : defaultSettings.recognitionProcessLocally,
    recognitionAutoInstall: typeof source.recognitionAutoInstall === "boolean" ? source.recognitionAutoInstall : defaultSettings.recognitionAutoInstall,
    voiceDetectionPreset: Object.hasOwn(voiceDetectionPresets, source.voiceDetectionPreset) ? source.voiceDetectionPreset : defaultSettings.voiceDetectionPreset,
    microphoneEnabled: typeof source.microphoneEnabled === "boolean" ? source.microphoneEnabled : defaultSettings.microphoneEnabled,
    announceAssistantMessages: typeof source.announceAssistantMessages === "boolean" ? source.announceAssistantMessages : defaultSettings.announceAssistantMessages,
    interruptSpeechOnUserMessage: typeof source.interruptSpeechOnUserMessage === "boolean" ? source.interruptSpeechOnUserMessage : defaultSettings.interruptSpeechOnUserMessage,
    sendingMode: source.sendingMode === "automatic" ? "queue" : ["manual", "queue", "steer"].includes(source.sendingMode) ? source.sendingMode : defaultSettings.sendingMode,
    autoSendDelaySeconds: Number.isInteger(source.autoSendDelaySeconds) && source.autoSendDelaySeconds >= 2 && source.autoSendDelaySeconds <= 10 ? source.autoSendDelaySeconds : defaultSettings.autoSendDelaySeconds,
    assistantSpeechDelaySeconds: Number.isInteger(source.assistantSpeechDelaySeconds) && source.assistantSpeechDelaySeconds >= 1 && source.assistantSpeechDelaySeconds <= 10 ? source.assistantSpeechDelaySeconds : defaultSettings.assistantSpeechDelaySeconds,
    mode: ["speaker", "headphones"].includes(source.mode) ? source.mode : defaultSettings.mode,
    lang: typeof source.lang === "string" && /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(source.lang) ? source.lang : defaultSettings.lang,
    recognitionLang: source.recognitionLang === "auto" || typeof source.recognitionLang === "string" && /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(source.recognitionLang) ? source.recognitionLang : typeof source.lang === "string" && /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(source.lang) ? source.lang : defaultSettings.recognitionLang,
    voice: typeof source.voice === "string" && source.voice.length <= 200 && !source.voice.includes("\0") ? source.voice : "",
    inputDeviceId: typeof source.inputDeviceId === "string" && source.inputDeviceId.length <= 500 && !source.inputDeviceId.includes("\0") ? source.inputDeviceId : "",
    outputDeviceId: typeof source.outputDeviceId === "string" && source.outputDeviceId.length <= 500 && !source.outputDeviceId.includes("\0") ? source.outputDeviceId : "",
    recognitionFilterEnabled: typeof source.recognitionFilterEnabled === "boolean" ? source.recognitionFilterEnabled : defaultSettings.recognitionFilterEnabled,
    recognitionMinimumWords: Number.isInteger(source.recognitionMinimumWords) && source.recognitionMinimumWords >= 1 && source.recognitionMinimumWords <= 20 ? source.recognitionMinimumWords : defaultSettings.recognitionMinimumWords,
    voiceCommandsEnabled: typeof source.voiceCommandsEnabled === "boolean" ? source.voiceCommandsEnabled : defaultSettings.voiceCommandsEnabled,
    voiceCommandSend: normalizeCommandPhrases(
      source.voiceCommandSend,
      defaultSettings.voiceCommandSend
    ),
    voiceCommandQueue: normalizeCommandPhrases(
      source.voiceCommandQueue,
      defaultSettings.voiceCommandQueue
    ),
    voiceCommandEnd: normalizeCommandPhrases(
      source.voiceCommandEnd,
      defaultSettings.voiceCommandEnd
    ),
    voiceCommandMute: normalizeCommandPhrases(
      source.voiceCommandMute,
      defaultSettings.voiceCommandMute
    ),
    voiceCommandResume: normalizeCommandPhrases(
      source.voiceCommandResume,
      defaultSettings.voiceCommandResume
    ),
    voiceCommandStopSpeaking: normalizeCommandPhrases(
      source.voiceCommandStopSpeaking,
      defaultSettings.voiceCommandStopSpeaking
    ),
    voiceCommandClear: normalizeCommandPhrases(
      source.voiceCommandClear,
      defaultSettings.voiceCommandClear
    ),
    outputCodeFilterEnabled: typeof source.outputCodeFilterEnabled === "boolean" ? source.outputCodeFilterEnabled : defaultSettings.outputCodeFilterEnabled,
    outputCodeMaxLines: Number.isInteger(source.outputCodeMaxLines) && source.outputCodeMaxLines >= 0 && source.outputCodeMaxLines <= 100 ? source.outputCodeMaxLines : defaultSettings.outputCodeMaxLines,
    outputCodeNotice: typeof source.outputCodeNotice === "string" && source.outputCodeNotice.trim() && source.outputCodeNotice.length <= 300 && !source.outputCodeNotice.includes("\0") ? source.outputCodeNotice.trim() : defaultSettings.outputCodeNotice,
    rate: Number.isFinite(source.rate) && source.rate >= 0.1 && source.rate <= 3 ? source.rate : 1
  };
}

// src/core/filters.ts
var words = (text) => String(text || "").trim().match(/[\p{L}\p{N}]+(?:['’_-][\p{L}\p{N}]+)*/gu) || [];
function normalizeVoiceCommand(text) {
  return String(text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("en-US").replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ");
}
function matchVoiceCommand(text, commands) {
  const candidate = normalizeVoiceCommand(text);
  if (!candidate) return null;
  for (const [action, phrases] of Object.entries(commands || {})) {
    if (String(phrases || "").split(/[,\r\n]+/).some((phrase) => normalizeVoiceCommand(phrase) === candidate))
      return action;
  }
  return null;
}
function hasMinimumWords(text, minimum = 2) {
  return words(text).length >= minimum;
}
function splitSpeechOutput(text, options = {}) {
  const filtered = filterSpeechOutput(text, options).trim();
  if (!filtered) return [];
  return filtered.split(/\r?\n+/u).map((segment) => segment.trim()).filter(Boolean);
}
function hasUnclosedCodeFence(text) {
  return (String(text || "").match(/```/g) || []).length % 2 === 1;
}
function filterSpeechOutput(text, {
  filterCodeBlocks = true,
  codeBlockMaxLines = 5,
  codeBlockNotice = "Look the code on out conversation"
} = {}) {
  const source = String(text || "");
  if (!filterCodeBlocks) return source;
  return source.replace(/```[^\n]*\n?([\s\S]*?)```/g, (block, body) => {
    const normalized = body.replace(/\n$/, "");
    const lineCount = normalized ? normalized.split(/\r?\n/).length : 0;
    return lineCount <= codeBlockMaxLines ? normalized : codeBlockNotice;
  });
}

// src/core/coordinator.ts
var message = (error) => error?.message || String(error);
function cancellable(promise, signal) {
  return new Promise((resolve, reject) => {
    const abort = () => reject(Object.assign(new Error("Cancelled"), { name: "AbortError" }));
    if (signal.aborted) {
      abort();
      return;
    }
    signal.addEventListener("abort", abort, { once: true });
    Promise.resolve(promise).then(resolve, reject).finally(() => signal.removeEventListener("abort", abort));
  });
}
var VoiceCoordinator = class {
  constructor({ recognition, engines, meter, composer, settings = {} }) {
    Object.assign(this, { recognition, engines, meter, composer });
    this.listeners = /* @__PURE__ */ new Set();
    this.transcript = new TranscriptDraft();
    this.epoch = 0;
    this.speechEpoch = 0;
    this.controlEpoch = 0;
    this.queue = [];
    this.consumed = /* @__PURE__ */ new Map();
    this.unfinished = /* @__PURE__ */ new Set();
    this.suppressed = /* @__PURE__ */ new Set();
    this.inputTail = Promise.resolve();
    this.speechBarrier = Promise.resolve();
    this.disposed = false;
    this.inputReleaseError = null;
    this.speechStopError = null;
    this.snapshot = {
      conversation: false,
      listening: false,
      recognizing: false,
      pendingTranscriptions: 0,
      muted: normalizeSettings(settings).microphoneEnabled === false,
      speaking: false,
      paused: false,
      starting: false,
      error: null,
      activeMessageId: null,
      answeringQuestion: false,
      autoSendAt: null,
      speechSegmentsRemaining: 0,
      capabilities: {},
      settings: normalizeSettings(settings)
    };
    this.autoSendTimer = null;
    this.autoSendDraft = null;
    this.interruptionTimer = null;
    this.interruptionTranscriptConfirmed = false;
    this.interruptionPausedSpeech = false;
    this.assistantSpeechTimer = null;
    this.assistantSpeechNotBefore = 0;
    this.recognition.lang = this.snapshot.settings.recognitionLang;
    this.meter.deviceId = this.snapshot.settings.inputDeviceId;
    this.getSnapshot = () => this.snapshot;
    this.subscribe = (listener) => {
      if (this.disposed) return () => {
      };
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
      voiceDetectionPreset: this.snapshot.settings.voiceDetectionPreset
    });
    this.patch({ capabilities: { ...this.snapshot.capabilities, recognition: void 0 } });
  }
  explainRecognition() {
    throw new Error(
      (this.snapshot.capabilities.capture?.reason || this.snapshot.capabilities.recognition?.reason || "Local speech recognition is unavailable.") + " Open Settings \u2192 Live Voice to check language and engine availability."
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
      voiceDetectionPreset: settings.voiceDetectionPreset
    });
    this.patch({
      settings,
      muted: settings.microphoneEnabled === false,
      recognizing: settings.microphoneEnabled === false ? false : this.snapshot.recognizing,
      error: null
    });
    if (settings.sendingMode === "manual") this.cancelAutoSend();
    if (Object.hasOwn(next, "announceAssistantMessages") && !settings.announceAssistantMessages) {
      this.queue = [];
      this.assistantSpeechNotBefore = 0;
      this._cancelAssistantSpeechTimer();
    }
    if (Object.hasOwn(next, "assistantSpeechDelaySeconds") && this.assistantSpeechNotBefore > 0) {
      this.assistantSpeechNotBefore = Date.now() + settings.assistantSpeechDelaySeconds * 1e3;
      this._cancelAssistantSpeechTimer();
      this._drain();
    }
  }
  async refreshCapabilities() {
    const request = this.capabilityRequest = (this.capabilityRequest || 0) + 1;
    const caps = {};
    const lang = this.snapshot.settings.recognitionLang;
    Object.assign(this.recognition, {
      lang,
      processLocally: this.snapshot.settings.recognitionProcessLocally,
      autoInstallLocalPack: this.snapshot.settings.recognitionAutoInstall
    });
    const probes = Object.entries(this.engines).map(([id2, engine]) => [
      id2,
      () => engine.capability?.() ?? engine.getCapabilities()
    ]);
    probes.push(["recognition", () => this.recognition.capability({ lang })]);
    probes.push(["capture", () => this.meter.capability()]);
    await Promise.all(
      probes.map(async ([id2, probe]) => {
        try {
          caps[id2] = await probe();
        } catch (error) {
          caps[id2] = { supported: false, reason: message(error) };
        }
        if (!this.disposed && request === this.capabilityRequest && lang === this.snapshot.settings.recognitionLang) {
          this.patch({ capabilities: { ...this.snapshot.capabilities, [id2]: caps[id2] } });
        }
      })
    );
    return caps;
  }
  _input(task) {
    const result = this.inputTail.then(task);
    this.inputTail = result.catch(() => {
    });
    return result;
  }
  async _releaseInput() {
    const results = await Promise.allSettled([
      Promise.resolve().then(() => this.recognition.stop()),
      Promise.resolve().then(() => this.meter.stop())
    ]);
    const errors = results.filter((result) => result.status === "rejected").map((result) => result.reason);
    if (errors.length) throw new AggregateError(errors, errors.map(message).join("; "));
  }
  startDictation() {
    return this.startListening(false);
  }
  startConversation() {
    return this.startListening(true);
  }
  muteListening() {
    this.cancelAutoSend();
    this.composer.setDraft(this.transcript.update(this.composer.getDraft(), "", true));
    this.transcript.reset();
    this.updateSettings({ microphoneEnabled: false });
    if (!this.snapshot.settings.voiceCommandsEnabled) return this.stopListening();
  }
  resumeListeningInput() {
    this.transcript.reset();
    this.updateSettings({ microphoneEnabled: true });
    if (this.snapshot.listening || this.snapshot.starting) {
      this.patch({ recognizing: false });
      return;
    }
    return this.startListening(this.snapshot.conversation);
  }
  startListening(conversation = this.snapshot.conversation) {
    if (this.disposed) return Promise.resolve();
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
          controller.signal
        );
        if (!valid()) return;
        if (!capability.supported)
          throw new Error(capability.reason || "Local browser recognition is unavailable.");
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
                  permission: error?.name === "NotAllowedError" ? "denied" : "error",
                  reason: error?.name === "NotAllowedError" ? "Microphone permission was denied. Allow it in browser settings, then refresh availability." : `Microphone capture failed: ${message(error)}`
                }
              }
            });
          throw error;
        }
        if (!valid()) {
          await this._releaseInput();
          return;
        }
        if (!started) throw new Error("Microphone metering could not start.");
        this.transcript.reset();
        await this.recognition.start({
          lang,
          signal: controller.signal,
          onResult: (result) => {
            if (valid()) this.onResult(result);
          },
          onProcessingChange: ({ pending = 0 } = {}) => {
            if (!valid()) return;
            const count = Number.isSafeInteger(pending) && pending >= 0 ? pending : 0;
            this.patch({ pendingTranscriptions: count });
            if (count > 0) this.cancelAutoSend();
            else this.maybeScheduleAutoSend();
          },
          onActivity: (active) => {
            if (!valid()) return;
            if (active) {
              this.cancelAutoSend();
              this.assistantSpeechNotBefore = Infinity;
              this._cancelAssistantSpeechTimer();
            } else
              this.assistantSpeechNotBefore = Date.now() + this.snapshot.settings.assistantSpeechDelaySeconds * 1e3;
            this.patch({ recognizing: active });
            this._handleSpeechInterruption(active);
            if (!active) this._drain();
          },
          onError: (error) => {
            if (!valid()) return;
            const ended = this.endConversation();
            this.patch({ error: message(error) });
            void ended;
          }
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
          error = new AggregateError([error, cleanup], message(error) + "; " + message(cleanup));
        }
        if (valid()) {
          this.queue = [];
          this.patch({
            starting: false,
            listening: false,
            conversation: false,
            recognizing: false,
            error: message(error)
          });
        }
      }
    });
  }
  _interruptionTranscriptQualifies(text) {
    return hasMinimumWords(text, 1);
  }
  _handleSpeechInterruption(active) {
    if (this.snapshot.settings.mode !== "headphones") return;
    if (active) {
      if (!this.interruptionTranscriptConfirmed || this.interruptionTimer !== null || !this.snapshot.speaking || this.snapshot.paused)
        return;
      this.interruptionTimer = setTimeout(() => {
        this.interruptionTimer = null;
        if (this.interruptionTranscriptConfirmed && this.snapshot.recognizing && this.snapshot.speaking && !this.snapshot.paused) {
          this.interruptionPausedSpeech = true;
          void this.pauseSpeech().then(() => {
            if (this.interruptionPausedSpeech && !this.snapshot.recognizing && this.snapshot.paused) {
              this.interruptionPausedSpeech = false;
              void this.resumeSpeech();
            }
          });
        }
      }, this.snapshot.settings.assistantSpeechDelaySeconds * 1e3);
      return;
    }
    if (this.interruptionTimer !== null) clearTimeout(this.interruptionTimer);
    this.interruptionTimer = null;
    this.interruptionTranscriptConfirmed = false;
    if (this.interruptionPausedSpeech && this.snapshot.paused) {
      this.interruptionPausedSpeech = false;
      void this.resumeSpeech();
    }
  }
  onResult({ final = "", interim = "" }) {
    if (this.disposed || !this.snapshot.listening && !this.snapshot.starting) return;
    if (this.snapshot.speaking && !this.snapshot.paused && this.snapshot.settings.mode === "speaker")
      return;
    if (this.snapshot.settings.mode === "headphones" && this.snapshot.speaking && this._interruptionTranscriptQualifies(final || interim)) {
      this.interruptionTranscriptConfirmed = true;
      this._handleSpeechInterruption(true);
    }
    if (typeof this.composer.handleQuestionResult === "function" && this.composer.handleQuestionResult({ final, interim })) {
      this.cancelAutoSend();
      this.transcript.reset();
      this.patch({ recognizing: !!interim });
      return;
    }
    if (final) {
      const command = this.snapshot.settings.voiceCommandsEnabled && matchVoiceCommand(final, {
        send: this.snapshot.settings.voiceCommandSend,
        queue: this.snapshot.settings.voiceCommandQueue,
        end: this.snapshot.settings.voiceCommandEnd,
        mute: this.snapshot.settings.voiceCommandMute,
        resume: this.snapshot.settings.voiceCommandResume,
        stopSpeaking: this.snapshot.settings.voiceCommandStopSpeaking,
        clear: this.snapshot.settings.voiceCommandClear
      });
      if (command) {
        this.composer.setDraft(this.transcript.update(this.composer.getDraft(), "", true));
        this.transcript.reset();
        this.cancelAutoSend();
        this.patch({ recognizing: false });
        if (command === "end") void this.endConversation();
        else if (command === "mute") this.muteListening();
        else if (command === "resume") this.resumeListeningInput();
        else if (command === "stopSpeaking") {
          this.updateSettings({ announceAssistantMessages: false });
          void this.stopSpeech();
        } else if (command === "clear") {
          this.cancelAutoSend();
          this.transcript.reset();
          this.composer.setDraft("");
        } else if (this.snapshot.muted) return;
        else {
          const sendingMode = command === "send" ? "steer" : "queue";
          this.updateSettings({ sendingMode });
          if (this.composer.getDraft().trim() && typeof this.composer.submit === "function")
            this.composer.submit(sendingMode);
        }
        return;
      }
      if (this.snapshot.muted) {
        this.composer.setDraft(this.transcript.update(this.composer.getDraft(), "", true));
        this.transcript.reset();
        this.patch({ recognizing: false });
        return;
      }
      if (this.snapshot.settings.recognitionFilterEnabled && !hasMinimumWords(final, this.snapshot.settings.recognitionMinimumWords)) {
        this.composer.setDraft(this.transcript.update(this.composer.getDraft(), "", true));
        this.transcript.reset();
        this.patch({ recognizing: false });
        return;
      }
      const next = this.transcript.update(this.composer.getDraft(), final, true);
      this.composer.setDraft(next);
      this.maybeScheduleAutoSend(next);
    }
    if (interim) {
      this.cancelAutoSend();
      this.composer.setDraft(this.transcript.update(this.composer.getDraft(), interim));
    }
    if (!interim && this.snapshot.recognizing)
      this.assistantSpeechNotBefore = Date.now() + this.snapshot.settings.assistantSpeechDelaySeconds * 1e3;
    this.patch({ recognizing: !!interim });
    this._drain();
  }
  maybeScheduleAutoSend(draft = this.composer.getDraft()) {
    if (this.snapshot.settings.sendingMode === "manual" || this.snapshot.recognizing || this.snapshot.pendingTranscriptions > 0)
      return;
    this.scheduleAutoSend(draft);
  }
  scheduleAutoSend(draft) {
    this.cancelAutoSend();
    if (!draft.trim() || typeof this.composer.submit !== "function") return;
    const delay = this.snapshot.settings.autoSendDelaySeconds * 1e3;
    this.autoSendDraft = draft;
    this.patch({ autoSendAt: Date.now() + delay });
    this.autoSendTimer = setTimeout(() => {
      this.autoSendTimer = null;
      const expected = this.autoSendDraft;
      this.autoSendDraft = null;
      this.patch({ autoSendAt: null });
      if (!this.disposed && this.snapshot.settings.sendingMode !== "manual" && expected === this.composer.getDraft()) {
        try {
          this.composer.submit(this.snapshot.settings.sendingMode === "steer" ? "steer" : "queue");
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
    this.patch({ listening: false, recognizing: false, pendingTranscriptions: 0, starting: false });
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
    this.composer.setDraft(this.transcript.update(this.composer.getDraft(), "", true));
    await this.stopListening();
  }
  async endConversation() {
    this._cancelAssistantSpeechTimer();
    this.assistantSpeechNotBefore = 0;
    this.patch({ conversation: false });
    await Promise.all([this.stopListening(), this.stopSpeech(false)]);
  }
  _syncSpeechSegments() {
    const speechSegmentsRemaining = this.queue.length + (this.snapshot.speaking ? 1 : 0);
    if (speechSegmentsRemaining !== this.snapshot.speechSegmentsRemaining)
      this.patch({ speechSegmentsRemaining });
  }
  _suppressPending() {
    for (const id2 of this.unfinished) this.suppressed.add(id2);
    if (this.snapshot.activeMessageId !== null) this.suppressed.add(this.snapshot.activeMessageId);
    for (const item of this.queue) this.suppressed.add(item.id);
    this.queue = [];
  }
  async stopSpeech(resumeListening = true) {
    if (this.interruptionTimer !== null) clearTimeout(this.interruptionTimer);
    this.interruptionTimer = null;
    this.interruptionTranscriptConfirmed = false;
    this.interruptionPausedSpeech = false;
    const epoch = ++this.speechEpoch;
    ++this.controlEpoch;
    this._suppressPending();
    this.patch({ speaking: false, paused: false, activeMessageId: null });
    this._syncSpeechSegments();
    const stopped = this.speechBarrier.then(async () => {
      const results = await Promise.allSettled(
        Object.values(this.engines).map((engine) => Promise.resolve().then(() => engine.stop()))
      );
      const failed = results.find((result) => result.status === "rejected");
      this.speechStopError = failed?.reason ?? null;
      if (failed) throw failed.reason;
    });
    this.speechBarrier = stopped.catch(() => {
    });
    try {
      await stopped;
    } catch (error) {
      if (epoch === this.speechEpoch) this.patch({ error: message(error) });
      return;
    }
    if (epoch === this.speechEpoch && !this.disposed && resumeListening && this.snapshot.conversation && !this.snapshot.listening && !this.snapshot.starting)
      await this._startInput(true);
  }
  async pauseSpeech() {
    if (this.disposed || !this.snapshot.speaking || this.snapshot.paused) return;
    const epoch = this.speechEpoch;
    const control = ++this.controlEpoch;
    try {
      const result = await this.engines[this.snapshot.settings.engine].pause();
      if (epoch === this.speechEpoch && control === this.controlEpoch && this.snapshot.speaking && result !== false)
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
      if (this.snapshot.settings.mode === "speaker") {
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
    if (this.disposed || epoch !== this.speechEpoch || this.speechStopError) return;
    const segments = splitSpeechOutput(text, {
      filterCodeBlocks: this.snapshot.settings.outputCodeFilterEnabled,
      codeBlockMaxLines: this.snapshot.settings.outputCodeMaxLines,
      codeBlockNotice: this.snapshot.settings.outputCodeNotice
    });
    const first = segments.shift();
    if (!first) return;
    this.queue.push(...segments.map((segment) => ({ text: segment, id: messageId, manual: true })));
    this._syncSpeechSegments();
    return this.play(first, messageId, true);
  }
  async play(text, messageId, manual = false) {
    if (this.disposed || !text.trim()) return;
    if (this.snapshot.speaking) {
      this.queue.push({ text, id: messageId, manual });
      this._syncSpeechSegments();
      return;
    }
    const epoch = ++this.speechEpoch;
    const engine = this.engines[this.snapshot.settings.engine];
    if (!engine) {
      this.queue = [];
      this.patch({ error: "Speech engine unavailable." });
      return;
    }
    this.patch({ speaking: true, paused: false, activeMessageId: messageId, error: null });
    this._syncSpeechSegments();
    let failed = false;
    try {
      await this.speechBarrier;
      if (this.speechStopError) throw this.speechStopError;
      if (epoch !== this.speechEpoch || this.disposed) return;
      if (this.snapshot.settings.mode === "speaker") {
        await this.stopListening();
        if (this.inputReleaseError) throw this.inputReleaseError;
      }
      if (epoch !== this.speechEpoch || this.disposed) return;
      await engine.speak(text, {
        voice: this.snapshot.settings.voice || void 0,
        rate: this.snapshot.settings.rate,
        outputDeviceId: this.snapshot.settings.outputDeviceId
      });
    } catch (error) {
      if (epoch === this.speechEpoch) {
        failed = true;
        this._suppressPending();
        if (error.name !== "AbortError") this.patch({ error: message(error) });
      }
    } finally {
      if (epoch === this.speechEpoch && !this.disposed) {
        this.patch({ speaking: false, paused: false, activeMessageId: null });
        this._syncSpeechSegments();
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
    if (this.disposed || !this.snapshot.conversation && !this.queue[0]?.manual || !this.snapshot.settings.announceAssistantMessages && !this.queue[0]?.manual || this.snapshot.speaking || this.snapshot.recognizing || this.snapshot.starting || !this.queue.length)
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
    void this.play(next.text, next.id, next.manual === true);
  }
  /** Baselines survive conversation toggles; cancelled message IDs remain suppressed. */
  observeMessage(id2, text, { complete = false, baseline = false } = {}) {
    if (this.disposed) return;
    if (complete) this.unfinished.delete(id2);
    else this.unfinished.add(id2);
    if (baseline || !this.snapshot.conversation || !this.snapshot.settings.announceAssistantMessages || this.suppressed.has(id2)) {
      this.consumed.set(id2, text.length);
      return;
    }
    const offset = this.consumed.get(id2) || 0;
    if (text.length < offset) {
      this.consumed.set(id2, text.length);
      return;
    }
    const remaining = text.slice(offset);
    const boundary = complete ? remaining.length : remaining.lastIndexOf("\n") + 1;
    if (boundary <= 0) return;
    if (this.snapshot.settings.outputCodeFilterEnabled && hasUnclosedCodeFence(remaining.slice(0, boundary)) && !complete)
      return;
    const chunk = filterSpeechOutput(remaining.slice(0, boundary).trim(), {
      filterCodeBlocks: this.snapshot.settings.outputCodeFilterEnabled,
      codeBlockMaxLines: this.snapshot.settings.outputCodeMaxLines,
      codeBlockNotice: this.snapshot.settings.outputCodeNotice
    }).trim();
    this.consumed.set(id2, offset + boundary);
    if (chunk) {
      this.queue.push({ text: chunk, id: id2 });
      this._syncSpeechSegments();
      this._drain();
    }
  }
  async dispose() {
    if (this.disposed) return;
    this.cancelAutoSend();
    this._cancelAssistantSpeechTimer();
    this.disposed = true;
    this.listeners.clear();
    await this.endConversation(true);
  }
};

// src/core/ownership.ts
var VoiceOwnership = class {
  constructor() {
    this.epoch = 0;
    this.tail = Promise.resolve();
    this.closed = false;
  }
  run(owner, owners, action) {
    const epoch = ++this.epoch;
    let outcome;
    const acquired = this.tail.then(async () => {
      if (this.closed || epoch !== this.epoch || owner.disposed) return;
      await Promise.all(
        owners.filter((other) => other !== owner).map((other) => other.endConversation(true))
      );
      if (this.closed || epoch !== this.epoch || owner.disposed) return;
      outcome = Promise.resolve(action());
      outcome.catch(() => {
      });
    });
    this.tail = acquired.catch(() => {
    });
    return acquired.then(() => outcome);
  }
  cancel() {
    ++this.epoch;
  }
  close() {
    this.closed = true;
    this.cancel();
  }
};

// src/core/microphone.ts
var MicrophoneMeter = class {
  constructor(globals = globalThis) {
    this.g = globals;
    this.deviceId = "";
    this.epoch = 0;
    this.current = null;
    this.stream = this.context = this.source = this.analyser = this.samples = null;
  }
  async capability() {
    const secure = this.g.isSecureContext === true || ["localhost", "127.0.0.1", "::1"].includes(this.g.location?.hostname);
    if (!secure)
      return {
        supported: false,
        permission: "unavailable",
        reason: "Microphone capture requires a secure or loopback page."
      };
    if (typeof this.g.navigator?.mediaDevices?.getUserMedia !== "function")
      return {
        supported: false,
        permission: "unavailable",
        reason: "This browser does not expose microphone capture."
      };
    const AudioContext = this.g.AudioContext || this.g.webkitAudioContext;
    if (typeof AudioContext !== "function")
      return {
        supported: false,
        permission: "unavailable",
        reason: "This browser does not expose Web Audio for the live waveform."
      };
    let permission = "prompt";
    try {
      const status = await this.g.navigator.permissions?.query?.({ name: "microphone" });
      if (["granted", "denied", "prompt"].includes(status?.state)) permission = status.state;
    } catch {
    }
    return permission === "denied" ? {
      supported: false,
      permission,
      reason: "Microphone permission is denied. Allow it in browser settings, then refresh availability."
    } : { supported: true, permission };
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
      samples: null
    };
    const cancelled3 = new Promise((resolve) => {
      job.cancelled = resolve;
    });
    job.cancel = () => {
      if (this.current === job) this.stop();
    };
    this.current = job;
    signal?.addEventListener("abort", job.cancel, { once: true });
    if (signal?.aborted) {
      job.cancel();
      return false;
    }
    const valid = () => this.current === job;
    const capture = async () => {
      try {
        const stream = await this.g.navigator.mediaDevices.getUserMedia({
          audio: {
            ...this.deviceId ? { deviceId: { exact: this.deviceId } } : {},
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
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
    return Promise.race([capture(), cancelled3]);
  }
  level() {
    if (!this.analyser || !this.samples) return 0;
    this.analyser.getFloatTimeDomainData(this.samples);
    return Math.min(
      1,
      Math.sqrt(this.samples.reduce((s, x) => s + x * x, 0) / this.samples.length) * 5
    );
  }
  _clear() {
    this.stream = this.context = this.source = this.analyser = this.samples = null;
  }
  _dispose(job) {
    job.signal?.removeEventListener("abort", job.cancel);
    const stream = job.stream, source = job.source, context = job.context;
    job.stream = job.source = job.context = job.analyser = job.samples = null;
    if (stream) {
      for (const track of stream.getTracks()) {
        try {
          track.stop();
        } catch {
        }
      }
    }
    try {
      source?.disconnect();
    } catch {
    }
    try {
      if (context && context.state !== "closed") Promise.resolve(context.close()).catch(() => {
      });
    } catch {
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
};

// src/engines/speaking/browser.ts
var abortError = () => Object.assign(new Error("Speech playback was cancelled."), { name: "AbortError" });
var BrowserSpeakingEngine = class {
  constructor({ globals = globalThis, lang = "pt-BR" } = {}) {
    this.globals = globals;
    this.lang = lang;
    this.current = null;
  }
  voices() {
    try {
      return Array.from(this.globals.speechSynthesis?.getVoices?.() ?? []).filter(
        (v) => v.localService === true
      );
    } catch {
      return [];
    }
  }
  capability() {
    const supported = typeof this.globals.SpeechSynthesisUtterance === "function" && typeof this.globals.speechSynthesis?.speak === "function" && typeof this.globals.speechSynthesis?.cancel === "function" && this.voices().length > 0;
    return {
      supported,
      local: true,
      voices: this.voices().map((voice) => ({
        name: voice.name,
        voiceURI: voice.voiceURI,
        lang: voice.lang
      })),
      pause: typeof this.globals.speechSynthesis?.pause === "function",
      resume: typeof this.globals.speechSynthesis?.resume === "function",
      ...supported ? {} : {
        reason: "Local browser speech synthesis is unavailable. Enable an installed local system voice, refresh the voice list, or choose another local speaking engine. Remote voices are not allowed."
      }
    };
  }
  async speak(text, { voice, rate = 1, signal } = {}) {
    this.stop();
    if (signal?.aborted) throw abortError();
    if (typeof text !== "string") throw new TypeError("Speech text must be a string.");
    if (!Number.isFinite(rate) || rate < 0.1 || rate > 10)
      throw new RangeError("Speech rate must be between 0.1 and 10.");
    const capability = this.capability();
    if (!capability.supported) throw new Error(capability.reason);
    const voices = this.voices();
    const chosen = voice == null ? voices.find((v) => v.lang?.toLowerCase() === this.lang.toLowerCase()) ?? voices[0] : voices.find(
      (v) => typeof voice === "string" ? v.voiceURI === voice || v.name === voice : v === voice
    );
    if (!chosen)
      throw new Error(
        "The selected voice is not an available local browser voice. Choose a voice from voices()."
      );
    if (!text.trim()) return;
    const utterance = new this.globals.SpeechSynthesisUtterance(text);
    utterance.voice = chosen;
    utterance.lang = chosen.lang || this.lang;
    utterance.rate = rate;
    return new Promise((resolve, reject) => {
      const finish = (error) => {
        if (this.current !== job) return;
        this.current = null;
        utterance.onend = null;
        utterance.onerror = null;
        signal?.removeEventListener("abort", cancel);
        error ? reject(error) : resolve();
      };
      const cancel = () => {
        if (this.current === job) this.stop();
      };
      const job = { finish, utterance };
      this.current = job;
      utterance.onend = () => finish();
      utterance.onerror = (event) => finish(
        Object.assign(
          new Error("Browser speech synthesis failed: " + (event.error || "unknown error")),
          { code: event.error }
        )
      );
      signal?.addEventListener("abort", cancel, { once: true });
      if (signal?.aborted) {
        cancel();
        return;
      }
      try {
        this.globals.speechSynthesis.resume?.();
        this.globals.speechSynthesis.speak(utterance);
      } catch (error) {
        finish(error);
      }
    });
  }
  async stop() {
    if (!this.current) return;
    this.current.finish(abortError());
    try {
      this.globals.speechSynthesis.cancel();
    } catch {
    }
  }
  pause() {
    if (!this.current || typeof this.globals.speechSynthesis.pause !== "function") return false;
    this.globals.speechSynthesis.pause();
    return true;
  }
  resume() {
    if (!this.current || typeof this.globals.speechSynthesis.resume !== "function") return false;
    this.globals.speechSynthesis.resume();
    return true;
  }
};

// src/engines/speaking/say-client.ts
var CHANNEL = "/api";
var cancelled = () => Object.assign(new Error("Speech was cancelled."), { name: "AbortError" });
var SayClientEngine = class {
  constructor({ rpc }) {
    this.rpc = rpc;
    this.clientId = globalThis.crypto.randomUUID();
    this.current = null;
  }
  async request(endpoint, payload = {}, signal) {
    const result = await this.rpc.call(CHANNEL, `dsh-live-voice/${endpoint}`, payload, signal);
    if (!result?.ok) {
      if (signal?.aborted || result?.error?.code === "cancelled") throw cancelled();
      throw Object.assign(new Error(result?.error?.message || "Host speech is unavailable."), {
        code: result?.error?.code
      });
    }
    return result.value;
  }
  async capability() {
    try {
      return { ...await this.request("capabilities"), local: true, location: "host" };
    } catch (error) {
      return {
        supported: false,
        local: true,
        location: "host",
        reason: `macOS say connection failed: ${error.message}`
      };
    }
  }
  async speak(text, { voice, rate = 1, signal } = {}) {
    if (typeof text !== "string") throw new TypeError("Speech text must be a string.");
    if (!Number.isFinite(rate) || rate < 0.1 || rate > 10)
      throw new RangeError("Speech rate must be between 0.1 and 10.");
    if (signal?.aborted) throw cancelled();
    const previous = this.current;
    previous?.abort.abort();
    const operation = { operationId: globalThis.crypto.randomUUID(), abort: new AbortController() };
    this.current = operation;
    const cancel = () => operation.abort.abort();
    signal?.addEventListener("abort", cancel, { once: true });
    if (signal?.aborted) cancel();
    try {
      if (!text.trim()) return;
      await this.request(
        "speak",
        {
          clientId: this.clientId,
          operationId: operation.operationId,
          text,
          ...voice === void 0 ? {} : { voice },
          rate: Math.round(rate * 175)
        },
        operation.abort.signal
      );
      if (operation.abort.signal.aborted) throw cancelled();
    } finally {
      signal?.removeEventListener("abort", cancel);
      if (this.current === operation) this.current = null;
    }
  }
  async stop() {
    const operation = this.current;
    if (!operation) return;
    this.current = null;
    const stopping = this.request("stop", {
      clientId: this.clientId,
      operationId: operation.operationId
    });
    operation.abort.abort();
    await stopping;
  }
  async control(endpoint) {
    const operation = this.current;
    if (!operation) return false;
    const value = await this.request(endpoint, {
      clientId: this.clientId,
      operationId: operation.operationId
    });
    return value.applied;
  }
  pause() {
    return this.control("pause");
  }
  resume() {
    return this.control("resume");
  }
};

// src/engines/recognition/browser.ts
var abortError2 = () => Object.assign(new Error("Speech recognition was cancelled."), { name: "AbortError" });
var localReason = "Local browser speech recognition is unavailable for this language. Install the local language pack, or explicitly turn off local-only processing in Settings if you permit the browser recognition service to process audio.";
var notify = (callback, value) => {
  try {
    callback?.(value);
  } catch {
  }
};
var BrowserRecognitionEngine = class {
  constructor({
    globals = globalThis,
    lang = "pt-BR",
    processLocally = true,
    autoInstallLocalPack = true,
    onResult,
    onActivity,
    onError,
    maxRestarts = 3,
    restartDelayMs = 100
  } = {}) {
    if (!Number.isInteger(maxRestarts) || maxRestarts < 0 || maxRestarts > 100)
      throw new RangeError("maxRestarts must be an integer between 0 and 100.");
    if (!Number.isFinite(restartDelayMs) || restartDelayMs < 0)
      throw new RangeError("restartDelayMs must be nonnegative.");
    Object.assign(this, {
      globals,
      lang,
      processLocally,
      autoInstallLocalPack,
      onResult,
      onActivity,
      onError,
      maxRestarts,
      restartDelayMs
    });
    this.session = null;
  }
  get active() {
    return this.session !== null;
  }
  get Recognition() {
    try {
      const standard = this.globals?.SpeechRecognition;
      return typeof standard === "function" ? standard : this.globals?.webkitSpeechRecognition;
    } catch {
      return void 0;
    }
  }
  async capability({ lang = this.lang, processLocally = this.processLocally } = {}) {
    try {
      const Recognition = this.Recognition;
      if (typeof Recognition !== "function") throw new Error();
      const probe = new Recognition();
      if (typeof probe.start !== "function" || typeof probe.abort !== "function") throw new Error();
      if (!processLocally)
        return {
          supported: true,
          local: false,
          reason: "Browser recognition service may process audio remotely."
        };
      if (typeof Recognition.available !== "function" || !("processLocally" in probe))
        throw new Error();
      probe.processLocally = true;
      if (probe.processLocally !== true) throw new Error();
      let availability = await Recognition.available({ langs: [lang], processLocally: true });
      if (availability === "downloadable" && this.autoInstallLocalPack) {
        const installed = await Recognition.install?.({ langs: [lang], processLocally: true });
        if (installed === true)
          availability = await Recognition.available({ langs: [lang], processLocally: true });
        else
          return {
            supported: false,
            local: true,
            availability,
            reason: `The browser could not install the local ${lang} language pack. Disable local processing to use the browser recognition service, or try again later.`
          };
      }
      if (availability !== "available")
        return {
          supported: false,
          local: true,
          availability,
          reason: `Local recognition for ${lang}: ${availability}. ${availability === "downloadable" ? "The language pack is not installed; enable automatic installation or browser-service recognition." : availability === "downloading" ? "The browser is still installing the language pack." : "The browser cannot currently provide on-device recognition for this language."}`
        };
      return { supported: true, local: true };
    } catch {
      return {
        supported: false,
        local: processLocally,
        reason: processLocally ? localReason : "Browser speech recognition is unavailable in this browser."
      };
    }
  }
  async installLocalPack({ lang = this.lang } = {}) {
    const Recognition = this.Recognition;
    if (typeof Recognition?.install !== "function")
      throw new Error("This browser cannot install local speech-recognition language packs.");
    const result = await Recognition.install({ langs: [lang], processLocally: true });
    if (result !== true) throw new Error(`Local recognition for ${lang} could not be installed.`);
    return this.capability({ lang, processLocally: true });
  }
  async start({
    lang = this.lang,
    signal,
    onResult = this.onResult,
    onActivity = this.onActivity,
    onError = this.onError
  } = {}) {
    this.stop();
    if (signal?.aborted) throw abortError2();
    const session = {
      lang,
      signal,
      onResult,
      onActivity,
      onError,
      restarts: 0,
      timer: null,
      recognition: null,
      speaking: false
    };
    this.session = session;
    const cancelled3 = new Promise((resolve, reject) => {
      session.rejectCancelled = reject;
    });
    session.cancel = () => {
      if (this.session === session) this.stop();
    };
    signal?.addEventListener("abort", session.cancel, { once: true });
    const capability = await Promise.race([
      this.capability({ lang, processLocally: this.processLocally }),
      cancelled3
    ]);
    if (this.session !== session || signal?.aborted) {
      session.cancel();
      throw abortError2();
    }
    if (!capability.supported) {
      this.stop();
      throw new Error(capability.reason);
    }
    try {
      this._begin(session);
      if (this.session !== session) throw abortError2();
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
    for (const name of ["onresult", "onerror", "onend", "onspeechstart", "onspeechend"])
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
      if (!("processLocally" in recognition)) throw new Error(localReason);
      recognition.processLocally = true;
      if (recognition.processLocally !== true) throw new Error(localReason);
    } else if ("processLocally" in recognition) recognition.processLocally = false;
    recognition.lang = session.lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    session.recognition = recognition;
    const finals = /* @__PURE__ */ new Set();
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
      const interim = [], final = [];
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? "";
        if (text.trim()) session.restarts = 0;
        if (result.isFinal) {
          if (!finals.has(i)) {
            finals.add(i);
            final.push(text);
          }
        } else interim.push(text);
      }
      notify(session.onResult, { interim: interim.join(" "), final: final.join(" ") });
    };
    recognition.onerror = (event) => {
      if (!valid()) return;
      const error = Object.assign(
        new Error("Local browser recognition failed: " + (event.error || "unknown error")),
        { code: event.error }
      );
      if (event.error === "no-speech") return;
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
              "Local browser recognition stopped repeatedly. Restart listening manually or choose another local engine."
            ),
            { code: "restart-limit" }
          )
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
        Math.min(3e4, this.restartDelayMs * 2 ** Math.min(session.restarts - 1, 20))
      );
    };
    recognition.start();
  }
  reset() {
    const session = this.session;
    const recognition = session?.recognition;
    if (!session || !recognition) return false;
    this._detach(recognition);
    session.recognition = null;
    try {
      recognition.abort();
    } catch {
    }
    this._activity(session, false);
    if (this.session !== session || session.signal?.aborted) return false;
    try {
      this._begin(session);
      return true;
    } catch (error) {
      this._fail(session, error);
      return false;
    }
  }
  async stop() {
    const session = this.session;
    if (!session) return;
    this.session = null;
    session.rejectCancelled(abortError2());
    session.signal?.removeEventListener("abort", session.cancel);
    if (session.timer !== null)
      (this.globals.clearTimeout ?? globalThis.clearTimeout)(session.timer);
    this._detach(session.recognition);
    try {
      session.recognition?.abort();
    } catch {
    }
    this._activity(session, false);
  }
};

// src/engines/recognition/whisper-http.ts
var ROUTE = "/api/dsh-live-voice/whisper";
var id = () => globalThis.crypto.randomUUID();
var abortError3 = () => Object.assign(new Error("Whisper recognition was cancelled."), { name: "AbortError" });
function encodeMonoPcm16Wav(samples, inputRate) {
  const ratio = inputRate / 16e3, length = Math.floor(samples.length / ratio), out = new Int16Array(length);
  for (let i = 0; i < length; i++) {
    const start = Math.floor(i * ratio), end = Math.max(start + 1, Math.floor((i + 1) * ratio));
    let sum = 0;
    for (let j = start; j < end && j < samples.length; j++) sum += samples[j];
    const value = Math.max(-1, Math.min(1, sum / (end - start)));
    out[i] = value < 0 ? value * 32768 : value * 32767;
  }
  const buffer = new ArrayBuffer(44 + out.byteLength), view = new DataView(buffer), text = (at, s) => {
    for (let i = 0; i < s.length; i++) view.setUint8(at + i, s.charCodeAt(i));
  };
  text(0, "RIFF");
  view.setUint32(4, 36 + out.byteLength, true);
  text(8, "WAVE");
  text(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 16e3, true);
  view.setUint32(28, 32e3, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  text(36, "data");
  view.setUint32(40, out.byteLength, true);
  new Int16Array(buffer, 44).set(out);
  return buffer;
}
var WhisperHttpRecognitionEngine = class {
  constructor({ globals = globalThis, meter, voiceDetectionPreset = "natural" } = {}) {
    this.g = globals;
    this.meter = meter;
    this.session = null;
    this.lang = "pt-BR";
    this.voiceDetectionPreset = voiceDetectionPreset;
    this.route = ROUTE;
  }
  get segmentation() {
    return voiceDetectionPresets[this.voiceDetectionPreset] || voiceDetectionPresets.natural;
  }
  async capability() {
    try {
      const response = await this.g.fetch(this.route + "/capabilities", {
        credentials: "same-origin"
      }), json = await response.json();
      return json?.ok ? json.value : {
        supported: false,
        local: true,
        streaming: false,
        reason: json?.error?.message || "Whisper HTTP host is unavailable."
      };
    } catch (error) {
      return {
        supported: false,
        local: true,
        streaming: false,
        reason: "Whisper HTTP host connection failed: " + error.message
      };
    }
  }
  async start({
    lang = this.lang,
    signal,
    onResult,
    onActivity,
    onError,
    onProcessingChange
  } = {}) {
    await this.stop();
    if (signal?.aborted) throw abortError3();
    const context = this.meter?.context, source = this.meter?.source;
    if (!context || !source || typeof context.createScriptProcessor !== "function")
      throw new Error("This browser cannot capture PCM audio for Whisper HTTP.");
    const processor = context.createScriptProcessor(4096, 1, 1), gain = context.createGain?.();
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
      signal
    };
    this.session = session;
    const valid = () => this.session === session && !signal?.aborted;
    const notifyProcessing = () => session.onProcessingChange?.({
      queued: session.transcriptionQueue.length,
      active: !!session.activeRequest,
      pending: session.transcriptionQueue.length + (session.activeRequest ? 1 : 0)
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
            const response = await this.g.fetch(this.route + "/transcribe", {
              method: "POST",
              credentials: "same-origin",
              headers: {
                "content-type": "audio/wav",
                "x-dlv-client-id": session.operation,
                "x-dlv-operation-id": id(),
                "x-dlv-language": lang
              },
              body: encodeMonoPcm16Wav(samples, context.sampleRate),
              signal: request.signal
            });
            const json = await response.json();
            if (!response.ok || !json?.ok)
              throw new Error(json?.error?.message || "HTTP transcription failed.");
            if (valid() && json.value.text) onResult?.({ final: json.value.text, interim: "" });
          } catch (error) {
            if (error.name !== "AbortError" && valid()) onError?.(error);
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
      const data = new Float32Array(event.inputBuffer.getChannelData(0)), rms = Math.sqrt(data.reduce((sum, x) => sum + x * x, 0) / data.length);
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
      if (session.voiced && session.silence > context.sampleRate * (this.segmentation.silenceMs / 1e3) || session.samples > context.sampleRate * 20)
        enqueue();
    };
    source.connect(processor);
    session.abort = () => this.stop();
    signal?.addEventListener("abort", session.abort, { once: true });
  }
  async stop() {
    const session = this.session;
    if (!session) return;
    this.session = null;
    session.signal?.removeEventListener("abort", session.abort);
    session.processor.onaudioprocess = null;
    try {
      this.meter?.source?.disconnect(session.processor);
    } catch {
    }
    try {
      session.processor.disconnect();
      session.gain?.disconnect();
    } catch {
    }
    session.transcriptionQueue = [];
    session.activeRequest?.abort();
    session.activeRequest = null;
    session.onProcessingChange?.({ queued: 0, active: false, pending: 0 });
  }
};

// src/engines/recognition/qwen-http.ts
var QwenHttpRecognitionEngine = class extends WhisperHttpRecognitionEngine {
  constructor(options = {}) {
    super(options);
    this.route = "/api/dsh-live-voice/qwen";
  }
  async capability() {
    const capture = await this.meter?.capability?.();
    if (capture?.supported === false) return capture;
    try {
      const response = await this.g.fetch(this.route + "/capabilities?kind=asr", {
        credentials: "same-origin"
      }), json = await response.json();
      return response.ok && json?.ok ? json.value : {
        supported: false,
        local: true,
        location: "host",
        reason: json?.error?.message || "Qwen capability check failed."
      };
    } catch (error) {
      return {
        supported: false,
        local: true,
        location: "host",
        reason: "Qwen speech server check failed: " + (error?.message || error)
      };
    }
  }
};

// src/engines/speaking/qwen-http.ts
var BASE = "/api/dsh-live-voice/qwen";
var cancelled2 = () => Object.assign(new Error("Speech was cancelled."), { name: "AbortError" });
var QwenHttpSpeakingEngine = class {
  constructor({ globals = globalThis, lang = "pt-BR" } = {}) {
    this.g = globals;
    this.lang = lang;
    this.current = null;
  }
  async capability() {
    try {
      const response = await this.g.fetch(BASE + "/capabilities?kind=tts", {
        credentials: "same-origin"
      }), json = await response.json();
      if (!response.ok || !json?.ok)
        throw new Error(json?.error?.message || "Qwen capability check failed.");
      return { ...json.value, pause: true, resume: true };
    } catch (error) {
      return {
        supported: false,
        local: true,
        location: "host",
        pause: true,
        resume: true,
        reason: "Qwen speech server check failed: " + (error?.message || error)
      };
    }
  }
  async speak(text, { rate = 1, signal, lang = this.lang, voice = "aiden", outputDeviceId = "" } = {}) {
    if (typeof text !== "string") throw new TypeError("Speech text must be a string.");
    if (!Number.isFinite(rate) || rate < 0.1 || rate > 3)
      throw new RangeError("Speech rate must be between 0.1 and 3.");
    if (signal?.aborted) throw cancelled2();
    await this.stop();
    if (!text.trim()) return;
    const operation = { abort: new AbortController(), audio: null, url: null };
    this.current = operation;
    const cancel = () => operation.abort.abort();
    signal?.addEventListener("abort", cancel, { once: true });
    if (signal?.aborted) cancel();
    try {
      const response = await this.g.fetch(BASE + "/speech", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, lang, voice }),
        signal: operation.abort.signal
      });
      if (!response.ok) {
        let body;
        try {
          body = await response.json();
        } catch {
        }
        throw new Error(body?.error?.message || `Qwen synthesis failed (${response.status}).`);
      }
      if (operation.abort.signal.aborted) throw cancelled2();
      const blob = await response.blob();
      operation.url = this.g.URL.createObjectURL(blob);
      const audio = operation.audio = new this.g.Audio(operation.url);
      audio.playbackRate = rate;
      if (outputDeviceId && typeof audio.setSinkId === "function")
        await audio.setSinkId(outputDeviceId);
      await new Promise((resolve, reject) => {
        const done = () => {
          cleanup();
          resolve();
        }, failed = () => {
          cleanup();
          reject(new Error("The browser could not play Qwen speech audio."));
        }, aborted = () => {
          cleanup();
          audio.pause();
          reject(cancelled2());
        }, cleanup = () => {
          audio.removeEventListener("ended", done);
          audio.removeEventListener("error", failed);
          operation.abort.signal.removeEventListener("abort", aborted);
        };
        audio.addEventListener("ended", done, { once: true });
        audio.addEventListener("error", failed, { once: true });
        operation.abort.signal.addEventListener("abort", aborted, { once: true });
        Promise.resolve(audio.play()).catch(failed);
      });
    } catch (error) {
      if (operation.abort.signal.aborted && error?.name !== "AbortError") throw cancelled2();
      throw error;
    } finally {
      signal?.removeEventListener("abort", cancel);
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
};

// src/client/whisper-settings.ts
var BASE2 = "/api/dsh-live-voice/whisper";
var UNLOADED = "Whisper settings routes are not loaded. A normal DSH server restart is required to load updated plugin routes; refreshing this page alone is not enough.";
async function whisperSettingsRequest(path, { method = "GET", config, signal } = {}, fetchImpl = globalThis.fetch) {
  const response = await fetchImpl(BASE2 + path, {
    method,
    credentials: "same-origin",
    signal,
    headers: config ? { "content-type": "application/json" } : void 0,
    body: config ? JSON.stringify(config) : void 0
  });
  if (response.status === 401 || response.status === 403)
    throw new Error("Sign in to DSH to manage Whisper settings.");
  if (response.status === 404 || response.status === 405) throw new Error(UNLOADED);
  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error(UNLOADED);
  }
  if (typeof body?.ok !== "boolean") throw new Error(UNLOADED);
  if (!response.ok || !body.ok)
    throw new Error(body.error?.message || "Whisper settings request failed.");
  return body.value;
}
function createWhisperSettings(React2) {
  const h = React2.createElement;
  return function WhisperSettings({ controller }) {
    const [draft, setDraft] = React2.useState({
      url: "http://127.0.0.1:8080/inference",
      healthUrl: "/health",
      timeoutMs: 3e4
    });
    const [busy, setBusy] = React2.useState(true), [loaded, setLoaded] = React2.useState(false), [error, setError] = React2.useState(""), [message2, setMessage] = React2.useState("");
    const active = React2.useRef(null);
    async function run(action) {
      active.current?.abort();
      const abort = new AbortController();
      active.current = abort;
      setBusy(true);
      setError("");
      setMessage("");
      try {
        if (action === "load") {
          const value = await whisperSettingsRequest("/config", { signal: abort.signal });
          if (!abort.signal.aborted) {
            setDraft(value);
            setLoaded(true);
          }
        } else if (action === "save") {
          await controller.endConversation?.();
          const value = await whisperSettingsRequest("/config", {
            method: "PUT",
            config: { ...draft, timeoutMs: Number(draft.timeoutMs) },
            signal: abort.signal
          });
          if (!abort.signal.aborted) {
            setDraft(value);
            setMessage("Saved on the DSH host. Active host transcription requests were cancelled.");
            await controller.refreshCapabilities?.();
          }
        } else {
          const value = await whisperSettingsRequest("/test", {
            method: "POST",
            config: { ...draft, timeoutMs: Number(draft.timeoutMs) },
            signal: abort.signal
          });
          if (!abort.signal.aborted) {
            if (!value.supported) throw new Error(value.reason || "Whisper health check failed.");
            setMessage(
              "Connection successful. Health endpoint responded; transcription was not tested. Unsaved edits have not been applied."
            );
          }
        }
      } catch (reason) {
        if (!abort.signal.aborted) setError(reason.message || String(reason));
      } finally {
        if (!abort.signal.aborted) setBusy(false);
      }
    }
    React2.useEffect(() => {
      void run("load");
      return () => active.current?.abort();
    }, []);
    function field(label, key, type = "text") {
      return h(
        "label",
        null,
        label,
        h("input", {
          type,
          value: draft[key],
          disabled: busy || !loaded,
          autoComplete: "off",
          ...type === "number" ? { min: 100, max: 3e5, step: 1 } : {},
          onChange: (event) => {
            setDraft({ ...draft, [key]: event.target.value });
            setMessage("Unsaved changes");
            setError("");
          }
        })
      );
    }
    return h(
      React2.Fragment,
      null,
      h(
        "p",
        null,
        "Host-wide settings. Only unauthenticated loopback HTTP URLs (localhost, 127.0.0.1, [::1]) are allowed. Loopback means the DSH host, not this browser. All health checks and audio requests run through the authenticated backend."
      ),
      field("Endpoint URL", "url"),
      field("Health URL or path", "healthUrl"),
      field("Request timeout (ms)", "timeoutMs", "number"),
      h(
        "div",
        { className: "dlv-settings-actions" },
        h(
          "button",
          { type: "button", disabled: busy || !loaded, onClick: () => run("save") },
          "Save Whisper settings"
        ),
        h(
          "button",
          { type: "button", disabled: busy || !loaded, onClick: () => run("test") },
          "Test connection"
        ),
        h(
          "button",
          { type: "button", disabled: busy, onClick: () => run("load") },
          "Reload saved settings"
        )
      ),
      busy ? h("p", { role: "status" }, "Contacting DSH host\u2026") : null,
      message2 ? h("p", { role: "status" }, message2) : null,
      error ? h("p", { role: "alert" }, error) : null
    );
  };
}

// src/client/qwen-settings.ts
var BASE3 = "/api/dsh-live-voice/qwen";
var UNLOADED2 = "Qwen settings routes are not loaded. A normal DSH server restart is required to load updated plugin routes; refreshing this page alone is not enough.";
async function qwenSettingsRequest(path, { method = "GET", config, signal } = {}, fetchImpl = globalThis.fetch) {
  const response = await fetchImpl(BASE3 + path, {
    method,
    credentials: "same-origin",
    signal,
    headers: config ? { "content-type": "application/json" } : void 0,
    body: config ? JSON.stringify(config) : void 0
  });
  if (response.status === 401 || response.status === 403)
    throw new Error("Sign in to DSH to manage Qwen settings.");
  if (response.status === 404 || response.status === 405) throw new Error(UNLOADED2);
  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error(UNLOADED2);
  }
  if (typeof body?.ok !== "boolean") throw new Error(UNLOADED2);
  if (!response.ok || !body.ok)
    throw new Error(body.error?.message || "Qwen settings request failed.");
  return body.value;
}
function createQwenSettings(React2) {
  const h = React2.createElement;
  return function QwenSettings({ controller }) {
    const [draft, setDraft] = React2.useState({
      baseUrl: "http://127.0.0.1:8080/",
      timeoutMs: 3e5
    });
    const [busy, setBusy] = React2.useState(true), [loaded, setLoaded] = React2.useState(false), [error, setError] = React2.useState(""), [message2, setMessage] = React2.useState("");
    const active = React2.useRef(null);
    async function run(action) {
      active.current?.abort();
      const abort = new AbortController();
      active.current = abort;
      setBusy(true);
      setError("");
      setMessage("");
      try {
        if (action === "load") {
          const value = await qwenSettingsRequest("/config", { signal: abort.signal });
          if (!abort.signal.aborted) {
            setDraft(value);
            setLoaded(true);
          }
        } else if (action === "save") {
          await controller.endConversation?.();
          const value = await qwenSettingsRequest("/config", {
            method: "PUT",
            config: { ...draft, timeoutMs: Number(draft.timeoutMs) },
            signal: abort.signal
          });
          if (!abort.signal.aborted) {
            setDraft(value);
            setMessage("Saved on the DSH host. Active Qwen requests were cancelled.");
            await controller.refreshCapabilities?.();
          }
        } else {
          const value = await qwenSettingsRequest("/test", {
            method: "POST",
            config: { ...draft, timeoutMs: Number(draft.timeoutMs) },
            signal: abort.signal
          });
          if (!abort.signal.aborted) {
            if (!value.supported) throw new Error(value.reason || "Qwen health check failed.");
            setMessage(
              "Connection successful. Both Qwen ASR and TTS are loaded. Unsaved edits have not been applied."
            );
          }
        }
      } catch (reason) {
        if (!abort.signal.aborted) setError(reason.message || String(reason));
      } finally {
        if (!abort.signal.aborted) setBusy(false);
      }
    }
    React2.useEffect(() => {
      void run("load");
      return () => active.current?.abort();
    }, []);
    const field = (label, key, type = "text") => h(
      "label",
      null,
      label,
      h("input", {
        type,
        value: draft[key],
        disabled: busy || !loaded,
        autoComplete: "off",
        ...type === "number" ? { min: 1e3, max: 6e5, step: 1 } : {},
        onChange: (event) => {
          setDraft({ ...draft, [key]: event.target.value });
          setMessage("Unsaved changes");
          setError("");
        }
      })
    );
    return h(
      React2.Fragment,
      null,
      h(
        "p",
        null,
        "Host-wide settings for the Qwen3 ASR + TTS server. Enter any HTTP or HTTPS base URL reachable from the DSH host. The browser accesses it through authenticated DSH routes."
      ),
      field("Qwen API base URL", "baseUrl"),
      field("Request timeout (ms)", "timeoutMs", "number"),
      h(
        "div",
        { className: "dlv-settings-actions" },
        h(
          "button",
          { type: "button", disabled: busy || !loaded, onClick: () => run("save") },
          "Save Qwen settings"
        ),
        h(
          "button",
          { type: "button", disabled: busy || !loaded, onClick: () => run("test") },
          "Test Qwen server"
        ),
        h(
          "button",
          { type: "button", disabled: busy, onClick: () => run("load") },
          "Reload saved settings"
        )
      ),
      busy ? h("p", { role: "status" }, "Contacting DSH host\u2026") : null,
      message2 ? h("p", { role: "status" }, message2) : null,
      error ? h("p", { role: "alert" }, error) : null
    );
  };
}

// src/client/components.ts
function createComponents(React2) {
  const h = React2.createElement;
  const WhisperSettings = createWhisperSettings(React2);
  const QwenSettings = createQwenSettings(React2);
  function useController(controller) {
    const subscribe = React2.useCallback((listener) => controller.subscribe(listener), [controller]);
    const read = React2.useCallback(() => controller.getSnapshot(), [controller]);
    return React2.useSyncExternalStore(subscribe, read, read);
  }
  function Icon({ name }) {
    const common = {
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.8,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": true
    };
    const paths = {
      mic: "M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0V5M6 10v2a6 6 0 0 0 12 0v-2M12 18v4M8 22h8",
      micOff: "M9 9v3a3 3 0 0 0 5.12 2.12M15 9V5a3 3 0 0 0-5.64-1.42M6 10v2a6 6 0 0 0 9.5 4.88M18 10v2a6 6 0 0 1-.5 2.4M12 18v4M8 22h8M3 3l18 18",
      speaker: "M3 9h4l6-5v16l-6-5H3V9M17 8a6 6 0 0 1 0 8M20 5a10 10 0 0 1 0 14",
      close: "M6 6l12 12M18 6L6 18",
      stop: "M6 6h12v12H6z",
      pause: "M8 5v14M16 5v14",
      play: "M7 4l13 8-13 8z",
      send: "M3 11.5L21 3l-8.5 18-2-7.5L3 11.5zm7.5 2L21 3",
      queue: "M5 6h14M5 12h10M5 18h6M18 15v6M15 18h6",
      speakerOff: "M3 9h4l6-5v16l-6-5H3V9M17 9l5 6M22 9l-5 6"
    };
    return h("svg", common, h("path", { d: paths[name] || paths.mic }));
  }
  function Button({
    label,
    icon,
    visibleLabel,
    title = label,
    className = "dlv-pill-button",
    ...props
  }) {
    return h(
      "button",
      {
        ...props,
        type: "button",
        className: "dlv-icon-button " + className,
        title,
        "aria-label": label
      },
      h(Icon, { name: icon }),
      visibleLabel ? h("span", { className: "dlv-toggle-state", "aria-hidden": true }, visibleLabel) : null
    );
  }
  function useActions(controller) {
    const [error, setError] = React2.useState("");
    const alive = React2.useRef(true);
    React2.useEffect(() => {
      alive.current = true;
      return () => {
        alive.current = false;
      };
    }, []);
    const invoke = (name, ...args) => {
      setError("");
      try {
        Promise.resolve(controller[name](...args)).catch((reason) => {
          if (alive.current) setError(reason instanceof Error ? reason.message : String(reason));
        });
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : String(reason));
      }
    };
    return [invoke, error, () => setError("")];
  }
  function ErrorText({ error, onDismiss }) {
    return error ? h(
      "div",
      { className: "dlv-error", role: "alert" },
      String(error),
      onDismiss ? h(
        "button",
        { type: "button", "aria-label": "Dismiss voice error", onClick: onDismiss },
        "Dismiss"
      ) : null
    ) : null;
  }
  function MicrophoneButtons({ controller }) {
    const state = useController(controller);
    const [invoke, error, clearError] = useActions(controller);
    const busy = state.conversation || state.listening || state.starting || state.recognizing;
    if (busy) return null;
    const recognition = state.capabilities?.recognition;
    const capture = state.capabilities?.capture;
    const pending = !recognition || !capture;
    const unavailable = recognition?.supported === false || capture?.supported === false;
    const reason = capture?.supported === false ? capture.reason : recognition?.reason;
    return h(
      React2.Fragment,
      null,
      h(Button, {
        className: "dlv-mic",
        icon: "mic",
        label: pending ? "Checking microphone availability" : unavailable ? reason || "Speech recognition unavailable" : "Start voice conversation",
        disabled: pending,
        onClick: () => unavailable ? invoke("explainRecognition") : invoke("startConversation")
      }),
      h(ErrorText, { error, onDismiss: clearError })
    );
  }
  function Waveform({ controller, enabled }) {
    const ref = React2.useRef(null);
    React2.useEffect(() => {
      const canvas = ref.current;
      const context = canvas?.getContext("2d");
      if (!context) return void 0;
      let frame = 0;
      let disposed = false;
      let width = 1;
      let height = 40;
      let ratio = 1;
      const motion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
      function resize() {
        const bounds = canvas.getBoundingClientRect();
        width = Math.max(1, bounds.width);
        height = Math.max(1, bounds.height || 40);
        ratio = Math.max(1, window.devicePixelRatio || 1);
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
      }
      const observer = typeof ResizeObserver === "function" ? new ResizeObserver(resize) : null;
      observer?.observe(canvas);
      window.addEventListener("resize", resize);
      resize();
      function draw(time) {
        if (disposed) return;
        if (ratio !== Math.max(1, window.devicePixelRatio || 1)) resize();
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        context.clearRect(0, 0, width, height);
        const raw = Number(controller.meter?.level?.() ?? 0);
        const level = enabled && Number.isFinite(raw) ? Math.min(1, Math.max(0, raw)) : 0;
        const color = getComputedStyle(canvas).color;
        for (let layer = 0; layer < 3; layer += 1) {
          context.beginPath();
          context.strokeStyle = layer === 1 ? "#38bdf8" : color;
          context.globalAlpha = 0.4 + layer * 0.25;
          context.lineWidth = layer === 2 ? 2 : 1;
          const phase = motion?.matches ? 0 : time / (500 + layer * 170);
          for (let x = 0; x <= width; x += 2) {
            const envelope = Math.sin(Math.PI * x / width);
            const y = height / 2 + Math.sin(x / width * Math.PI * (4 + layer * 2) + phase) * envelope * level * height * (0.43 - layer * 0.08);
            if (x === 0) context.moveTo(x, y);
            else context.lineTo(x, y);
          }
          context.stroke();
        }
        context.globalAlpha = 1;
        frame = window.requestAnimationFrame(draw);
      }
      frame = window.requestAnimationFrame(draw);
      return () => {
        disposed = true;
        window.cancelAnimationFrame(frame);
        observer?.disconnect();
        window.removeEventListener("resize", resize);
      };
    }, [controller, enabled]);
    return h("canvas", { ref, className: "dlv-wave", "aria-hidden": true });
  }
  function RecordingBar({ controller, questionOnly = false, overlay = false, overlayStyle }) {
    const state = useController(controller);
    const [now, setNow] = React2.useState(Date.now());
    React2.useEffect(() => {
      if (!state.autoSendAt) return;
      setNow(Date.now());
      const timer = setInterval(() => setNow(Date.now()), 200);
      return () => clearInterval(timer);
    }, [state.autoSendAt]);
    const [invoke, error, clearError] = useActions(controller);
    const capture = state.starting || state.listening || state.recognizing;
    if (questionOnly && !state.answeringQuestion) return null;
    if (!state.conversation && !capture && !state.speaking && !state.paused && !state.error && !error)
      return null;
    const remaining = state.autoSendAt ? Math.max(1, Math.ceil((state.autoSendAt - now) / 1e3)) : null;
    const status = state.answeringQuestion && state.recognizing ? "Recognizing answer\u2026" : state.answeringQuestion && state.listening ? "Listening for your answer\u2026" : remaining ? `Sending in ${remaining}\u2026` : state.starting ? "Starting microphone\u2026" : state.paused ? "Speech paused" : state.speaking ? "Speaking" : state.recognizing ? "Recognizing speech\u2026" : state.listening ? "Listening \u2014 waiting for speech" : state.conversation ? "Conversation idle" : "Voice ready";
    return h(
      "div",
      {
        className: overlay ? "dlv-bar-wrap dlv-question-overlay" : "dlv-bar-wrap",
        style: overlay ? overlayStyle : void 0
      },
      h(
        "div",
        { className: "dlv-pill", role: "group", "aria-label": "Voice controls" },
        capture && !state.conversation ? h(Button, {
          label: "Cancel dictation",
          icon: "close",
          onClick: () => invoke("cancelDictation")
        }) : null,
        state.conversation ? h(Button, {
          label: "End voice conversation",
          icon: "close",
          onClick: () => invoke("endConversation")
        }) : null,
        h(Waveform, { controller, enabled: Boolean(state.listening) }),
        h("span", { className: "dlv-status", role: "status", "aria-live": "polite" }, status),
        h(Button, {
          className: "dlv-live-toggle",
          label: "Automatic delivery mode",
          title: `Automatic delivery: ${state.settings.sendingMode === "steer" ? "send to the running agent" : state.settings.sendingMode === "queue" ? "queue" : "off"}`,
          icon: state.settings.sendingMode === "queue" ? "queue" : "send",
          visibleLabel: state.settings.sendingMode === "steer" ? "SEND" : state.settings.sendingMode === "queue" ? "QUEUE" : "OFF",
          "aria-label": `Automatic delivery: ${state.settings.sendingMode || "manual"}`,
          "aria-pressed": ["queue", "steer"].includes(state.settings.sendingMode),
          "data-mode": state.settings.sendingMode || "manual",
          onClick: () => invoke("updateSettings", {
            sendingMode: !["queue", "steer"].includes(state.settings.sendingMode) ? "queue" : state.settings.sendingMode === "queue" ? "steer" : "manual"
          })
        }),
        h(Button, {
          className: `dlv-live-toggle${state.speechSegmentsRemaining > 0 ? " dlv-live-toggle-expanded" : ""}`,
          label: "Automatic assistant speech",
          title: `Automatic assistant speech: ${state.settings.announceAssistantMessages !== false ? "on" : "off"}${state.speechSegmentsRemaining > 0 ? ` \u2014 ${state.speechSegmentsRemaining} speech segment${state.speechSegmentsRemaining === 1 ? "" : "s"} remaining` : ""}`,
          icon: state.settings.announceAssistantMessages !== false ? "speaker" : "speakerOff",
          visibleLabel: state.settings.announceAssistantMessages === false ? "OFF" : state.speechSegmentsRemaining > 0 ? String(state.speechSegmentsRemaining) : "ON",
          role: "switch",
          "aria-checked": state.settings.announceAssistantMessages !== false,
          onClick: () => invoke("updateSettings", {
            announceAssistantMessages: state.settings.announceAssistantMessages === false
          })
        }),
        remaining ? h(Button, {
          label: "Cancel automatic send",
          icon: "close",
          onClick: () => invoke("cancelAutoSend")
        }) : null,
        state.conversation && !capture ? h(Button, {
          label: "Take microphone",
          icon: "mic",
          onClick: () => invoke("startConversation")
        }) : null,
        capture ? h(Button, {
          className: "dlv-live-toggle dlv-mic-state",
          label: state.muted ? "Resume listening" : "Ignore composer input",
          title: `Microphone input: ${state.muted ? "ignoring" : "listening"}`,
          icon: state.muted ? "micOff" : "mic",
          visibleLabel: state.muted ? "IGNORING" : "LISTENING",
          "aria-pressed": Boolean(state.muted),
          "data-muted": state.muted ? "true" : "false",
          onClick: () => invoke(state.muted ? "resumeListeningInput" : "muteListening")
        }) : null,
        state.speaking && !state.paused && state.capabilities[state.settings.engine]?.pause ? h(Button, {
          label: "Pause speech",
          icon: "pause",
          onClick: () => invoke("pauseSpeech")
        }) : null,
        state.paused && state.capabilities[state.settings.engine]?.resume ? h(Button, {
          label: "Resume speech",
          icon: "play",
          onClick: () => invoke("resumeSpeech")
        }) : null,
        state.speaking || state.paused ? h(Button, {
          label: "Stop all speech",
          icon: "stop",
          onClick: () => invoke("stopSpeech")
        }) : null
      ),
      h(ErrorText, {
        error: error || state.error,
        onDismiss: () => {
          clearError();
          controller.clearError();
        }
      })
    );
  }
  function SpeakButton({ active = false, disabled = false, label, onClick }) {
    return h(Button, {
      className: "dlv-speaker",
      label: label || (active ? "Stop speaking" : "Speak message"),
      icon: active ? "stop" : "speaker",
      "aria-pressed": Boolean(active),
      disabled,
      onClick
    });
  }
  function SettingsPanel({ controller, onClose }) {
    const state = useController(controller);
    const [invoke, error, clearError] = useActions(controller);
    const settings = state.settings || {};
    const capabilities = state.capabilities || {};
    const tabsId = React2.useId();
    const tabs = [
      { id: "conversation", label: "Conversation" },
      { id: "speech", label: "Speech" },
      { id: "recognition", label: "Speech recognition" }
    ];
    const tabRefs = React2.useRef([]);
    const [activeTab, setActiveTab] = React2.useState("conversation");
    const activateTab = (index) => {
      const tab = tabs[index];
      if (!tab) return;
      setActiveTab(tab.id);
      tabRefs.current[index]?.focus();
    };
    const handleTabKeyDown = (event, index) => {
      let nextIndex;
      if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
      else if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") nextIndex = 0;
      else if (event.key === "End") nextIndex = tabs.length - 1;
      else return;
      event.preventDefault();
      activateTab(nextIndex);
    };
    const [audioDevices, setAudioDevices] = React2.useState([]);
    React2.useEffect(() => {
      let active = true;
      const refresh = async () => {
        try {
          const devices = await globalThis.navigator?.mediaDevices?.enumerateDevices?.();
          if (active) setAudioDevices(Array.from(devices || []));
        } catch {
          if (active) setAudioDevices([]);
        }
      };
      void refresh();
      globalThis.navigator?.mediaDevices?.addEventListener?.("devicechange", refresh);
      return () => {
        active = false;
        globalThis.navigator?.mediaDevices?.removeEventListener?.("devicechange", refresh);
      };
    }, []);
    const deviceOptions = (kind, fallback) => [
      { value: "", label: "System default" },
      ...audioDevices.filter(
        (device) => device.kind === kind && device.deviceId && device.deviceId !== "default"
      ).map((device, index) => ({
        value: device.deviceId,
        label: device.label || `${fallback} ${index + 1}`
      }))
    ];
    const field = (label, key, options) => h(
      "label",
      { key },
      label,
      h(
        "select",
        {
          value: settings[key] || options[0].value,
          onChange: (event) => invoke(
            "updateSettings",
            key === "engine" ? { engine: event.target.value, voice: "" } : { [key]: event.target.value }
          )
        },
        options.map(
          (option) => h(
            "option",
            { key: option.value, value: option.value, disabled: option.disabled },
            option.label
          )
        )
      )
    );
    const panel = (id2, children) => h(
      "div",
      {
        id: `${tabsId}-panel-${id2}`,
        className: "dlv-settings-panel",
        role: "tabpanel",
        "aria-labelledby": `${tabsId}-tab-${id2}`,
        hidden: activeTab !== id2
      },
      ...children
    );
    const subcard = (title, children, open = false) => h(
      "details",
      { className: "dlv-settings-subcard", open },
      h("summary", null, title),
      h("div", { className: "dlv-settings-subcard-body" }, ...children)
    );
    return h(
      "section",
      { className: "dlv-settings", "aria-label": "Live Voice settings" },
      h("h3", null, "Live Voice"),
      onClose ? h(Button, { label: "Close voice settings", icon: "close", onClick: onClose }) : null,
      h(
        "div",
        { className: "dlv-settings-tabs", role: "tablist", "aria-label": "Live Voice settings" },
        tabs.map((tab, index) => {
          const selected = activeTab === tab.id;
          return h(
            "button",
            {
              key: tab.id,
              ref: (element) => {
                tabRefs.current[index] = element;
              },
              id: `${tabsId}-tab-${tab.id}`,
              type: "button",
              role: "tab",
              className: "dlv-settings-tab",
              "aria-selected": selected,
              "aria-controls": `${tabsId}-panel-${tab.id}`,
              "data-active": selected ? "true" : void 0,
              tabIndex: selected ? 0 : -1,
              onClick: () => setActiveTab(tab.id),
              onKeyDown: (event) => handleTabKeyDown(event, index)
            },
            tab.label
          );
        })
      ),
      h(
        "div",
        {
          id: `${tabsId}-panel-speech`,
          className: "dlv-settings-panel",
          role: "tabpanel",
          "aria-labelledby": `${tabsId}-tab-speech`,
          hidden: activeTab !== "speech"
        },
        h(
          "div",
          { className: "dlv-settings-card-body" },
          field("Speech engine", "engine", [
            {
              value: "qwen-http",
              label: "Qwen3 TTS \u2014 local MLX server",
              disabled: capabilities["qwen-http"]?.supported === false
            },
            {
              value: "say",
              label: "macOS say \u2014 host audio",
              disabled: capabilities.say?.supported === false
            },
            {
              value: "browser",
              label: "Browser speech \u2014 device audio",
              disabled: capabilities.browser?.supported === false
            }
          ]),
          settings.engine !== "say" ? field("Output device", "outputDeviceId", deviceOptions("audiooutput", "Audio output")) : h("small", null, "macOS say uses the output selected on the DSH host."),
          settings.engine === "browser" ? h(
            React2.Fragment,
            null,
            h(
              "small",
              null,
              "Browser speech synthesis may ignore the selected output device; this browser API normally follows the system default."
            ),
            field("Local browser voice", "voice", [
              { value: "", label: "Automatic local voice" },
              ...(capabilities.browser?.voices || []).map((voice) => ({
                value: voice.voiceURI || voice.name,
                label: `${voice.name} \u2014 ${voice.lang || "unknown language"}`
              }))
            ])
          ) : null,
          settings.engine === "qwen-http" ? h(
            React2.Fragment,
            null,
            field("Qwen voice", "voice", qwenVoices),
            h(
              "small",
              null,
              `Aiden is used by default. These preset voices are not native Brazilian Portuguese voices.`
            ),
            subcard("Qwen server connection", [
              h(QwenSettings, { key: "qwen-output-settings", controller })
            ])
          ) : null,
          subcard("Filtering", [
            h(
              "label",
              { key: "output-code-filter", className: "dlv-check" },
              h("input", {
                type: "checkbox",
                checked: settings.outputCodeFilterEnabled !== false,
                onChange: (event) => invoke("updateSettings", { outputCodeFilterEnabled: event.target.checked })
              }),
              " Filter Markdown code blocks before speaking"
            ),
            h(
              "label",
              { key: "output-code-lines" },
              "Read code blocks up to this many lines",
              h("input", {
                type: "number",
                min: 0,
                max: 100,
                value: settings.outputCodeMaxLines ?? 5,
                disabled: settings.outputCodeFilterEnabled === false,
                onChange: (event) => {
                  const value = Number(event.target.value);
                  if (Number.isInteger(value) && value >= 0 && value <= 100)
                    invoke("updateSettings", { outputCodeMaxLines: value });
                }
              })
            ),
            h(
              "label",
              { key: "output-code-notice" },
              "Replacement phrase for larger code blocks",
              h("input", {
                type: "text",
                maxLength: 300,
                value: settings.outputCodeNotice || "Look the code on out conversation",
                disabled: settings.outputCodeFilterEnabled === false,
                onChange: (event) => invoke("updateSettings", { outputCodeNotice: event.target.value })
              })
            )
          ]),
          h(
            "label",
            null,
            "Speech rate",
            h("input", {
              type: "number",
              min: 0.1,
              max: 3,
              step: 0.1,
              value: settings.rate ?? 1,
              onChange: (event) => {
                const rate = Number(event.target.value);
                if (Number.isFinite(rate) && rate >= 0.1 && rate <= 3)
                  invoke("updateSettings", { rate });
              }
            }),
            h("small", null, "Relative speed: 1 is normal.")
          ),
          h(
            "p",
            null,
            "Qwen synthesis runs on the DSH host and the generated WAV plays in this browser. macOS say plays on the host; Browser speech plays on this device."
          ),
          ...["qwen-http", "say", "browser"].filter((id2) => capabilities[id2]?.supported === false).map(
            (id2) => h(
              "p",
              { key: id2, role: "status" },
              `${id2 === "qwen-http" ? "Qwen3 local" : id2 === "say" ? "macOS say" : "Browser speech"}: ${capabilities[id2].reason}`
            )
          ),
          h(
            "div",
            { className: "dlv-settings-actions" },
            h(
              "button",
              {
                type: "button",
                disabled: capabilities[settings.engine]?.supported !== true || state.speaking,
                onClick: () => invoke("speak", "DSH Live Voice. The selected speech output is working.")
              },
              state.speaking ? "Testing speech\u2026" : "Test selected speech output"
            ),
            state.speaking || state.paused ? h(
              "button",
              { type: "button", onClick: () => invoke("stopSpeech") },
              "Stop speech test"
            ) : null,
            h(
              "button",
              { type: "button", onClick: () => invoke("refreshCapabilities") },
              "Refresh available engines"
            )
          )
        )
      ),
      h(
        "div",
        {
          id: `${tabsId}-panel-recognition`,
          className: "dlv-settings-panel",
          role: "tabpanel",
          "aria-labelledby": `${tabsId}-tab-recognition`,
          hidden: activeTab !== "recognition"
        },
        h(
          "div",
          { className: "dlv-settings-card-body" },
          h(
            "label",
            null,
            "Recognition engine",
            h(
              "select",
              {
                value: settings.recognitionEngine,
                onChange: (event) => invoke(
                  "updateSettings",
                  event.target.value === "browser" && settings.recognitionLang === "auto" ? { recognitionEngine: "browser", recognitionLang: "pt-BR" } : { recognitionEngine: event.target.value }
                )
              },
              h("option", { value: "qwen-http" }, "Qwen3 ASR \u2014 local MLX server"),
              h("option", { value: "browser" }, "Browser SpeechRecognition"),
              h("option", { value: "whisper-http" }, "Whisper HTTP \u2014 DSH host")
            )
          ),
          field("Input device", "inputDeviceId", deviceOptions("audioinput", "Microphone")),
          settings.recognitionEngine === "browser" ? h(
            "small",
            null,
            "Browser SpeechRecognition may use the browser or system default microphone instead of this selection."
          ) : null,
          field("Recognition language", "recognitionLang", [
            ...settings.recognitionEngine !== "browser" ? [{ value: "auto", label: "Automatic \u2014 detect language" }] : [],
            { value: "pt-BR", label: "Portugu\xEAs (Brasil)" },
            { value: "en-US", label: "English (United States)" }
          ]),
          settings.recognitionEngine === "browser" ? h(
            React2.Fragment,
            null,
            h(
              "label",
              { className: "dlv-check" },
              h("input", {
                type: "checkbox",
                checked: settings.recognitionProcessLocally !== false,
                onChange: (event) => invoke("updateSettings", { recognitionProcessLocally: event.target.checked })
              }),
              " Process recognition locally on this device"
            ),
            settings.recognitionProcessLocally !== false ? h(
              "label",
              { className: "dlv-check" },
              h("input", {
                type: "checkbox",
                checked: settings.recognitionAutoInstall !== false,
                onChange: (event) => invoke("updateSettings", {
                  recognitionAutoInstall: event.target.checked
                })
              }),
              " Automatically install this browser language pack when needed"
            ) : h(
              "p",
              { role: "status" },
              "Browser-service recognition is enabled. The browser may send microphone audio to its recognition service."
            )
          ) : h(
            "p",
            { role: "status" },
            settings.recognitionEngine === "qwen-http" ? "Audio is segmented into complete WAV utterances and sent through authenticated DSH to the host-local Qwen3 ASR model." : "Audio is segmented into complete WAV utterances, sent through authenticated DSH, and processed by loopback whisper.cpp HTTP."
          ),
          settings.recognitionEngine === "whisper-http" ? subcard("Connection settings", [h(WhisperSettings, { key: "settings", controller })]) : null,
          settings.recognitionEngine === "qwen-http" && settings.engine !== "qwen-http" ? subcard("Qwen server connection", [
            h(QwenSettings, { key: "qwen-recognition-settings", controller })
          ]) : null,
          h("p", null, "Provider settings change with the selected recognition engine."),
          subcard("Voice commands", [
            h(
              "label",
              { key: "voice-commands-enabled", className: "dlv-check" },
              h("input", {
                type: "checkbox",
                checked: settings.voiceCommandsEnabled !== false,
                onChange: (event) => invoke("updateSettings", { voiceCommandsEnabled: event.target.checked })
              }),
              " Enable exact voice commands"
            ),
            h(
              "small",
              { key: "voice-command-help" },
              "Separate phrases with commas. Matching ignores capitalization, accents, punctuation, and extra spaces. The entire final chunk must match."
            ),
            ...[
              ["Send to running agent", "voiceCommandSend", "send, send message"],
              ["Put in queue", "voiceCommandQueue", "queue, queue message"],
              ["End conversation", "voiceCommandEnd", "end, end conversation"],
              ["Mute composer input", "voiceCommandMute", "mute, stop listening"],
              ["Resume composer input", "voiceCommandResume", "resume, start listening"],
              [
                "Stop assistant speech",
                "voiceCommandStopSpeaking",
                "stop talking, stop speaking, shut up"
              ],
              ["Clear composer", "voiceCommandClear", "clear all, clear message"]
            ].map(
              ([label, key, fallback]) => h(
                "label",
                { key },
                label,
                h("textarea", {
                  rows: 2,
                  maxLength: 1e3,
                  defaultValue: settings[key] || fallback,
                  disabled: settings.voiceCommandsEnabled === false,
                  onBlur: (event) => invoke("updateSettings", { [key]: event.target.value })
                })
              )
            )
          ]),
          subcard("Filtering", [
            h(
              "label",
              { key: "recognition-filter", className: "dlv-check" },
              h("input", {
                type: "checkbox",
                checked: settings.recognitionFilterEnabled !== false,
                onChange: (event) => invoke("updateSettings", { recognitionFilterEnabled: event.target.checked })
              }),
              " Ignore short final transcription chunks"
            ),
            h(
              "label",
              { key: "recognition-minimum-words" },
              "Minimum words per final chunk",
              h("input", {
                type: "number",
                min: 1,
                max: 20,
                value: settings.recognitionMinimumWords ?? 2,
                disabled: settings.recognitionFilterEnabled === false,
                onChange: (event) => {
                  const value = Number(event.target.value);
                  if (Number.isInteger(value) && value >= 1 && value <= 20)
                    invoke("updateSettings", { recognitionMinimumWords: value });
                }
              }),
              h(
                "small",
                null,
                "Final chunks with fewer words are ignored before they reach the composer or automatic delivery."
              )
            )
          ]),
          capabilities.capture?.supported === false ? h("p", { role: "status" }, `Microphone: ${capabilities.capture.reason}`) : capabilities.capture?.permission === "prompt" ? h(
            "p",
            { role: "status" },
            "Microphone permission will be requested only when you start dictation or a voice conversation."
          ) : null,
          capabilities.recognition?.supported === false ? h("p", { role: "status" }, capabilities.recognition.reason) : null,
          usesPluginVoiceDetection(settings.recognitionEngine) ? h(
            "details",
            { className: "dlv-settings-subcard", "aria-label": "Silence detection settings" },
            h("summary", null, "Silence detection"),
            h(
              "div",
              { className: "dlv-settings-subcard-body" },
              h(
                "p",
                null,
                "Controls how long a pause must last before captured speech is sent for recognition."
              ),
              h(
                "div",
                {
                  className: "dlv-preset-group",
                  role: "radiogroup",
                  "aria-label": "Pause before sending"
                },
                Object.entries(voiceDetectionPresets).map(
                  ([value, preset]) => h(
                    "label",
                    { key: value, className: "dlv-preset" },
                    h("input", {
                      type: "radio",
                      name: "dlv-vad-preset",
                      value,
                      checked: (settings.voiceDetectionPreset || "natural") === value,
                      onChange: () => invoke("updateSettings", { voiceDetectionPreset: value })
                    }),
                    h(
                      "span",
                      null,
                      h("strong", null, preset.label),
                      h("small", null, preset.description)
                    )
                  )
                )
              ),
              h(
                "p",
                { className: "dlv-vad-summary" },
                "Pause before sending: " + (voiceDetectionPresets[settings.voiceDetectionPreset]?.silenceMs || voiceDetectionPresets.natural.silenceMs) + " ms"
              )
            )
          ) : null
        )
      ),
      panel("conversation", [
        h(
          "label",
          { key: "announce", className: "dlv-check" },
          h("input", {
            type: "checkbox",
            checked: settings.announceAssistantMessages !== false,
            onChange: (event) => invoke("updateSettings", { announceAssistantMessages: event.target.checked })
          }),
          " Automatically speak new assistant messages"
        ),
        h(
          "p",
          { key: "policy" },
          "During a voice conversation, assistant phrases are announced automatically. Playback waits while you are speaking."
        ),
        h(
          "label",
          { key: "interrupt-message", className: "dlv-check" },
          h("input", {
            type: "checkbox",
            checked: settings.interruptSpeechOnUserMessage === true,
            onChange: (event) => invoke("updateSettings", { interruptSpeechOnUserMessage: event.target.checked })
          }),
          " Stop assistant speech when I send a message"
        ),
        h(
          "p",
          { key: "interrupt-message-description", className: "dlv-setting-description" },
          settings.interruptSpeechOnUserMessage ? "Sending or steering a new user message stops current or paused assistant speech." : "Sending another message does not stop the assistant audio you are already hearing."
        ),
        field("Listening mode", "mode", [
          { value: "speaker", label: "Speakers \u2014 gated listening" },
          { value: "headphones", label: "Headphones \u2014 open microphone" }
        ]),
        h(
          "p",
          { key: "mode-description", className: "dlv-setting-description" },
          settings.mode === "headphones" ? "Open microphone keeps listening while responses play. When your speech is detected, playback pauses and resumes only when you choose." : "Gated listening releases the microphone while responses play, preventing speaker audio from being recognized. Use Take microphone to interrupt."
        ),
        h(
          "label",
          { key: "speech-delay" },
          "Assistant response delay",
          h(
            "select",
            {
              value: String(settings.assistantSpeechDelaySeconds || 3),
              onChange: (event) => invoke("updateSettings", {
                assistantSpeechDelaySeconds: Number(event.target.value)
              })
            },
            [1, 2, 3, 4, 5, 6, 8, 10].map(
              (seconds) => h("option", { key: seconds, value: String(seconds) }, seconds + " seconds")
            )
          ),
          h(
            "small",
            null,
            "After you stop speaking, automatic assistant playback waits for this much continuous silence. Speaking again restarts the wait."
          )
        ),
        field("Sending mode", "sendingMode", [
          { value: "manual", label: "Off \u2014 review and send manually" },
          { value: "queue", label: "Queue \u2014 automatically add after silence" },
          { value: "steer", label: "Steer \u2014 automatically send to the running agent" }
        ]),
        settings.sendingMode !== "manual" ? h(
          "label",
          { key: "delay" },
          "Send after silence",
          h(
            "select",
            {
              value: String(settings.autoSendDelaySeconds || 4),
              onChange: (event) => invoke("updateSettings", {
                autoSendDelaySeconds: Number(event.target.value)
              })
            },
            [2, 3, 4, 5, 6, 8, 10].map(
              (seconds) => h("option", { key: seconds, value: String(seconds) }, seconds + " seconds")
            )
          ),
          h(
            "small",
            null,
            "Countdown starts after a final recognized phrase. New speech or edits cancel it."
          )
        ) : h(
          "p",
          { key: "manual", className: "dlv-setting-description" },
          "Recognized text stays in the composer until you use the normal DSH Send control."
        )
      ]),
      h(ErrorText, {
        error: error || state.error,
        onDismiss: () => {
          clearError();
          controller.clearError();
        }
      })
    );
  }
  return { MicrophoneButtons, RecordingBar, SpeakButton, SettingsPanel };
}

// src/client/styles.ts
var styles = `
.dlv-icon-button{display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;flex-shrink:0;cursor:pointer;background:transparent;color:var(--dsw-alias-label-secondary);padding:0;font:inherit}
.dlv-icon-button svg{display:block;width:20px;height:20px}
.dlv-mic{width:30px;height:30px;border:1px solid var(--dsw-alias-border-l1);border-radius:50%}
.dlv-mic:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l2)}
.dlv-speaker{width:28px;height:28px;border:0;border-radius:28px;padding:5px;color:var(--dsw-alias-label-tertiary)}
.dlv-speaker:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary)}
.dlv-speaker[aria-pressed=true]{color:var(--dsw-alias-label-primary)}
.dlv-icon-button:disabled{opacity:.4;cursor:default}
.dlv-icon-button:focus-visible,.dlv-settings :is(input,select):focus-visible{outline:2px solid var(--dsw-alias-label-primary);outline-offset:3px}
.dlv-bar-wrap{width:100%;min-width:0}
.dlv-question-overlay{position:fixed;z-index:10000;bottom:8px;transform:translateX(-50%);max-width:calc(100vw - 32px);pointer-events:none}
.dlv-question-overlay .dlv-pill{pointer-events:auto}
.dlv-pill{display:flex;align-items:center;box-sizing:border-box;gap:10px;min-height:52px;border-radius:26px;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);padding:0 14px;width:100%;max-width:720px;margin:0 auto;box-shadow:0 8px 24px rgba(0,0,0,.18)}
.dlv-pill-button{width:34px;height:34px;border-radius:50%;border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary)}
.dlv-pill-button:hover{background:var(--dsw-alias-bg-layer-2)}
.dlv-live-toggle{width:34px;height:34px;padding:0 7px;gap:0;overflow:hidden;border:1px solid var(--dsw-alias-border-l2);border-radius:17px;color:var(--dsw-alias-label-primary);transition:width .16s ease,gap .16s ease}
.dlv-live-toggle svg{width:18px;height:18px;flex:none}
.dlv-toggle-state{max-width:0;opacity:0;overflow:hidden;white-space:nowrap;font-size:10px;font-weight:700;line-height:1;letter-spacing:.04em;text-align:left;transition:max-width .16s ease,opacity .12s ease}
.dlv-live-toggle:hover,.dlv-live-toggle:focus-visible,.dlv-live-toggle-expanded{width:78px;gap:5px;background:var(--dsw-alias-bg-layer-2)}
.dlv-live-toggle:hover .dlv-toggle-state,.dlv-live-toggle:focus-visible .dlv-toggle-state,.dlv-live-toggle-expanded .dlv-toggle-state{max-width:38px;opacity:1}
.dlv-live-toggle[aria-checked=false],.dlv-live-toggle[data-mode=manual],.dlv-mic-state[data-muted=true]{color:var(--dsw-alias-label-tertiary);border-color:var(--dsw-alias-border-l1);opacity:.55}
.dlv-mic-state:hover,.dlv-mic-state:focus-visible{width:102px}.dlv-mic-state:hover .dlv-toggle-state,.dlv-mic-state:focus-visible .dlv-toggle-state{max-width:64px}
.dlv-live-toggle[aria-checked=true]{background:var(--dsw-alias-bg-layer-2)}
.dlv-wave{display:block;flex:1 1 180px;min-width:30px;width:100%;height:40px;color:var(--dsw-alias-label-primary)}
.dlv-status{flex:1 1 120px;min-width:0;font-size:13px;line-height:1.4;color:var(--dsw-alias-label-secondary)}
.dlv-error{color:var(--dsw-alias-state-error-primary);overflow-wrap:anywhere;font-size:13px;max-width:720px;margin:8px auto}
.dlv-settings{box-sizing:border-box;padding:18px;width:100%;display:grid;gap:16px;max-width:640px;color:var(--dsw-alias-label-primary)}
.dlv-settings h3,.dlv-settings p{margin:0}
.dlv-settings-tabs{border-bottom:.5px solid var(--dsw-alias-border-l2);display:flex;align-items:flex-end;gap:22px;overflow-x:auto}.dlv-settings-tab{position:relative;flex:none;padding:7px 1px 9px;border:0;background:transparent;color:var(--dsw-alias-label-tertiary);font:inherit;font-size:13px;line-height:20px;cursor:pointer}.dlv-settings-tab:hover,.dlv-settings-tab[data-active=true]{color:var(--dsw-alias-label-primary)}.dlv-settings-tab[data-active=true]:after,.dlv-settings-tab:focus-visible:after{content:"";position:absolute;right:0;bottom:-1px;left:0;height:2px;border-radius:2px 2px 0 0;background:var(--dsw-alias-label-primary)}.dlv-settings-tab:focus-visible{border-radius:2px;outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px;color:var(--dsw-alias-label-primary)}.dlv-settings-panel{min-width:0;padding-top:2px}.dlv-settings-panel[hidden]{display:none}.dlv-settings-group{margin:0;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;min-width:0;display:grid;gap:14px;padding:16px}.dlv-settings-group legend{padding:0 6px;font-weight:600;color:var(--dsw-alias-label-primary)}.dlv-settings-card-body{display:grid;gap:12px;padding:12px 0}.dlv-settings-subcard{border:1px solid var(--dsw-alias-border-l2);border-radius:8px;min-width:0}.dlv-settings-subcard>summary{cursor:pointer;font-weight:650;list-style:none;display:flex;align-items:center;justify-content:space-between;padding:10px}.dlv-settings-subcard>summary::-webkit-details-marker{display:none}.dlv-settings-subcard>summary:after{content:"\u203A";transform:rotate(90deg);transition:transform .15s}.dlv-settings-subcard:not([open])>summary:after{transform:rotate(0)}.dlv-settings-subcard-body{display:grid;gap:10px;padding:0 10px 10px}
.dlv-settings label{display:grid;gap:6px;font-size:14px}.dlv-settings label.dlv-check{display:flex;align-items:center;gap:8px}.dlv-settings label.dlv-check input{width:auto}
.dlv-settings :is(input,select,textarea){box-sizing:border-box;width:100%;padding:8px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:inherit;font:inherit}
.dlv-settings small,.dlv-settings p{font-size:13px;color:var(--dsw-alias-label-secondary);line-height:1.5}
.dlv-preset-group{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.dlv-settings label.dlv-preset{display:flex;align-items:flex-start;gap:8px;padding:10px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;cursor:pointer}.dlv-settings label.dlv-preset:has(input:checked){border-color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-1)}.dlv-settings label.dlv-preset input{width:auto;margin-top:3px}.dlv-preset span{display:grid;gap:3px}.dlv-vad-summary{font-weight:500}
.dlv-settings-actions{display:flex;flex-wrap:wrap;gap:8px}.dlv-settings-actions button{padding:8px 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:inherit;cursor:pointer}.dlv-settings-actions button:disabled{opacity:.45;cursor:default}
@media(max-width:480px){.dlv-preset-group{grid-template-columns:1fr}.dlv-pill{flex-wrap:wrap}.dlv-wave{flex-basis:90px}.dlv-status{flex-basis:100px}}
`;

// src/client/chat.ts
function assistantMessages(snapshot) {
  const nodes = snapshot?.nodes?.values?.() || [];
  return [...nodes].filter(
    (node) => (node.kind === "assistant-step" || node.kind === "assistant") && node.visibility !== "hidden"
  ).map((node) => {
    const data = node.data;
    return {
      id: String(data.turn) + ":" + String(data.step),
      messageId: data.finalNode?.messageId,
      turn: data.turn,
      step: data.step,
      complete: data.status !== "running",
      interrupted: data.status === "interrupted",
      text: (data.blocks || []).filter((block) => block.kind === "text").map((block) => block.text || "").join("")
    };
  }).sort((a, b) => a.turn - b.turn || a.step - b.step);
}
function pendingQuestionSpeech(interaction, index = 0) {
  if (!interaction || interaction.kind !== "question" || !Array.isArray(interaction.questions)) return "";
  const question = interaction.questions[index]?.question;
  return typeof question === "string" ? question.trim() : "";
}
function latestUserSequence(snapshot) {
  return Math.max(
    -1,
    ...[...snapshot?.nodes?.values?.() || []].filter((node) => node.kind === "user" || node.kind === "steering").map((node) => Number(node.anchorSeq ?? node.data?.seq ?? -1))
  );
}
function addressedTurn(messages, messageId) {
  const addressed = messages.find((message2) => String(message2.messageId) === String(messageId));
  if (!addressed) return { text: "", ids: [] };
  return { text: addressed.text, id: addressed.id };
}

// src/client/index.ts
var inject = ["slots", "connection", "uiConversation", "uiSession"];
function apply(ctx) {
  const e = import_react.default.createElement;
  const { MicrophoneButtons, RecordingBar, SpeakButton, SettingsPanel } = createComponents(import_react.default);
  const controllers = /* @__PURE__ */ new Map();
  const retiring = /* @__PURE__ */ new Set();
  let disposed = false;
  let voiceModeActive = false;
  const ownership = new VoiceOwnership();
  const recognitionFor = (settings, meter) => settings.recognitionEngine === "qwen-http" ? new QwenHttpRecognitionEngine({
    meter,
    voiceDetectionPreset: settings.voiceDetectionPreset
  }) : settings.recognitionEngine === "whisper-http" ? new WhisperHttpRecognitionEngine({
    meter,
    voiceDetectionPreset: settings.voiceDetectionPreset
  }) : new BrowserRecognitionEngine({
    processLocally: settings.recognitionProcessLocally,
    autoInstallLocalPack: settings.recognitionAutoInstall
  });
  const run = (controller, promise) => Promise.resolve(promise).catch((error) => {
    if (!disposed && !controller.disposed)
      controller.patch({ error: error?.message || String(error) });
  });
  function retire(entry) {
    if (entry.closed) return;
    entry.closed = true;
    entry.request++;
    entry.composers.clear();
    entry.unsubscribe?.();
    entry.unsubscribe = null;
    entry.unsubscribePendingQuestion?.();
    entry.unsubscribePendingQuestion = null;
    entry.questionCapture = null;
    entry.controller.patch({ answeringQuestion: false });
    entry.chatListeners.clear();
    if (controllers.get(entry.key) === entry) controllers.delete(entry.key);
    const done = run(entry.controller, entry.controller.dispose());
    const barrier = { endConversation: () => done };
    retiring.add(barrier);
    void done.finally(() => retiring.delete(barrier));
  }
  function get(sessionId) {
    const key = String(sessionId);
    if (controllers.has(key)) return controllers.get(key);
    const entry = {
      key,
      draft: "",
      pendingDraft: void 0,
      composers: /* @__PURE__ */ new Map(),
      refs: 0,
      buttons: 0,
      request: 0,
      closed: false
    };
    let settings = {};
    try {
      settings = normalizeSettings(
        JSON.parse(localStorage.getItem("dsh-live-voice.settings") || "{}")
      );
    } catch {
      settings = normalizeSettings(null);
    }
    const engineBrowser = new BrowserSpeakingEngine({ lang: settings.lang || "pt-BR" });
    const engineSay = new SayClientEngine({ rpc: ctx.connection.rpc });
    const engineQwen = new QwenHttpSpeakingEngine({ lang: settings.lang || "pt-BR" });
    const meter = new MicrophoneMeter();
    const recognition = recognitionFor(settings, meter);
    entry.controller = new VoiceCoordinator({
      recognition,
      engines: { browser: engineBrowser, say: engineSay, "qwen-http": engineQwen },
      meter,
      composer: {
        getDraft: () => entry.draft,
        submit: (mode = "queue") => {
          const owner = [...entry.composers.values()].at(-1);
          owner?.actions.submit?.(mode);
        },
        handleQuestionResult: ({ final, interim }) => {
          const capture = entry.questionCapture;
          if (!capture || capture.answering || !final && !interim) return false;
          if (final?.trim()) {
            capture.answering = true;
            capture.answers.push({
              id: capture.interaction.questions[capture.index].id,
              selected: [],
              custom: final.trim()
            });
            capture.index++;
            if (capture.index < capture.interaction.questions.length) {
              capture.answering = false;
              const text = pendingQuestionSpeech(capture.interaction, capture.index);
              if (text) run(entry.controller, entry.controller.speak(text, capture.interaction.key));
            } else {
              entry.questionCapture = null;
              entry.controller.patch({ answeringQuestion: false });
              run(entry.controller, capture.interaction.answer({ answers: capture.answers }));
            }
          }
          return true;
        },
        setDraft: (text) => {
          if (disposed || entry.closed) return;
          const owner = [...entry.composers.values()].at(-1);
          if (!owner) return;
          entry.draft = text;
          entry.pendingDraft = text;
          owner.actions.setDraft(text);
        }
      },
      settings
    });
    const controller = entry.controller;
    entry.chat = ctx.uiConversation.binding(sessionId).target("chat");
    entry.chatListeners = /* @__PURE__ */ new Set();
    entry.subscribeChat = (listener) => {
      if (entry.closed) return () => {
      };
      entry.chatListeners.add(listener);
      return () => entry.chatListeners.delete(listener);
    };
    entry.readChat = entry.chat.getSnapshot.bind(entry.chat);
    const refresh = (baseline = false) => {
      if (disposed || entry.closed) return;
      const snapshot = entry.readChat();
      const userSeq = latestUserSequence(snapshot);
      if (!baseline && userSeq > entry.userSeq && controller.getSnapshot().settings.interruptSpeechOnUserMessage && (controller.getSnapshot().speaking || controller.getSnapshot().paused))
        run(controller, controller.stopSpeech());
      entry.userSeq = Math.max(entry.userSeq ?? -1, userSeq);
      for (const message2 of assistantMessages(snapshot))
        controller.observeMessage(message2.id, message2.text, {
          complete: message2.complete,
          baseline: baseline || message2.interrupted
        });
    };
    refresh(true);
    entry.unsubscribe = entry.chat.subscribe(() => {
      refresh();
      for (const listener of entry.chatListeners) listener();
    });
    const pendingInteractions = ctx.uiSession.pendingInteractions;
    const refreshPendingQuestion = (baseline = false) => {
      if (disposed || entry.closed || !pendingInteractions) return;
      const interaction = pendingInteractions.getSnapshot().get(sessionId);
      const key2 = interaction?.kind === "question" ? interaction.key : null;
      if (!key2 || entry.questionCapture && entry.questionCapture.interaction.key !== key2) {
        entry.questionCapture = null;
        controller.patch({ answeringQuestion: false });
      }
      if (baseline) {
        entry.pendingQuestionKey = key2;
        return;
      }
      if (!key2 || key2 === entry.pendingQuestionKey) return;
      entry.pendingQuestionKey = key2;
      const text = pendingQuestionSpeech(interaction);
      if (text && controller.getSnapshot().conversation) {
        entry.questionCapture = { interaction, index: 0, answers: [], answering: false };
        controller.patch({ answeringQuestion: true });
        run(controller, controller.speak(text, key2));
      }
    };
    if (pendingInteractions) {
      refreshPendingQuestion(true);
      entry.unsubscribePendingQuestion = pendingInteractions.subscribe(refreshPendingQuestion);
    }
    const update = controller.updateSettings.bind(controller);
    entry.applySettings = (next) => {
      update(next);
      engineBrowser.lang = controller.getSnapshot().settings.lang;
      engineQwen.lang = controller.getSnapshot().settings.lang;
      run(controller, controller.refreshCapabilities());
    };
    controller.updateSettings = (next) => {
      if (disposed || entry.closed) return;
      entry.applySettings(next);
      const settings2 = controller.getSnapshot().settings;
      try {
        localStorage.setItem("dsh-live-voice.settings", JSON.stringify(settings2));
      } catch {
      }
      for (const other of controllers.values()) {
        if (other !== entry && !other.closed) other.applySettings(settings2);
      }
    };
    for (const method of ["stopListening", "cancelDictation", "endConversation", "stopSpeech"]) {
      const original = controller[method].bind(controller);
      controller[method] = (...args) => {
        entry.request++;
        if (method === "endConversation" && args[0] !== true) voiceModeActive = false;
        return original(...args);
      };
    }
    for (const method of ["startDictation", "startConversation", "speak"]) {
      const original = controller[method].bind(controller);
      controller[method] = (...args) => {
        if (disposed || entry.closed || !entry.refs) return Promise.resolve();
        if (method !== "speak" && !entry.composers.size) return Promise.resolve();
        if (method === "startConversation") voiceModeActive = true;
        const request = ++entry.request;
        return ownership.run(
          controller,
          [...controllers.values()].map((other) => other.controller).concat([...retiring]),
          () => {
            if (disposed || entry.closed || !entry.refs || request !== entry.request) return;
            if (method !== "speak" && !entry.composers.size) return;
            return original(...args);
          }
        );
      };
    }
    controllers.set(key, entry);
    run(controller, controller.refreshCapabilities());
    return entry;
  }
  function useEntry(sessionId, kind) {
    const [entry, setEntry] = import_react.default.useState(null);
    import_react.default.useLayoutEffect(() => {
      if (disposed) return;
      const current = get(sessionId);
      current.refs++;
      if (kind === "buttons") current.buttons++;
      setEntry(current);
      return () => {
        current.refs--;
        if (kind === "buttons") current.buttons--;
        if (!current.refs) current.request++;
        queueMicrotask(() => {
          if (!current.refs) retire(current);
        });
      };
    }, [sessionId, kind]);
    return entry?.key === String(sessionId) && !entry.closed ? entry : null;
  }
  function useComposer(entry, props) {
    const subscribedInput = props.useInput?.((value) => value);
    const input = subscribedInput ?? props.input;
    const token = import_react.default.useRef({});
    import_react.default.useLayoutEffect(() => {
      if (!entry || entry.closed || disposed) return;
      return () => {
        entry.composers.delete(token.current);
      };
    }, [entry]);
    import_react.default.useLayoutEffect(() => {
      if (!entry || entry.closed || disposed) return;
      if (!input || typeof props.inputActions?.setDraft !== "function") return;
      entry.composers.set(token.current, { actions: props.inputActions });
      if (voiceModeActive && !entry.controller.getSnapshot().conversation)
        run(entry.controller, entry.controller.startConversation());
    }, [entry, input, props.inputActions]);
    import_react.default.useLayoutEffect(() => {
      if (!entry || entry.closed || disposed || !input) return;
      const published = typeof input.draft === "string" ? input.draft : "";
      if (entry.pendingDraft === void 0) entry.draft = published;
      else if (published === entry.pendingDraft) {
        entry.draft = published;
        entry.pendingDraft = void 0;
      }
      entry.controller.composerChanged(entry.draft);
    });
  }
  function Buttons(props) {
    const entry = useEntry(props.sessionId, "buttons");
    useComposer(entry, props);
    return entry ? e(MicrophoneButtons, { controller: entry.controller }) : null;
  }
  function Settings() {
    const [controller, setController] = import_react.default.useState(null);
    import_react.default.useEffect(() => {
      let settings;
      try {
        settings = normalizeSettings(
          JSON.parse(localStorage.getItem("dsh-live-voice.settings") || "{}")
        );
      } catch {
        settings = normalizeSettings(null);
      }
      const browser = new BrowserSpeakingEngine({ lang: settings.lang });
      const qwen = new QwenHttpSpeakingEngine({ lang: settings.lang });
      const meter = new MicrophoneMeter();
      const recognition = recognitionFor(settings, meter);
      const c = new VoiceCoordinator({
        recognition,
        engines: {
          browser,
          say: new SayClientEngine({ rpc: ctx.connection.rpc }),
          "qwen-http": qwen
        },
        meter,
        composer: { getDraft: () => "", setDraft: () => {
        } },
        settings
      });
      const speak = c.speak.bind(c);
      c.speak = (...args) => ownership.run(
        c,
        [...controllers.values()].map((entry) => entry.controller).concat([...retiring]),
        () => speak(...args)
      );
      const update = c.updateSettings.bind(c);
      let settingsRevision = 0;
      c.updateSettings = async (next) => {
        const revision = ++settingsRevision;
        const previousEngine = c.getSnapshot().settings.recognitionEngine;
        update(next);
        browser.lang = c.getSnapshot().settings.lang;
        qwen.lang = c.getSnapshot().settings.lang;
        const settings2 = c.getSnapshot().settings;
        if (previousEngine !== settings2.recognitionEngine)
          c.replaceRecognition(recognitionFor(settings2, c.meter));
        localStorage.setItem("dsh-live-voice.settings", JSON.stringify(settings2));
        run(c, c.refreshCapabilities());
        const active = [...controllers.values()];
        await Promise.allSettled([
          c.endConversation(),
          ...active.map((entry) => entry.controller.endConversation())
        ]);
        if (revision !== settingsRevision || disposed || c.disposed) return;
        for (const entry of controllers.values()) {
          if (entry.closed) continue;
          if (entry.controller.getSnapshot().settings.recognitionEngine !== settings2.recognitionEngine)
            entry.controller.replaceRecognition(recognitionFor(settings2, entry.controller.meter));
          entry.applySettings(settings2);
          run(entry.controller, entry.controller.refreshCapabilities());
        }
      };
      const refresh = () => run(c, c.refreshCapabilities());
      document.addEventListener("dsh-live-voice:capabilitieschanged", refresh);
      setController(c);
      refresh();
      return () => {
        document.removeEventListener("dsh-live-voice:capabilitieschanged", refresh);
        void c.dispose();
      };
    }, []);
    return controller ? e(SettingsPanel, { controller }) : null;
  }
  ctx.slots.inject(
    "settings.section",
    () => ctx.slots.register(
      { name: "settings.section", id: "dsh-live-voice", order: 65, label: "Live Voice" },
      Settings
    )
  );
  function Dock(props) {
    const entry = useEntry(props.sessionId, "dock");
    useComposer(entry, props);
    return entry ? e(RecordingBar, { controller: entry.controller }) : null;
  }
  function QuestionStatusView({ entry }) {
    const snapshot = import_react.default.useSyncExternalStore(
      entry.controller.subscribe,
      entry.controller.getSnapshot
    );
    const [overlayStyle, setOverlayStyle] = import_react.default.useState();
    import_react.default.useLayoutEffect(() => {
      if (!snapshot.answeringQuestion) return;
      const seat = document.querySelector("[data-composer-seat]");
      if (!seat) return;
      const update = () => {
        const rect = seat.getBoundingClientRect();
        setOverlayStyle({
          left: rect.left + rect.width / 2,
          width: Math.min(720, Math.max(0, rect.width - 32))
        });
      };
      update();
      const observer = typeof ResizeObserver === "function" ? new ResizeObserver(update) : null;
      observer?.observe(seat);
      window.addEventListener("resize", update);
      return () => {
        observer?.disconnect();
        window.removeEventListener("resize", update);
      };
    }, [snapshot.answeringQuestion]);
    const target = typeof document === "undefined" ? null : document.body;
    return snapshot.answeringQuestion && target && overlayStyle ? (0, import_react_dom.createPortal)(
      e(RecordingBar, {
        controller: entry.controller,
        questionOnly: true,
        overlay: true,
        overlayStyle
      }),
      target
    ) : null;
  }
  function QuestionStatus(props) {
    const entry = useEntry(props.sessionId, "question-status");
    return entry ? e(QuestionStatusView, { entry }) : null;
  }
  function ActionView({ entry, messageId }) {
    const snapshot = import_react.default.useSyncExternalStore(
      entry.controller.subscribe,
      entry.controller.getSnapshot
    );
    const chat = import_react.default.useSyncExternalStore(entry.subscribeChat, entry.readChat);
    const message2 = addressedTurn(assistantMessages(chat), messageId);
    const capability = snapshot.capabilities[snapshot.settings.engine];
    const active = snapshot.speaking && message2.id === snapshot.activeMessageId;
    const unavailable = capability?.supported !== true;
    return e(SpeakButton, {
      active,
      disabled: !message2.text.trim() || !active && unavailable,
      label: unavailable ? capability?.reason || "Checking speech output\u2026" : void 0,
      onClick: () => run(
        entry.controller,
        active ? entry.controller.stopSpeech() : entry.controller.speak(message2.text, message2.id)
      )
    });
  }
  function Action(props) {
    const entry = useEntry(props.sessionId, "action");
    return entry ? e(ActionView, { entry, messageId: props.messageId }) : null;
  }
  ctx.effect(() => {
    const style = document.createElement("style");
    style.dataset.plugin = "dsh-live-voice";
    style.textContent = styles;
    document.head.appendChild(style);
    return () => style.remove();
  });
  for (const [name, id2, order, component] of [
    ["conversation.input.right", "live-voice-controls", 6, Buttons],
    ["conversation.input.dock", "live-voice-status", -100, Dock],
    ["conversation.session.header.utilities", "live-voice-question-status", 100, QuestionStatus],
    ["conversation.chat.assistant-actions", "live-voice-speak", 5, Action]
  ])
    ctx.slots.inject(
      name,
      () => ctx.slots.register({ name, id: id2, order, label: "DSH Live Voice" }, component)
    );
  ctx.effect(() => {
    const stop = () => {
      ownership.cancel();
      for (const entry of controllers.values())
        run(entry.controller, entry.controller.endConversation());
    };
    const onKey = (event) => {
      if (disposed || event.defaultPrevented || !event.ctrlKey || !event.shiftKey || event.code !== "Space" || event.repeat)
        return;
      const candidates = [...controllers.values()].filter(
        (entry) => entry.buttons > 0 && entry.composers.size > 0
      );
      if (candidates.length !== 1) return;
      event.preventDefault();
      const c = candidates[0].controller;
      run(
        c,
        c.getSnapshot().listening || c.getSnapshot().starting ? c.stopListening() : c.startDictation()
      );
    };
    const refreshCapabilities = () => {
      for (const entry of controllers.values())
        run(entry.controller, entry.controller.refreshCapabilities());
      document.dispatchEvent(new Event("dsh-live-voice:capabilitieschanged"));
    };
    const visibilityChanged = () => {
      if (document.visibilityState === "visible") refreshCapabilities();
    };
    window.speechSynthesis?.addEventListener?.("voiceschanged", refreshCapabilities);
    navigator.mediaDevices?.addEventListener?.("devicechange", refreshCapabilities);
    document.addEventListener("visibilitychange", visibilityChanged);
    document.addEventListener("keydown", onKey);
    window.addEventListener("pagehide", stop);
    return () => {
      disposed = true;
      ownership.close();
      window.speechSynthesis?.removeEventListener?.("voiceschanged", refreshCapabilities);
      navigator.mediaDevices?.removeEventListener?.("devicechange", refreshCapabilities);
      document.removeEventListener("visibilitychange", visibilityChanged);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("pagehide", stop);
      for (const entry of controllers.values()) retire(entry);
    };
  });
}
return module.exports;}});
