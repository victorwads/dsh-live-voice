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
var defaultAgentVoiceContext = `Live Voice output is active. Your entire user-facing response will be spoken aloud.
Be concise and conversational. Lead with the answer or next action. Avoid unnecessary repetition, long preambles, dense lists, raw code, paths, and verbose status narration.
Do not narrate routine tool activity by default. If the user explicitly asks you to keep them informed while working, provide brief spoken progress updates only at meaningful milestones.`;
var defaultSettings = Object.freeze({
  engine: "browser",
  recognitionEngine: "browser",
  recognitionProcessLocally: true,
  recognitionAutoInstall: true,
  voiceDetectionPreset: "natural",
  recognitionMaxUtteranceSeconds: 60,
  microphoneEnabled: true,
  holdToTalkEnabled: true,
  announceAssistantMessages: true,
  agentVoiceContextEnabled: true,
  agentVoiceContext: defaultAgentVoiceContext,
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
  rate: 1,
  segmentGapMs: 200
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
    recognitionMaxUtteranceSeconds: Number.isInteger(source.recognitionMaxUtteranceSeconds) && source.recognitionMaxUtteranceSeconds >= 10 && source.recognitionMaxUtteranceSeconds <= 300 ? source.recognitionMaxUtteranceSeconds : defaultSettings.recognitionMaxUtteranceSeconds,
    microphoneEnabled: typeof source.microphoneEnabled === "boolean" ? source.microphoneEnabled : defaultSettings.microphoneEnabled,
    holdToTalkEnabled: typeof source.holdToTalkEnabled === "boolean" ? source.holdToTalkEnabled : defaultSettings.holdToTalkEnabled,
    announceAssistantMessages: typeof source.announceAssistantMessages === "boolean" ? source.announceAssistantMessages : defaultSettings.announceAssistantMessages,
    agentVoiceContextEnabled: typeof source.agentVoiceContextEnabled === "boolean" ? source.agentVoiceContextEnabled : defaultSettings.agentVoiceContextEnabled,
    agentVoiceContext: typeof source.agentVoiceContext === "string" && source.agentVoiceContext.length <= 4e3 && !source.agentVoiceContext.includes("\0") ? source.agentVoiceContext.trim() : defaultSettings.agentVoiceContext,
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
    rate: Number.isFinite(source.rate) && source.rate >= 0.1 && source.rate <= 3 ? source.rate : 1,
    segmentGapMs: Number.isFinite(source.segmentGapMs) && source.segmentGapMs >= 0 && source.segmentGapMs <= 2e3 ? Math.round(source.segmentGapMs) : 200
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
    this.prefetchController = new AbortController();
    this.prefetchItems = /* @__PURE__ */ new Set();
    this.activeSpeechItem = null;
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
    this.holdToTalkRelease = false;
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
    const previousSettings = this.snapshot.settings;
    const settings = normalizeSettings({ ...previousSettings, ...next });
    const speechPreparationChanged = ["engine", "voice", "lang", "rate", "outputDeviceId"].some(
      (key) => Object.hasOwn(next, key) && settings[key] !== previousSettings[key]
    );
    if (speechPreparationChanged) this._cancelSpeechPrefetch();
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
      this._cancelSpeechPrefetch();
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
  startHoldToTalk() {
    this.holdToTalkRelease = false;
    return this.startListening(false);
  }
  async releaseHoldToTalk() {
    if (this.disposed || !this.snapshot.listening && !this.snapshot.starting) return;
    this.holdToTalkRelease = true;
    if (this.snapshot.starting) return;
    await this.recognition.finish?.();
    if (this.snapshot.pendingTranscriptions === 0) this._finishHoldToTalk();
  }
  _finishHoldToTalk() {
    if (!this.holdToTalkRelease) return;
    this.holdToTalkRelease = false;
    const draft = this.composer.getDraft();
    if (!draft.trim()) {
      void this.stopListening();
      return;
    }
    this.scheduleAutoSend(draft, { force: true, stopAfter: true });
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
            else if (this.holdToTalkRelease) this._finishHoldToTalk();
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
        if (this.holdToTalkRelease) void this.releaseHoldToTalk();
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
  scheduleAutoSend(draft, { force = false, stopAfter = false } = {}) {
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
      if (!this.disposed && (force || this.snapshot.settings.sendingMode !== "manual") && expected === this.composer.getDraft()) {
        try {
          this.composer.submit(
            this.snapshot.settings.sendingMode === "steer" && !force ? "steer" : "queue"
          );
          this.transcript.reset();
          this.recognition.reset?.();
          if (stopAfter) void this.stopListening();
        } catch (error) {
          this.patch({ error: message(error) });
        } finally {
          this._drain();
        }
      } else {
        this._drain();
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
    this.holdToTalkRelease = false;
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
  _cancelSpeechPrefetch() {
    this.prefetchController.abort();
    this.prefetchController = new AbortController();
    for (const item of this.prefetchItems) {
      item.prepared?.dispose?.();
      item.prepared = null;
      item.preparing = null;
    }
    this.prefetchItems.clear();
  }
  _prefetchSpeech() {
    const engine = this.engines[this.snapshot.settings.engine];
    if (typeof engine?.prepare !== "function") return;
    const options = {
      voice: this.snapshot.settings.voice || void 0,
      rate: this.snapshot.settings.rate,
      lang: this.snapshot.settings.lang,
      outputDeviceId: this.snapshot.settings.outputDeviceId
    };
    for (const item of this.queue.slice(0, 3)) {
      if (item.prepared || item.preparing) continue;
      this.prefetchItems.add(item);
      const signal = this.prefetchController.signal;
      item.preparing = engine.prepare(item.text, { ...options, signal }).then((prepared) => {
        item.preparing = null;
        if (signal.aborted || !this.queue.includes(item)) {
          prepared.dispose?.();
          this.prefetchItems.delete(item);
        } else item.prepared = prepared;
        return prepared;
      }).catch((error) => {
        item.preparing = null;
        if (!signal.aborted) item.prepareError = error;
      });
    }
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
    this._cancelSpeechPrefetch();
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
  async skipSpeechSegment() {
    if (this.disposed || this.queue.length === 0) return;
    if (!this.snapshot.speaking && !this.snapshot.paused) {
      const skipped = this.queue.shift();
      skipped?.prepared?.dispose?.();
      this.prefetchItems.delete(skipped);
      this._cancelAssistantSpeechTimer();
      this.assistantSpeechNotBefore = 0;
      this._syncSpeechSegments();
      this._prefetchSpeech();
      this._drain();
      return;
    }
    const epoch = ++this.speechEpoch;
    ++this.controlEpoch;
    this._cancelAssistantSpeechTimer();
    this.assistantSpeechNotBefore = 0;
    this._cancelSpeechPrefetch();
    this.patch({ speaking: false, paused: false, activeMessageId: null });
    this._syncSpeechSegments();
    const stopped = this.speechBarrier.then(
      () => Promise.resolve().then(() => this.engines[this.snapshot.settings.engine]?.stop())
    );
    this.speechBarrier = stopped.catch(() => {
    });
    try {
      await stopped;
    } catch (error) {
      if (epoch === this.speechEpoch) this.patch({ error: message(error) });
      return;
    }
    if (epoch !== this.speechEpoch || this.disposed) return;
    this._drain();
  }
  async pauseSpeech() {
    if (this.disposed || !this.snapshot.speaking || this.snapshot.paused) return;
    const epoch = this.speechEpoch;
    const control = ++this.controlEpoch;
    try {
      const result = await this.engines[this.snapshot.settings.engine].pause();
      if (result !== false) this._cancelSpeechPrefetch();
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
      if (epoch === this.speechEpoch && control === this.controlEpoch && result !== false) {
        this.patch({ paused: false });
        this._prefetchSpeech();
      }
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
    this._prefetchSpeech();
    this._syncSpeechSegments();
    return this.play(first, messageId, true);
  }
  async play(text, messageId, manual = false) {
    if (this.disposed || !text.trim()) return;
    if (this.snapshot.speaking) {
      this.queue.push({ text, id: messageId, manual });
      this._prefetchSpeech();
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
      const queued = this.activeSpeechItem;
      if (queued?.preparing) await queued.preparing;
      if (epoch !== this.speechEpoch || this.disposed) return;
      if (queued?.prepareError) throw queued.prepareError;
      const options = {
        voice: this.snapshot.settings.voice || void 0,
        rate: this.snapshot.settings.rate,
        outputDeviceId: this.snapshot.settings.outputDeviceId
      };
      if (queued?.prepared && typeof engine.playPrepared === "function") {
        const prepared = queued.prepared;
        queued.prepared = null;
        this.prefetchItems.delete(queued);
        await engine.playPrepared(prepared, options);
      } else await engine.speak(text, options);
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
        if (!failed && this.queue.length) {
          this.assistantSpeechNotBefore = Date.now() + this.snapshot.settings.segmentGapMs;
          this._drain();
        } else if (this.snapshot.conversation && !this.snapshot.listening && !this.snapshot.starting)
          await this._startInput(true);
      }
    }
  }
  _cancelAssistantSpeechTimer() {
    if (this.assistantSpeechTimer !== null) clearTimeout(this.assistantSpeechTimer);
    this.assistantSpeechTimer = null;
  }
  _drain() {
    if (this.disposed || !this.snapshot.conversation && !this.queue[0]?.manual || !this.snapshot.settings.announceAssistantMessages && !this.queue[0]?.manual || this.snapshot.speaking || this.snapshot.recognizing || this.snapshot.starting || !this.queue[0]?.manual && (this.snapshot.pendingTranscriptions > 0 || this.snapshot.autoSendAt !== null) || !this.queue.length)
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
    this.activeSpeechItem = next;
    this._prefetchSpeech();
    void this.play(next.text, next.id, next.manual === true).finally(() => {
      if (this.activeSpeechItem === next) this.activeSpeechItem = null;
      next.prepared?.dispose?.();
      this.prefetchItems.delete(next);
    });
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
      this._prefetchSpeech();
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
    const cancelled2 = new Promise((resolve) => {
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
    return Promise.race([capture(), cancelled2]);
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

// src/engines/speaking/host-audio.ts
var cancelled = () => Object.assign(new Error("Speech was cancelled."), { name: "AbortError" });
var HostAudioSpeakingEngine = class {
  constructor({ endpoint, globals = globalThis, lang = "pt-BR", capability, synthesisRate, playbackRate, audioFormat = "audio/mp4" } = {}) {
    Object.assign(this, { endpoint, g: globals, lang, capabilityEndpoint: capability, audioFormat });
    this.synthesisRate = synthesisRate || ((rate) => rate);
    this.playbackRate = playbackRate || ((rate) => rate);
    this.current = null;
  }
  async capability() {
    try {
      const url = this.capabilityEndpoint || this.endpoint.replace(/\/speech$/, "/capabilities");
      const response = await this.g.fetch(url, { credentials: "same-origin" });
      const json = await response.json();
      if (!response.ok || !json?.ok) throw new Error(json?.error?.message || "Speech capability check failed.");
      return { ...json.value, local: true, location: "host", pause: true, resume: true, audioFormat: this.audioFormat };
    } catch (error) {
      return { supported: false, local: true, location: "host", pause: true, resume: true, reason: error?.message || String(error) };
    }
  }
  async prepare(text, { voice, lang = this.lang, rate = 1, signal } = {}) {
    if (typeof text !== "string") throw new TypeError("Speech text must be a string.");
    if (signal?.aborted) throw cancelled();
    const controller = new AbortController();
    const cancel = () => controller.abort();
    signal?.addEventListener("abort", cancel, { once: true });
    try {
      const response = await this.g.fetch(this.endpoint, {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, lang, voice, rate: this.synthesisRate(rate) }),
        signal: controller.signal
      });
      if (!response.ok) {
        let body;
        try {
          body = await response.json();
        } catch {
        }
        throw new Error(body?.error?.message || "Host speech synthesis failed (" + response.status + ").");
      }
      if (controller.signal.aborted) throw cancelled();
      const blob = await response.blob();
      if (blob.type && blob.type !== this.audioFormat) throw new Error("Host speech returned an unsupported audio format.");
      const url = this.g.URL.createObjectURL(blob);
      let disposed = false;
      return { audio: new this.g.Audio(url), url, dispose: () => {
        if (!disposed) {
          disposed = true;
          this.g.URL.revokeObjectURL(url);
        }
      } };
    } catch (error) {
      if (controller.signal.aborted && error?.name !== "AbortError") throw cancelled();
      throw error;
    } finally {
      signal?.removeEventListener("abort", cancel);
    }
  }
  async playPrepared(prepared, options = {}) {
    const { signal, outputDeviceId = "", rate = 1 } = options;
    const playbackRate = this.playbackRate(rate);
    if (!prepared?.audio) throw new TypeError("Prepared speech audio is required.");
    await this.stop();
    if (signal?.aborted) throw cancelled();
    const operation = { prepared, audio: prepared.audio };
    this.current = operation;
    const audio = operation.audio;
    audio.playbackRate = playbackRate;
    if (outputDeviceId && typeof audio.setSinkId === "function") await audio.setSinkId(outputDeviceId);
    return new Promise((resolve, reject) => {
      const cleanup = () => {
        audio.removeEventListener("ended", done);
        audio.removeEventListener("error", failed);
        signal?.removeEventListener("abort", aborted);
        if (this.current === operation) this.current = null;
        prepared.dispose();
      };
      const done = () => {
        cleanup();
        resolve();
      };
      const failed = () => {
        cleanup();
        reject(new Error("The browser could not play host speech audio."));
      };
      const aborted = () => {
        audio.pause();
        cleanup();
        reject(cancelled());
      };
      operation.cancel = aborted;
      audio.addEventListener("ended", done, { once: true });
      audio.addEventListener("error", failed, { once: true });
      signal?.addEventListener("abort", aborted, { once: true });
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
      speaking: false,
      finishing: false,
      finishPromise: null,
      resolveFinish: null
    };
    this.session = session;
    const cancelled2 = new Promise((resolve, reject) => {
      session.rejectCancelled = reject;
    });
    session.cancel = () => {
      if (this.session === session) this.stop();
    };
    signal?.addEventListener("abort", session.cancel, { once: true });
    const capability = await Promise.race([
      this.capability({ lang, processLocally: this.processLocally }),
      cancelled2
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
      if (session.finishing) {
        this.session = null;
        session.signal?.removeEventListener("abort", session.cancel);
        session.resolveFinish?.();
        return;
      }
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
  finish() {
    const session = this.session;
    if (!session) return Promise.resolve();
    if (session.finishPromise) return session.finishPromise;
    session.finishing = true;
    session.finishPromise = new Promise((resolve) => {
      session.resolveFinish = resolve;
    });
    if (session.timer !== null) {
      (this.globals.clearTimeout ?? globalThis.clearTimeout)(session.timer);
      session.timer = null;
      this.session = null;
      session.resolveFinish();
      return session.finishPromise;
    }
    try {
      session.recognition?.stop();
      if (!session.recognition) {
        this.session = null;
        session.resolveFinish();
      }
    } catch {
      this.session = null;
      session.resolveFinish();
    }
    return session.finishPromise;
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
    session.resolveFinish?.();
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
  constructor({
    globals = globalThis,
    meter,
    voiceDetectionPreset = "natural",
    maxUtteranceSeconds = 60
  } = {}) {
    this.g = globals;
    this.meter = meter;
    this.session = null;
    this.lang = "pt-BR";
    this.voiceDetectionPreset = voiceDetectionPreset;
    this.maxUtteranceSeconds = maxUtteranceSeconds;
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
      if (session.voiced && session.silence > context.sampleRate * (this.segmentation.silenceMs / 1e3) || session.samples > context.sampleRate * this.maxUtteranceSeconds)
        enqueue();
    };
    source.connect(processor);
    session.finish = enqueue;
    session.abort = () => this.stop();
    signal?.addEventListener("abort", session.abort, { once: true });
  }
  finish() {
    const session = this.session;
    if (!session) return;
    session.processor.onaudioprocess = null;
    try {
      this.meter?.source?.disconnect(session.processor);
    } catch {
    }
    session.finish?.();
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
var QwenHttpSpeakingEngine = class extends HostAudioSpeakingEngine {
  constructor({ globals = globalThis, lang = "pt-BR" } = {}) {
    super({
      endpoint: "/api/dsh-live-voice/qwen/speech",
      capability: "/api/dsh-live-voice/qwen/capabilities?kind=tts",
      globals,
      lang
    });
  }
};

// src/client/whisper-settings.ts
var BASE = "/api/dsh-live-voice/whisper";
var UNLOADED = "dsh-live-voice.recognition.whisper.restartRequired";
async function whisperSettingsRequest(path, { method = "GET", config, signal } = {}, fetchImpl = globalThis.fetch) {
  const response = await fetchImpl(BASE + path, {
    method,
    credentials: "same-origin",
    signal,
    headers: config ? { "content-type": "application/json" } : void 0,
    body: config ? JSON.stringify(config) : void 0
  });
  if (response.status === 401 || response.status === 403)
    throw new Error("dsh-live-voice.recognition.whisper.signInRequired");
  if (response.status === 404 || response.status === 405) throw new Error(UNLOADED);
  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error(UNLOADED);
  }
  if (typeof body?.ok !== "boolean") throw new Error(UNLOADED);
  if (!response.ok || !body.ok)
    throw new Error(body.error?.message || "dsh-live-voice.recognition.whisper.requestFailed");
  return body.value;
}
function createWhisperSettings(React2, translate = (value) => value) {
  const t = translate;
  const h = (type, props, ...children) => React2.createElement(
    type,
    props,
    ...children.map(
      (value) => typeof value === "string" && value.startsWith("dsh-live-voice.") ? t(value) : value
    )
  );
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
            setMessage("dsh-live-voice.recognition.whisper.saved");
            await controller.refreshCapabilities?.();
          }
        } else {
          const value = await whisperSettingsRequest("/test", {
            method: "POST",
            config: { ...draft, timeoutMs: Number(draft.timeoutMs) },
            signal: abort.signal
          });
          if (!abort.signal.aborted) {
            if (!value.supported)
              throw new Error(value.reason || "dsh-live-voice.recognition.whisper.healthFailed");
            setMessage("dsh-live-voice.recognition.whisper.connectionSuccess");
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
            setMessage("dsh-live-voice.commons.connection.unsaved");
            setError("");
          }
        })
      );
    }
    return h(
      React2.Fragment,
      null,
      h("p", null, "dsh-live-voice.settings.whisper.hostHelp"),
      field("dsh-live-voice.commons.connection.endpoint", "url"),
      field("dsh-live-voice.commons.connection.healthEndpoint", "healthUrl"),
      field("dsh-live-voice.commons.connection.timeout", "timeoutMs", "number"),
      h(
        "div",
        { className: "dlv-settings-actions" },
        h(
          "button",
          { type: "button", disabled: busy || !loaded, onClick: () => run("save") },
          "dsh-live-voice.recognition.whisper.save"
        ),
        h(
          "button",
          { type: "button", disabled: busy || !loaded, onClick: () => run("test") },
          "dsh-live-voice.commons.connection.test"
        ),
        h(
          "button",
          { type: "button", disabled: busy, onClick: () => run("load") },
          "dsh-live-voice.commons.connection.reload"
        )
      ),
      busy ? h("p", { role: "status" }, "dsh-live-voice.commons.connection.contactingHost") : null,
      message2 ? h("p", { role: "status" }, message2) : null,
      error ? h("p", { role: "alert" }, error) : null
    );
  };
}

// src/client/qwen-settings.ts
var BASE2 = "/api/dsh-live-voice/qwen";
var UNLOADED2 = "dsh-live-voice.speak.qwen.restartRequired";
async function qwenSettingsRequest(path, { method = "GET", config, signal } = {}, fetchImpl = globalThis.fetch) {
  const response = await fetchImpl(BASE2 + path, {
    method,
    credentials: "same-origin",
    signal,
    headers: config ? { "content-type": "application/json" } : void 0,
    body: config ? JSON.stringify(config) : void 0
  });
  if (response.status === 401 || response.status === 403)
    throw new Error("dsh-live-voice.speak.qwen.signInRequired");
  if (response.status === 404 || response.status === 405) throw new Error(UNLOADED2);
  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error(UNLOADED2);
  }
  if (typeof body?.ok !== "boolean") throw new Error(UNLOADED2);
  if (!response.ok || !body.ok)
    throw new Error(body.error?.message || "dsh-live-voice.speak.qwen.requestFailed");
  return body.value;
}
function createQwenSettings(React2, translate = (value) => value) {
  const t = translate;
  const h = (type, props, ...children) => React2.createElement(
    type,
    props,
    ...children.map(
      (value) => typeof value === "string" && value.startsWith("dsh-live-voice.") ? t(value) : value
    )
  );
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
            setMessage("dsh-live-voice.speak.qwen.saved");
            await controller.refreshCapabilities?.();
          }
        } else {
          const value = await qwenSettingsRequest("/test", {
            method: "POST",
            config: { ...draft, timeoutMs: Number(draft.timeoutMs) },
            signal: abort.signal
          });
          if (!abort.signal.aborted) {
            if (!value.supported)
              throw new Error(value.reason || "dsh-live-voice.speak.qwen.healthFailed");
            setMessage("dsh-live-voice.recognition.qwen.connectionSuccess");
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
          setMessage("dsh-live-voice.commons.connection.unsaved");
          setError("");
        }
      })
    );
    return h(
      React2.Fragment,
      null,
      h("p", null, "dsh-live-voice.recognition.qwen.hostHelp"),
      field("dsh-live-voice.speak.qwen.endpoint", "baseUrl"),
      field("dsh-live-voice.commons.connection.timeout", "timeoutMs", "number"),
      h(
        "div",
        { className: "dlv-settings-actions" },
        h(
          "button",
          { type: "button", disabled: busy || !loaded, onClick: () => run("save") },
          "dsh-live-voice.speak.qwen.save"
        ),
        h(
          "button",
          { type: "button", disabled: busy || !loaded, onClick: () => run("test") },
          "dsh-live-voice.speak.qwen.test"
        ),
        h(
          "button",
          { type: "button", disabled: busy, onClick: () => run("load") },
          "dsh-live-voice.commons.connection.reload"
        )
      ),
      busy ? h("p", { role: "status" }, "dsh-live-voice.commons.connection.contactingHost") : null,
      message2 ? h("p", { role: "status" }, message2) : null,
      error ? h("p", { role: "alert" }, error) : null
    );
  };
}

// src/client/i18n/en.ts
var en = {
  "dsh-live-voice.commons.connection.contactingHost": "Contacting DSH host\u2026",
  "dsh-live-voice.commons.connection.endpoint": "Endpoint URL",
  "dsh-live-voice.commons.connection.healthEndpoint": "Health URL or path",
  "dsh-live-voice.commons.connection.reload": "Reload saved settings",
  "dsh-live-voice.commons.connection.test": "Test connection",
  "dsh-live-voice.commons.connection.timeout": "Request timeout (ms)",
  "dsh-live-voice.commons.connection.title": "Connection settings",
  "dsh-live-voice.commons.connection.unsaved": "Unsaved changes",
  "dsh-live-voice.commons.controls.title": "Voice controls",
  "dsh-live-voice.commons.conversation.end": "End voice conversation",
  "dsh-live-voice.commons.conversation.idle": "Conversation idle",
  "dsh-live-voice.commons.conversation.start": "Start voice conversation",
  "dsh-live-voice.commons.delivery.queueBadge": "QUEUE",
  "dsh-live-voice.commons.device.numberedLabel": "{device} {number}",
  "dsh-live-voice.commons.dismiss": "Dismiss",
  "dsh-live-voice.commons.dismissError": "Dismiss voice error",
  "dsh-live-voice.commons.engine.failure": "{engine}: {reason}",
  "dsh-live-voice.commons.input.ignoring": "ignoring",
  "dsh-live-voice.commons.input.ignoringBadge": "IGNORING",
  "dsh-live-voice.commons.input.listening": "listening",
  "dsh-live-voice.commons.input.listeningBadge": "LISTENING",
  "dsh-live-voice.commons.manual": "manual",
  "dsh-live-voice.commons.off": "off",
  "dsh-live-voice.commons.on": "on",
  "dsh-live-voice.commons.pluginName": "Live Voice",
  "dsh-live-voice.commons.queue": "queue",
  "dsh-live-voice.commons.repository.starLabel": "Star Us on GitHub",
  "dsh-live-voice.commons.repository.starLink": "Star DSH Live Voice on GitHub",
  "dsh-live-voice.commons.seconds": "{seconds} seconds",
  "dsh-live-voice.commons.send": "SEND",
  "dsh-live-voice.commons.status.ready": "Voice ready",
  "dsh-live-voice.commons.systemDefault": "System default",
  "dsh-live-voice.commons.toggle.offBadge": "OFF",
  "dsh-live-voice.commons.unknownLanguage": "unknown language",
  "dsh-live-voice.commons.update.label": "Update available",
  "dsh-live-voice.commons.update.link": "Update available: {version}. Open release",
  "dsh-live-voice.commons.update.version": "Update available: {version}",
  "dsh-live-voice.commons.version.compatibility": "Compatible with DSH v{version}",
  "dsh-live-voice.commons.version.compatibilityLink": "Compatible with DSH v{version}. Open release",
  "dsh-live-voice.commons.version.label": "DSH Live Voice v{version}",
  "dsh-live-voice.commons.version.link": "DSH Live Voice v{version}. Open releases",
  "dsh-live-voice.commons.version.title": "Version information",
  "dsh-live-voice.recognition.autoSend.countdownHelp": "Countdown starts after a final recognized phrase. New speech or edits cancel it.",
  "dsh-live-voice.recognition.browser.autoInstallPack": "Automatically install this browser language pack when needed",
  "dsh-live-voice.recognition.browser.help": "Uses the browser SpeechRecognition API. This is the default option.",
  "dsh-live-voice.recognition.browser.label": "Browser SpeechRecognition \u2014 Default option",
  "dsh-live-voice.recognition.browser.localProcessing": "Process recognition locally on this device",
  "dsh-live-voice.recognition.browser.microphoneHelp": "Browser SpeechRecognition may use the browser or system default microphone instead of this selection.",
  "dsh-live-voice.recognition.browser.remoteServiceWarning": "Browser-service recognition is enabled. The browser may send microphone audio to its recognition service.",
  "dsh-live-voice.recognition.commands.clear": "Clear composer",
  "dsh-live-voice.recognition.commands.enabled": "Enable exact voice commands",
  "dsh-live-voice.recognition.commands.mute": "Mute composer input",
  "dsh-live-voice.recognition.commands.queue": "Put in queue",
  "dsh-live-voice.recognition.commands.resume": "Resume composer input",
  "dsh-live-voice.recognition.commands.send": "Send to running agent",
  "dsh-live-voice.recognition.commands.stopSpeech": "Stop assistant speech",
  "dsh-live-voice.recognition.commands.title": "Voice commands",
  "dsh-live-voice.recognition.dictation.cancel": "Cancel dictation",
  "dsh-live-voice.recognition.engine.label": "Recognition engine",
  "dsh-live-voice.recognition.headphoneMode.help": "Open microphone keeps listening while responses play. When your speech is detected, playback pauses and resumes only when you choose.",
  "dsh-live-voice.recognition.headphoneMode.label": "Headphones \u2014 open microphone",
  "dsh-live-voice.recognition.holdToTalk.enabled": "Hold Control to talk",
  "dsh-live-voice.recognition.holdToTalk.help": "While a composer is open, hold Control anywhere on the page to capture speech. Release it to flush queued transcription, wait the configured send delay, queue the message, and close voice capture. Press Escape while holding to cancel.",
  "dsh-live-voice.recognition.language.automatic": "Automatic \u2014 detect language",
  "dsh-live-voice.recognition.language.label": "Recognition language",
  "dsh-live-voice.recognition.manualSend.help": "Recognized text stays in the composer until you use the normal DSH Send control.",
  "dsh-live-voice.recognition.maxUtterance.help": "If speech never pauses, start a new transcription chunk after this duration. Default: 60 seconds.",
  "dsh-live-voice.recognition.maxUtterance.label": "Maximum continuous speech (seconds)",
  "dsh-live-voice.recognition.microphone.checking": "Checking microphone availability",
  "dsh-live-voice.recognition.microphone.device": "Input device",
  "dsh-live-voice.recognition.microphone.failure": "Microphone: {reason}",
  "dsh-live-voice.recognition.microphone.ignore": "Ignore composer input",
  "dsh-live-voice.recognition.microphone.inputStatus": "Microphone input: {state}",
  "dsh-live-voice.recognition.microphone.label": "Microphone",
  "dsh-live-voice.recognition.microphone.permissionHelp": "Microphone permission will be requested only when you start dictation or a voice conversation.",
  "dsh-live-voice.recognition.microphone.resume": "Resume listening",
  "dsh-live-voice.recognition.microphone.starting": "Starting microphone\u2026",
  "dsh-live-voice.recognition.microphone.takeControl": "Take microphone",
  "dsh-live-voice.recognition.minimumWords.enabled": "Ignore short final transcription chunks",
  "dsh-live-voice.recognition.minimumWords.help": "Final chunks with fewer words are ignored before they reach the composer or automatic delivery.",
  "dsh-live-voice.recognition.minimumWords.label": "Minimum words per final chunk",
  "dsh-live-voice.recognition.mode.label": "Listening mode",
  "dsh-live-voice.recognition.planned.parakeet": "NVIDIA Parakeet \u2014 Soon",
  "dsh-live-voice.recognition.planned.sherpa": "sherpa-onnx Streaming \u2014 Soon",
  "dsh-live-voice.recognition.planned.vote": "Coming Soon \u2014 vote on repo issues",
  "dsh-live-voice.recognition.planned.voxtral": "Voxtral Realtime \u2014 Soon",
  "dsh-live-voice.recognition.planned.webGpu": "Browser WebGPU Inference \u2014 Soon",
  "dsh-live-voice.recognition.presets.long.description": "Wait through longer thinking pauses.",
  "dsh-live-voice.recognition.presets.long.label": "Long",
  "dsh-live-voice.recognition.presets.natural.description": "Allow normal pauses between phrases.",
  "dsh-live-voice.recognition.presets.natural.label": "Natural",
  "dsh-live-voice.recognition.presets.short.description": "Send quickly after a short pause.",
  "dsh-live-voice.recognition.presets.short.label": "Short",
  "dsh-live-voice.recognition.providerSettings.help": "Provider settings change with the selected recognition engine.",
  "dsh-live-voice.recognition.qwen.captureHelp": "Audio is segmented into complete WAV utterances and sent through authenticated DSH to the host-local Qwen3 ASR model.",
  "dsh-live-voice.recognition.qwen.connectionSuccess": "Connection successful. Both Qwen ASR and TTS are loaded. Unsaved edits have not been applied.",
  "dsh-live-voice.recognition.qwen.endpointHelp": "HTTP API at the configured DSH host URL (default: http://127.0.0.1:8080/inference). Audio uses the authenticated DSH host transcription route.",
  "dsh-live-voice.recognition.qwen.hostHelp": "Host-wide settings for the Qwen3 ASR + TTS server. Enter any HTTP or HTTPS base URL reachable from the DSH host. The browser accesses it through authenticated DSH routes.",
  "dsh-live-voice.recognition.qwen.label": "Qwen3 ASR \u2014 HTTP API",
  "dsh-live-voice.recognition.silenceDetection.duration": "Pause before sending: {milliseconds} ms",
  "dsh-live-voice.recognition.silenceDetection.help": "Controls how long a pause must last before captured speech is sent for recognition.",
  "dsh-live-voice.recognition.silenceDetection.label": "Silence detection",
  "dsh-live-voice.recognition.silenceDetection.pauseLabel": "Pause before sending",
  "dsh-live-voice.recognition.silenceDetection.title": "Silence detection settings",
  "dsh-live-voice.recognition.speakerMode.help": "Gated listening releases the microphone while responses play, preventing speaker audio from being recognized. Use Take microphone to interrupt.",
  "dsh-live-voice.recognition.speakerMode.label": "Speakers \u2014 gated listening",
  "dsh-live-voice.recognition.status.answer": "Recognizing answer\u2026",
  "dsh-live-voice.recognition.status.awaitingAnswer": "Listening for your answer\u2026",
  "dsh-live-voice.recognition.status.listening": "Listening \u2014 waiting for speech",
  "dsh-live-voice.recognition.status.processing": "Recognizing speech\u2026",
  "dsh-live-voice.recognition.status.unavailable": "Speech recognition unavailable",
  "dsh-live-voice.recognition.voiceCommands.help": "Separate phrases with commas. Matching ignores capitalization, accents, punctuation, and extra spaces. The entire final chunk must match.",
  "dsh-live-voice.recognition.whisper.captureHelp": "Audio is segmented into complete WAV utterances, sent through authenticated DSH, and processed by loopback whisper.cpp HTTP.",
  "dsh-live-voice.recognition.whisper.connectionSuccess": "Connection successful. Health endpoint responded; transcription was not tested. Unsaved edits have not been applied.",
  "dsh-live-voice.recognition.whisper.endpointHelp": "HTTP API at the configured base URL (default: http://127.0.0.1:8080/). Compatible with POST /v1/audio/transcriptions.",
  "dsh-live-voice.recognition.whisper.healthFailed": "Whisper health check failed.",
  "dsh-live-voice.recognition.whisper.label": "Whisper \u2014 HTTP API",
  "dsh-live-voice.recognition.whisper.requestFailed": "Whisper settings request failed.",
  "dsh-live-voice.recognition.whisper.restartRequired": "Whisper settings routes are not loaded. A normal DSH server restart is required to load updated plugin routes; refreshing this page alone is not enough.",
  "dsh-live-voice.recognition.whisper.save": "Save Whisper settings",
  "dsh-live-voice.recognition.whisper.saved": "Saved on the DSH host. Active host transcription requests were cancelled.",
  "dsh-live-voice.recognition.whisper.signInRequired": "Sign in to DSH to manage Whisper settings.",
  "dsh-live-voice.settings.autoSend.cancel": "Cancel automatic send",
  "dsh-live-voice.settings.autoSend.countdown": "Sending in {remaining}\u2026",
  "dsh-live-voice.settings.autoSend.delay": "Send after silence",
  "dsh-live-voice.settings.close": "Close voice settings",
  "dsh-live-voice.settings.delivery.label": "Sending mode",
  "dsh-live-voice.settings.delivery.manualLabel": "Off \u2014 review and send manually",
  "dsh-live-voice.settings.delivery.queueLabel": "Queue \u2014 automatically add after silence",
  "dsh-live-voice.settings.delivery.status": "Automatic delivery: {mode}",
  "dsh-live-voice.settings.delivery.steerDescription": "send to the running agent",
  "dsh-live-voice.settings.delivery.steerLabel": "Steer \u2014 automatically send to the running agent",
  "dsh-live-voice.settings.delivery.toggle": "Automatic delivery mode",
  "dsh-live-voice.settings.engine.refresh": "Refresh available engines",
  "dsh-live-voice.settings.filters.title": "Filtering",
  "dsh-live-voice.settings.tabs.conversation": "Conversation",
  "dsh-live-voice.settings.tabs.recognition": "Speech recognition",
  "dsh-live-voice.settings.tabs.speak": "Speech",
  "dsh-live-voice.settings.title": "Live Voice settings",
  "dsh-live-voice.settings.whisper.hostHelp": "Host-wide settings. Only unauthenticated loopback HTTP URLs (localhost, 127.0.0.1, [::1]) are allowed. Loopback means the DSH host, not this browser. All health checks and audio requests run through the authenticated backend.",
  "dsh-live-voice.speak.agentContext.enabled": "Enable agent voice context",
  "dsh-live-voice.speak.agentContext.enabledHelp": "When enabled, the context below tells the agent that its responses will be spoken aloud.",
  "dsh-live-voice.speak.agentContext.help": "This English instruction is sent to the agent only during an active voice conversation with automatic assistant speech enabled.",
  "dsh-live-voice.speak.agentContext.label": "Agent voice context",
  "dsh-live-voice.speak.agentContext.restore": "Restore default",
  "dsh-live-voice.speak.autoPlayback.enabled": "Automatically speak new assistant messages",
  "dsh-live-voice.speak.autoPlayback.help": "During a voice conversation, assistant phrases are announced automatically. Playback waits while you are speaking.",
  "dsh-live-voice.speak.autoPlayback.label": "Automatic assistant speech",
  "dsh-live-voice.speak.autoPlayback.remainingOne": "Automatic assistant speech: {state} \u2014 {count} speech segment remaining",
  "dsh-live-voice.speak.autoPlayback.remainingOther": "Automatic assistant speech: {state} \u2014 {count} speech segments remaining",
  "dsh-live-voice.speak.autoPlayback.status": "Automatic assistant speech: {state}",
  "dsh-live-voice.speak.browser.automaticVoice": "Automatic local voice",
  "dsh-live-voice.speak.browser.label": "Browser speech \u2014 device audio",
  "dsh-live-voice.speak.browser.name": "Browser speech",
  "dsh-live-voice.speak.browser.outputHelp": "Browser speech synthesis may ignore the selected output device; this browser API normally follows the system default.",
  "dsh-live-voice.speak.browser.voice": "Local browser voice",
  "dsh-live-voice.speak.engine.label": "Speech engine",
  "dsh-live-voice.speak.engine.playbackHelp": "Qwen and macOS say synthesize on the DSH host; compact AAC/M4A audio plays in this browser. Browser speech synthesizes and plays on this device.",
  "dsh-live-voice.speak.filters.code.enabled": "Filter Markdown code blocks before speaking",
  "dsh-live-voice.speak.filters.code.maxLines": "Read code blocks up to this many lines",
  "dsh-live-voice.speak.filters.code.notice": "Look at the code in our conversation",
  "dsh-live-voice.speak.filters.code.replacement": "Replacement phrase for larger code blocks",
  "dsh-live-voice.speak.interruption.disabledHelp": "Sending another message does not stop the assistant audio you are already hearing.",
  "dsh-live-voice.speak.interruption.enabled": "Stop assistant speech when I send a message",
  "dsh-live-voice.speak.interruption.enabledHelp": "Sending or steering a new user message stops current or paused assistant speech.",
  "dsh-live-voice.speak.macos.label": "macOS say \u2014 host audio",
  "dsh-live-voice.speak.macos.name": "macOS say",
  "dsh-live-voice.speak.macos.outputHelp": "macOS say uses the output selected on the DSH host.",
  "dsh-live-voice.speak.output.checking": "Checking speech output\u2026",
  "dsh-live-voice.speak.output.device": "Output device",
  "dsh-live-voice.speak.output.fallbackName": "Audio output",
  "dsh-live-voice.speak.output.stopTest": "Stop speech test",
  "dsh-live-voice.speak.output.test": "Test selected speech output",
  "dsh-live-voice.speak.output.testPhrase": "DSH Live Voice. The selected speech output is working.",
  "dsh-live-voice.speak.output.testing": "Testing speech\u2026",
  "dsh-live-voice.speak.playback.message": "Speak message",
  "dsh-live-voice.speak.playback.next": "Skip to next speech segment",
  "dsh-live-voice.speak.playback.pause": "Pause speech",
  "dsh-live-voice.speak.playback.resume": "Resume speech",
  "dsh-live-voice.speak.playback.stop": "Stop speaking",
  "dsh-live-voice.speak.playback.stopAll": "Stop all speech",
  "dsh-live-voice.speak.qwen.connection": "Qwen server connection",
  "dsh-live-voice.speak.qwen.endpoint": "Qwen API base URL",
  "dsh-live-voice.speak.qwen.healthFailed": "Qwen health check failed.",
  "dsh-live-voice.speak.qwen.label": "Qwen3 TTS \u2014 local MLX server",
  "dsh-live-voice.speak.qwen.name": "Qwen3 local",
  "dsh-live-voice.speak.qwen.requestFailed": "Qwen settings request failed.",
  "dsh-live-voice.speak.qwen.restartRequired": "Qwen settings routes are not loaded. A normal DSH server restart is required to load updated plugin routes; refreshing this page alone is not enough.",
  "dsh-live-voice.speak.qwen.save": "Save Qwen settings",
  "dsh-live-voice.speak.qwen.saved": "Saved on the DSH host. Active Qwen requests were cancelled.",
  "dsh-live-voice.speak.qwen.signInRequired": "Sign in to DSH to manage Qwen settings.",
  "dsh-live-voice.speak.qwen.test": "Test Qwen server",
  "dsh-live-voice.speak.qwen.voice": "Qwen voice",
  "dsh-live-voice.speak.qwen.voiceHelp": "Aiden is used by default. These preset voices are not native Brazilian Portuguese voices.",
  "dsh-live-voice.speak.qwen.voices.aiden": "Aiden \u2014 male, American English",
  "dsh-live-voice.speak.qwen.voices.dylan": "Dylan \u2014 male, Beijing Chinese",
  "dsh-live-voice.speak.qwen.voices.eric": "Eric \u2014 male, Sichuan Chinese",
  "dsh-live-voice.speak.qwen.voices.onoAnna": "Ono Anna \u2014 female, Japanese",
  "dsh-live-voice.speak.qwen.voices.ryan": "Ryan \u2014 male, English",
  "dsh-live-voice.speak.qwen.voices.serena": "Serena \u2014 female, Chinese",
  "dsh-live-voice.speak.qwen.voices.sohee": "Sohee \u2014 female, Korean",
  "dsh-live-voice.speak.qwen.voices.uncleFu": "Uncle Fu \u2014 male, Chinese",
  "dsh-live-voice.speak.qwen.voices.vivian": "Vivian \u2014 female, Chinese",
  "dsh-live-voice.speak.rate.help": "Relative speed: 1 is normal.",
  "dsh-live-voice.speak.rate.label": "Speech rate",
  "dsh-live-voice.speak.responseDelay.help": "After you stop speaking, automatic assistant playback waits for this much continuous silence. Speaking again restarts the wait.",
  "dsh-live-voice.speak.responseDelay.label": "Assistant response delay",
  "dsh-live-voice.speak.segmentGap.help": "Wait this many milliseconds between consecutive spoken segments. 200 ms is the default.",
  "dsh-live-voice.speak.segmentGap.label": "Pause between speech segments",
  "dsh-live-voice.speak.status.paused": "Speech paused",
  "dsh-live-voice.speak.status.playing": "Speaking"
};
var en_default = Object.freeze(en);

// src/client/i18n/zh.ts
var zh = {
  "dsh-live-voice.commons.connection.contactingHost": "\u6B63\u5728\u8054\u7CFB DSH \u4E3B\u673A\u2026",
  "dsh-live-voice.commons.connection.endpoint": "\u7AEF\u70B9 URL",
  "dsh-live-voice.commons.connection.healthEndpoint": "\u5065\u5EB7\u68C0\u67E5 URL \u6216\u8DEF\u5F84",
  "dsh-live-voice.commons.connection.reload": "\u91CD\u65B0\u52A0\u8F7D\u5DF2\u4FDD\u5B58\u7684\u8BBE\u7F6E",
  "dsh-live-voice.commons.connection.test": "\u6D4B\u8BD5\u8FDE\u63A5",
  "dsh-live-voice.commons.connection.timeout": "\u8BF7\u6C42\u8D85\u65F6\uFF08\u6BEB\u79D2\uFF09",
  "dsh-live-voice.commons.connection.title": "\u8FDE\u63A5\u8BBE\u7F6E",
  "dsh-live-voice.commons.connection.unsaved": "\u6709\u672A\u4FDD\u5B58\u7684\u66F4\u6539",
  "dsh-live-voice.commons.controls.title": "\u8BED\u97F3\u63A7\u5236",
  "dsh-live-voice.commons.conversation.end": "\u7ED3\u675F\u8BED\u97F3\u5BF9\u8BDD",
  "dsh-live-voice.commons.conversation.idle": "\u5BF9\u8BDD\u7A7A\u95F2",
  "dsh-live-voice.commons.conversation.start": "\u5F00\u59CB\u8BED\u97F3\u5BF9\u8BDD",
  "dsh-live-voice.commons.delivery.queueBadge": "\u961F\u5217",
  "dsh-live-voice.commons.device.numberedLabel": "{device} {number}",
  "dsh-live-voice.commons.dismiss": "\u5173\u95ED",
  "dsh-live-voice.commons.dismissError": "\u5173\u95ED\u8BED\u97F3\u9519\u8BEF\u63D0\u793A",
  "dsh-live-voice.commons.engine.failure": "{engine}\uFF1A{reason}",
  "dsh-live-voice.commons.input.ignoring": "\u6B63\u5728\u5FFD\u7565",
  "dsh-live-voice.commons.input.ignoringBadge": "\u5FFD\u7565\u4E2D",
  "dsh-live-voice.commons.input.listening": "\u6B63\u5728\u8046\u542C",
  "dsh-live-voice.commons.input.listeningBadge": "\u8046\u542C\u4E2D",
  "dsh-live-voice.commons.manual": "\u624B\u52A8",
  "dsh-live-voice.commons.off": "\u5173\u95ED",
  "dsh-live-voice.commons.on": "\u5F00\u542F",
  "dsh-live-voice.commons.pluginName": "Live Voice",
  "dsh-live-voice.commons.queue": "\u961F\u5217",
  "dsh-live-voice.commons.repository.starLabel": "\u5728 GitHub \u4E0A\u4E3A\u6211\u4EEC\u52A0\u661F",
  "dsh-live-voice.commons.repository.starLink": "\u5728 GitHub \u4E0A\u4E3A DSH Live Voice \u52A0\u661F",
  "dsh-live-voice.commons.seconds": "{seconds} \u79D2",
  "dsh-live-voice.commons.send": "\u53D1\u9001",
  "dsh-live-voice.commons.status.ready": "\u8BED\u97F3\u5DF2\u5C31\u7EEA",
  "dsh-live-voice.commons.systemDefault": "\u7CFB\u7EDF\u9ED8\u8BA4",
  "dsh-live-voice.commons.toggle.offBadge": "\u5173\u95ED",
  "dsh-live-voice.commons.unknownLanguage": "\u672A\u77E5\u8BED\u8A00",
  "dsh-live-voice.commons.update.label": "\u6709\u53EF\u7528\u66F4\u65B0",
  "dsh-live-voice.commons.update.link": "\u6709\u53EF\u7528\u66F4\u65B0\uFF1A{version}\u3002\u6253\u5F00\u53D1\u5E03\u9875\u9762",
  "dsh-live-voice.commons.update.version": "\u6709\u53EF\u7528\u66F4\u65B0\uFF1A{version}",
  "dsh-live-voice.commons.version.compatibility": "\u517C\u5BB9 DSH v{version}",
  "dsh-live-voice.commons.version.compatibilityLink": "\u517C\u5BB9 DSH v{version}\u3002\u6253\u5F00\u53D1\u5E03\u9875\u9762",
  "dsh-live-voice.commons.version.label": "DSH Live Voice v{version}",
  "dsh-live-voice.commons.version.link": "DSH Live Voice v{version}\u3002\u6253\u5F00\u7248\u672C\u53D1\u5E03\u5217\u8868",
  "dsh-live-voice.commons.version.title": "\u7248\u672C\u4FE1\u606F",
  "dsh-live-voice.recognition.autoSend.countdownHelp": "\u8BC6\u522B\u51FA\u6700\u7EC8\u8BED\u53E5\u540E\u5F00\u59CB\u5012\u8BA1\u65F6\u3002\u518D\u6B21\u8BF4\u8BDD\u6216\u7F16\u8F91\u6587\u672C\u4F1A\u53D6\u6D88\u5012\u8BA1\u65F6\u3002",
  "dsh-live-voice.recognition.browser.autoInstallPack": "\u9700\u8981\u65F6\u81EA\u52A8\u5B89\u88C5\u6B64\u6D4F\u89C8\u5668\u8BED\u8A00\u5305",
  "dsh-live-voice.recognition.browser.help": "\u4F7F\u7528\u6D4F\u89C8\u5668\u7684 SpeechRecognition API\u3002\u8FD9\u662F\u9ED8\u8BA4\u9009\u9879\u3002",
  "dsh-live-voice.recognition.browser.label": "\u6D4F\u89C8\u5668 SpeechRecognition \u2014 \u9ED8\u8BA4\u9009\u9879",
  "dsh-live-voice.recognition.browser.localProcessing": "\u5728\u6B64\u8BBE\u5907\u4E0A\u672C\u5730\u5904\u7406\u8BED\u97F3\u8BC6\u522B",
  "dsh-live-voice.recognition.browser.microphoneHelp": "\u6D4F\u89C8\u5668 SpeechRecognition \u53EF\u80FD\u4F7F\u7528\u6D4F\u89C8\u5668\u6216\u7CFB\u7EDF\u9ED8\u8BA4\u9EA6\u514B\u98CE\uFF0C\u800C\u975E\u6B64\u5904\u9009\u62E9\u7684\u8BBE\u5907\u3002",
  "dsh-live-voice.recognition.browser.remoteServiceWarning": "\u5DF2\u542F\u7528\u6D4F\u89C8\u5668\u670D\u52A1\u8BED\u97F3\u8BC6\u522B\u3002\u6D4F\u89C8\u5668\u53EF\u80FD\u4F1A\u5C06\u9EA6\u514B\u98CE\u97F3\u9891\u53D1\u9001\u81F3\u5176\u8BED\u97F3\u8BC6\u522B\u670D\u52A1\u3002",
  "dsh-live-voice.recognition.commands.clear": "\u6E05\u7A7A\u6D88\u606F\u8F93\u5165\u6846",
  "dsh-live-voice.recognition.commands.enabled": "\u542F\u7528\u7CBE\u786E\u5339\u914D\u7684\u8BED\u97F3\u547D\u4EE4",
  "dsh-live-voice.recognition.commands.mute": "\u505C\u6B62\u5411\u6D88\u606F\u8F93\u5165\u6846\u8F93\u5165\u8BED\u97F3",
  "dsh-live-voice.recognition.commands.queue": "\u52A0\u5165\u961F\u5217",
  "dsh-live-voice.recognition.commands.resume": "\u6062\u590D\u5411\u6D88\u606F\u8F93\u5165\u6846\u8F93\u5165\u8BED\u97F3",
  "dsh-live-voice.recognition.commands.send": "\u53D1\u9001\u7ED9\u8FD0\u884C\u4E2D\u7684\u667A\u80FD\u4F53",
  "dsh-live-voice.recognition.commands.stopSpeech": "\u505C\u6B62\u52A9\u624B\u6717\u8BFB",
  "dsh-live-voice.recognition.commands.title": "\u8BED\u97F3\u547D\u4EE4",
  "dsh-live-voice.recognition.dictation.cancel": "\u53D6\u6D88\u542C\u5199",
  "dsh-live-voice.recognition.engine.label": "\u8BC6\u522B\u5F15\u64CE",
  "dsh-live-voice.recognition.headphoneMode.help": "\u5F00\u653E\u9EA6\u514B\u98CE\u4F1A\u5728\u64AD\u653E\u56DE\u590D\u65F6\u7EE7\u7EED\u8046\u542C\u3002\u68C0\u6D4B\u5230\u4F60\u8BF4\u8BDD\u65F6\uFF0C\u64AD\u653E\u4F1A\u6682\u505C\uFF0C\u5E76\u4EC5\u5728\u4F60\u9009\u62E9\u6062\u590D\u65F6\u7EE7\u7EED\u3002",
  "dsh-live-voice.recognition.headphoneMode.label": "\u8033\u673A \u2014 \u5F00\u653E\u9EA6\u514B\u98CE",
  "dsh-live-voice.recognition.holdToTalk.enabled": "\u6309\u4F4F Control \u952E\u8BF4\u8BDD",
  "dsh-live-voice.recognition.holdToTalk.help": "\u6D88\u606F\u8F93\u5165\u6846\u6253\u5F00\u65F6\uFF0C\u5728\u9875\u9762\u4EFB\u610F\u4F4D\u7F6E\u6309\u4F4F Control \u952E\u5373\u53EF\u91C7\u96C6\u8BED\u97F3\u3002\u677E\u5F00\u540E\u4F1A\u5904\u7406\u5B8C\u961F\u5217\u4E2D\u7684\u8F6C\u5199\uFF0C\u7B49\u5F85\u8BBE\u5B9A\u7684\u53D1\u9001\u5EF6\u8FDF\uFF0C\u5C06\u6D88\u606F\u52A0\u5165\u961F\u5217\uFF0C\u7136\u540E\u5173\u95ED\u8BED\u97F3\u91C7\u96C6\u3002\u6309\u4F4F\u671F\u95F4\u6309 Escape \u952E\u53EF\u53D6\u6D88\u3002",
  "dsh-live-voice.recognition.language.automatic": "\u81EA\u52A8 \u2014 \u68C0\u6D4B\u8BED\u8A00",
  "dsh-live-voice.recognition.language.label": "\u8BC6\u522B\u8BED\u8A00",
  "dsh-live-voice.recognition.manualSend.help": "\u8BC6\u522B\u51FA\u7684\u6587\u672C\u4F1A\u4FDD\u7559\u5728\u6D88\u606F\u8F93\u5165\u6846\u4E2D\uFF0C\u76F4\u5230\u4F60\u4F7F\u7528 DSH \u7684\u5E38\u89C4\u53D1\u9001\u6309\u94AE\u3002",
  "dsh-live-voice.recognition.maxUtterance.help": "\u5982\u679C\u8BF4\u8BDD\u4E00\u76F4\u6CA1\u6709\u505C\u987F\uFF0C\u5219\u5728\u6B64\u65F6\u957F\u540E\u5F00\u59CB\u65B0\u7684\u8F6C\u5199\u7247\u6BB5\u3002\u9ED8\u8BA4\u503C\uFF1A60 \u79D2\u3002",
  "dsh-live-voice.recognition.maxUtterance.label": "\u6700\u957F\u8FDE\u7EED\u8BED\u97F3\uFF08\u79D2\uFF09",
  "dsh-live-voice.recognition.microphone.checking": "\u6B63\u5728\u68C0\u67E5\u9EA6\u514B\u98CE\u53EF\u7528\u6027",
  "dsh-live-voice.recognition.microphone.device": "\u8F93\u5165\u8BBE\u5907",
  "dsh-live-voice.recognition.microphone.failure": "\u9EA6\u514B\u98CE\uFF1A{reason}",
  "dsh-live-voice.recognition.microphone.ignore": "\u5FFD\u7565\u6D88\u606F\u8F93\u5165\u6846\u7684\u8BED\u97F3\u8F93\u5165",
  "dsh-live-voice.recognition.microphone.inputStatus": "\u9EA6\u514B\u98CE\u8F93\u5165\uFF1A{state}",
  "dsh-live-voice.recognition.microphone.label": "\u9EA6\u514B\u98CE",
  "dsh-live-voice.recognition.microphone.permissionHelp": "\u4EC5\u5728\u4F60\u5F00\u59CB\u542C\u5199\u6216\u8BED\u97F3\u5BF9\u8BDD\u65F6\u624D\u4F1A\u8BF7\u6C42\u9EA6\u514B\u98CE\u6743\u9650\u3002",
  "dsh-live-voice.recognition.microphone.resume": "\u6062\u590D\u8046\u542C",
  "dsh-live-voice.recognition.microphone.starting": "\u6B63\u5728\u542F\u52A8\u9EA6\u514B\u98CE\u2026",
  "dsh-live-voice.recognition.microphone.takeControl": "\u63A5\u7BA1\u9EA6\u514B\u98CE",
  "dsh-live-voice.recognition.minimumWords.enabled": "\u5FFD\u7565\u8FC7\u77ED\u7684\u6700\u7EC8\u8F6C\u5199\u7247\u6BB5",
  "dsh-live-voice.recognition.minimumWords.help": "\u5B57\u8BCD\u6570\u4E0D\u8DB3\u7684\u6700\u7EC8\u8F6C\u5199\u7247\u6BB5\u4F1A\u88AB\u5FFD\u7565\uFF0C\u4E0D\u4F1A\u8FDB\u5165\u6D88\u606F\u8F93\u5165\u6846\u6216\u81EA\u52A8\u53D1\u9001\u6D41\u7A0B\u3002",
  "dsh-live-voice.recognition.minimumWords.label": "\u6BCF\u4E2A\u6700\u7EC8\u7247\u6BB5\u7684\u6700\u5C11\u5B57\u8BCD\u6570",
  "dsh-live-voice.recognition.mode.label": "\u8046\u542C\u6A21\u5F0F",
  "dsh-live-voice.recognition.planned.parakeet": "NVIDIA Parakeet \u2014 \u5373\u5C06\u63A8\u51FA",
  "dsh-live-voice.recognition.planned.sherpa": "sherpa-onnx \u6D41\u5F0F\u8BC6\u522B \u2014 \u5373\u5C06\u63A8\u51FA",
  "dsh-live-voice.recognition.planned.vote": "\u5373\u5C06\u63A8\u51FA \u2014 \u8BF7\u5728\u4ED3\u5E93\u8BAE\u9898\u4E2D\u6295\u7968",
  "dsh-live-voice.recognition.planned.voxtral": "Voxtral Realtime \u2014 \u5373\u5C06\u63A8\u51FA",
  "dsh-live-voice.recognition.planned.webGpu": "\u6D4F\u89C8\u5668 WebGPU \u63A8\u7406 \u2014 \u5373\u5C06\u63A8\u51FA",
  "dsh-live-voice.recognition.presets.long.description": "\u7B49\u5F85\u8F83\u957F\u7684\u601D\u8003\u505C\u987F\u3002",
  "dsh-live-voice.recognition.presets.long.label": "\u957F",
  "dsh-live-voice.recognition.presets.natural.description": "\u5141\u8BB8\u77ED\u8BED\u4E4B\u95F4\u51FA\u73B0\u81EA\u7136\u505C\u987F\u3002",
  "dsh-live-voice.recognition.presets.natural.label": "\u81EA\u7136",
  "dsh-live-voice.recognition.presets.short.description": "\u77ED\u6682\u505C\u987F\u540E\u5FEB\u901F\u53D1\u9001\u3002",
  "dsh-live-voice.recognition.presets.short.label": "\u77ED",
  "dsh-live-voice.recognition.providerSettings.help": "\u670D\u52A1\u63D0\u4F9B\u65B9\u8BBE\u7F6E\u4F1A\u968F\u6240\u9009\u8BC6\u522B\u5F15\u64CE\u800C\u53D8\u5316\u3002",
  "dsh-live-voice.recognition.qwen.captureHelp": "\u97F3\u9891\u4F1A\u6309\u5B8C\u6574\u8BED\u53E5\u5206\u5272\u4E3A WAV \u7247\u6BB5\uFF0C\u5E76\u901A\u8FC7\u7ECF\u8FC7\u8EAB\u4EFD\u9A8C\u8BC1\u7684 DSH \u53D1\u9001\u81F3\u4E3B\u673A\u672C\u5730\u7684 Qwen3 ASR \u6A21\u578B\u3002",
  "dsh-live-voice.recognition.qwen.connectionSuccess": "\u8FDE\u63A5\u6210\u529F\u3002Qwen ASR \u548C TTS \u5747\u5DF2\u52A0\u8F7D\u3002\u672A\u4FDD\u5B58\u7684\u66F4\u6539\u5C1A\u672A\u5E94\u7528\u3002",
  "dsh-live-voice.recognition.qwen.endpointHelp": "HTTP API \u4F4D\u4E8E\u914D\u7F6E\u7684 DSH \u4E3B\u673A URL\uFF08\u9ED8\u8BA4\uFF1Ahttp://127.0.0.1:8080/inference\uFF09\u3002\u97F3\u9891\u901A\u8FC7\u9700\u8981\u8EAB\u4EFD\u9A8C\u8BC1\u7684 DSH \u4E3B\u673A\u8F6C\u5199\u8DEF\u7531\u53D1\u9001\u3002",
  "dsh-live-voice.recognition.qwen.hostHelp": "Qwen3 ASR + TTS \u670D\u52A1\u5668\u7684\u4E3B\u673A\u7EA7\u8BBE\u7F6E\u3002\u8BF7\u8F93\u5165 DSH \u4E3B\u673A\u53EF\u8BBF\u95EE\u7684\u4EFB\u610F HTTP \u6216 HTTPS \u57FA\u7840 URL\u3002\u6D4F\u89C8\u5668\u901A\u8FC7\u9700\u8981\u8EAB\u4EFD\u9A8C\u8BC1\u7684 DSH \u8DEF\u7531\u8BBF\u95EE\u8BE5\u670D\u52A1\u5668\u3002",
  "dsh-live-voice.recognition.qwen.label": "Qwen3 ASR \u2014 HTTP API",
  "dsh-live-voice.recognition.silenceDetection.duration": "\u53D1\u9001\u524D\u505C\u987F\uFF1A{milliseconds} \u6BEB\u79D2",
  "dsh-live-voice.recognition.silenceDetection.help": "\u8BBE\u7F6E\u505C\u987F\u6301\u7EED\u591A\u4E45\u540E\uFF0C\u5C06\u91C7\u96C6\u7684\u8BED\u97F3\u53D1\u9001\u8FDB\u884C\u8BC6\u522B\u3002",
  "dsh-live-voice.recognition.silenceDetection.label": "\u9759\u97F3\u68C0\u6D4B",
  "dsh-live-voice.recognition.silenceDetection.pauseLabel": "\u53D1\u9001\u524D\u505C\u987F",
  "dsh-live-voice.recognition.silenceDetection.title": "\u9759\u97F3\u68C0\u6D4B\u8BBE\u7F6E",
  "dsh-live-voice.recognition.speakerMode.help": "\u95E8\u63A7\u8046\u542C\u4F1A\u5728\u64AD\u653E\u56DE\u590D\u65F6\u91CA\u653E\u9EA6\u514B\u98CE\uFF0C\u9632\u6B62\u626C\u58F0\u5668\u97F3\u9891\u88AB\u8BC6\u522B\u3002\u4F7F\u7528\u201C\u63A5\u7BA1\u9EA6\u514B\u98CE\u201D\u53EF\u6253\u65AD\u64AD\u653E\u3002",
  "dsh-live-voice.recognition.speakerMode.label": "\u626C\u58F0\u5668 \u2014 \u95E8\u63A7\u8046\u542C",
  "dsh-live-voice.recognition.status.answer": "\u6B63\u5728\u8BC6\u522B\u56DE\u7B54\u2026",
  "dsh-live-voice.recognition.status.awaitingAnswer": "\u6B63\u5728\u8046\u542C\u4F60\u7684\u56DE\u7B54\u2026",
  "dsh-live-voice.recognition.status.listening": "\u6B63\u5728\u8046\u542C \u2014 \u7B49\u5F85\u8BED\u97F3",
  "dsh-live-voice.recognition.status.processing": "\u6B63\u5728\u8BC6\u522B\u8BED\u97F3\u2026",
  "dsh-live-voice.recognition.status.unavailable": "\u8BED\u97F3\u8BC6\u522B\u4E0D\u53EF\u7528",
  "dsh-live-voice.recognition.voiceCommands.help": "\u7528\u9017\u53F7\u5206\u9694\u77ED\u8BED\u3002\u5339\u914D\u65F6\u5FFD\u7565\u5927\u5C0F\u5199\u3001\u91CD\u97F3\u7B26\u53F7\u3001\u6807\u70B9\u548C\u591A\u4F59\u7A7A\u683C\u3002\u6574\u4E2A\u6700\u7EC8\u7247\u6BB5\u5FC5\u987B\u5B8C\u5168\u5339\u914D\u3002",
  "dsh-live-voice.recognition.whisper.captureHelp": "\u97F3\u9891\u4F1A\u6309\u5B8C\u6574\u8BED\u53E5\u5206\u5272\u4E3A WAV \u7247\u6BB5\uFF0C\u901A\u8FC7\u7ECF\u8FC7\u8EAB\u4EFD\u9A8C\u8BC1\u7684 DSH \u53D1\u9001\uFF0C\u5E76\u7531\u56DE\u73AF\u5730\u5740\u4E0A\u7684 whisper.cpp HTTP \u670D\u52A1\u5904\u7406\u3002",
  "dsh-live-voice.recognition.whisper.connectionSuccess": "\u8FDE\u63A5\u6210\u529F\u3002\u5065\u5EB7\u68C0\u67E5\u7AEF\u70B9\u5DF2\u54CD\u5E94\uFF1B\u5C1A\u672A\u6D4B\u8BD5\u8F6C\u5199\u529F\u80FD\u3002\u672A\u4FDD\u5B58\u7684\u66F4\u6539\u5C1A\u672A\u5E94\u7528\u3002",
  "dsh-live-voice.recognition.whisper.endpointHelp": "HTTP API \u4F4D\u4E8E\u914D\u7F6E\u7684\u57FA\u7840 URL\uFF08\u9ED8\u8BA4\uFF1Ahttp://127.0.0.1:8080/\uFF09\u3002\u517C\u5BB9 POST /v1/audio/transcriptions\u3002",
  "dsh-live-voice.recognition.whisper.healthFailed": "Whisper \u5065\u5EB7\u68C0\u67E5\u5931\u8D25\u3002",
  "dsh-live-voice.recognition.whisper.label": "Whisper \u2014 HTTP API",
  "dsh-live-voice.recognition.whisper.requestFailed": "Whisper \u8BBE\u7F6E\u8BF7\u6C42\u5931\u8D25\u3002",
  "dsh-live-voice.recognition.whisper.restartRequired": "Whisper \u8BBE\u7F6E\u8DEF\u7531\u5C1A\u672A\u52A0\u8F7D\u3002\u9700\u8981\u6B63\u5E38\u91CD\u542F DSH \u670D\u52A1\u5668\u624D\u80FD\u52A0\u8F7D\u66F4\u65B0\u540E\u7684\u63D2\u4EF6\u8DEF\u7531\uFF1B\u4EC5\u5237\u65B0\u6B64\u9875\u9762\u662F\u4E0D\u591F\u7684\u3002",
  "dsh-live-voice.recognition.whisper.save": "\u4FDD\u5B58 Whisper \u8BBE\u7F6E",
  "dsh-live-voice.recognition.whisper.saved": "\u5DF2\u4FDD\u5B58\u5230 DSH \u4E3B\u673A\u3002\u4E3B\u673A\u4E0A\u6B63\u5728\u8FDB\u884C\u7684\u8F6C\u5199\u8BF7\u6C42\u5DF2\u53D6\u6D88\u3002",
  "dsh-live-voice.recognition.whisper.signInRequired": "\u8BF7\u767B\u5F55 DSH \u4EE5\u7BA1\u7406 Whisper \u8BBE\u7F6E\u3002",
  "dsh-live-voice.settings.autoSend.cancel": "\u53D6\u6D88\u81EA\u52A8\u53D1\u9001",
  "dsh-live-voice.settings.autoSend.countdown": "{remaining} \u540E\u53D1\u9001\u2026",
  "dsh-live-voice.settings.autoSend.delay": "\u9759\u97F3\u540E\u53D1\u9001",
  "dsh-live-voice.settings.close": "\u5173\u95ED\u8BED\u97F3\u8BBE\u7F6E",
  "dsh-live-voice.settings.delivery.label": "\u53D1\u9001\u6A21\u5F0F",
  "dsh-live-voice.settings.delivery.manualLabel": "\u5173\u95ED \u2014 \u5BA1\u9605\u540E\u624B\u52A8\u53D1\u9001",
  "dsh-live-voice.settings.delivery.queueLabel": "\u961F\u5217 \u2014 \u9759\u97F3\u540E\u81EA\u52A8\u52A0\u5165\u961F\u5217",
  "dsh-live-voice.settings.delivery.status": "\u81EA\u52A8\u53D1\u9001\uFF1A{mode}",
  "dsh-live-voice.settings.delivery.steerDescription": "\u53D1\u9001\u7ED9\u8FD0\u884C\u4E2D\u7684\u667A\u80FD\u4F53",
  "dsh-live-voice.settings.delivery.steerLabel": "\u5F15\u5BFC \u2014 \u81EA\u52A8\u53D1\u9001\u7ED9\u8FD0\u884C\u4E2D\u7684\u667A\u80FD\u4F53",
  "dsh-live-voice.settings.delivery.toggle": "\u81EA\u52A8\u53D1\u9001\u6A21\u5F0F",
  "dsh-live-voice.settings.engine.refresh": "\u5237\u65B0\u53EF\u7528\u5F15\u64CE",
  "dsh-live-voice.settings.filters.title": "\u8FC7\u6EE4",
  "dsh-live-voice.settings.tabs.conversation": "\u5BF9\u8BDD",
  "dsh-live-voice.settings.tabs.recognition": "\u8BED\u97F3\u8BC6\u522B",
  "dsh-live-voice.settings.tabs.speak": "\u8BED\u97F3\u5408\u6210",
  "dsh-live-voice.settings.title": "Live Voice \u8BBE\u7F6E",
  "dsh-live-voice.settings.whisper.hostHelp": "\u4E3B\u673A\u7EA7\u8BBE\u7F6E\u3002\u4EC5\u5141\u8BB8\u65E0\u9700\u8EAB\u4EFD\u9A8C\u8BC1\u7684\u56DE\u73AF HTTP URL\uFF08localhost\u3001127.0.0.1\u3001[::1]\uFF09\u3002\u56DE\u73AF\u5730\u5740\u6307 DSH \u4E3B\u673A\uFF0C\u800C\u975E\u6B64\u6D4F\u89C8\u5668\u3002\u6240\u6709\u5065\u5EB7\u68C0\u67E5\u548C\u97F3\u9891\u8BF7\u6C42\u90FD\u901A\u8FC7\u9700\u8981\u8EAB\u4EFD\u9A8C\u8BC1\u7684\u540E\u7AEF\u6267\u884C\u3002",
  "dsh-live-voice.speak.agentContext.enabled": "\u542F\u7528\u4EE3\u7406\u8BED\u97F3\u4E0A\u4E0B\u6587",
  "dsh-live-voice.speak.agentContext.enabledHelp": "\u542F\u7528\u540E\uFF0C\u4E0B\u65B9\u7684\u4E0A\u4E0B\u6587\u4F1A\u544A\u77E5\u4EE3\u7406\u5176\u56DE\u590D\u5C06\u88AB\u6717\u8BFB\u3002",
  "dsh-live-voice.speak.agentContext.help": "\u6B64\u82F1\u6587\u6307\u4EE4\u4EC5\u5728\u8BED\u97F3\u5BF9\u8BDD\u5904\u4E8E\u6D3B\u52A8\u72B6\u6001\u4E14\u542F\u7528\u81EA\u52A8\u6717\u8BFB\u52A9\u624B\u56DE\u590D\u65F6\u53D1\u9001\u7ED9\u4EE3\u7406\u3002",
  "dsh-live-voice.speak.agentContext.label": "\u4EE3\u7406\u8BED\u97F3\u4E0A\u4E0B\u6587",
  "dsh-live-voice.speak.agentContext.restore": "\u6062\u590D\u9ED8\u8BA4\u503C",
  "dsh-live-voice.speak.autoPlayback.enabled": "\u81EA\u52A8\u6717\u8BFB\u65B0\u7684\u52A9\u624B\u6D88\u606F",
  "dsh-live-voice.speak.autoPlayback.help": "\u8BED\u97F3\u5BF9\u8BDD\u671F\u95F4\uFF0C\u52A9\u624B\u7684\u8BED\u53E5\u4F1A\u81EA\u52A8\u6717\u8BFB\u3002\u4F60\u8BF4\u8BDD\u65F6\u4F1A\u7B49\u5F85\uFF0C\u4E0D\u4F1A\u64AD\u653E\u3002",
  "dsh-live-voice.speak.autoPlayback.label": "\u52A9\u624B\u81EA\u52A8\u6717\u8BFB",
  "dsh-live-voice.speak.autoPlayback.remainingOne": "\u52A9\u624B\u81EA\u52A8\u6717\u8BFB\uFF1A{state} \u2014 \u5269\u4F59 {count} \u4E2A\u8BED\u97F3\u7247\u6BB5",
  "dsh-live-voice.speak.autoPlayback.remainingOther": "\u52A9\u624B\u81EA\u52A8\u6717\u8BFB\uFF1A{state} \u2014 \u5269\u4F59 {count} \u4E2A\u8BED\u97F3\u7247\u6BB5",
  "dsh-live-voice.speak.autoPlayback.status": "\u52A9\u624B\u81EA\u52A8\u6717\u8BFB\uFF1A{state}",
  "dsh-live-voice.speak.browser.automaticVoice": "\u81EA\u52A8\u9009\u62E9\u672C\u5730\u8BED\u97F3",
  "dsh-live-voice.speak.browser.label": "\u6D4F\u89C8\u5668\u8BED\u97F3\u5408\u6210 \u2014 \u5728\u6B64\u8BBE\u5907\u64AD\u653E",
  "dsh-live-voice.speak.browser.name": "\u6D4F\u89C8\u5668\u8BED\u97F3\u5408\u6210",
  "dsh-live-voice.speak.browser.outputHelp": "\u6D4F\u89C8\u5668\u8BED\u97F3\u5408\u6210\u53EF\u80FD\u5FFD\u7565\u6240\u9009\u8F93\u51FA\u8BBE\u5907\uFF1B\u6B64\u6D4F\u89C8\u5668 API \u901A\u5E38\u4F7F\u7528\u7CFB\u7EDF\u9ED8\u8BA4\u8BBE\u5907\u3002",
  "dsh-live-voice.speak.browser.voice": "\u6D4F\u89C8\u5668\u672C\u5730\u8BED\u97F3",
  "dsh-live-voice.speak.engine.label": "\u8BED\u97F3\u5408\u6210\u5F15\u64CE",
  "dsh-live-voice.speak.engine.playbackHelp": "Qwen \u548C macOS say \u5728 DSH \u4E3B\u673A\u4E0A\u5408\u6210\u8BED\u97F3\uFF1B\u538B\u7F29\u7684 AAC/M4A \u97F3\u9891\u5728\u6B64\u6D4F\u89C8\u5668\u4E2D\u64AD\u653E\u3002\u6D4F\u89C8\u5668\u8BED\u97F3\u5219\u5728\u6B64\u8BBE\u5907\u4E0A\u5408\u6210\u5E76\u64AD\u653E\u3002",
  "dsh-live-voice.speak.filters.code.enabled": "\u6717\u8BFB\u524D\u8FC7\u6EE4 Markdown \u4EE3\u7801\u5757",
  "dsh-live-voice.speak.filters.code.maxLines": "\u4EC5\u6717\u8BFB\u4E0D\u8D85\u8FC7\u6B64\u884C\u6570\u7684\u4EE3\u7801\u5757",
  "dsh-live-voice.speak.filters.code.notice": "\u8BF7\u67E5\u770B\u6211\u4EEC\u5BF9\u8BDD\u4E2D\u7684\u4EE3\u7801",
  "dsh-live-voice.speak.filters.code.replacement": "\u8F83\u5927\u4EE3\u7801\u5757\u7684\u66FF\u4EE3\u6717\u8BFB\u8BED\u53E5",
  "dsh-live-voice.speak.interruption.disabledHelp": "\u53D1\u9001\u53E6\u4E00\u6761\u6D88\u606F\u4E0D\u4F1A\u505C\u6B62\u4F60\u6B63\u5728\u6536\u542C\u7684\u52A9\u624B\u97F3\u9891\u3002",
  "dsh-live-voice.speak.interruption.enabled": "\u53D1\u9001\u6D88\u606F\u65F6\u505C\u6B62\u52A9\u624B\u6717\u8BFB",
  "dsh-live-voice.speak.interruption.enabledHelp": "\u53D1\u9001\u65B0\u7684\u7528\u6237\u6D88\u606F\u6216\u7528\u65B0\u6D88\u606F\u5F15\u5BFC\u667A\u80FD\u4F53\u65F6\uFF0C\u4F1A\u505C\u6B62\u5F53\u524D\u6B63\u5728\u64AD\u653E\u6216\u5DF2\u6682\u505C\u7684\u52A9\u624B\u8BED\u97F3\u3002",
  "dsh-live-voice.speak.macos.label": "macOS say \u2014 \u5728\u4E3B\u673A\u64AD\u653E",
  "dsh-live-voice.speak.macos.name": "macOS say",
  "dsh-live-voice.speak.macos.outputHelp": "macOS say \u4F7F\u7528 DSH \u4E3B\u673A\u4E0A\u9009\u5B9A\u7684\u8F93\u51FA\u8BBE\u5907\u3002",
  "dsh-live-voice.speak.output.checking": "\u6B63\u5728\u68C0\u67E5\u8BED\u97F3\u8F93\u51FA\u2026",
  "dsh-live-voice.speak.output.device": "\u8F93\u51FA\u8BBE\u5907",
  "dsh-live-voice.speak.output.fallbackName": "\u97F3\u9891\u8F93\u51FA",
  "dsh-live-voice.speak.output.stopTest": "\u505C\u6B62\u8BED\u97F3\u6D4B\u8BD5",
  "dsh-live-voice.speak.output.test": "\u6D4B\u8BD5\u6240\u9009\u8BED\u97F3\u8F93\u51FA",
  "dsh-live-voice.speak.output.testPhrase": "DSH Live Voice\u3002\u6240\u9009\u8BED\u97F3\u8F93\u51FA\u5DE5\u4F5C\u6B63\u5E38\u3002",
  "dsh-live-voice.speak.output.testing": "\u6B63\u5728\u6D4B\u8BD5\u8BED\u97F3\u2026",
  "dsh-live-voice.speak.playback.message": "\u6717\u8BFB\u6D88\u606F",
  "dsh-live-voice.speak.playback.next": "\u8DF3\u81F3\u4E0B\u4E00\u8BED\u97F3\u7247\u6BB5",
  "dsh-live-voice.speak.playback.pause": "\u6682\u505C\u6717\u8BFB",
  "dsh-live-voice.speak.playback.resume": "\u6062\u590D\u6717\u8BFB",
  "dsh-live-voice.speak.playback.stop": "\u505C\u6B62\u6717\u8BFB",
  "dsh-live-voice.speak.playback.stopAll": "\u505C\u6B62\u5168\u90E8\u6717\u8BFB",
  "dsh-live-voice.speak.qwen.connection": "Qwen \u670D\u52A1\u5668\u8FDE\u63A5",
  "dsh-live-voice.speak.qwen.endpoint": "Qwen API \u57FA\u7840 URL",
  "dsh-live-voice.speak.qwen.healthFailed": "Qwen \u5065\u5EB7\u68C0\u67E5\u5931\u8D25\u3002",
  "dsh-live-voice.speak.qwen.label": "Qwen3 TTS \u2014 \u672C\u5730 MLX \u670D\u52A1\u5668",
  "dsh-live-voice.speak.qwen.name": "\u672C\u5730 Qwen3",
  "dsh-live-voice.speak.qwen.requestFailed": "Qwen \u8BBE\u7F6E\u8BF7\u6C42\u5931\u8D25\u3002",
  "dsh-live-voice.speak.qwen.restartRequired": "Qwen \u8BBE\u7F6E\u8DEF\u7531\u5C1A\u672A\u52A0\u8F7D\u3002\u9700\u8981\u6B63\u5E38\u91CD\u542F DSH \u670D\u52A1\u5668\u624D\u80FD\u52A0\u8F7D\u66F4\u65B0\u540E\u7684\u63D2\u4EF6\u8DEF\u7531\uFF1B\u4EC5\u5237\u65B0\u6B64\u9875\u9762\u662F\u4E0D\u591F\u7684\u3002",
  "dsh-live-voice.speak.qwen.save": "\u4FDD\u5B58 Qwen \u8BBE\u7F6E",
  "dsh-live-voice.speak.qwen.saved": "\u5DF2\u4FDD\u5B58\u5230 DSH \u4E3B\u673A\u3002\u6B63\u5728\u8FDB\u884C\u7684 Qwen \u8BF7\u6C42\u5DF2\u53D6\u6D88\u3002",
  "dsh-live-voice.speak.qwen.signInRequired": "\u8BF7\u767B\u5F55 DSH \u4EE5\u7BA1\u7406 Qwen \u8BBE\u7F6E\u3002",
  "dsh-live-voice.speak.qwen.test": "\u6D4B\u8BD5 Qwen \u670D\u52A1\u5668",
  "dsh-live-voice.speak.qwen.voice": "Qwen \u97F3\u8272",
  "dsh-live-voice.speak.qwen.voiceHelp": "\u9ED8\u8BA4\u4F7F\u7528 Aiden\u3002\u8FD9\u4E9B\u9884\u8BBE\u97F3\u8272\u5E76\u975E\u4EE5\u5DF4\u897F\u8461\u8404\u7259\u8BED\u4E3A\u6BCD\u8BED\u7684\u97F3\u8272\u3002",
  "dsh-live-voice.speak.qwen.voices.aiden": "Aiden \u2014 \u7537\u58F0\uFF0C\u7F8E\u5F0F\u82F1\u8BED",
  "dsh-live-voice.speak.qwen.voices.dylan": "Dylan \u2014 \u7537\u58F0\uFF0C\u5317\u4EAC\u8BDD",
  "dsh-live-voice.speak.qwen.voices.eric": "Eric \u2014 \u7537\u58F0\uFF0C\u56DB\u5DDD\u8BDD",
  "dsh-live-voice.speak.qwen.voices.onoAnna": "Ono Anna \u2014 \u5973\u58F0\uFF0C\u65E5\u8BED",
  "dsh-live-voice.speak.qwen.voices.ryan": "Ryan \u2014 \u7537\u58F0\uFF0C\u82F1\u8BED",
  "dsh-live-voice.speak.qwen.voices.serena": "Serena \u2014 \u5973\u58F0\uFF0C\u4E2D\u6587",
  "dsh-live-voice.speak.qwen.voices.sohee": "Sohee \u2014 \u5973\u58F0\uFF0C\u97E9\u8BED",
  "dsh-live-voice.speak.qwen.voices.uncleFu": "Uncle Fu \u2014 \u7537\u58F0\uFF0C\u4E2D\u6587",
  "dsh-live-voice.speak.qwen.voices.vivian": "Vivian \u2014 \u5973\u58F0\uFF0C\u4E2D\u6587",
  "dsh-live-voice.speak.rate.help": "\u76F8\u5BF9\u901F\u5EA6\uFF1A1 \u4E3A\u6B63\u5E38\u901F\u5EA6\u3002",
  "dsh-live-voice.speak.rate.label": "\u8BED\u901F",
  "dsh-live-voice.speak.responseDelay.help": "\u4F60\u505C\u6B62\u8BF4\u8BDD\u540E\uFF0C\u52A9\u624B\u4F1A\u7B49\u5F85\u6B64\u65F6\u957F\u7684\u8FDE\u7EED\u9759\u97F3\uFF0C\u7136\u540E\u81EA\u52A8\u64AD\u653E\u8BED\u97F3\u3002\u518D\u6B21\u8BF4\u8BDD\u4F1A\u91CD\u65B0\u5F00\u59CB\u7B49\u5F85\u3002",
  "dsh-live-voice.speak.responseDelay.label": "\u52A9\u624B\u54CD\u5E94\u5EF6\u8FDF",
  "dsh-live-voice.speak.segmentGap.help": "\u5728\u8FDE\u7EED\u8BED\u97F3\u7247\u6BB5\u4E4B\u95F4\u7B49\u5F85\u6B64\u6BEB\u79D2\u6570\u3002\u9ED8\u8BA4\u503C\u4E3A 200 ms\u3002",
  "dsh-live-voice.speak.segmentGap.label": "\u8BED\u97F3\u7247\u6BB5\u4E4B\u95F4\u7684\u505C\u987F",
  "dsh-live-voice.speak.status.paused": "\u8BED\u97F3\u5DF2\u6682\u505C",
  "dsh-live-voice.speak.status.playing": "\u6B63\u5728\u6717\u8BFB"
};
var zh_default = Object.freeze(zh);

// src/client/i18n/pt-BR.ts
var ptBR = {
  "dsh-live-voice.commons.connection.contactingHost": "Conectando ao host DSH\u2026",
  "dsh-live-voice.commons.connection.endpoint": "URL do endpoint",
  "dsh-live-voice.commons.connection.healthEndpoint": "URL ou caminho de verifica\xE7\xE3o de integridade",
  "dsh-live-voice.commons.connection.reload": "Recarregar configura\xE7\xF5es salvas",
  "dsh-live-voice.commons.connection.test": "Testar conex\xE3o",
  "dsh-live-voice.commons.connection.timeout": "Tempo limite da requisi\xE7\xE3o (ms)",
  "dsh-live-voice.commons.connection.title": "Configura\xE7\xF5es de conex\xE3o",
  "dsh-live-voice.commons.connection.unsaved": "Altera\xE7\xF5es n\xE3o salvas",
  "dsh-live-voice.commons.controls.title": "Controles de voz",
  "dsh-live-voice.commons.conversation.end": "Encerrar conversa por voz",
  "dsh-live-voice.commons.conversation.idle": "Conversa inativa",
  "dsh-live-voice.commons.conversation.start": "Iniciar conversa por voz",
  "dsh-live-voice.commons.delivery.queueBadge": "FILA",
  "dsh-live-voice.commons.device.numberedLabel": "{device} {number}",
  "dsh-live-voice.commons.dismiss": "Dispensar",
  "dsh-live-voice.commons.dismissError": "Dispensar erro de voz",
  "dsh-live-voice.commons.engine.failure": "{engine}: {reason}",
  "dsh-live-voice.commons.input.ignoring": "ignorando",
  "dsh-live-voice.commons.input.ignoringBadge": "IGNORANDO",
  "dsh-live-voice.commons.input.listening": "escutando",
  "dsh-live-voice.commons.input.listeningBadge": "ESCUTANDO",
  "dsh-live-voice.commons.manual": "manual",
  "dsh-live-voice.commons.off": "desativado",
  "dsh-live-voice.commons.on": "ativada",
  "dsh-live-voice.commons.pluginName": "Live Voice",
  "dsh-live-voice.commons.queue": "fila",
  "dsh-live-voice.commons.repository.starLabel": "D\xEA uma estrela no GitHub",
  "dsh-live-voice.commons.repository.starLink": "Dar estrela ao DSH Live Voice no GitHub",
  "dsh-live-voice.commons.seconds": "{seconds} segundos",
  "dsh-live-voice.commons.send": "ENVIAR",
  "dsh-live-voice.commons.status.ready": "Voz pronta",
  "dsh-live-voice.commons.systemDefault": "Padr\xE3o do sistema",
  "dsh-live-voice.commons.toggle.offBadge": "DESATIVADO",
  "dsh-live-voice.commons.unknownLanguage": "idioma desconhecido",
  "dsh-live-voice.commons.update.label": "Atualiza\xE7\xE3o dispon\xEDvel",
  "dsh-live-voice.commons.update.link": "Atualiza\xE7\xE3o dispon\xEDvel: {version}. Abrir lan\xE7amento",
  "dsh-live-voice.commons.update.version": "Atualiza\xE7\xE3o dispon\xEDvel: {version}",
  "dsh-live-voice.commons.version.compatibility": "Compat\xEDvel com DSH v{version}",
  "dsh-live-voice.commons.version.compatibilityLink": "Compat\xEDvel com DSH v{version}. Abrir lan\xE7amento",
  "dsh-live-voice.commons.version.label": "DSH Live Voice v{version}",
  "dsh-live-voice.commons.version.link": "DSH Live Voice v{version}. Abrir vers\xF5es",
  "dsh-live-voice.commons.version.title": "Informa\xE7\xF5es da vers\xE3o",
  "dsh-live-voice.recognition.autoSend.countdownHelp": "A contagem regressiva inicia ap\xF3s a frase final reconhecida. Nova fala ou edi\xE7\xF5es cancelam o envio.",
  "dsh-live-voice.recognition.browser.autoInstallPack": "Instalar automaticamente este pacote de idioma do navegador quando necess\xE1rio",
  "dsh-live-voice.recognition.browser.help": "Usa a API SpeechRecognition do navegador. Esta \xE9 a op\xE7\xE3o padr\xE3o.",
  "dsh-live-voice.recognition.browser.label": "SpeechRecognition do navegador \u2014 Op\xE7\xE3o padr\xE3o",
  "dsh-live-voice.recognition.browser.localProcessing": "Processar reconhecimento localmente neste dispositivo",
  "dsh-live-voice.recognition.browser.microphoneHelp": "O SpeechRecognition do navegador pode usar o microfone padr\xE3o do sistema ou do navegador em vez desta sele\xE7\xE3o.",
  "dsh-live-voice.recognition.browser.remoteServiceWarning": "O reconhecimento pelo servi\xE7o do navegador est\xE1 ativado. O navegador pode enviar o \xE1udio do microfone para o servi\xE7o remoto.",
  "dsh-live-voice.recognition.commands.clear": "Limpar editor de mensagens",
  "dsh-live-voice.recognition.commands.enabled": "Ativar comandos de voz exatos",
  "dsh-live-voice.recognition.commands.mute": "Silenciar entrada do editor de mensagens",
  "dsh-live-voice.recognition.commands.queue": "Adicionar \xE0 fila",
  "dsh-live-voice.recognition.commands.resume": "Retomar entrada do editor de mensagens",
  "dsh-live-voice.recognition.commands.send": "Enviar ao agente em execu\xE7\xE3o",
  "dsh-live-voice.recognition.commands.stopSpeech": "Parar fala do assistente",
  "dsh-live-voice.recognition.commands.title": "Comandos de voz",
  "dsh-live-voice.recognition.dictation.cancel": "Cancelar ditado",
  "dsh-live-voice.recognition.engine.label": "Mecanismo de reconhecimento",
  "dsh-live-voice.recognition.headphoneMode.help": "O microfone aberto continua ouvindo enquanto as respostas s\xE3o reproduzidas. Ao detectar sua fala, a reprodu\xE7\xE3o pausa e s\xF3 continua quando voc\xEA escolher.",
  "dsh-live-voice.recognition.headphoneMode.label": "Fones de ouvido \u2014 microfone aberto",
  "dsh-live-voice.recognition.holdToTalk.enabled": "Segure Control para falar",
  "dsh-live-voice.recognition.holdToTalk.help": "Com o editor aberto, segure Control em qualquer lugar da p\xE1gina para capturar a fala. Solte para concluir as transcri\xE7\xF5es pendentes, aguardar o atraso configurado, enfileirar a mensagem e encerrar a captura. Pressione Escape enquanto segura para cancelar.",
  "dsh-live-voice.recognition.language.automatic": "Autom\xE1tico \u2014 detectar idioma",
  "dsh-live-voice.recognition.language.label": "Idioma de reconhecimento",
  "dsh-live-voice.recognition.manualSend.help": "O texto reconhecido permanece no editor at\xE9 que voc\xEA use o bot\xE3o normal de envio do DSH.",
  "dsh-live-voice.recognition.maxUtterance.help": "Se a fala nunca pausar, inicia um novo trecho de transcri\xE7\xE3o ap\xF3s esta dura\xE7\xE3o. Padr\xE3o: 60 segundos.",
  "dsh-live-voice.recognition.maxUtterance.label": "Fala cont\xEDnua m\xE1xima (segundos)",
  "dsh-live-voice.recognition.microphone.checking": "Verificando disponibilidade do microfone",
  "dsh-live-voice.recognition.microphone.device": "Dispositivo de entrada",
  "dsh-live-voice.recognition.microphone.failure": "Microfone: {reason}",
  "dsh-live-voice.recognition.microphone.ignore": "Ignorar entrada do editor de mensagens",
  "dsh-live-voice.recognition.microphone.inputStatus": "Entrada do microfone: {state}",
  "dsh-live-voice.recognition.microphone.label": "Microfone",
  "dsh-live-voice.recognition.microphone.permissionHelp": "A permiss\xE3o do microfone ser\xE1 solicitada apenas quando voc\xEA iniciar a ditado ou uma conversa por voz.",
  "dsh-live-voice.recognition.microphone.resume": "Retomar escuta",
  "dsh-live-voice.recognition.microphone.starting": "Iniciando microfone\u2026",
  "dsh-live-voice.recognition.microphone.takeControl": "Assumir microfone",
  "dsh-live-voice.recognition.minimumWords.enabled": "Ignorar trechos curtos de transcri\xE7\xE3o final",
  "dsh-live-voice.recognition.minimumWords.help": "Trechos finais com menos palavras s\xE3o ignorados antes de chegarem ao editor ou ao envio autom\xE1tico.",
  "dsh-live-voice.recognition.minimumWords.label": "M\xEDnimo de palavras por trecho final",
  "dsh-live-voice.recognition.mode.label": "Modo de escuta",
  "dsh-live-voice.recognition.planned.parakeet": "NVIDIA Parakeet \u2014 Em breve",
  "dsh-live-voice.recognition.planned.sherpa": "sherpa-onnx Streaming \u2014 Em breve",
  "dsh-live-voice.recognition.planned.vote": "Em breve \u2014 vote nas issues do reposit\xF3rio",
  "dsh-live-voice.recognition.planned.voxtral": "Voxtral Realtime \u2014 Em breve",
  "dsh-live-voice.recognition.planned.webGpu": "Infer\xEAncia WebGPU no navegador \u2014 Em breve",
  "dsh-live-voice.recognition.presets.long.description": "Aguarda durante pausas de pensamento mais longas.",
  "dsh-live-voice.recognition.presets.long.label": "Longa",
  "dsh-live-voice.recognition.presets.natural.description": "Permite pausas normais entre frases.",
  "dsh-live-voice.recognition.presets.natural.label": "Natural",
  "dsh-live-voice.recognition.presets.short.description": "Envia rapidamente ap\xF3s uma pausa curta.",
  "dsh-live-voice.recognition.presets.short.label": "Curta",
  "dsh-live-voice.recognition.providerSettings.help": "As configura\xE7\xF5es do provedor mudam com o mecanismo de reconhecimento selecionado.",
  "dsh-live-voice.recognition.qwen.captureHelp": "O \xE1udio \xE9 segmentado em trechos completos de fala em WAV e enviado pelo DSH autenticado para o modelo Qwen3 ASR local do host.",
  "dsh-live-voice.recognition.qwen.connectionSuccess": "Conex\xE3o bem-sucedida. O Qwen ASR e TTS est\xE3o carregados. Edi\xE7\xF5es n\xE3o salvas n\xE3o foram aplicadas.",
  "dsh-live-voice.recognition.qwen.endpointHelp": "API HTTP na URL configurada do host DSH (padr\xE3o: http://127.0.0.1:8080/inference). O \xE1udio usa a rota de transcri\xE7\xE3o autenticada do host DSH.",
  "dsh-live-voice.recognition.qwen.hostHelp": "Configura\xE7\xF5es de todo o host para o servidor Qwen3 ASR + TTS. Insira qualquer URL base HTTP ou HTTPS acess\xEDvel a partir do host DSH. O navegador acessa atrav\xE9s de rotas autenticadas do DSH.",
  "dsh-live-voice.recognition.qwen.label": "Qwen3 ASR \u2014 API HTTP",
  "dsh-live-voice.recognition.silenceDetection.duration": "Pausa antes de enviar: {milliseconds} ms",
  "dsh-live-voice.recognition.silenceDetection.help": "Controla a dura\xE7\xE3o m\xEDnima da pausa antes de enviar a fala capturada para reconhecimento.",
  "dsh-live-voice.recognition.silenceDetection.label": "Detec\xE7\xE3o de sil\xEAncio",
  "dsh-live-voice.recognition.silenceDetection.pauseLabel": "Pausa antes de enviar",
  "dsh-live-voice.recognition.silenceDetection.title": "Configura\xE7\xF5es de detec\xE7\xE3o de sil\xEAncio",
  "dsh-live-voice.recognition.speakerMode.help": 'A escuta controlada libera o microfone enquanto as respostas s\xE3o reproduzidas, evitando que o som dos alto-falantes seja reconhecido. Use "Assumir microfone" para interromper.',
  "dsh-live-voice.recognition.speakerMode.label": "Alto-falantes \u2014 escuta controlada",
  "dsh-live-voice.recognition.status.answer": "Reconhecendo resposta\u2026",
  "dsh-live-voice.recognition.status.awaitingAnswer": "Ouvindo sua resposta\u2026",
  "dsh-live-voice.recognition.status.listening": "Ouvindo \u2014 aguardando fala",
  "dsh-live-voice.recognition.status.processing": "Reconhecendo fala\u2026",
  "dsh-live-voice.recognition.status.unavailable": "Reconhecimento de voz indispon\xEDvel",
  "dsh-live-voice.recognition.voiceCommands.help": "Separe as frases por v\xEDrgulas. A correspond\xEAncia ignora mai\xFAsculas, acentos, pontua\xE7\xE3o e espa\xE7os extras. Todo o trecho final deve coincidir.",
  "dsh-live-voice.recognition.whisper.captureHelp": "O \xE1udio \xE9 segmentado em trechos completos de fala em WAV, enviado atrav\xE9s do DSH autenticado e processado pelo whisper.cpp HTTP em loopback.",
  "dsh-live-voice.recognition.whisper.connectionSuccess": "Conex\xE3o bem-sucedida. O endpoint de verifica\xE7\xE3o respondeu; a transcri\xE7\xE3o n\xE3o foi testada. Edi\xE7\xF5es n\xE3o salvas n\xE3o foram aplicadas.",
  "dsh-live-voice.recognition.whisper.endpointHelp": "API HTTP na URL base configurada (padr\xE3o: http://127.0.0.1:8080/). Compat\xEDvel com POST /v1/audio/transcriptions.",
  "dsh-live-voice.recognition.whisper.healthFailed": "Falha na verifica\xE7\xE3o de integridade do Whisper.",
  "dsh-live-voice.recognition.whisper.label": "Whisper \u2014 API HTTP",
  "dsh-live-voice.recognition.whisper.requestFailed": "Falha na requisi\xE7\xE3o de configura\xE7\xF5es do Whisper.",
  "dsh-live-voice.recognition.whisper.restartRequired": "As rotas de configura\xE7\xE3o do Whisper n\xE3o est\xE3o carregadas. \xC9 necess\xE1rio reiniciar o servidor DSH normalmente para carregar rotas atualizadas do plugin; atualizar apenas esta p\xE1gina n\xE3o \xE9 suficiente.",
  "dsh-live-voice.recognition.whisper.save": "Salvar configura\xE7\xF5es do Whisper",
  "dsh-live-voice.recognition.whisper.saved": "Salvo no host DSH. Requisi\xE7\xF5es ativas de transcri\xE7\xE3o do host foram canceladas.",
  "dsh-live-voice.recognition.whisper.signInRequired": "Fa\xE7a login no DSH para gerenciar as configura\xE7\xF5es do Whisper.",
  "dsh-live-voice.settings.autoSend.cancel": "Cancelar envio autom\xE1tico",
  "dsh-live-voice.settings.autoSend.countdown": "Enviando em {remaining}\u2026",
  "dsh-live-voice.settings.autoSend.delay": "Enviar ap\xF3s o sil\xEAncio",
  "dsh-live-voice.settings.close": "Fechar configura\xE7\xF5es de voz",
  "dsh-live-voice.settings.delivery.label": "Modo de envio",
  "dsh-live-voice.settings.delivery.manualLabel": "Desativado \u2014 revisar e enviar manualmente",
  "dsh-live-voice.settings.delivery.queueLabel": "Fila \u2014 adicionar automaticamente ap\xF3s o sil\xEAncio",
  "dsh-live-voice.settings.delivery.status": "Entrega autom\xE1tica: {mode}",
  "dsh-live-voice.settings.delivery.steerDescription": "enviar ao agente em execu\xE7\xE3o",
  "dsh-live-voice.settings.delivery.steerLabel": "Enviar \u2014 encaminhar automaticamente ao agente em execu\xE7\xE3o",
  "dsh-live-voice.settings.delivery.toggle": "Modo de entrega autom\xE1tica",
  "dsh-live-voice.settings.engine.refresh": "Atualizar mecanismos dispon\xEDveis",
  "dsh-live-voice.settings.filters.title": "Filtragem",
  "dsh-live-voice.settings.tabs.conversation": "Conversa",
  "dsh-live-voice.settings.tabs.recognition": "Reconhecimento de voz",
  "dsh-live-voice.settings.tabs.speak": "Fala",
  "dsh-live-voice.settings.title": "Configura\xE7\xF5es do Live Voice",
  "dsh-live-voice.settings.whisper.hostHelp": "Configura\xE7\xF5es para todo o host. Apenas URLs HTTP loopback n\xE3o autenticadas (localhost, 127.0.0.1, [::1]) s\xE3o permitidas. Loopback refere-se ao host DSH, n\xE3o a este navegador. Todas as verifica\xE7\xF5es de integridade e requisi\xE7\xF5es de \xE1udio passam pelo backend autenticado.",
  "dsh-live-voice.speak.agentContext.enabled": "Ativar contexto de voz do agente",
  "dsh-live-voice.speak.agentContext.enabledHelp": "Quando ativado, o contexto abaixo informa ao agente que suas respostas ser\xE3o faladas em voz alta.",
  "dsh-live-voice.speak.agentContext.help": "Esta instru\xE7\xE3o em ingl\xEAs \xE9 enviada ao agente somente durante uma conversa por voz ativa com fala autom\xE1tica do assistente ativada.",
  "dsh-live-voice.speak.agentContext.label": "Contexto de voz do agente",
  "dsh-live-voice.speak.agentContext.restore": "Restaurar padr\xE3o",
  "dsh-live-voice.speak.autoPlayback.enabled": "Falar automaticamente novas mensagens do assistente",
  "dsh-live-voice.speak.autoPlayback.help": "Durante uma conversa por voz, as frases do assistente s\xE3o anunciadas automaticamente. A reprodu\xE7\xE3o aguarda enquanto voc\xEA fala.",
  "dsh-live-voice.speak.autoPlayback.label": "Fala autom\xE1tica do assistente",
  "dsh-live-voice.speak.autoPlayback.remainingOne": "Fala autom\xE1tica do assistente: {state} \u2014 resta {count} segmento de fala",
  "dsh-live-voice.speak.autoPlayback.remainingOther": "Fala autom\xE1tica do assistente: {state} \u2014 restam {count} segmentos de fala",
  "dsh-live-voice.speak.autoPlayback.status": "Fala autom\xE1tica do assistente: {state}",
  "dsh-live-voice.speak.browser.automaticVoice": "Voz local autom\xE1tica",
  "dsh-live-voice.speak.browser.label": "Fala do navegador \u2014 \xE1udio neste dispositivo",
  "dsh-live-voice.speak.browser.name": "Fala do navegador",
  "dsh-live-voice.speak.browser.outputHelp": "A s\xEDntese de fala do navegador pode ignorar o dispositivo de sa\xEDda selecionado; esta API normalmente segue o padr\xE3o do sistema.",
  "dsh-live-voice.speak.browser.voice": "Voz local do navegador",
  "dsh-live-voice.speak.engine.label": "Mecanismo de fala",
  "dsh-live-voice.speak.engine.playbackHelp": "Qwen e macOS say sintetizam no host do DSH; o \xE1udio AAC/M4A compacto \xE9 reproduzido neste navegador. A fala do navegador \xE9 sintetizada e reproduzida neste dispositivo.",
  "dsh-live-voice.speak.filters.code.enabled": "Filtrar blocos de c\xF3digo Markdown antes de falar",
  "dsh-live-voice.speak.filters.code.maxLines": "Ler blocos de c\xF3digo at\xE9 esta quantidade de linhas",
  "dsh-live-voice.speak.filters.code.notice": "Veja o c\xF3digo na nossa conversa",
  "dsh-live-voice.speak.filters.code.replacement": "Frase substituta para blocos de c\xF3digo maiores",
  "dsh-live-voice.speak.interruption.disabledHelp": "Enviar outra mensagem n\xE3o interrompe o \xE1udio do assistente que voc\xEA j\xE1 est\xE1 ouvindo.",
  "dsh-live-voice.speak.interruption.enabled": "Parar fala do assistente quando eu enviar uma mensagem",
  "dsh-live-voice.speak.interruption.enabledHelp": "Enviar ou direcionar uma nova mensagem interrompe a fala atual ou pausada do assistente.",
  "dsh-live-voice.speak.macos.label": "macOS say \u2014 \xE1udio no host",
  "dsh-live-voice.speak.macos.name": "macOS say",
  "dsh-live-voice.speak.macos.outputHelp": "O macOS say usa a sa\xEDda selecionada no host DSH.",
  "dsh-live-voice.speak.output.checking": "Verificando sa\xEDda de fala\u2026",
  "dsh-live-voice.speak.output.device": "Dispositivo de sa\xEDda",
  "dsh-live-voice.speak.output.fallbackName": "Sa\xEDda de \xE1udio",
  "dsh-live-voice.speak.output.stopTest": "Parar teste de fala",
  "dsh-live-voice.speak.output.test": "Testar sa\xEDda de fala selecionada",
  "dsh-live-voice.speak.output.testPhrase": "DSH Live Voice. A sa\xEDda de fala selecionada est\xE1 funcionando.",
  "dsh-live-voice.speak.output.testing": "Testando fala\u2026",
  "dsh-live-voice.speak.playback.message": "Falar mensagem",
  "dsh-live-voice.speak.playback.next": "Pular para o pr\xF3ximo trecho de fala",
  "dsh-live-voice.speak.playback.pause": "Pausar fala",
  "dsh-live-voice.speak.playback.resume": "Retomar fala",
  "dsh-live-voice.speak.playback.stop": "Parar de falar",
  "dsh-live-voice.speak.playback.stopAll": "Parar toda a fala",
  "dsh-live-voice.speak.qwen.connection": "Conex\xE3o com servidor Qwen",
  "dsh-live-voice.speak.qwen.endpoint": "URL base da API Qwen",
  "dsh-live-voice.speak.qwen.healthFailed": "Falha na verifica\xE7\xE3o de integridade do Qwen.",
  "dsh-live-voice.speak.qwen.label": "Qwen3 TTS \u2014 servidor MLX local",
  "dsh-live-voice.speak.qwen.name": "Qwen3 local",
  "dsh-live-voice.speak.qwen.requestFailed": "Falha na requisi\xE7\xE3o de configura\xE7\xF5es do Qwen.",
  "dsh-live-voice.speak.qwen.restartRequired": "As rotas de configura\xE7\xE3o do Qwen n\xE3o est\xE3o carregadas. \xC9 necess\xE1rio reiniciar o servidor DSH normalmente para carregar rotas atualizadas do plugin; atualizar apenas esta p\xE1gina n\xE3o \xE9 suficiente.",
  "dsh-live-voice.speak.qwen.save": "Salvar configura\xE7\xF5es do Qwen",
  "dsh-live-voice.speak.qwen.saved": "Salvo no host DSH. Requisi\xE7\xF5es ativas do Qwen foram canceladas.",
  "dsh-live-voice.speak.qwen.signInRequired": "Fa\xE7a login no DSH para gerenciar as configura\xE7\xF5es do Qwen.",
  "dsh-live-voice.speak.qwen.test": "Testar servidor Qwen",
  "dsh-live-voice.speak.qwen.voice": "Voz Qwen",
  "dsh-live-voice.speak.qwen.voiceHelp": "Aiden \xE9 usado por padr\xE3o. Estas vozes predefinidas n\xE3o s\xE3o vozes nativas em Portugu\xEAs do Brasil.",
  "dsh-live-voice.speak.qwen.voices.aiden": "Aiden \u2014 masculino, ingl\xEAs americano",
  "dsh-live-voice.speak.qwen.voices.dylan": "Dylan \u2014 masculino, chin\xEAs de Pequim",
  "dsh-live-voice.speak.qwen.voices.eric": "Eric \u2014 masculino, chin\xEAs de Sichuan",
  "dsh-live-voice.speak.qwen.voices.onoAnna": "Ono Anna \u2014 feminino, japon\xEAs",
  "dsh-live-voice.speak.qwen.voices.ryan": "Ryan \u2014 masculino, ingl\xEAs",
  "dsh-live-voice.speak.qwen.voices.serena": "Serena \u2014 feminino, chin\xEAs",
  "dsh-live-voice.speak.qwen.voices.sohee": "Sohee \u2014 feminino, coreano",
  "dsh-live-voice.speak.qwen.voices.uncleFu": "Uncle Fu \u2014 masculino, chin\xEAs",
  "dsh-live-voice.speak.qwen.voices.vivian": "Vivian \u2014 feminino, chin\xEAs",
  "dsh-live-voice.speak.rate.help": "A velocidade relativa 1 \xE9 normal.",
  "dsh-live-voice.speak.rate.label": "Velocidade da fala",
  "dsh-live-voice.speak.responseDelay.help": "Depois que voc\xEA parar de falar, a reprodu\xE7\xE3o autom\xE1tica do assistente aguardar\xE1 esse tempo de sil\xEAncio cont\xEDnuo. Falar novamente reinicia a contagem.",
  "dsh-live-voice.speak.responseDelay.label": "Atraso da resposta do assistente",
  "dsh-live-voice.speak.segmentGap.help": "Aguarde esta quantidade de milissegundos entre trechos falados consecutivos. O padr\xE3o \xE9 200 ms.",
  "dsh-live-voice.speak.segmentGap.label": "Pausa entre trechos de fala",
  "dsh-live-voice.speak.status.paused": "Fala pausada",
  "dsh-live-voice.speak.status.playing": "Falando"
};
var pt_BR_default = Object.freeze(ptBR);

// src/client/i18n/fr.ts
var fr = {
  "dsh-live-voice.commons.connection.contactingHost": "Connexion \xE0 l\u2019h\xF4te DSH\u2026",
  "dsh-live-voice.commons.connection.endpoint": "URL du point d\u2019acc\xE8s",
  "dsh-live-voice.commons.connection.healthEndpoint": "URL ou chemin de v\xE9rification de l\u2019\xE9tat",
  "dsh-live-voice.commons.connection.reload": "Recharger les param\xE8tres enregistr\xE9s",
  "dsh-live-voice.commons.connection.test": "Tester la connexion",
  "dsh-live-voice.commons.connection.timeout": "D\xE9lai d\u2019expiration des requ\xEAtes (ms)",
  "dsh-live-voice.commons.connection.title": "Param\xE8tres de connexion",
  "dsh-live-voice.commons.connection.unsaved": "Modifications non enregistr\xE9es",
  "dsh-live-voice.commons.controls.title": "Contr\xF4les vocaux",
  "dsh-live-voice.commons.conversation.end": "Terminer la conversation vocale",
  "dsh-live-voice.commons.conversation.idle": "Conversation inactive",
  "dsh-live-voice.commons.conversation.start": "D\xE9marrer une conversation vocale",
  "dsh-live-voice.commons.delivery.queueBadge": "FILE",
  "dsh-live-voice.commons.device.numberedLabel": "{device} {number}",
  "dsh-live-voice.commons.dismiss": "Fermer",
  "dsh-live-voice.commons.dismissError": "Masquer l\u2019erreur vocale",
  "dsh-live-voice.commons.engine.failure": "{engine} : {reason}",
  "dsh-live-voice.commons.input.ignoring": "entr\xE9e ignor\xE9e",
  "dsh-live-voice.commons.input.ignoringBadge": "ENTR\xC9E IGNOR\xC9E",
  "dsh-live-voice.commons.input.listening": "\xE0 l\u2019\xE9coute",
  "dsh-live-voice.commons.input.listeningBadge": "\xC0 L\u2019\xC9COUTE",
  "dsh-live-voice.commons.manual": "manuel",
  "dsh-live-voice.commons.off": "d\xE9sactiv\xE9",
  "dsh-live-voice.commons.on": "activ\xE9",
  "dsh-live-voice.commons.pluginName": "Live Voice",
  "dsh-live-voice.commons.queue": "file d\u2019attente",
  "dsh-live-voice.commons.repository.starLabel": "Soutenez-nous avec une \xE9toile sur GitHub",
  "dsh-live-voice.commons.repository.starLink": "Attribuer une \xE9toile \xE0 DSH Live Voice sur GitHub",
  "dsh-live-voice.commons.seconds": "{seconds} secondes",
  "dsh-live-voice.commons.send": "ENVOYER",
  "dsh-live-voice.commons.status.ready": "Fonctions vocales pr\xEAtes",
  "dsh-live-voice.commons.systemDefault": "Valeur par d\xE9faut du syst\xE8me",
  "dsh-live-voice.commons.toggle.offBadge": "D\xC9SACTIV\xC9",
  "dsh-live-voice.commons.unknownLanguage": "langue inconnue",
  "dsh-live-voice.commons.update.label": "Mise \xE0 jour disponible",
  "dsh-live-voice.commons.update.link": "Mise \xE0 jour disponible : {version}. Ouvrir la page de cette version",
  "dsh-live-voice.commons.update.version": "Mise \xE0 jour disponible : {version}",
  "dsh-live-voice.commons.version.compatibility": "Compatible avec DSH v{version}",
  "dsh-live-voice.commons.version.compatibilityLink": "Compatible avec DSH v{version}. Ouvrir la page de cette version",
  "dsh-live-voice.commons.version.label": "DSH Live Voice v{version}",
  "dsh-live-voice.commons.version.link": "DSH Live Voice v{version}. Ouvrir la liste des versions",
  "dsh-live-voice.commons.version.title": "Informations de version",
  "dsh-live-voice.recognition.autoSend.countdownHelp": "Le compte \xE0 rebours d\xE9marre apr\xE8s la reconnaissance d\xE9finitive d\u2019une phrase. Toute nouvelle parole ou modification l\u2019annule.",
  "dsh-live-voice.recognition.browser.autoInstallPack": "Installer automatiquement ce pack linguistique du navigateur si n\xE9cessaire",
  "dsh-live-voice.recognition.browser.help": "Utilise l\u2019API SpeechRecognition du navigateur. Il s\u2019agit de l\u2019option par d\xE9faut.",
  "dsh-live-voice.recognition.browser.label": "SpeechRecognition du navigateur \u2014 Option par d\xE9faut",
  "dsh-live-voice.recognition.browser.localProcessing": "Effectuer la reconnaissance localement sur cet appareil",
  "dsh-live-voice.recognition.browser.microphoneHelp": "SpeechRecognition peut utiliser le microphone par d\xE9faut du navigateur ou du syst\xE8me plut\xF4t que celui s\xE9lectionn\xE9 ici.",
  "dsh-live-voice.recognition.browser.remoteServiceWarning": "La reconnaissance via le service du navigateur est activ\xE9e. Le navigateur peut envoyer le son du microphone \xE0 son service de reconnaissance.",
  "dsh-live-voice.recognition.commands.clear": "Vider la zone de r\xE9daction",
  "dsh-live-voice.recognition.commands.enabled": "Activer les commandes vocales par correspondance exacte",
  "dsh-live-voice.recognition.commands.mute": "Suspendre la saisie vocale dans la zone de r\xE9daction",
  "dsh-live-voice.recognition.commands.queue": "Mettre en file d\u2019attente",
  "dsh-live-voice.recognition.commands.resume": "Reprendre la saisie vocale dans la zone de r\xE9daction",
  "dsh-live-voice.recognition.commands.send": "Envoyer \xE0 l\u2019agent en cours d\u2019ex\xE9cution",
  "dsh-live-voice.recognition.commands.stopSpeech": "Arr\xEAter la lecture vocale de l\u2019assistant",
  "dsh-live-voice.recognition.commands.title": "Commandes vocales",
  "dsh-live-voice.recognition.dictation.cancel": "Annuler la dict\xE9e",
  "dsh-live-voice.recognition.engine.label": "Moteur de reconnaissance",
  "dsh-live-voice.recognition.headphoneMode.help": "Le microphone ouvert continue d\u2019\xE9couter pendant la lecture des r\xE9ponses. Lorsque votre voix est d\xE9tect\xE9e, la lecture se met en pause et ne reprend que lorsque vous le d\xE9cidez.",
  "dsh-live-voice.recognition.headphoneMode.label": "Casque \u2014 microphone ouvert",
  "dsh-live-voice.recognition.holdToTalk.enabled": "Maintenir Ctrl pour parler",
  "dsh-live-voice.recognition.holdToTalk.help": "Lorsqu\u2019une zone de r\xE9daction est ouverte, maintenez Ctrl n\u2019importe o\xF9 sur la page pour capturer votre voix. Rel\xE2chez la touche pour traiter la transcription en attente, attendre le d\xE9lai d\u2019envoi configur\xE9, mettre le message en file d\u2019attente et arr\xEAter la capture vocale. Appuyez sur \xC9chap tout en maintenant Ctrl pour annuler.",
  "dsh-live-voice.recognition.language.automatic": "Automatique \u2014 d\xE9tecter la langue",
  "dsh-live-voice.recognition.language.label": "Langue de reconnaissance",
  "dsh-live-voice.recognition.manualSend.help": "Le texte reconnu reste dans la zone de r\xE9daction jusqu\u2019\xE0 ce que vous utilisiez le bouton d\u2019envoi habituel de DSH.",
  "dsh-live-voice.recognition.maxUtterance.help": "Si vous parlez sans pause, un nouveau segment de transcription commence apr\xE8s cette dur\xE9e. Valeur par d\xE9faut : 60 secondes.",
  "dsh-live-voice.recognition.maxUtterance.label": "Dur\xE9e maximale de parole continue (secondes)",
  "dsh-live-voice.recognition.microphone.checking": "V\xE9rification de la disponibilit\xE9 du microphone",
  "dsh-live-voice.recognition.microphone.device": "P\xE9riph\xE9rique d\u2019entr\xE9e",
  "dsh-live-voice.recognition.microphone.failure": "Microphone : {reason}",
  "dsh-live-voice.recognition.microphone.ignore": "Ignorer la saisie vocale dans la zone de r\xE9daction",
  "dsh-live-voice.recognition.microphone.inputStatus": "Entr\xE9e du microphone : {state}",
  "dsh-live-voice.recognition.microphone.label": "Microphone",
  "dsh-live-voice.recognition.microphone.permissionHelp": "L\u2019autorisation d\u2019utiliser le microphone ne sera demand\xE9e que lorsque vous d\xE9marrerez une dict\xE9e ou une conversation vocale.",
  "dsh-live-voice.recognition.microphone.resume": "Reprendre l\u2019\xE9coute",
  "dsh-live-voice.recognition.microphone.starting": "D\xE9marrage du microphone\u2026",
  "dsh-live-voice.recognition.microphone.takeControl": "Prendre le contr\xF4le du microphone",
  "dsh-live-voice.recognition.minimumWords.enabled": "Ignorer les segments d\xE9finitifs de transcription trop courts",
  "dsh-live-voice.recognition.minimumWords.help": "Les segments d\xE9finitifs contenant moins de mots sont ignor\xE9s avant d\u2019atteindre la zone de r\xE9daction ou l\u2019envoi automatique.",
  "dsh-live-voice.recognition.minimumWords.label": "Nombre minimal de mots par segment d\xE9finitif",
  "dsh-live-voice.recognition.mode.label": "Mode d\u2019\xE9coute",
  "dsh-live-voice.recognition.planned.parakeet": "NVIDIA Parakeet \u2014 Bient\xF4t disponible",
  "dsh-live-voice.recognition.planned.sherpa": "sherpa-onnx en continu \u2014 Bient\xF4t disponible",
  "dsh-live-voice.recognition.planned.vote": "Bient\xF4t disponible \u2014 votez dans les tickets du d\xE9p\xF4t",
  "dsh-live-voice.recognition.planned.voxtral": "Voxtral Realtime \u2014 Bient\xF4t disponible",
  "dsh-live-voice.recognition.planned.webGpu": "Inf\xE9rence WebGPU dans le navigateur \u2014 Bient\xF4t disponible",
  "dsh-live-voice.recognition.presets.long.description": "Attend pendant les pauses de r\xE9flexion plus longues.",
  "dsh-live-voice.recognition.presets.long.label": "Longue",
  "dsh-live-voice.recognition.presets.natural.description": "Autorise des pauses normales entre les phrases.",
  "dsh-live-voice.recognition.presets.natural.label": "Naturelle",
  "dsh-live-voice.recognition.presets.short.description": "Envoie rapidement apr\xE8s une courte pause.",
  "dsh-live-voice.recognition.presets.short.label": "Courte",
  "dsh-live-voice.recognition.providerSettings.help": "Les param\xE8tres du fournisseur d\xE9pendent du moteur de reconnaissance s\xE9lectionn\xE9.",
  "dsh-live-voice.recognition.qwen.captureHelp": "Le son est d\xE9coup\xE9 en \xE9nonc\xE9s complets au format WAV, puis envoy\xE9 via DSH avec authentification au mod\xE8le Qwen3 ASR ex\xE9cut\xE9 localement sur l\u2019h\xF4te.",
  "dsh-live-voice.recognition.qwen.connectionSuccess": "Connexion r\xE9ussie. Qwen ASR et TTS sont tous deux charg\xE9s. Les modifications non enregistr\xE9es n\u2019ont pas \xE9t\xE9 appliqu\xE9es.",
  "dsh-live-voice.recognition.qwen.endpointHelp": "API HTTP \xE0 l\u2019URL configur\xE9e sur l\u2019h\xF4te DSH (par d\xE9faut : http://127.0.0.1:8080/inference). Le son passe par la route de transcription authentifi\xE9e de l\u2019h\xF4te DSH.",
  "dsh-live-voice.recognition.qwen.hostHelp": "Param\xE8tres communs \xE0 tout l\u2019h\xF4te pour le serveur Qwen3 ASR + TTS. Saisissez une URL de base HTTP ou HTTPS accessible depuis l\u2019h\xF4te DSH. Le navigateur y acc\xE8de via les routes authentifi\xE9es de DSH.",
  "dsh-live-voice.recognition.qwen.label": "Qwen3 ASR \u2014 API HTTP",
  "dsh-live-voice.recognition.silenceDetection.duration": "Pause avant l\u2019envoi : {milliseconds} ms",
  "dsh-live-voice.recognition.silenceDetection.help": "D\xE9termine la dur\xE9e de pause n\xE9cessaire avant que la parole captur\xE9e soit envoy\xE9e pour reconnaissance.",
  "dsh-live-voice.recognition.silenceDetection.label": "D\xE9tection du silence",
  "dsh-live-voice.recognition.silenceDetection.pauseLabel": "Pause avant l\u2019envoi",
  "dsh-live-voice.recognition.silenceDetection.title": "Param\xE8tres de d\xE9tection du silence",
  "dsh-live-voice.recognition.speakerMode.help": "L\u2019\xE9coute contr\xF4l\xE9e lib\xE8re le microphone pendant la lecture des r\xE9ponses pour \xE9viter que le son des haut-parleurs soit reconnu. Utilisez \xAB Prendre le contr\xF4le du microphone \xBB pour interrompre la lecture.",
  "dsh-live-voice.recognition.speakerMode.label": "Haut-parleurs \u2014 \xE9coute contr\xF4l\xE9e",
  "dsh-live-voice.recognition.status.answer": "Reconnaissance de la r\xE9ponse\u2026",
  "dsh-live-voice.recognition.status.awaitingAnswer": "\xC9coute de votre r\xE9ponse\u2026",
  "dsh-live-voice.recognition.status.listening": "\xC9coute \u2014 en attente de parole",
  "dsh-live-voice.recognition.status.processing": "Reconnaissance vocale\u2026",
  "dsh-live-voice.recognition.status.unavailable": "Reconnaissance vocale indisponible",
  "dsh-live-voice.recognition.voiceCommands.help": "S\xE9parez les expressions par des virgules. La comparaison ignore la casse, les accents, la ponctuation et les espaces superflus. Le segment d\xE9finitif entier doit correspondre.",
  "dsh-live-voice.recognition.whisper.captureHelp": "Le son est d\xE9coup\xE9 en \xE9nonc\xE9s complets au format WAV, transmis via DSH avec authentification, puis trait\xE9 par le serveur HTTP whisper.cpp sur l\u2019interface de bouclage.",
  "dsh-live-voice.recognition.whisper.connectionSuccess": "Connexion r\xE9ussie. Le point d\u2019acc\xE8s de v\xE9rification de l\u2019\xE9tat a r\xE9pondu ; la transcription n\u2019a pas \xE9t\xE9 test\xE9e. Les modifications non enregistr\xE9es n\u2019ont pas \xE9t\xE9 appliqu\xE9es.",
  "dsh-live-voice.recognition.whisper.endpointHelp": "API HTTP \xE0 l\u2019URL de base configur\xE9e (par d\xE9faut : http://127.0.0.1:8080/). Compatible avec POST /v1/audio/transcriptions.",
  "dsh-live-voice.recognition.whisper.healthFailed": "La v\xE9rification de l\u2019\xE9tat de Whisper a \xE9chou\xE9.",
  "dsh-live-voice.recognition.whisper.label": "Whisper \u2014 API HTTP",
  "dsh-live-voice.recognition.whisper.requestFailed": "La requ\xEAte relative aux param\xE8tres de Whisper a \xE9chou\xE9.",
  "dsh-live-voice.recognition.whisper.restartRequired": "Les routes de configuration de Whisper ne sont pas charg\xE9es. Un red\xE9marrage normal du serveur DSH est n\xE9cessaire pour charger les routes mises \xE0 jour du plugin ; actualiser cette page ne suffit pas.",
  "dsh-live-voice.recognition.whisper.save": "Enregistrer les param\xE8tres de Whisper",
  "dsh-live-voice.recognition.whisper.saved": "Enregistr\xE9 sur l\u2019h\xF4te DSH. Les requ\xEAtes de transcription actives sur l\u2019h\xF4te ont \xE9t\xE9 annul\xE9es.",
  "dsh-live-voice.recognition.whisper.signInRequired": "Connectez-vous \xE0 DSH pour g\xE9rer les param\xE8tres de Whisper.",
  "dsh-live-voice.settings.autoSend.cancel": "Annuler l\u2019envoi automatique",
  "dsh-live-voice.settings.autoSend.countdown": "Envoi dans {remaining}\u2026",
  "dsh-live-voice.settings.autoSend.delay": "Envoyer apr\xE8s le silence",
  "dsh-live-voice.settings.close": "Fermer les param\xE8tres vocaux",
  "dsh-live-voice.settings.delivery.label": "Mode d\u2019envoi",
  "dsh-live-voice.settings.delivery.manualLabel": "D\xE9sactiv\xE9 \u2014 v\xE9rifier et envoyer manuellement",
  "dsh-live-voice.settings.delivery.queueLabel": "File d\u2019attente \u2014 ajout automatique apr\xE8s un silence",
  "dsh-live-voice.settings.delivery.status": "Envoi automatique : {mode}",
  "dsh-live-voice.settings.delivery.steerDescription": "envoyer \xE0 l\u2019agent en cours d\u2019ex\xE9cution",
  "dsh-live-voice.settings.delivery.steerLabel": "R\xE9orienter \u2014 envoyer automatiquement \xE0 l\u2019agent en cours d\u2019ex\xE9cution",
  "dsh-live-voice.settings.delivery.toggle": "Mode d\u2019envoi automatique",
  "dsh-live-voice.settings.engine.refresh": "Actualiser les moteurs disponibles",
  "dsh-live-voice.settings.filters.title": "Filtrage",
  "dsh-live-voice.settings.tabs.conversation": "Conversation",
  "dsh-live-voice.settings.tabs.recognition": "Reconnaissance vocale",
  "dsh-live-voice.settings.tabs.speak": "Synth\xE8se vocale",
  "dsh-live-voice.settings.title": "Param\xE8tres de Live Voice",
  "dsh-live-voice.settings.whisper.hostHelp": "Param\xE8tres communs \xE0 tout l\u2019h\xF4te. Seules les URL HTTP sans authentification sur l\u2019interface de bouclage (localhost, 127.0.0.1, [::1]) sont autoris\xE9es. Le bouclage d\xE9signe l\u2019h\xF4te DSH, pas ce navigateur. Toutes les v\xE9rifications d\u2019\xE9tat et requ\xEAtes audio passent par le serveur avec authentification.",
  "dsh-live-voice.speak.agentContext.enabled": "Activer le contexte vocal de l\u2019agent",
  "dsh-live-voice.speak.agentContext.enabledHelp": "Lorsqu\u2019il est activ\xE9, le contexte ci-dessous indique \xE0 l\u2019agent que ses r\xE9ponses seront lues \xE0 voix haute.",
  "dsh-live-voice.speak.agentContext.help": "Cette instruction en anglais est envoy\xE9e \xE0 l\u2019agent seulement pendant une conversation vocale active avec la parole automatique de l\u2019assistant activ\xE9e.",
  "dsh-live-voice.speak.agentContext.label": "Contexte vocal de l\u2019agent",
  "dsh-live-voice.speak.agentContext.restore": "Restaurer la valeur par d\xE9faut",
  "dsh-live-voice.speak.autoPlayback.enabled": "Lire automatiquement les nouveaux messages de l\u2019assistant",
  "dsh-live-voice.speak.autoPlayback.help": "Pendant une conversation vocale, les phrases de l\u2019assistant sont lues automatiquement. La lecture attend pendant que vous parlez.",
  "dsh-live-voice.speak.autoPlayback.label": "Lecture automatique de l\u2019assistant",
  "dsh-live-voice.speak.autoPlayback.remainingOne": "Lecture automatique de l\u2019assistant : {state} \u2014 {count} segment vocal restant",
  "dsh-live-voice.speak.autoPlayback.remainingOther": "Lecture automatique de l\u2019assistant : {state} \u2014 {count} segments vocaux restants",
  "dsh-live-voice.speak.autoPlayback.status": "Lecture automatique de l\u2019assistant : {state}",
  "dsh-live-voice.speak.browser.automaticVoice": "Voix locale automatique",
  "dsh-live-voice.speak.browser.label": "Synth\xE8se vocale du navigateur \u2014 son sur cet appareil",
  "dsh-live-voice.speak.browser.name": "Synth\xE8se vocale du navigateur",
  "dsh-live-voice.speak.browser.outputHelp": "La synth\xE8se vocale du navigateur peut ignorer le p\xE9riph\xE9rique de sortie s\xE9lectionn\xE9 ; cette API du navigateur utilise normalement celui d\xE9fini par d\xE9faut sur le syst\xE8me.",
  "dsh-live-voice.speak.browser.voice": "Voix locale du navigateur",
  "dsh-live-voice.speak.engine.label": "Moteur de synth\xE8se vocale",
  "dsh-live-voice.speak.engine.playbackHelp": "Qwen et macOS say synth\xE9tisent sur l\u2019h\xF4te DSH ; l\u2019audio AAC/M4A compact est lu dans ce navigateur. La synth\xE8se vocale du navigateur est g\xE9n\xE9r\xE9e et lue sur cet appareil.",
  "dsh-live-voice.speak.filters.code.enabled": "Filtrer les blocs de code Markdown avant la lecture vocale",
  "dsh-live-voice.speak.filters.code.maxLines": "Nombre maximal de lignes des blocs de code \xE0 lire",
  "dsh-live-voice.speak.filters.code.notice": "Consultez le code dans notre conversation",
  "dsh-live-voice.speak.filters.code.replacement": "Phrase de remplacement pour les blocs de code plus longs",
  "dsh-live-voice.speak.interruption.disabledHelp": "L\u2019envoi d\u2019un autre message n\u2019arr\xEAte pas la lecture vocale de l\u2019assistant que vous \xE9coutez d\xE9j\xE0.",
  "dsh-live-voice.speak.interruption.enabled": "Arr\xEAter la lecture vocale de l\u2019assistant lorsque j\u2019envoie un message",
  "dsh-live-voice.speak.interruption.enabledHelp": "L\u2019envoi d\u2019un nouveau message utilisateur, y compris \xE0 l\u2019agent en cours d\u2019ex\xE9cution, arr\xEAte la lecture vocale de l\u2019assistant, qu\u2019elle soit en cours ou en pause.",
  "dsh-live-voice.speak.macos.label": "macOS say \u2014 son sur l\u2019h\xF4te",
  "dsh-live-voice.speak.macos.name": "macOS say",
  "dsh-live-voice.speak.macos.outputHelp": "macOS say utilise la sortie s\xE9lectionn\xE9e sur l\u2019h\xF4te DSH.",
  "dsh-live-voice.speak.output.checking": "V\xE9rification de la sortie vocale\u2026",
  "dsh-live-voice.speak.output.device": "P\xE9riph\xE9rique de sortie",
  "dsh-live-voice.speak.output.fallbackName": "Sortie audio",
  "dsh-live-voice.speak.output.stopTest": "Arr\xEAter le test vocal",
  "dsh-live-voice.speak.output.test": "Tester la sortie vocale s\xE9lectionn\xE9e",
  "dsh-live-voice.speak.output.testPhrase": "DSH Live Voice. La sortie vocale s\xE9lectionn\xE9e fonctionne.",
  "dsh-live-voice.speak.output.testing": "Test vocal en cours\u2026",
  "dsh-live-voice.speak.playback.message": "Lire le message \xE0 voix haute",
  "dsh-live-voice.speak.playback.next": "Passer au segment vocal suivant",
  "dsh-live-voice.speak.playback.pause": "Mettre la lecture en pause",
  "dsh-live-voice.speak.playback.resume": "Reprendre la lecture",
  "dsh-live-voice.speak.playback.stop": "Arr\xEAter la lecture",
  "dsh-live-voice.speak.playback.stopAll": "Arr\xEAter toute lecture",
  "dsh-live-voice.speak.qwen.connection": "Connexion au serveur Qwen",
  "dsh-live-voice.speak.qwen.endpoint": "URL de base de l\u2019API Qwen",
  "dsh-live-voice.speak.qwen.healthFailed": "La v\xE9rification de l\u2019\xE9tat de Qwen a \xE9chou\xE9.",
  "dsh-live-voice.speak.qwen.label": "Qwen3 TTS \u2014 serveur MLX local",
  "dsh-live-voice.speak.qwen.name": "Qwen3 local",
  "dsh-live-voice.speak.qwen.requestFailed": "La requ\xEAte relative aux param\xE8tres de Qwen a \xE9chou\xE9.",
  "dsh-live-voice.speak.qwen.restartRequired": "Les routes de configuration de Qwen ne sont pas charg\xE9es. Un red\xE9marrage normal du serveur DSH est n\xE9cessaire pour charger les routes mises \xE0 jour du plugin ; actualiser cette page ne suffit pas.",
  "dsh-live-voice.speak.qwen.save": "Enregistrer les param\xE8tres de Qwen",
  "dsh-live-voice.speak.qwen.saved": "Enregistr\xE9 sur l\u2019h\xF4te DSH. Les requ\xEAtes Qwen actives ont \xE9t\xE9 annul\xE9es.",
  "dsh-live-voice.speak.qwen.signInRequired": "Connectez-vous \xE0 DSH pour g\xE9rer les param\xE8tres de Qwen.",
  "dsh-live-voice.speak.qwen.test": "Tester le serveur Qwen",
  "dsh-live-voice.speak.qwen.voice": "Voix Qwen",
  "dsh-live-voice.speak.qwen.voiceHelp": "Aiden est utilis\xE9 par d\xE9faut. Ces voix pr\xE9d\xE9finies ne sont pas des voix natives du portugais br\xE9silien.",
  "dsh-live-voice.speak.qwen.voices.aiden": "Aiden \u2014 homme, anglais am\xE9ricain",
  "dsh-live-voice.speak.qwen.voices.dylan": "Dylan \u2014 homme, chinois de P\xE9kin",
  "dsh-live-voice.speak.qwen.voices.eric": "Eric \u2014 homme, chinois du Sichuan",
  "dsh-live-voice.speak.qwen.voices.onoAnna": "Ono Anna \u2014 femme, japonais",
  "dsh-live-voice.speak.qwen.voices.ryan": "Ryan \u2014 homme, anglais",
  "dsh-live-voice.speak.qwen.voices.serena": "Serena \u2014 femme, chinois",
  "dsh-live-voice.speak.qwen.voices.sohee": "Sohee \u2014 femme, cor\xE9en",
  "dsh-live-voice.speak.qwen.voices.uncleFu": "Uncle Fu \u2014 homme, chinois",
  "dsh-live-voice.speak.qwen.voices.vivian": "Vivian \u2014 femme, chinois",
  "dsh-live-voice.speak.rate.help": "Vitesse relative : 1 correspond \xE0 la vitesse normale.",
  "dsh-live-voice.speak.rate.label": "D\xE9bit de parole",
  "dsh-live-voice.speak.responseDelay.help": "Apr\xE8s que vous avez cess\xE9 de parler, la lecture automatique de l\u2019assistant attend cette dur\xE9e de silence continu. Si vous reparlez, l\u2019attente recommence.",
  "dsh-live-voice.speak.responseDelay.label": "D\xE9lai de r\xE9ponse de l\u2019assistant",
  "dsh-live-voice.speak.segmentGap.help": "Attend ce nombre de millisecondes entre des segments vocaux cons\xE9cutifs. La valeur par d\xE9faut est 200 ms.",
  "dsh-live-voice.speak.segmentGap.label": "Pause entre les segments vocaux",
  "dsh-live-voice.speak.status.paused": "Lecture en pause",
  "dsh-live-voice.speak.status.playing": "Lecture en cours"
};
var fr_default = Object.freeze(fr);

// src/client/i18n/es.ts
var es = {
  "dsh-live-voice.commons.connection.contactingHost": "Conectando con el host de DSH\u2026",
  "dsh-live-voice.commons.connection.endpoint": "URL del punto de acceso",
  "dsh-live-voice.commons.connection.healthEndpoint": "URL o ruta de comprobaci\xF3n de estado",
  "dsh-live-voice.commons.connection.reload": "Volver a cargar la configuraci\xF3n guardada",
  "dsh-live-voice.commons.connection.test": "Probar conexi\xF3n",
  "dsh-live-voice.commons.connection.timeout": "Tiempo de espera de las solicitudes (ms)",
  "dsh-live-voice.commons.connection.title": "Configuraci\xF3n de conexi\xF3n",
  "dsh-live-voice.commons.connection.unsaved": "Cambios sin guardar",
  "dsh-live-voice.commons.controls.title": "Controles de voz",
  "dsh-live-voice.commons.conversation.end": "Terminar conversaci\xF3n por voz",
  "dsh-live-voice.commons.conversation.idle": "Conversaci\xF3n inactiva",
  "dsh-live-voice.commons.conversation.start": "Iniciar conversaci\xF3n por voz",
  "dsh-live-voice.commons.delivery.queueBadge": "COLA",
  "dsh-live-voice.commons.device.numberedLabel": "{device} {number}",
  "dsh-live-voice.commons.dismiss": "Descartar",
  "dsh-live-voice.commons.dismissError": "Descartar error de voz",
  "dsh-live-voice.commons.engine.failure": "{engine}: {reason}",
  "dsh-live-voice.commons.input.ignoring": "ignorando",
  "dsh-live-voice.commons.input.ignoringBadge": "IGNORANDO",
  "dsh-live-voice.commons.input.listening": "escuchando",
  "dsh-live-voice.commons.input.listeningBadge": "ESCUCHANDO",
  "dsh-live-voice.commons.manual": "manual",
  "dsh-live-voice.commons.off": "desactivado",
  "dsh-live-voice.commons.on": "activado",
  "dsh-live-voice.commons.pluginName": "Live Voice",
  "dsh-live-voice.commons.queue": "cola",
  "dsh-live-voice.commons.repository.starLabel": "Danos una estrella en GitHub",
  "dsh-live-voice.commons.repository.starLink": "Dar una estrella a DSH Live Voice en GitHub",
  "dsh-live-voice.commons.seconds": "{seconds} segundos",
  "dsh-live-voice.commons.send": "ENVIAR",
  "dsh-live-voice.commons.status.ready": "Funciones de voz listas",
  "dsh-live-voice.commons.systemDefault": "Predeterminado del sistema",
  "dsh-live-voice.commons.toggle.offBadge": "DESACTIVADO",
  "dsh-live-voice.commons.unknownLanguage": "idioma desconocido",
  "dsh-live-voice.commons.update.label": "Actualizaci\xF3n disponible",
  "dsh-live-voice.commons.update.link": "Actualizaci\xF3n disponible: {version}. Abrir la p\xE1gina de esta versi\xF3n",
  "dsh-live-voice.commons.update.version": "Actualizaci\xF3n disponible: {version}",
  "dsh-live-voice.commons.version.compatibility": "Compatible con DSH v{version}",
  "dsh-live-voice.commons.version.compatibilityLink": "Compatible con DSH v{version}. Abrir la p\xE1gina de esta versi\xF3n",
  "dsh-live-voice.commons.version.label": "DSH Live Voice v{version}",
  "dsh-live-voice.commons.version.link": "DSH Live Voice v{version}. Abrir la lista de versiones",
  "dsh-live-voice.commons.version.title": "Informaci\xF3n de versi\xF3n",
  "dsh-live-voice.recognition.autoSend.countdownHelp": "La cuenta atr\xE1s comienza tras el reconocimiento definitivo de una frase. Hablar de nuevo o editar el texto la cancela.",
  "dsh-live-voice.recognition.browser.autoInstallPack": "Instalar autom\xE1ticamente este paquete de idioma del navegador cuando sea necesario",
  "dsh-live-voice.recognition.browser.help": "Utiliza la API SpeechRecognition del navegador. Esta es la opci\xF3n predeterminada.",
  "dsh-live-voice.recognition.browser.label": "SpeechRecognition del navegador \u2014 Opci\xF3n predeterminada",
  "dsh-live-voice.recognition.browser.localProcessing": "Procesar el reconocimiento localmente en este dispositivo",
  "dsh-live-voice.recognition.browser.microphoneHelp": "SpeechRecognition puede utilizar el micr\xF3fono predeterminado del navegador o del sistema en lugar del seleccionado aqu\xED.",
  "dsh-live-voice.recognition.browser.remoteServiceWarning": "El reconocimiento mediante el servicio del navegador est\xE1 activado. El navegador puede enviar el audio del micr\xF3fono a su servicio de reconocimiento.",
  "dsh-live-voice.recognition.commands.clear": "Vaciar el cuadro de mensaje",
  "dsh-live-voice.recognition.commands.enabled": "Activar comandos de voz con coincidencia exacta",
  "dsh-live-voice.recognition.commands.mute": "Suspender la entrada de voz en el cuadro de mensaje",
  "dsh-live-voice.recognition.commands.queue": "A\xF1adir a la cola",
  "dsh-live-voice.recognition.commands.resume": "Reanudar la entrada de voz en el cuadro de mensaje",
  "dsh-live-voice.recognition.commands.send": "Enviar al agente en ejecuci\xF3n",
  "dsh-live-voice.recognition.commands.stopSpeech": "Detener la lectura en voz alta del asistente",
  "dsh-live-voice.recognition.commands.title": "Comandos de voz",
  "dsh-live-voice.recognition.dictation.cancel": "Cancelar dictado",
  "dsh-live-voice.recognition.engine.label": "Motor de reconocimiento",
  "dsh-live-voice.recognition.headphoneMode.help": "El micr\xF3fono abierto sigue escuchando mientras se reproducen las respuestas. Al detectar tu voz, la reproducci\xF3n se pausa y solo se reanuda cuando t\xFA lo decides.",
  "dsh-live-voice.recognition.headphoneMode.label": "Auriculares \u2014 micr\xF3fono abierto",
  "dsh-live-voice.recognition.holdToTalk.enabled": "Mantener Control pulsado para hablar",
  "dsh-live-voice.recognition.holdToTalk.help": "Con un cuadro de mensaje abierto, mant\xE9n Control pulsado en cualquier parte de la p\xE1gina para capturar tu voz. Al soltarlo, se procesa la transcripci\xF3n pendiente, se espera el retraso de env\xEDo configurado, se a\xF1ade el mensaje a la cola y se cierra la captura de voz. Pulsa Escape mientras mantienes Control para cancelar.",
  "dsh-live-voice.recognition.language.automatic": "Autom\xE1tico \u2014 detectar idioma",
  "dsh-live-voice.recognition.language.label": "Idioma de reconocimiento",
  "dsh-live-voice.recognition.manualSend.help": "El texto reconocido permanece en el cuadro de mensaje hasta que utilices el bot\xF3n de env\xEDo habitual de DSH.",
  "dsh-live-voice.recognition.maxUtterance.help": "Si hablas sin hacer pausas, se inicia un nuevo fragmento de transcripci\xF3n tras este intervalo. Valor predeterminado: 60 segundos.",
  "dsh-live-voice.recognition.maxUtterance.label": "Duraci\xF3n m\xE1xima del habla continua (segundos)",
  "dsh-live-voice.recognition.microphone.checking": "Comprobando la disponibilidad del micr\xF3fono",
  "dsh-live-voice.recognition.microphone.device": "Dispositivo de entrada",
  "dsh-live-voice.recognition.microphone.failure": "Micr\xF3fono: {reason}",
  "dsh-live-voice.recognition.microphone.ignore": "Ignorar la entrada de voz en el cuadro de mensaje",
  "dsh-live-voice.recognition.microphone.inputStatus": "Entrada del micr\xF3fono: {state}",
  "dsh-live-voice.recognition.microphone.label": "Micr\xF3fono",
  "dsh-live-voice.recognition.microphone.permissionHelp": "Solo se solicitar\xE1 permiso para usar el micr\xF3fono cuando inicies un dictado o una conversaci\xF3n por voz.",
  "dsh-live-voice.recognition.microphone.resume": "Reanudar escucha",
  "dsh-live-voice.recognition.microphone.starting": "Iniciando micr\xF3fono\u2026",
  "dsh-live-voice.recognition.microphone.takeControl": "Tomar el control del micr\xF3fono",
  "dsh-live-voice.recognition.minimumWords.enabled": "Ignorar los fragmentos definitivos de transcripci\xF3n demasiado cortos",
  "dsh-live-voice.recognition.minimumWords.help": "Los fragmentos definitivos con menos palabras se descartan antes de llegar al cuadro de mensaje o al env\xEDo autom\xE1tico.",
  "dsh-live-voice.recognition.minimumWords.label": "M\xEDnimo de palabras por fragmento definitivo",
  "dsh-live-voice.recognition.mode.label": "Modo de escucha",
  "dsh-live-voice.recognition.planned.parakeet": "NVIDIA Parakeet \u2014 Pr\xF3ximamente",
  "dsh-live-voice.recognition.planned.sherpa": "sherpa-onnx en continuo \u2014 Pr\xF3ximamente",
  "dsh-live-voice.recognition.planned.vote": "Pr\xF3ximamente \u2014 vota en las incidencias del repositorio",
  "dsh-live-voice.recognition.planned.voxtral": "Voxtral Realtime \u2014 Pr\xF3ximamente",
  "dsh-live-voice.recognition.planned.webGpu": "Inferencia WebGPU en el navegador \u2014 Pr\xF3ximamente",
  "dsh-live-voice.recognition.presets.long.description": "Espera durante pausas de reflexi\xF3n m\xE1s largas.",
  "dsh-live-voice.recognition.presets.long.label": "Larga",
  "dsh-live-voice.recognition.presets.natural.description": "Permite pausas normales entre frases.",
  "dsh-live-voice.recognition.presets.natural.label": "Natural",
  "dsh-live-voice.recognition.presets.short.description": "Env\xEDa r\xE1pidamente despu\xE9s de una pausa corta.",
  "dsh-live-voice.recognition.presets.short.label": "Corta",
  "dsh-live-voice.recognition.providerSettings.help": "La configuraci\xF3n del proveedor cambia seg\xFAn el motor de reconocimiento seleccionado.",
  "dsh-live-voice.recognition.qwen.captureHelp": "El audio se divide en enunciados completos en formato WAV y se env\xEDa a trav\xE9s de DSH con autenticaci\xF3n al modelo Qwen3 ASR ejecutado localmente en el host.",
  "dsh-live-voice.recognition.qwen.connectionSuccess": "Conexi\xF3n correcta. Qwen ASR y TTS est\xE1n cargados. Los cambios sin guardar no se han aplicado.",
  "dsh-live-voice.recognition.qwen.endpointHelp": "API HTTP en la URL configurada en el host de DSH (predeterminada: http://127.0.0.1:8080/inference). El audio utiliza la ruta de transcripci\xF3n autenticada del host de DSH.",
  "dsh-live-voice.recognition.qwen.hostHelp": "Configuraci\xF3n para todo el host del servidor Qwen3 ASR + TTS. Introduce una URL base HTTP o HTTPS accesible desde el host de DSH. El navegador accede a ella mediante las rutas autenticadas de DSH.",
  "dsh-live-voice.recognition.qwen.label": "Qwen3 ASR \u2014 API HTTP",
  "dsh-live-voice.recognition.silenceDetection.duration": "Pausa antes de enviar: {milliseconds} ms",
  "dsh-live-voice.recognition.silenceDetection.help": "Determina cu\xE1nto debe durar una pausa antes de enviar la voz capturada para su reconocimiento.",
  "dsh-live-voice.recognition.silenceDetection.label": "Detecci\xF3n de silencio",
  "dsh-live-voice.recognition.silenceDetection.pauseLabel": "Pausa antes de enviar",
  "dsh-live-voice.recognition.silenceDetection.title": "Configuraci\xF3n de detecci\xF3n de silencio",
  "dsh-live-voice.recognition.speakerMode.help": "La escucha controlada libera el micr\xF3fono mientras se reproducen las respuestas para evitar que se reconozca el audio de los altavoces. Usa \xABTomar el control del micr\xF3fono\xBB para interrumpir la reproducci\xF3n.",
  "dsh-live-voice.recognition.speakerMode.label": "Altavoces \u2014 escucha controlada",
  "dsh-live-voice.recognition.status.answer": "Reconociendo respuesta\u2026",
  "dsh-live-voice.recognition.status.awaitingAnswer": "Escuchando tu respuesta\u2026",
  "dsh-live-voice.recognition.status.listening": "Escuchando \u2014 esperando voz",
  "dsh-live-voice.recognition.status.processing": "Reconociendo voz\u2026",
  "dsh-live-voice.recognition.status.unavailable": "Reconocimiento de voz no disponible",
  "dsh-live-voice.recognition.voiceCommands.help": "Separa las frases con comas. La comparaci\xF3n ignora may\xFAsculas, acentos, puntuaci\xF3n y espacios adicionales. Debe coincidir todo el fragmento definitivo.",
  "dsh-live-voice.recognition.whisper.captureHelp": "El audio se divide en enunciados completos en formato WAV, se env\xEDa a trav\xE9s de DSH con autenticaci\xF3n y se procesa mediante el servidor HTTP de whisper.cpp en la interfaz de bucle local.",
  "dsh-live-voice.recognition.whisper.connectionSuccess": "Conexi\xF3n correcta. El punto de acceso de comprobaci\xF3n de estado ha respondido; no se ha probado la transcripci\xF3n. Los cambios sin guardar no se han aplicado.",
  "dsh-live-voice.recognition.whisper.endpointHelp": "API HTTP en la URL base configurada (predeterminada: http://127.0.0.1:8080/). Compatible con POST /v1/audio/transcriptions.",
  "dsh-live-voice.recognition.whisper.healthFailed": "Ha fallado la comprobaci\xF3n de estado de Whisper.",
  "dsh-live-voice.recognition.whisper.label": "Whisper \u2014 API HTTP",
  "dsh-live-voice.recognition.whisper.requestFailed": "Ha fallado la solicitud de configuraci\xF3n de Whisper.",
  "dsh-live-voice.recognition.whisper.restartRequired": "Las rutas de configuraci\xF3n de Whisper no est\xE1n cargadas. Es necesario reiniciar normalmente el servidor DSH para cargar las rutas actualizadas del complemento; no basta con actualizar esta p\xE1gina.",
  "dsh-live-voice.recognition.whisper.save": "Guardar la configuraci\xF3n de Whisper",
  "dsh-live-voice.recognition.whisper.saved": "Guardado en el host de DSH. Se han cancelado las solicitudes de transcripci\xF3n activas del host.",
  "dsh-live-voice.recognition.whisper.signInRequired": "Inicia sesi\xF3n en DSH para gestionar la configuraci\xF3n de Whisper.",
  "dsh-live-voice.settings.autoSend.cancel": "Cancelar env\xEDo autom\xE1tico",
  "dsh-live-voice.settings.autoSend.countdown": "Enviando en {remaining}\u2026",
  "dsh-live-voice.settings.autoSend.delay": "Enviar despu\xE9s del silencio",
  "dsh-live-voice.settings.close": "Cerrar configuraci\xF3n de voz",
  "dsh-live-voice.settings.delivery.label": "Modo de env\xEDo",
  "dsh-live-voice.settings.delivery.manualLabel": "Desactivado \u2014 revisar y enviar manualmente",
  "dsh-live-voice.settings.delivery.queueLabel": "Cola \u2014 a\xF1adir autom\xE1ticamente tras un silencio",
  "dsh-live-voice.settings.delivery.status": "Env\xEDo autom\xE1tico: {mode}",
  "dsh-live-voice.settings.delivery.steerDescription": "enviar al agente en ejecuci\xF3n",
  "dsh-live-voice.settings.delivery.steerLabel": "Redirigir \u2014 enviar autom\xE1ticamente al agente en ejecuci\xF3n",
  "dsh-live-voice.settings.delivery.toggle": "Modo de env\xEDo autom\xE1tico",
  "dsh-live-voice.settings.engine.refresh": "Actualizar los motores disponibles",
  "dsh-live-voice.settings.filters.title": "Filtrado",
  "dsh-live-voice.settings.tabs.conversation": "Conversaci\xF3n",
  "dsh-live-voice.settings.tabs.recognition": "Reconocimiento de voz",
  "dsh-live-voice.settings.tabs.speak": "S\xEDntesis de voz",
  "dsh-live-voice.settings.title": "Configuraci\xF3n de Live Voice",
  "dsh-live-voice.settings.whisper.hostHelp": "Configuraci\xF3n para todo el host. Solo se permiten URL HTTP sin autenticaci\xF3n en la interfaz de bucle local (localhost, 127.0.0.1, [::1]). El bucle local se refiere al host de DSH, no a este navegador. Todas las comprobaciones de estado y solicitudes de audio pasan por el servidor con autenticaci\xF3n.",
  "dsh-live-voice.speak.agentContext.enabled": "Activar el contexto de voz del agente",
  "dsh-live-voice.speak.agentContext.enabledHelp": "Cuando est\xE1 activado, el contexto siguiente informa al agente que sus respuestas se leer\xE1n en voz alta.",
  "dsh-live-voice.speak.agentContext.help": "Esta instrucci\xF3n en ingl\xE9s se env\xEDa al agente solo durante una conversaci\xF3n de voz activa con habla autom\xE1tica del asistente activada.",
  "dsh-live-voice.speak.agentContext.label": "Contexto de voz del agente",
  "dsh-live-voice.speak.agentContext.restore": "Restaurar predeterminado",
  "dsh-live-voice.speak.autoPlayback.enabled": "Leer autom\xE1ticamente los nuevos mensajes del asistente en voz alta",
  "dsh-live-voice.speak.autoPlayback.help": "Durante una conversaci\xF3n por voz, las frases del asistente se leen autom\xE1ticamente. La reproducci\xF3n espera mientras hablas.",
  "dsh-live-voice.speak.autoPlayback.label": "Lectura autom\xE1tica del asistente",
  "dsh-live-voice.speak.autoPlayback.remainingOne": "Lectura autom\xE1tica del asistente: {state} \u2014 queda {count} segmento de voz",
  "dsh-live-voice.speak.autoPlayback.remainingOther": "Lectura autom\xE1tica del asistente: {state} \u2014 quedan {count} segmentos de voz",
  "dsh-live-voice.speak.autoPlayback.status": "Lectura autom\xE1tica del asistente: {state}",
  "dsh-live-voice.speak.browser.automaticVoice": "Voz local autom\xE1tica",
  "dsh-live-voice.speak.browser.label": "S\xEDntesis de voz del navegador \u2014 audio en este dispositivo",
  "dsh-live-voice.speak.browser.name": "S\xEDntesis de voz del navegador",
  "dsh-live-voice.speak.browser.outputHelp": "La s\xEDntesis de voz del navegador puede ignorar el dispositivo de salida seleccionado; esta API del navegador normalmente utiliza el predeterminado del sistema.",
  "dsh-live-voice.speak.browser.voice": "Voz local del navegador",
  "dsh-live-voice.speak.engine.label": "Motor de s\xEDntesis de voz",
  "dsh-live-voice.speak.engine.playbackHelp": "Qwen y macOS say sintetizan en el host de DSH; el audio AAC/M4A compacto se reproduce en este navegador. La voz del navegador se sintetiza y reproduce en este dispositivo.",
  "dsh-live-voice.speak.filters.code.enabled": "Filtrar los bloques de c\xF3digo Markdown antes de leer en voz alta",
  "dsh-live-voice.speak.filters.code.maxLines": "M\xE1ximo de l\xEDneas de los bloques de c\xF3digo que se leer\xE1n",
  "dsh-live-voice.speak.filters.code.notice": "Mira el c\xF3digo en nuestra conversaci\xF3n",
  "dsh-live-voice.speak.filters.code.replacement": "Frase de reemplazo para los bloques de c\xF3digo m\xE1s largos",
  "dsh-live-voice.speak.interruption.disabledHelp": "Enviar otro mensaje no detiene el audio del asistente que ya est\xE1s escuchando.",
  "dsh-live-voice.speak.interruption.enabled": "Detener la lectura en voz alta del asistente cuando env\xEDe un mensaje",
  "dsh-live-voice.speak.interruption.enabledHelp": "Enviar un nuevo mensaje de usuario, incluso al agente en ejecuci\xF3n, detiene la lectura en voz alta del asistente, tanto si est\xE1 reproduci\xE9ndose como si est\xE1 en pausa.",
  "dsh-live-voice.speak.macos.label": "macOS say \u2014 audio en el host",
  "dsh-live-voice.speak.macos.name": "macOS say",
  "dsh-live-voice.speak.macos.outputHelp": "macOS say utiliza la salida seleccionada en el host de DSH.",
  "dsh-live-voice.speak.output.checking": "Comprobando la salida de voz\u2026",
  "dsh-live-voice.speak.output.device": "Dispositivo de salida",
  "dsh-live-voice.speak.output.fallbackName": "Salida de audio",
  "dsh-live-voice.speak.output.stopTest": "Detener la prueba de voz",
  "dsh-live-voice.speak.output.test": "Probar la salida de voz seleccionada",
  "dsh-live-voice.speak.output.testPhrase": "DSH Live Voice. La salida de voz seleccionada funciona.",
  "dsh-live-voice.speak.output.testing": "Probando la voz\u2026",
  "dsh-live-voice.speak.playback.message": "Leer el mensaje en voz alta",
  "dsh-live-voice.speak.playback.next": "Saltar al siguiente segmento de voz",
  "dsh-live-voice.speak.playback.pause": "Pausar la lectura en voz alta",
  "dsh-live-voice.speak.playback.resume": "Reanudar la lectura en voz alta",
  "dsh-live-voice.speak.playback.stop": "Detener la lectura en voz alta",
  "dsh-live-voice.speak.playback.stopAll": "Detener toda la lectura en voz alta",
  "dsh-live-voice.speak.qwen.connection": "Conexi\xF3n al servidor Qwen",
  "dsh-live-voice.speak.qwen.endpoint": "URL base de la API de Qwen",
  "dsh-live-voice.speak.qwen.healthFailed": "Ha fallado la comprobaci\xF3n de estado de Qwen.",
  "dsh-live-voice.speak.qwen.label": "Qwen3 TTS \u2014 servidor MLX local",
  "dsh-live-voice.speak.qwen.name": "Qwen3 local",
  "dsh-live-voice.speak.qwen.requestFailed": "Ha fallado la solicitud de configuraci\xF3n de Qwen.",
  "dsh-live-voice.speak.qwen.restartRequired": "Las rutas de configuraci\xF3n de Qwen no est\xE1n cargadas. Es necesario reiniciar normalmente el servidor DSH para cargar las rutas actualizadas del complemento; no basta con actualizar esta p\xE1gina.",
  "dsh-live-voice.speak.qwen.save": "Guardar la configuraci\xF3n de Qwen",
  "dsh-live-voice.speak.qwen.saved": "Guardado en el host de DSH. Se han cancelado las solicitudes activas de Qwen.",
  "dsh-live-voice.speak.qwen.signInRequired": "Inicia sesi\xF3n en DSH para gestionar la configuraci\xF3n de Qwen.",
  "dsh-live-voice.speak.qwen.test": "Probar el servidor Qwen",
  "dsh-live-voice.speak.qwen.voice": "Voz de Qwen",
  "dsh-live-voice.speak.qwen.voiceHelp": "Aiden se utiliza de forma predeterminada. Estas voces predefinidas no son voces nativas de portugu\xE9s brasile\xF1o.",
  "dsh-live-voice.speak.qwen.voices.aiden": "Aiden \u2014 masculino, ingl\xE9s estadounidense",
  "dsh-live-voice.speak.qwen.voices.dylan": "Dylan \u2014 masculino, chino de Pek\xEDn",
  "dsh-live-voice.speak.qwen.voices.eric": "Eric \u2014 masculino, chino de Sichuan",
  "dsh-live-voice.speak.qwen.voices.onoAnna": "Ono Anna \u2014 femenino, japon\xE9s",
  "dsh-live-voice.speak.qwen.voices.ryan": "Ryan \u2014 masculino, ingl\xE9s",
  "dsh-live-voice.speak.qwen.voices.serena": "Serena \u2014 femenino, chino",
  "dsh-live-voice.speak.qwen.voices.sohee": "Sohee \u2014 femenino, coreano",
  "dsh-live-voice.speak.qwen.voices.uncleFu": "Uncle Fu \u2014 masculino, chino",
  "dsh-live-voice.speak.qwen.voices.vivian": "Vivian \u2014 femenino, chino",
  "dsh-live-voice.speak.rate.help": "Velocidad relativa: 1 es la velocidad normal.",
  "dsh-live-voice.speak.rate.label": "Velocidad de habla",
  "dsh-live-voice.speak.responseDelay.help": "Cuando dejas de hablar, la reproducci\xF3n autom\xE1tica del asistente espera este intervalo de silencio continuo. Si vuelves a hablar, la espera se reinicia.",
  "dsh-live-voice.speak.responseDelay.label": "Demora de respuesta del asistente",
  "dsh-live-voice.speak.segmentGap.help": "Espera esta cantidad de milisegundos entre segmentos hablados consecutivos. El valor predeterminado es 200 ms.",
  "dsh-live-voice.speak.segmentGap.label": "Pausa entre segmentos de voz",
  "dsh-live-voice.speak.status.paused": "Lectura en pausa",
  "dsh-live-voice.speak.status.playing": "Hablando"
};
var es_default = Object.freeze(es);

// src/client/i18n/hi.ts
var hi = {
  "dsh-live-voice.commons.connection.contactingHost": "DSH \u0939\u094B\u0938\u094D\u091F \u0938\u0947 \u0938\u0902\u092A\u0930\u094D\u0915 \u0915\u093F\u092F\u093E \u091C\u093E \u0930\u0939\u093E \u0939\u0948\u2026",
  "dsh-live-voice.commons.connection.endpoint": "\u090F\u0902\u0921\u092A\u0949\u0907\u0902\u091F URL",
  "dsh-live-voice.commons.connection.healthEndpoint": "\u0938\u094D\u0935\u093E\u0938\u094D\u0925\u094D\u092F \u091C\u093E\u0901\u091A \u0915\u093E URL \u092F\u093E \u092A\u0925",
  "dsh-live-voice.commons.connection.reload": "\u0938\u0939\u0947\u091C\u0940 \u0917\u0908 \u0938\u0947\u091F\u093F\u0902\u0917\u094D\u0938 \u092B\u093F\u0930 \u0932\u094B\u0921 \u0915\u0930\u0947\u0902",
  "dsh-live-voice.commons.connection.test": "\u0915\u0928\u0947\u0915\u094D\u0936\u0928 \u091C\u093E\u0901\u091A\u0947\u0902",
  "dsh-live-voice.commons.connection.timeout": "\u0905\u0928\u0941\u0930\u094B\u0927 \u0915\u0940 \u0938\u092E\u092F-\u0938\u0940\u092E\u093E (\u092E\u093F\u0932\u0940\u0938\u0947\u0915\u0902\u0921)",
  "dsh-live-voice.commons.connection.title": "\u0915\u0928\u0947\u0915\u094D\u0936\u0928 \u0938\u0947\u091F\u093F\u0902\u0917\u094D\u0938",
  "dsh-live-voice.commons.connection.unsaved": "\u092C\u0926\u0932\u093E\u0935 \u0905\u092D\u0940 \u0938\u0939\u0947\u091C\u0947 \u0928\u0939\u0940\u0902 \u0917\u090F \u0939\u0948\u0902",
  "dsh-live-voice.commons.controls.title": "\u0935\u0949\u0907\u0938 \u0928\u093F\u092F\u0902\u0924\u094D\u0930\u0923",
  "dsh-live-voice.commons.conversation.end": "\u0935\u0949\u0907\u0938 \u092C\u093E\u0924\u091A\u0940\u0924 \u0938\u092E\u093E\u092A\u094D\u0924 \u0915\u0930\u0947\u0902",
  "dsh-live-voice.commons.conversation.idle": "\u092C\u093E\u0924\u091A\u0940\u0924 \u0928\u093F\u0937\u094D\u0915\u094D\u0930\u093F\u092F \u0939\u0948",
  "dsh-live-voice.commons.conversation.start": "\u0935\u0949\u0907\u0938 \u092C\u093E\u0924\u091A\u0940\u0924 \u0936\u0941\u0930\u0942 \u0915\u0930\u0947\u0902",
  "dsh-live-voice.commons.delivery.queueBadge": "\u0915\u0924\u093E\u0930",
  "dsh-live-voice.commons.device.numberedLabel": "{device} {number}",
  "dsh-live-voice.commons.dismiss": "\u0939\u091F\u093E\u090F\u0901",
  "dsh-live-voice.commons.dismissError": "\u0935\u0949\u0907\u0938 \u0924\u094D\u0930\u0941\u091F\u093F \u0915\u093E \u0938\u0902\u0926\u0947\u0936 \u0939\u091F\u093E\u090F\u0901",
  "dsh-live-voice.commons.engine.failure": "{engine}: {reason}",
  "dsh-live-voice.commons.input.ignoring": "\u0905\u0928\u0926\u0947\u0916\u093E \u0915\u093F\u092F\u093E \u091C\u093E \u0930\u0939\u093E \u0939\u0948",
  "dsh-live-voice.commons.input.ignoringBadge": "\u0905\u0928\u0926\u0947\u0916\u093E \u0915\u093F\u092F\u093E \u091C\u093E \u0930\u0939\u093E \u0939\u0948",
  "dsh-live-voice.commons.input.listening": "\u0938\u0941\u0928\u093E \u091C\u093E \u0930\u0939\u093E \u0939\u0948",
  "dsh-live-voice.commons.input.listeningBadge": "\u0938\u0941\u0928\u093E \u091C\u093E \u0930\u0939\u093E \u0939\u0948",
  "dsh-live-voice.commons.manual": "\u092E\u0948\u0928\u094D\u092F\u0941\u0905\u0932",
  "dsh-live-voice.commons.off": "\u092C\u0902\u0926",
  "dsh-live-voice.commons.on": "\u091A\u093E\u0932\u0942",
  "dsh-live-voice.commons.pluginName": "Live Voice",
  "dsh-live-voice.commons.queue": "\u0915\u0924\u093E\u0930",
  "dsh-live-voice.commons.repository.starLabel": "GitHub \u092A\u0930 \u0939\u092E\u0947\u0902 \u0938\u094D\u091F\u093E\u0930 \u0926\u0947\u0902",
  "dsh-live-voice.commons.repository.starLink": "GitHub \u092A\u0930 DSH Live Voice \u0915\u094B \u0938\u094D\u091F\u093E\u0930 \u0926\u0947\u0902",
  "dsh-live-voice.commons.seconds": "{seconds} \u0938\u0947\u0915\u0902\u0921",
  "dsh-live-voice.commons.send": "\u092D\u0947\u091C\u0947\u0902",
  "dsh-live-voice.commons.status.ready": "\u0935\u0949\u0907\u0938 \u0924\u0948\u092F\u093E\u0930 \u0939\u0948",
  "dsh-live-voice.commons.systemDefault": "\u0938\u093F\u0938\u094D\u091F\u092E \u0921\u093F\u092B\u093C\u0949\u0932\u094D\u091F",
  "dsh-live-voice.commons.toggle.offBadge": "\u092C\u0902\u0926",
  "dsh-live-voice.commons.unknownLanguage": "\u0905\u091C\u094D\u091E\u093E\u0924 \u092D\u093E\u0937\u093E",
  "dsh-live-voice.commons.update.label": "\u0905\u092A\u0921\u0947\u091F \u0909\u092A\u0932\u092C\u094D\u0927 \u0939\u0948",
  "dsh-live-voice.commons.update.link": "\u0905\u092A\u0921\u0947\u091F \u0909\u092A\u0932\u092C\u094D\u0927 \u0939\u0948: {version}\u0964 \u0930\u093F\u0932\u0940\u091C\u093C \u0916\u094B\u0932\u0947\u0902",
  "dsh-live-voice.commons.update.version": "\u0905\u092A\u0921\u0947\u091F \u0909\u092A\u0932\u092C\u094D\u0927 \u0939\u0948: {version}",
  "dsh-live-voice.commons.version.compatibility": "DSH v{version} \u0915\u0947 \u0938\u093E\u0925 \u0938\u0902\u0917\u0924",
  "dsh-live-voice.commons.version.compatibilityLink": "DSH v{version} \u0915\u0947 \u0938\u093E\u0925 \u0938\u0902\u0917\u0924\u0964 \u0930\u093F\u0932\u0940\u091C\u093C \u0916\u094B\u0932\u0947\u0902",
  "dsh-live-voice.commons.version.label": "DSH Live Voice v{version}",
  "dsh-live-voice.commons.version.link": "DSH Live Voice v{version}\u0964 \u0930\u093F\u0932\u0940\u091C\u093C \u0938\u0942\u091A\u0940 \u0916\u094B\u0932\u0947\u0902",
  "dsh-live-voice.commons.version.title": "\u0938\u0902\u0938\u094D\u0915\u0930\u0923 \u091C\u093E\u0928\u0915\u093E\u0930\u0940",
  "dsh-live-voice.recognition.autoSend.countdownHelp": "\u092A\u0939\u091A\u093E\u0928\u0947 \u0917\u090F \u0935\u093E\u0915\u094D\u092F\u093E\u0902\u0936 \u0915\u093E \u0905\u0902\u0924\u093F\u092E \u092A\u0930\u093F\u0923\u093E\u092E \u092E\u093F\u0932\u0928\u0947 \u0915\u0947 \u092C\u093E\u0926 \u0909\u0932\u091F\u0940 \u0917\u093F\u0928\u0924\u0940 \u0936\u0941\u0930\u0942 \u0939\u094B\u0924\u0940 \u0939\u0948\u0964 \u0926\u094B\u092C\u093E\u0930\u093E \u092C\u094B\u0932\u0928\u0947 \u092F\u093E \u0938\u0902\u092A\u093E\u0926\u0928 \u0915\u0930\u0928\u0947 \u092A\u0930 \u092F\u0939 \u0930\u0926\u094D\u0926 \u0939\u094B \u091C\u093E\u0924\u0940 \u0939\u0948\u0964",
  "dsh-live-voice.recognition.browser.autoInstallPack": "\u091C\u093C\u0930\u0942\u0930\u0924 \u092A\u0921\u093C\u0928\u0947 \u092A\u0930 \u092C\u094D\u0930\u093E\u0909\u091C\u093C\u0930 \u0915\u093E \u092F\u0939 \u092D\u093E\u0937\u093E \u092A\u0948\u0915 \u0905\u092A\u0928\u0947 \u0906\u092A \u0907\u0902\u0938\u094D\u091F\u0949\u0932 \u0915\u0930\u0947\u0902",
  "dsh-live-voice.recognition.browser.help": "\u092C\u094D\u0930\u093E\u0909\u091C\u093C\u0930 \u0915\u0947 SpeechRecognition API \u0915\u093E \u0909\u092A\u092F\u094B\u0917 \u0915\u0930\u0924\u093E \u0939\u0948\u0964 \u092F\u0939 \u0921\u093F\u092B\u093C\u0949\u0932\u094D\u091F \u0935\u093F\u0915\u0932\u094D\u092A \u0939\u0948\u0964",
  "dsh-live-voice.recognition.browser.label": "\u092C\u094D\u0930\u093E\u0909\u091C\u093C\u0930 SpeechRecognition \u2014 \u0921\u093F\u092B\u093C\u0949\u0932\u094D\u091F \u0935\u093F\u0915\u0932\u094D\u092A",
  "dsh-live-voice.recognition.browser.localProcessing": "\u0935\u093E\u0915\u094D \u092A\u0939\u091A\u093E\u0928 \u0915\u0940 \u092A\u094D\u0930\u094B\u0938\u0947\u0938\u093F\u0902\u0917 \u0907\u0938\u0940 \u0921\u093F\u0935\u093E\u0907\u0938 \u092A\u0930 \u0938\u094D\u0925\u093E\u0928\u0940\u092F \u0930\u0942\u092A \u0938\u0947 \u0915\u0930\u0947\u0902",
  "dsh-live-voice.recognition.browser.microphoneHelp": "\u092C\u094D\u0930\u093E\u0909\u091C\u093C\u0930 \u0915\u093E SpeechRecognition \u092F\u0939\u093E\u0901 \u091A\u0941\u0928\u0947 \u0917\u090F \u092E\u093E\u0907\u0915\u094D\u0930\u094B\u092B\u093C\u094B\u0928 \u0915\u0947 \u092C\u091C\u093E\u092F \u092C\u094D\u0930\u093E\u0909\u091C\u093C\u0930 \u092F\u093E \u0938\u093F\u0938\u094D\u091F\u092E \u0915\u0947 \u0921\u093F\u092B\u093C\u0949\u0932\u094D\u091F \u092E\u093E\u0907\u0915\u094D\u0930\u094B\u092B\u093C\u094B\u0928 \u0915\u093E \u0909\u092A\u092F\u094B\u0917 \u0915\u0930 \u0938\u0915\u0924\u093E \u0939\u0948\u0964",
  "dsh-live-voice.recognition.browser.remoteServiceWarning": "\u092C\u094D\u0930\u093E\u0909\u091C\u093C\u0930 \u0938\u0947\u0935\u093E \u0915\u0947 \u091C\u093C\u0930\u093F\u090F \u0935\u093E\u0915\u094D \u092A\u0939\u091A\u093E\u0928 \u091A\u093E\u0932\u0942 \u0939\u0948\u0964 \u092C\u094D\u0930\u093E\u0909\u091C\u093C\u0930 \u092E\u093E\u0907\u0915\u094D\u0930\u094B\u092B\u093C\u094B\u0928 \u0915\u093E \u0911\u0921\u093F\u092F\u094B \u0905\u092A\u0928\u0940 \u0935\u093E\u0915\u094D \u092A\u0939\u091A\u093E\u0928 \u0938\u0947\u0935\u093E \u0915\u094B \u092D\u0947\u091C \u0938\u0915\u0924\u093E \u0939\u0948\u0964",
  "dsh-live-voice.recognition.commands.clear": "\u0938\u0902\u0926\u0947\u0936 \u0932\u093F\u0916\u0928\u0947 \u0915\u093E \u092C\u0949\u0915\u094D\u0938 \u0916\u093E\u0932\u0940 \u0915\u0930\u0947\u0902",
  "dsh-live-voice.recognition.commands.enabled": "\u0939\u0942\u092C\u0939\u0942 \u092E\u093F\u0932\u093E\u0928 \u0935\u093E\u0932\u0947 \u0935\u0949\u0907\u0938 \u0915\u092E\u093E\u0902\u0921 \u091A\u093E\u0932\u0942 \u0915\u0930\u0947\u0902",
  "dsh-live-voice.recognition.commands.mute": "\u0938\u0902\u0926\u0947\u0936 \u092C\u0949\u0915\u094D\u0938 \u092E\u0947\u0902 \u0935\u0949\u0907\u0938 \u0907\u0928\u092A\u0941\u091F \u092C\u0902\u0926 \u0915\u0930\u0947\u0902",
  "dsh-live-voice.recognition.commands.queue": "\u0915\u0924\u093E\u0930 \u092E\u0947\u0902 \u091C\u094B\u0921\u093C\u0947\u0902",
  "dsh-live-voice.recognition.commands.resume": "\u0938\u0902\u0926\u0947\u0936 \u092C\u0949\u0915\u094D\u0938 \u092E\u0947\u0902 \u0935\u0949\u0907\u0938 \u0907\u0928\u092A\u0941\u091F \u092B\u093F\u0930 \u0936\u0941\u0930\u0942 \u0915\u0930\u0947\u0902",
  "dsh-live-voice.recognition.commands.send": "\u091A\u0932 \u0930\u0939\u0947 \u090F\u091C\u0947\u0902\u091F \u0915\u094B \u092D\u0947\u091C\u0947\u0902",
  "dsh-live-voice.recognition.commands.stopSpeech": "\u0938\u0939\u093E\u092F\u0915 \u0915\u093E \u0935\u093E\u091A\u0928 \u092C\u0902\u0926 \u0915\u0930\u0947\u0902",
  "dsh-live-voice.recognition.commands.title": "\u0935\u0949\u0907\u0938 \u0915\u092E\u093E\u0902\u0921",
  "dsh-live-voice.recognition.dictation.cancel": "\u0921\u093F\u0915\u094D\u091F\u0947\u0936\u0928 \u0930\u0926\u094D\u0926 \u0915\u0930\u0947\u0902",
  "dsh-live-voice.recognition.engine.label": "\u0935\u093E\u0915\u094D \u092A\u0939\u091A\u093E\u0928 \u0907\u0902\u091C\u0928",
  "dsh-live-voice.recognition.headphoneMode.help": "\u0916\u0941\u0932\u093E \u092E\u093E\u0907\u0915\u094D\u0930\u094B\u092B\u093C\u094B\u0928 \u091C\u0935\u093E\u092C \u091A\u0932\u0928\u0947 \u0915\u0947 \u0926\u094C\u0930\u093E\u0928 \u092D\u0940 \u0938\u0941\u0928\u0924\u093E \u0930\u0939\u0924\u093E \u0939\u0948\u0964 \u0906\u092A\u0915\u0947 \u092C\u094B\u0932\u0928\u0947 \u0915\u093E \u092A\u0924\u093E \u091A\u0932\u0928\u0947 \u092A\u0930 \u092A\u094D\u0932\u0947\u092C\u0948\u0915 \u0920\u0939\u0930 \u091C\u093E\u0924\u093E \u0939\u0948 \u0914\u0930 \u0906\u092A\u0915\u0947 \u091A\u0941\u0928\u0928\u0947 \u092A\u0930 \u0939\u0940 \u092B\u093F\u0930 \u0936\u0941\u0930\u0942 \u0939\u094B\u0924\u093E \u0939\u0948\u0964",
  "dsh-live-voice.recognition.headphoneMode.label": "\u0939\u0947\u0921\u092B\u093C\u094B\u0928 \u2014 \u0916\u0941\u0932\u093E \u092E\u093E\u0907\u0915\u094D\u0930\u094B\u092B\u093C\u094B\u0928",
  "dsh-live-voice.recognition.holdToTalk.enabled": "\u092C\u094B\u0932\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F Control \u0926\u092C\u093E\u090F \u0930\u0916\u0947\u0902",
  "dsh-live-voice.recognition.holdToTalk.help": "\u0938\u0902\u0926\u0947\u0936 \u092C\u0949\u0915\u094D\u0938 \u0916\u0941\u0932\u093E \u0939\u094B\u0928\u0947 \u092A\u0930, \u092A\u0947\u091C \u092A\u0930 \u0915\u0939\u0940\u0902 \u092D\u0940 Control \u0926\u092C\u093E\u090F \u0930\u0916\u0915\u0930 \u0906\u0935\u093E\u091C\u093C \u0930\u093F\u0915\u0949\u0930\u094D\u0921 \u0915\u0930\u0947\u0902\u0964 \u091B\u094B\u0921\u093C\u0928\u0947 \u092A\u0930 \u0915\u0924\u093E\u0930 \u092E\u0947\u0902 \u092E\u094C\u091C\u0942\u0926 \u091F\u094D\u0930\u093E\u0902\u0938\u0915\u094D\u0930\u093F\u092A\u094D\u0936\u0928 \u092A\u0942\u0930\u093E \u0915\u093F\u092F\u093E \u091C\u093E\u0924\u093E \u0939\u0948, \u0924\u092F \u092D\u0947\u091C\u0928\u0947 \u0915\u0947 \u0935\u093F\u0932\u0902\u092C \u0924\u0915 \u092A\u094D\u0930\u0924\u0940\u0915\u094D\u0937\u093E \u0939\u094B\u0924\u0940 \u0939\u0948, \u0938\u0902\u0926\u0947\u0936 \u0915\u0924\u093E\u0930 \u092E\u0947\u0902 \u091C\u0941\u0921\u093C\u0924\u093E \u0939\u0948 \u0914\u0930 \u0906\u0935\u093E\u091C\u093C \u0930\u093F\u0915\u0949\u0930\u094D\u0921 \u0915\u0930\u0928\u093E \u092C\u0902\u0926 \u0939\u094B \u091C\u093E\u0924\u093E \u0939\u0948\u0964 \u0930\u0926\u094D\u0926 \u0915\u0930\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F Control \u0926\u092C\u093E\u090F \u0930\u0916\u0924\u0947 \u0939\u0941\u090F Escape \u0926\u092C\u093E\u090F\u0901\u0964",
  "dsh-live-voice.recognition.language.automatic": "\u0938\u094D\u0935\u091A\u093E\u0932\u093F\u0924 \u2014 \u092D\u093E\u0937\u093E \u092A\u0939\u091A\u093E\u0928\u0947\u0902",
  "dsh-live-voice.recognition.language.label": "\u0935\u093E\u0915\u094D \u092A\u0939\u091A\u093E\u0928 \u0915\u0940 \u092D\u093E\u0937\u093E",
  "dsh-live-voice.recognition.manualSend.help": "\u092A\u0939\u091A\u093E\u0928\u093E \u0917\u092F\u093E \u092A\u093E\u0920 \u0938\u0902\u0926\u0947\u0936 \u092C\u0949\u0915\u094D\u0938 \u092E\u0947\u0902 \u0924\u092C \u0924\u0915 \u0930\u0939\u0924\u093E \u0939\u0948 \u091C\u092C \u0924\u0915 \u0906\u092A DSH \u0915\u0947 \u0938\u093E\u092E\u093E\u0928\u094D\u092F \u092D\u0947\u091C\u0947\u0902 \u092C\u091F\u0928 \u0915\u093E \u0909\u092A\u092F\u094B\u0917 \u0928\u0939\u0940\u0902 \u0915\u0930\u0924\u0947\u0964",
  "dsh-live-voice.recognition.maxUtterance.help": "\u092F\u0926\u093F \u092C\u094B\u0932\u0928\u093E \u092C\u093F\u0928\u093E \u0930\u0941\u0915\u0947 \u091C\u093E\u0930\u0940 \u0930\u0939\u0947, \u0924\u094B \u0907\u0938 \u0905\u0935\u0927\u093F \u0915\u0947 \u092C\u093E\u0926 \u0928\u092F\u093E \u091F\u094D\u0930\u093E\u0902\u0938\u0915\u094D\u0930\u093F\u092A\u094D\u0936\u0928 \u0916\u0902\u0921 \u0936\u0941\u0930\u0942 \u0915\u0930\u0947\u0902\u0964 \u0921\u093F\u092B\u093C\u0949\u0932\u094D\u091F: 60 \u0938\u0947\u0915\u0902\u0921\u0964",
  "dsh-live-voice.recognition.maxUtterance.label": "\u0932\u0917\u093E\u0924\u093E\u0930 \u092C\u094B\u0932\u0928\u0947 \u0915\u0940 \u0905\u0927\u093F\u0915\u0924\u092E \u0905\u0935\u0927\u093F (\u0938\u0947\u0915\u0902\u0921)",
  "dsh-live-voice.recognition.microphone.checking": "\u092E\u093E\u0907\u0915\u094D\u0930\u094B\u092B\u093C\u094B\u0928 \u0915\u0940 \u0909\u092A\u0932\u092C\u094D\u0927\u0924\u093E \u091C\u093E\u0901\u091A\u0940 \u091C\u093E \u0930\u0939\u0940 \u0939\u0948",
  "dsh-live-voice.recognition.microphone.device": "\u0907\u0928\u092A\u0941\u091F \u0921\u093F\u0935\u093E\u0907\u0938",
  "dsh-live-voice.recognition.microphone.failure": "\u092E\u093E\u0907\u0915\u094D\u0930\u094B\u092B\u093C\u094B\u0928: {reason}",
  "dsh-live-voice.recognition.microphone.ignore": "\u0938\u0902\u0926\u0947\u0936 \u092C\u0949\u0915\u094D\u0938 \u0915\u093E \u0935\u0949\u0907\u0938 \u0907\u0928\u092A\u0941\u091F \u0905\u0928\u0926\u0947\u0916\u093E \u0915\u0930\u0947\u0902",
  "dsh-live-voice.recognition.microphone.inputStatus": "\u092E\u093E\u0907\u0915\u094D\u0930\u094B\u092B\u093C\u094B\u0928 \u0907\u0928\u092A\u0941\u091F: {state}",
  "dsh-live-voice.recognition.microphone.label": "\u092E\u093E\u0907\u0915\u094D\u0930\u094B\u092B\u093C\u094B\u0928",
  "dsh-live-voice.recognition.microphone.permissionHelp": "\u092E\u093E\u0907\u0915\u094D\u0930\u094B\u092B\u093C\u094B\u0928 \u0915\u0940 \u0905\u0928\u0941\u092E\u0924\u093F \u0915\u0947\u0935\u0932 \u0924\u092D\u0940 \u092E\u093E\u0901\u0917\u0940 \u091C\u093E\u090F\u0917\u0940 \u091C\u092C \u0906\u092A \u0921\u093F\u0915\u094D\u091F\u0947\u0936\u0928 \u092F\u093E \u0935\u0949\u0907\u0938 \u092C\u093E\u0924\u091A\u0940\u0924 \u0936\u0941\u0930\u0942 \u0915\u0930\u0947\u0902\u0917\u0947\u0964",
  "dsh-live-voice.recognition.microphone.resume": "\u0938\u0941\u0928\u0928\u093E \u092B\u093F\u0930 \u0936\u0941\u0930\u0942 \u0915\u0930\u0947\u0902",
  "dsh-live-voice.recognition.microphone.starting": "\u092E\u093E\u0907\u0915\u094D\u0930\u094B\u092B\u093C\u094B\u0928 \u0936\u0941\u0930\u0942 \u0939\u094B \u0930\u0939\u093E \u0939\u0948\u2026",
  "dsh-live-voice.recognition.microphone.takeControl": "\u092E\u093E\u0907\u0915\u094D\u0930\u094B\u092B\u093C\u094B\u0928 \u0915\u093E \u0928\u093F\u092F\u0902\u0924\u094D\u0930\u0923 \u0932\u0947\u0902",
  "dsh-live-voice.recognition.minimumWords.enabled": "\u091B\u094B\u091F\u0947 \u0905\u0902\u0924\u093F\u092E \u091F\u094D\u0930\u093E\u0902\u0938\u0915\u094D\u0930\u093F\u092A\u094D\u0936\u0928 \u0916\u0902\u0921 \u0905\u0928\u0926\u0947\u0916\u093E \u0915\u0930\u0947\u0902",
  "dsh-live-voice.recognition.minimumWords.help": "\u0915\u092E \u0936\u092C\u094D\u0926\u094B\u0902 \u0935\u093E\u0932\u0947 \u0905\u0902\u0924\u093F\u092E \u0916\u0902\u0921 \u0938\u0902\u0926\u0947\u0936 \u092C\u0949\u0915\u094D\u0938 \u092F\u093E \u0938\u094D\u0935\u091A\u093E\u0932\u093F\u0924 \u092D\u0947\u091C\u0928\u0947 \u0915\u0940 \u092A\u094D\u0930\u0915\u094D\u0930\u093F\u092F\u093E \u0924\u0915 \u092A\u0939\u0941\u0901\u091A\u0928\u0947 \u0938\u0947 \u092A\u0939\u0932\u0947 \u0939\u0940 \u0905\u0928\u0926\u0947\u0916\u0947 \u0915\u0930 \u0926\u093F\u090F \u091C\u093E\u0924\u0947 \u0939\u0948\u0902\u0964",
  "dsh-live-voice.recognition.minimumWords.label": "\u0939\u0930 \u0905\u0902\u0924\u093F\u092E \u0916\u0902\u0921 \u092E\u0947\u0902 \u0928\u094D\u092F\u0942\u0928\u0924\u092E \u0936\u092C\u094D\u0926",
  "dsh-live-voice.recognition.mode.label": "\u0938\u0941\u0928\u0928\u0947 \u0915\u093E \u092E\u094B\u0921",
  "dsh-live-voice.recognition.planned.parakeet": "NVIDIA Parakeet \u2014 \u091C\u0932\u094D\u0926 \u0906 \u0930\u0939\u093E \u0939\u0948",
  "dsh-live-voice.recognition.planned.sherpa": "sherpa-onnx \u0938\u094D\u091F\u094D\u0930\u0940\u092E\u093F\u0902\u0917 \u2014 \u091C\u0932\u094D\u0926 \u0906 \u0930\u0939\u093E \u0939\u0948",
  "dsh-live-voice.recognition.planned.vote": "\u091C\u0932\u094D\u0926 \u0906 \u0930\u0939\u093E \u0939\u0948 \u2014 \u0930\u093F\u092A\u0949\u091C\u093C\u093F\u091F\u0930\u0940 \u0915\u0947 \u0907\u0936\u094D\u092F\u0942 \u092E\u0947\u0902 \u0935\u094B\u091F \u0926\u0947\u0902",
  "dsh-live-voice.recognition.planned.voxtral": "Voxtral Realtime \u2014 \u091C\u0932\u094D\u0926 \u0906 \u0930\u0939\u093E \u0939\u0948",
  "dsh-live-voice.recognition.planned.webGpu": "\u092C\u094D\u0930\u093E\u0909\u091C\u093C\u0930 \u092E\u0947\u0902 WebGPU \u0907\u0928\u094D\u092B\u093C\u0930\u0947\u0902\u0938 \u2014 \u091C\u0932\u094D\u0926 \u0906 \u0930\u0939\u093E \u0939\u0948",
  "dsh-live-voice.recognition.presets.long.description": "\u0932\u0902\u092C\u0947 \u0938\u094B\u091A-\u0935\u093F\u091A\u093E\u0930 \u0935\u093E\u0932\u0947 \u0935\u093F\u0930\u093E\u092E\u094B\u0902 \u0924\u0915 \u092A\u094D\u0930\u0924\u0940\u0915\u094D\u0937\u093E \u0915\u0930\u0947\u0902\u0964",
  "dsh-live-voice.recognition.presets.long.label": "\u0932\u0902\u092C\u093E",
  "dsh-live-voice.recognition.presets.natural.description": "\u0935\u093E\u0915\u094D\u092F\u093E\u0902\u0936\u094B\u0902 \u0915\u0947 \u092C\u0940\u091A \u0938\u093E\u092E\u093E\u0928\u094D\u092F \u0935\u093F\u0930\u093E\u092E \u0915\u0940 \u0905\u0928\u0941\u092E\u0924\u093F \u0926\u0947\u0902\u0964",
  "dsh-live-voice.recognition.presets.natural.label": "\u0938\u094D\u0935\u093E\u092D\u093E\u0935\u093F\u0915",
  "dsh-live-voice.recognition.presets.short.description": "\u091B\u094B\u091F\u0947 \u0935\u093F\u0930\u093E\u092E \u0915\u0947 \u092C\u093E\u0926 \u091C\u0932\u094D\u0926\u0940 \u092D\u0947\u091C\u0947\u0902\u0964",
  "dsh-live-voice.recognition.presets.short.label": "\u091B\u094B\u091F\u093E",
  "dsh-live-voice.recognition.providerSettings.help": "\u092A\u094D\u0930\u0926\u093E\u0924\u093E \u0915\u0940 \u0938\u0947\u091F\u093F\u0902\u0917\u094D\u0938 \u091A\u0941\u0928\u0947 \u0917\u090F \u0935\u093E\u0915\u094D \u092A\u0939\u091A\u093E\u0928 \u0907\u0902\u091C\u0928 \u0915\u0947 \u0905\u0928\u0941\u0938\u093E\u0930 \u092C\u0926\u0932\u0924\u0940 \u0939\u0948\u0902\u0964",
  "dsh-live-voice.recognition.qwen.captureHelp": "\u0911\u0921\u093F\u092F\u094B \u0915\u094B \u092A\u0942\u0930\u0947 \u0915\u0925\u0928\u094B\u0902 \u0935\u093E\u0932\u0947 WAV \u0916\u0902\u0921\u094B\u0902 \u092E\u0947\u0902 \u092C\u093E\u0901\u091F\u0915\u0930, \u092A\u094D\u0930\u092E\u093E\u0923\u0940\u0915\u0943\u0924 DSH \u0915\u0947 \u091C\u093C\u0930\u093F\u090F \u0939\u094B\u0938\u094D\u091F \u092A\u0930 \u0938\u094D\u0925\u093E\u0928\u0940\u092F \u0930\u0942\u092A \u0938\u0947 \u091A\u0932 \u0930\u0939\u0947 Qwen3 ASR \u092E\u0949\u0921\u0932 \u0915\u094B \u092D\u0947\u091C\u093E \u091C\u093E\u0924\u093E \u0939\u0948\u0964",
  "dsh-live-voice.recognition.qwen.connectionSuccess": "\u0915\u0928\u0947\u0915\u094D\u0936\u0928 \u0938\u092B\u0932 \u0930\u0939\u093E\u0964 Qwen ASR \u0914\u0930 TTS \u0926\u094B\u0928\u094B\u0902 \u0932\u094B\u0921 \u0939\u0948\u0902\u0964 \u092C\u093F\u0928\u093E \u0938\u0939\u0947\u091C\u0947 \u092C\u0926\u0932\u093E\u0935 \u0932\u093E\u0917\u0942 \u0928\u0939\u0940\u0902 \u0915\u093F\u090F \u0917\u090F \u0939\u0948\u0902\u0964",
  "dsh-live-voice.recognition.qwen.endpointHelp": "HTTP API, \u0915\u0949\u0928\u094D\u092B\u093C\u093F\u0917\u0930 \u0915\u093F\u090F \u0917\u090F DSH \u0939\u094B\u0938\u094D\u091F URL \u092A\u0930 \u0939\u0948 (\u0921\u093F\u092B\u093C\u0949\u0932\u094D\u091F: http://127.0.0.1:8080/inference)\u0964 \u0911\u0921\u093F\u092F\u094B \u0915\u0947 \u0932\u093F\u090F \u092A\u094D\u0930\u092E\u093E\u0923\u0940\u0915\u0930\u0923 \u0935\u093E\u0932\u0947 DSH \u0939\u094B\u0938\u094D\u091F \u091F\u094D\u0930\u093E\u0902\u0938\u0915\u094D\u0930\u093F\u092A\u094D\u0936\u0928 \u0930\u0942\u091F \u0915\u093E \u0909\u092A\u092F\u094B\u0917 \u0939\u094B\u0924\u093E \u0939\u0948\u0964",
  "dsh-live-voice.recognition.qwen.hostHelp": "Qwen3 ASR + TTS \u0938\u0930\u094D\u0935\u0930 \u0915\u0940 \u092A\u0942\u0930\u0947 \u0939\u094B\u0938\u094D\u091F \u092A\u0930 \u0932\u093E\u0917\u0942 \u0939\u094B\u0928\u0947 \u0935\u093E\u0932\u0940 \u0938\u0947\u091F\u093F\u0902\u0917\u094D\u0938\u0964 \u0915\u094B\u0908 \u092D\u0940 HTTP \u092F\u093E HTTPS \u092C\u0947\u0938 URL \u0926\u0930\u094D\u091C \u0915\u0930\u0947\u0902 \u091C\u093F\u0938 \u0924\u0915 DSH \u0939\u094B\u0938\u094D\u091F \u092A\u0939\u0941\u0901\u091A \u0938\u0915\u0947\u0964 \u092C\u094D\u0930\u093E\u0909\u091C\u093C\u0930 \u092A\u094D\u0930\u092E\u093E\u0923\u0940\u0915\u0930\u0923 \u0935\u093E\u0932\u0947 DSH \u0930\u0942\u091F\u094B\u0902 \u0915\u0947 \u091C\u093C\u0930\u093F\u090F \u0907\u0938\u0947 \u090F\u0915\u094D\u0938\u0947\u0938 \u0915\u0930\u0924\u093E \u0939\u0948\u0964",
  "dsh-live-voice.recognition.qwen.label": "Qwen3 ASR \u2014 HTTP API",
  "dsh-live-voice.recognition.silenceDetection.duration": "\u092D\u0947\u091C\u0928\u0947 \u0938\u0947 \u092A\u0939\u0932\u0947 \u0915\u093E \u0935\u093F\u0930\u093E\u092E: {milliseconds} \u092E\u093F\u0932\u0940\u0938\u0947\u0915\u0902\u0921",
  "dsh-live-voice.recognition.silenceDetection.help": "\u0924\u092F \u0915\u0930\u0924\u093E \u0939\u0948 \u0915\u093F \u0930\u093F\u0915\u0949\u0930\u094D\u0921 \u0915\u0940 \u0917\u0908 \u0906\u0935\u093E\u091C\u093C \u0915\u094B \u092A\u0939\u091A\u093E\u0928 \u0915\u0947 \u0932\u093F\u090F \u092D\u0947\u091C\u0928\u0947 \u0938\u0947 \u092A\u0939\u0932\u0947 \u0935\u093F\u0930\u093E\u092E \u0915\u093F\u0924\u0928\u0940 \u0926\u0947\u0930 \u0930\u0939\u0928\u093E \u091A\u093E\u0939\u093F\u090F\u0964",
  "dsh-live-voice.recognition.silenceDetection.label": "\u092E\u094C\u0928 \u0915\u093E \u092A\u0924\u093E \u0932\u0917\u093E\u0928\u093E",
  "dsh-live-voice.recognition.silenceDetection.pauseLabel": "\u092D\u0947\u091C\u0928\u0947 \u0938\u0947 \u092A\u0939\u0932\u0947 \u0915\u093E \u0935\u093F\u0930\u093E\u092E",
  "dsh-live-voice.recognition.silenceDetection.title": "\u092E\u094C\u0928 \u0915\u093E \u092A\u0924\u093E \u0932\u0917\u093E\u0928\u0947 \u0915\u0940 \u0938\u0947\u091F\u093F\u0902\u0917\u094D\u0938",
  "dsh-live-voice.recognition.speakerMode.help": "\u0928\u093F\u092F\u0902\u0924\u094D\u0930\u093F\u0924 \u0938\u0941\u0928\u0928\u0947 \u0915\u093E \u092E\u094B\u0921 \u091C\u0935\u093E\u092C \u091A\u0932\u0924\u0947 \u0938\u092E\u092F \u092E\u093E\u0907\u0915\u094D\u0930\u094B\u092B\u093C\u094B\u0928 \u091B\u094B\u0921\u093C \u0926\u0947\u0924\u093E \u0939\u0948, \u0924\u093E\u0915\u093F \u0938\u094D\u092A\u0940\u0915\u0930 \u0915\u093E \u0911\u0921\u093F\u092F\u094B \u092A\u0939\u091A\u093E\u0928\u093E \u0928 \u091C\u093E\u090F\u0964 \u092C\u0940\u091A \u092E\u0947\u0902 \u0930\u094B\u0915\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F \u201C\u092E\u093E\u0907\u0915\u094D\u0930\u094B\u092B\u093C\u094B\u0928 \u0915\u093E \u0928\u093F\u092F\u0902\u0924\u094D\u0930\u0923 \u0932\u0947\u0902\u201D \u0915\u093E \u0909\u092A\u092F\u094B\u0917 \u0915\u0930\u0947\u0902\u0964",
  "dsh-live-voice.recognition.speakerMode.label": "\u0938\u094D\u092A\u0940\u0915\u0930 \u2014 \u0928\u093F\u092F\u0902\u0924\u094D\u0930\u093F\u0924 \u0938\u0941\u0928\u0928\u093E",
  "dsh-live-voice.recognition.status.answer": "\u0909\u0924\u094D\u0924\u0930 \u092A\u0939\u091A\u093E\u0928\u093E \u091C\u093E \u0930\u0939\u093E \u0939\u0948\u2026",
  "dsh-live-voice.recognition.status.awaitingAnswer": "\u0906\u092A\u0915\u093E \u0909\u0924\u094D\u0924\u0930 \u0938\u0941\u0928\u093E \u091C\u093E \u0930\u0939\u093E \u0939\u0948\u2026",
  "dsh-live-voice.recognition.status.listening": "\u0938\u0941\u0928\u093E \u091C\u093E \u0930\u0939\u093E \u0939\u0948 \u2014 \u0906\u092A\u0915\u0947 \u092C\u094B\u0932\u0928\u0947 \u0915\u0940 \u092A\u094D\u0930\u0924\u0940\u0915\u094D\u0937\u093E \u0939\u0948",
  "dsh-live-voice.recognition.status.processing": "\u0935\u093E\u0915\u094D \u092A\u0939\u091A\u093E\u0928\u093E \u091C\u093E \u0930\u0939\u093E \u0939\u0948\u2026",
  "dsh-live-voice.recognition.status.unavailable": "\u0935\u093E\u0915\u094D \u092A\u0939\u091A\u093E\u0928 \u0909\u092A\u0932\u092C\u094D\u0927 \u0928\u0939\u0940\u0902 \u0939\u0948",
  "dsh-live-voice.recognition.voiceCommands.help": "\u0935\u093E\u0915\u094D\u092F\u093E\u0902\u0936\u094B\u0902 \u0915\u094B \u0905\u0932\u094D\u092A\u0935\u093F\u0930\u093E\u092E \u0938\u0947 \u0905\u0932\u0917 \u0915\u0930\u0947\u0902\u0964 \u092E\u093F\u0932\u093E\u0928 \u092E\u0947\u0902 \u092C\u0921\u093C\u0947-\u091B\u094B\u091F\u0947 \u0905\u0915\u094D\u0937\u0930, \u0909\u091A\u094D\u091A\u093E\u0930\u0923 \u091A\u093F\u0939\u094D\u0928, \u0935\u093F\u0930\u093E\u092E \u091A\u093F\u0939\u094D\u0928 \u0914\u0930 \u0905\u0924\u093F\u0930\u093F\u0915\u094D\u0924 \u0938\u094D\u092A\u0947\u0938 \u0905\u0928\u0926\u0947\u0916\u0947 \u0915\u093F\u090F \u091C\u093E\u0924\u0947 \u0939\u0948\u0902\u0964 \u092A\u0942\u0930\u093E \u0905\u0902\u0924\u093F\u092E \u0916\u0902\u0921 \u092E\u0947\u0932 \u0916\u093E\u0928\u093E \u091A\u093E\u0939\u093F\u090F\u0964",
  "dsh-live-voice.recognition.whisper.captureHelp": "\u0911\u0921\u093F\u092F\u094B \u0915\u094B \u092A\u0942\u0930\u0947 \u0915\u0925\u0928\u094B\u0902 \u0935\u093E\u0932\u0947 WAV \u0916\u0902\u0921\u094B\u0902 \u092E\u0947\u0902 \u092C\u093E\u0901\u091F\u0915\u0930 \u092A\u094D\u0930\u092E\u093E\u0923\u0940\u0915\u0943\u0924 DSH \u0915\u0947 \u091C\u093C\u0930\u093F\u090F \u092D\u0947\u091C\u093E \u091C\u093E\u0924\u093E \u0939\u0948, \u0914\u0930 \u0932\u0942\u092A\u092C\u0948\u0915 \u092A\u0924\u0947 \u092A\u0930 \u091A\u0932 \u0930\u0939\u0940 whisper.cpp HTTP \u0938\u0947\u0935\u093E \u0907\u0938\u0947 \u092A\u094D\u0930\u094B\u0938\u0947\u0938 \u0915\u0930\u0924\u0940 \u0939\u0948\u0964",
  "dsh-live-voice.recognition.whisper.connectionSuccess": "\u0915\u0928\u0947\u0915\u094D\u0936\u0928 \u0938\u092B\u0932 \u0930\u0939\u093E\u0964 \u0938\u094D\u0935\u093E\u0938\u094D\u0925\u094D\u092F \u091C\u093E\u0901\u091A \u090F\u0902\u0921\u092A\u0949\u0907\u0902\u091F \u0928\u0947 \u091C\u0935\u093E\u092C \u0926\u093F\u092F\u093E; \u091F\u094D\u0930\u093E\u0902\u0938\u0915\u094D\u0930\u093F\u092A\u094D\u0936\u0928 \u0915\u0940 \u091C\u093E\u0901\u091A \u0928\u0939\u0940\u0902 \u0915\u0940 \u0917\u0908\u0964 \u092C\u093F\u0928\u093E \u0938\u0939\u0947\u091C\u0947 \u092C\u0926\u0932\u093E\u0935 \u0932\u093E\u0917\u0942 \u0928\u0939\u0940\u0902 \u0915\u093F\u090F \u0917\u090F \u0939\u0948\u0902\u0964",
  "dsh-live-voice.recognition.whisper.endpointHelp": "HTTP API, \u0915\u0949\u0928\u094D\u092B\u093C\u093F\u0917\u0930 \u0915\u093F\u090F \u0917\u090F \u092C\u0947\u0938 URL \u092A\u0930 \u0939\u0948 (\u0921\u093F\u092B\u093C\u0949\u0932\u094D\u091F: http://127.0.0.1:8080/)\u0964 POST /v1/audio/transcriptions \u0915\u0947 \u0938\u093E\u0925 \u0938\u0902\u0917\u0924 \u0939\u0948\u0964",
  "dsh-live-voice.recognition.whisper.healthFailed": "Whisper \u0915\u0940 \u0938\u094D\u0935\u093E\u0938\u094D\u0925\u094D\u092F \u091C\u093E\u0901\u091A \u0935\u093F\u092B\u0932 \u0930\u0939\u0940\u0964",
  "dsh-live-voice.recognition.whisper.label": "Whisper \u2014 HTTP API",
  "dsh-live-voice.recognition.whisper.requestFailed": "Whisper \u0938\u0947\u091F\u093F\u0902\u0917\u094D\u0938 \u0915\u093E \u0905\u0928\u0941\u0930\u094B\u0927 \u0935\u093F\u092B\u0932 \u0930\u0939\u093E\u0964",
  "dsh-live-voice.recognition.whisper.restartRequired": "Whisper \u0938\u0947\u091F\u093F\u0902\u0917\u094D\u0938 \u0915\u0947 \u0930\u0942\u091F \u0932\u094B\u0921 \u0928\u0939\u0940\u0902 \u0939\u0948\u0902\u0964 \u0905\u092A\u0921\u0947\u091F \u0915\u093F\u090F \u0917\u090F \u092A\u094D\u0932\u0917\u0907\u0928 \u0930\u0942\u091F \u0932\u094B\u0921 \u0915\u0930\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F DSH \u0938\u0930\u094D\u0935\u0930 \u0915\u094B \u0938\u093E\u092E\u093E\u0928\u094D\u092F \u0930\u0942\u092A \u0938\u0947 \u092A\u0941\u0928\u0903 \u0936\u0941\u0930\u0942 \u0915\u0930\u0928\u093E \u0939\u094B\u0917\u093E; \u0915\u0947\u0935\u0932 \u092F\u0939 \u092A\u0947\u091C \u0930\u0940\u092B\u093C\u094D\u0930\u0947\u0936 \u0915\u0930\u0928\u093E \u092A\u0930\u094D\u092F\u093E\u092A\u094D\u0924 \u0928\u0939\u0940\u0902 \u0939\u0948\u0964",
  "dsh-live-voice.recognition.whisper.save": "Whisper \u0938\u0947\u091F\u093F\u0902\u0917\u094D\u0938 \u0938\u0939\u0947\u091C\u0947\u0902",
  "dsh-live-voice.recognition.whisper.saved": "DSH \u0939\u094B\u0938\u094D\u091F \u092A\u0930 \u0938\u0939\u0947\u091C\u093E \u0917\u092F\u093E\u0964 \u0939\u094B\u0938\u094D\u091F \u092A\u0930 \u091A\u0932 \u0930\u0939\u0947 \u091F\u094D\u0930\u093E\u0902\u0938\u0915\u094D\u0930\u093F\u092A\u094D\u0936\u0928 \u0905\u0928\u0941\u0930\u094B\u0927 \u0930\u0926\u094D\u0926 \u0915\u0930 \u0926\u093F\u090F \u0917\u090F\u0964",
  "dsh-live-voice.recognition.whisper.signInRequired": "Whisper \u0938\u0947\u091F\u093F\u0902\u0917\u094D\u0938 \u092A\u094D\u0930\u092C\u0902\u0927\u093F\u0924 \u0915\u0930\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F DSH \u092E\u0947\u0902 \u0938\u093E\u0907\u0928 \u0907\u0928 \u0915\u0930\u0947\u0902\u0964",
  "dsh-live-voice.settings.autoSend.cancel": "\u0938\u094D\u0935\u091A\u093E\u0932\u093F\u0924 \u092D\u0947\u091C\u0928\u093E \u0930\u0926\u094D\u0926 \u0915\u0930\u0947\u0902",
  "dsh-live-voice.settings.autoSend.countdown": "{remaining} \u092E\u0947\u0902 \u092D\u0947\u091C\u093E \u091C\u093E\u090F\u0917\u093E\u2026",
  "dsh-live-voice.settings.autoSend.delay": "\u092E\u094C\u0928 \u0915\u0947 \u092C\u093E\u0926 \u092D\u0947\u091C\u0947\u0902",
  "dsh-live-voice.settings.close": "\u0935\u0949\u0907\u0938 \u0938\u0947\u091F\u093F\u0902\u0917\u094D\u0938 \u092C\u0902\u0926 \u0915\u0930\u0947\u0902",
  "dsh-live-voice.settings.delivery.label": "\u092D\u0947\u091C\u0928\u0947 \u0915\u093E \u092E\u094B\u0921",
  "dsh-live-voice.settings.delivery.manualLabel": "\u092C\u0902\u0926 \u2014 \u0938\u092E\u0940\u0915\u094D\u0937\u093E \u0915\u0930\u0915\u0947 \u092E\u0948\u0928\u094D\u092F\u0941\u0905\u0932 \u0930\u0942\u092A \u0938\u0947 \u092D\u0947\u091C\u0947\u0902",
  "dsh-live-voice.settings.delivery.queueLabel": "\u0915\u0924\u093E\u0930 \u2014 \u092E\u094C\u0928 \u0915\u0947 \u092C\u093E\u0926 \u0905\u092A\u0928\u0947 \u0906\u092A \u091C\u094B\u0921\u093C\u0947\u0902",
  "dsh-live-voice.settings.delivery.status": "\u0938\u094D\u0935\u091A\u093E\u0932\u093F\u0924 \u092D\u0947\u091C\u0928\u093E: {mode}",
  "dsh-live-voice.settings.delivery.steerDescription": "\u091A\u0932 \u0930\u0939\u0947 \u090F\u091C\u0947\u0902\u091F \u0915\u094B \u092D\u0947\u091C\u0947\u0902",
  "dsh-live-voice.settings.delivery.steerLabel": "\u0926\u093F\u0936\u093E \u0926\u0947\u0902 \u2014 \u091A\u0932 \u0930\u0939\u0947 \u090F\u091C\u0947\u0902\u091F \u0915\u094B \u0905\u092A\u0928\u0947 \u0906\u092A \u092D\u0947\u091C\u0947\u0902",
  "dsh-live-voice.settings.delivery.toggle": "\u0938\u094D\u0935\u091A\u093E\u0932\u093F\u0924 \u092D\u0947\u091C\u0928\u0947 \u0915\u093E \u092E\u094B\u0921",
  "dsh-live-voice.settings.engine.refresh": "\u0909\u092A\u0932\u092C\u094D\u0927 \u0907\u0902\u091C\u0928 \u0930\u0940\u092B\u093C\u094D\u0930\u0947\u0936 \u0915\u0930\u0947\u0902",
  "dsh-live-voice.settings.filters.title": "\u092B\u093C\u093F\u0932\u094D\u091F\u0930\u093F\u0902\u0917",
  "dsh-live-voice.settings.tabs.conversation": "\u092C\u093E\u0924\u091A\u0940\u0924",
  "dsh-live-voice.settings.tabs.recognition": "\u0935\u093E\u0915\u094D \u092A\u0939\u091A\u093E\u0928",
  "dsh-live-voice.settings.tabs.speak": "\u0935\u093E\u091A\u0928",
  "dsh-live-voice.settings.title": "Live Voice \u0938\u0947\u091F\u093F\u0902\u0917\u094D\u0938",
  "dsh-live-voice.settings.whisper.hostHelp": "\u092A\u0942\u0930\u0947 \u0939\u094B\u0938\u094D\u091F \u092A\u0930 \u0932\u093E\u0917\u0942 \u0939\u094B\u0928\u0947 \u0935\u093E\u0932\u0940 \u0938\u0947\u091F\u093F\u0902\u0917\u094D\u0938\u0964 \u0915\u0947\u0935\u0932 \u092C\u093F\u0928\u093E \u092A\u094D\u0930\u092E\u093E\u0923\u0940\u0915\u0930\u0923 \u0935\u093E\u0932\u0947 \u0932\u0942\u092A\u092C\u0948\u0915 HTTP URL (localhost, 127.0.0.1, [::1]) \u0938\u094D\u0935\u0940\u0915\u093E\u0930\u094D\u092F \u0939\u0948\u0902\u0964 \u0932\u0942\u092A\u092C\u0948\u0915 \u0915\u093E \u0905\u0930\u094D\u0925 DSH \u0939\u094B\u0938\u094D\u091F \u0939\u0948, \u092F\u0939 \u092C\u094D\u0930\u093E\u0909\u091C\u093C\u0930 \u0928\u0939\u0940\u0902\u0964 \u0938\u092D\u0940 \u0938\u094D\u0935\u093E\u0938\u094D\u0925\u094D\u092F \u091C\u093E\u0901\u091A \u0914\u0930 \u0911\u0921\u093F\u092F\u094B \u0905\u0928\u0941\u0930\u094B\u0927 \u092A\u094D\u0930\u092E\u093E\u0923\u0940\u0915\u0930\u0923 \u0935\u093E\u0932\u0947 \u092C\u0948\u0915\u090F\u0902\u0921 \u0915\u0947 \u091C\u093C\u0930\u093F\u090F \u091A\u0932\u0924\u0947 \u0939\u0948\u0902\u0964",
  "dsh-live-voice.speak.agentContext.enabled": "\u090F\u091C\u0947\u0902\u091F \u0935\u0949\u0907\u0938 \u0938\u0902\u0926\u0930\u094D\u092D \u0938\u0915\u094D\u0937\u092E \u0915\u0930\u0947\u0902",
  "dsh-live-voice.speak.agentContext.enabledHelp": "\u0938\u0915\u094D\u0937\u092E \u0939\u094B\u0928\u0947 \u092A\u0930, \u0928\u0940\u091A\u0947 \u0926\u093F\u092F\u093E \u0917\u092F\u093E \u0938\u0902\u0926\u0930\u094D\u092D \u090F\u091C\u0947\u0902\u091F \u0915\u094B \u092C\u0924\u093E\u0924\u093E \u0939\u0948 \u0915\u093F \u0909\u0938\u0915\u0947 \u0909\u0924\u094D\u0924\u0930 \u091C\u093C\u094B\u0930 \u0938\u0947 \u092C\u094B\u0932\u0947 \u091C\u093E\u090F\u0902\u0917\u0947\u0964",
  "dsh-live-voice.speak.agentContext.help": "\u092F\u0939 \u0905\u0902\u0917\u094D\u0930\u0947\u091C\u093C\u0940 \u0928\u093F\u0930\u094D\u0926\u0947\u0936 \u090F\u091C\u0947\u0902\u091F \u0915\u094B \u0915\u0947\u0935\u0932 \u0938\u0915\u094D\u0930\u093F\u092F \u0935\u0949\u0907\u0938 \u092C\u093E\u0924\u091A\u0940\u0924 \u0915\u0947 \u0926\u094C\u0930\u093E\u0928 \u092D\u0947\u091C\u093E \u091C\u093E\u0924\u093E \u0939\u0948, \u091C\u092C \u0938\u0939\u093E\u092F\u0915 \u0915\u093E \u0938\u094D\u0935\u091A\u093E\u0932\u093F\u0924 \u092D\u093E\u0937\u0923 \u0938\u0915\u094D\u0937\u092E \u0939\u094B.",
  "dsh-live-voice.speak.agentContext.label": "\u090F\u091C\u0947\u0902\u091F \u0935\u0949\u0907\u0938 \u0938\u0902\u0926\u0930\u094D\u092D",
  "dsh-live-voice.speak.agentContext.restore": "\u0921\u093F\u092B\u093C\u0949\u0932\u094D\u091F \u092C\u0939\u093E\u0932 \u0915\u0930\u0947\u0902",
  "dsh-live-voice.speak.autoPlayback.enabled": "\u0938\u0939\u093E\u092F\u0915 \u0915\u0947 \u0928\u090F \u0938\u0902\u0926\u0947\u0936 \u0905\u092A\u0928\u0947 \u0906\u092A \u092A\u0922\u093C\u0915\u0930 \u0938\u0941\u0928\u093E\u090F\u0901",
  "dsh-live-voice.speak.autoPlayback.help": "\u0935\u0949\u0907\u0938 \u092C\u093E\u0924\u091A\u0940\u0924 \u0915\u0947 \u0926\u094C\u0930\u093E\u0928 \u0938\u0939\u093E\u092F\u0915 \u0915\u0947 \u0935\u093E\u0915\u094D\u092F\u093E\u0902\u0936 \u0905\u092A\u0928\u0947 \u0906\u092A \u092A\u0922\u093C\u0915\u0930 \u0938\u0941\u0928\u093E\u090F \u091C\u093E\u0924\u0947 \u0939\u0948\u0902\u0964 \u091C\u092C \u0906\u092A \u092C\u094B\u0932 \u0930\u0939\u0947 \u0939\u094B\u0902, \u0924\u094B \u092A\u094D\u0932\u0947\u092C\u0948\u0915 \u092A\u094D\u0930\u0924\u0940\u0915\u094D\u0937\u093E \u0915\u0930\u0924\u093E \u0939\u0948\u0964",
  "dsh-live-voice.speak.autoPlayback.label": "\u0938\u0939\u093E\u092F\u0915 \u0915\u093E \u0938\u094D\u0935\u091A\u093E\u0932\u093F\u0924 \u0935\u093E\u091A\u0928",
  "dsh-live-voice.speak.autoPlayback.remainingOne": "\u0938\u0939\u093E\u092F\u0915 \u0915\u093E \u0938\u094D\u0935\u091A\u093E\u0932\u093F\u0924 \u0935\u093E\u091A\u0928: {state} \u2014 {count} \u0935\u093E\u0915\u094D \u0916\u0902\u0921 \u0936\u0947\u0937 \u0939\u0948",
  "dsh-live-voice.speak.autoPlayback.remainingOther": "\u0938\u0939\u093E\u092F\u0915 \u0915\u093E \u0938\u094D\u0935\u091A\u093E\u0932\u093F\u0924 \u0935\u093E\u091A\u0928: {state} \u2014 {count} \u0935\u093E\u0915\u094D \u0916\u0902\u0921 \u0936\u0947\u0937 \u0939\u0948\u0902",
  "dsh-live-voice.speak.autoPlayback.status": "\u0938\u0939\u093E\u092F\u0915 \u0915\u093E \u0938\u094D\u0935\u091A\u093E\u0932\u093F\u0924 \u0935\u093E\u091A\u0928: {state}",
  "dsh-live-voice.speak.browser.automaticVoice": "\u0938\u094D\u0925\u093E\u0928\u0940\u092F \u0906\u0935\u093E\u091C\u093C \u0915\u093E \u0938\u094D\u0935\u091A\u093E\u0932\u093F\u0924 \u091A\u092F\u0928",
  "dsh-live-voice.speak.browser.label": "\u092C\u094D\u0930\u093E\u0909\u091C\u093C\u0930 \u0935\u093E\u091A\u0928 \u2014 \u0907\u0938 \u0921\u093F\u0935\u093E\u0907\u0938 \u092A\u0930 \u0911\u0921\u093F\u092F\u094B",
  "dsh-live-voice.speak.browser.name": "\u092C\u094D\u0930\u093E\u0909\u091C\u093C\u0930 \u0935\u093E\u091A\u0928",
  "dsh-live-voice.speak.browser.outputHelp": "\u092C\u094D\u0930\u093E\u0909\u091C\u093C\u0930 \u0915\u093E \u0935\u093E\u0915\u094D \u0938\u0902\u0936\u094D\u0932\u0947\u0937\u0923 \u091A\u0941\u0928\u0947 \u0917\u090F \u0906\u0909\u091F\u092A\u0941\u091F \u0921\u093F\u0935\u093E\u0907\u0938 \u0915\u094B \u0905\u0928\u0926\u0947\u0916\u093E \u0915\u0930 \u0938\u0915\u0924\u093E \u0939\u0948; \u092F\u0939 \u092C\u094D\u0930\u093E\u0909\u091C\u093C\u0930 API \u0938\u093E\u092E\u093E\u0928\u094D\u092F\u0924\u0903 \u0938\u093F\u0938\u094D\u091F\u092E \u0915\u0947 \u0921\u093F\u092B\u093C\u0949\u0932\u094D\u091F \u0915\u093E \u0909\u092A\u092F\u094B\u0917 \u0915\u0930\u0924\u093E \u0939\u0948\u0964",
  "dsh-live-voice.speak.browser.voice": "\u092C\u094D\u0930\u093E\u0909\u091C\u093C\u0930 \u0915\u0940 \u0938\u094D\u0925\u093E\u0928\u0940\u092F \u0906\u0935\u093E\u091C\u093C",
  "dsh-live-voice.speak.engine.label": "\u0935\u093E\u0915\u094D \u0938\u0902\u0936\u094D\u0932\u0947\u0937\u0923 \u0907\u0902\u091C\u0928",
  "dsh-live-voice.speak.engine.playbackHelp": "Qwen \u0914\u0930 macOS say DSH \u0939\u094B\u0938\u094D\u091F \u092A\u0930 \u0906\u0935\u093E\u091C\u093C \u092C\u0928\u093E\u0924\u0947 \u0939\u0948\u0902; \u0915\u0949\u092E\u094D\u092A\u0948\u0915\u094D\u091F AAC/M4A \u0911\u0921\u093F\u092F\u094B \u0907\u0938 \u092C\u094D\u0930\u093E\u0909\u091C\u093C\u0930 \u092E\u0947\u0902 \u091A\u0932\u0924\u093E \u0939\u0948\u0964 \u092C\u094D\u0930\u093E\u0909\u091C\u093C\u0930 \u0938\u094D\u092A\u0940\u091A \u0907\u0938\u0940 \u0921\u093F\u0935\u093E\u0907\u0938 \u092A\u0930 \u092C\u0928\u0924\u0940 \u0914\u0930 \u091A\u0932\u0924\u0940 \u0939\u0948\u0964",
  "dsh-live-voice.speak.filters.code.enabled": "\u092A\u0922\u093C\u0915\u0930 \u0938\u0941\u0928\u093E\u0928\u0947 \u0938\u0947 \u092A\u0939\u0932\u0947 Markdown \u0915\u094B\u0921 \u092C\u094D\u0932\u0949\u0915 \u092B\u093C\u093F\u0932\u094D\u091F\u0930 \u0915\u0930\u0947\u0902",
  "dsh-live-voice.speak.filters.code.maxLines": "\u0905\u0927\u093F\u0915\u0924\u092E \u0907\u0924\u0928\u0940 \u092A\u0902\u0915\u094D\u0924\u093F\u092F\u094B\u0902 \u0935\u093E\u0932\u0947 \u0915\u094B\u0921 \u092C\u094D\u0932\u0949\u0915 \u092A\u0922\u093C\u0947\u0902",
  "dsh-live-voice.speak.filters.code.notice": "\u0939\u092E\u093E\u0930\u0940 \u092C\u093E\u0924\u091A\u0940\u0924 \u092E\u0947\u0902 \u0926\u093F\u092F\u093E \u0917\u092F\u093E \u0915\u094B\u0921 \u0926\u0947\u0916\u0947\u0902",
  "dsh-live-voice.speak.filters.code.replacement": "\u092C\u0921\u093C\u0947 \u0915\u094B\u0921 \u092C\u094D\u0932\u0949\u0915 \u0915\u0940 \u091C\u0917\u0939 \u092A\u0922\u093C\u093E \u091C\u093E\u0928\u0947 \u0935\u093E\u0932\u093E \u0935\u093E\u0915\u094D\u092F\u093E\u0902\u0936",
  "dsh-live-voice.speak.interruption.disabledHelp": "\u0926\u0942\u0938\u0930\u093E \u0938\u0902\u0926\u0947\u0936 \u092D\u0947\u091C\u0928\u0947 \u0938\u0947 \u0938\u0939\u093E\u092F\u0915 \u0915\u093E \u0935\u0939 \u0911\u0921\u093F\u092F\u094B \u092C\u0902\u0926 \u0928\u0939\u0940\u0902 \u0939\u094B\u0924\u093E \u091C\u093F\u0938\u0947 \u0906\u092A \u0905\u092D\u0940 \u0938\u0941\u0928 \u0930\u0939\u0947 \u0939\u0948\u0902\u0964",
  "dsh-live-voice.speak.interruption.enabled": "\u092E\u0947\u0930\u0947 \u0938\u0902\u0926\u0947\u0936 \u092D\u0947\u091C\u0928\u0947 \u092A\u0930 \u0938\u0939\u093E\u092F\u0915 \u0915\u093E \u0935\u093E\u091A\u0928 \u092C\u0902\u0926 \u0915\u0930\u0947\u0902",
  "dsh-live-voice.speak.interruption.enabledHelp": "\u0928\u092F\u093E \u0909\u092A\u092F\u094B\u0917\u0915\u0930\u094D\u0924\u093E \u0938\u0902\u0926\u0947\u0936 \u092D\u0947\u091C\u0928\u0947 \u092F\u093E \u0909\u0938\u0938\u0947 \u091A\u0932 \u0930\u0939\u0947 \u090F\u091C\u0947\u0902\u091F \u0915\u094B \u0926\u093F\u0936\u093E \u0926\u0947\u0928\u0947 \u092A\u0930 \u0938\u0939\u093E\u092F\u0915 \u0915\u093E \u091A\u093E\u0932\u0942 \u092F\u093E \u0920\u0939\u0930\u093E \u0939\u0941\u0906 \u0935\u093E\u091A\u0928 \u092C\u0902\u0926 \u0939\u094B \u091C\u093E\u0924\u093E \u0939\u0948\u0964",
  "dsh-live-voice.speak.macos.label": "macOS say \u2014 \u0939\u094B\u0938\u094D\u091F \u092A\u0930 \u0911\u0921\u093F\u092F\u094B",
  "dsh-live-voice.speak.macos.name": "macOS say",
  "dsh-live-voice.speak.macos.outputHelp": "macOS say, DSH \u0939\u094B\u0938\u094D\u091F \u092A\u0930 \u091A\u0941\u0928\u0947 \u0917\u090F \u0906\u0909\u091F\u092A\u0941\u091F \u0915\u093E \u0909\u092A\u092F\u094B\u0917 \u0915\u0930\u0924\u093E \u0939\u0948\u0964",
  "dsh-live-voice.speak.output.checking": "\u0935\u093E\u0915\u094D \u0906\u0909\u091F\u092A\u0941\u091F \u091C\u093E\u0901\u091A\u093E \u091C\u093E \u0930\u0939\u093E \u0939\u0948\u2026",
  "dsh-live-voice.speak.output.device": "\u0906\u0909\u091F\u092A\u0941\u091F \u0921\u093F\u0935\u093E\u0907\u0938",
  "dsh-live-voice.speak.output.fallbackName": "\u0911\u0921\u093F\u092F\u094B \u0906\u0909\u091F\u092A\u0941\u091F",
  "dsh-live-voice.speak.output.stopTest": "\u0935\u093E\u091A\u0928 \u092A\u0930\u0940\u0915\u094D\u0937\u0923 \u092C\u0902\u0926 \u0915\u0930\u0947\u0902",
  "dsh-live-voice.speak.output.test": "\u091A\u0941\u0928\u0947 \u0917\u090F \u0935\u093E\u0915\u094D \u0906\u0909\u091F\u092A\u0941\u091F \u0915\u0940 \u091C\u093E\u0901\u091A \u0915\u0930\u0947\u0902",
  "dsh-live-voice.speak.output.testPhrase": "DSH Live Voice\u0964 \u091A\u0941\u0928\u093E \u0917\u092F\u093E \u0935\u093E\u0915\u094D \u0906\u0909\u091F\u092A\u0941\u091F \u0915\u093E\u092E \u0915\u0930 \u0930\u0939\u093E \u0939\u0948\u0964",
  "dsh-live-voice.speak.output.testing": "\u0935\u093E\u091A\u0928 \u0915\u093E \u092A\u0930\u0940\u0915\u094D\u0937\u0923 \u0939\u094B \u0930\u0939\u093E \u0939\u0948\u2026",
  "dsh-live-voice.speak.playback.message": "\u0938\u0902\u0926\u0947\u0936 \u092A\u0922\u093C\u0915\u0930 \u0938\u0941\u0928\u093E\u090F\u0901",
  "dsh-live-voice.speak.playback.next": "\u0905\u0917\u0932\u0947 \u0935\u093E\u0923\u0940 \u0916\u0902\u0921 \u092A\u0930 \u091C\u093E\u090F\u0901",
  "dsh-live-voice.speak.playback.pause": "\u0935\u093E\u091A\u0928 \u0920\u0939\u0930\u093E\u090F\u0901",
  "dsh-live-voice.speak.playback.resume": "\u0935\u093E\u091A\u0928 \u092B\u093F\u0930 \u0936\u0941\u0930\u0942 \u0915\u0930\u0947\u0902",
  "dsh-live-voice.speak.playback.stop": "\u0935\u093E\u091A\u0928 \u092C\u0902\u0926 \u0915\u0930\u0947\u0902",
  "dsh-live-voice.speak.playback.stopAll": "\u0938\u092D\u0940 \u0935\u093E\u091A\u0928 \u092C\u0902\u0926 \u0915\u0930\u0947\u0902",
  "dsh-live-voice.speak.qwen.connection": "Qwen \u0938\u0930\u094D\u0935\u0930 \u0915\u0928\u0947\u0915\u094D\u0936\u0928",
  "dsh-live-voice.speak.qwen.endpoint": "Qwen API \u0915\u093E \u092C\u0947\u0938 URL",
  "dsh-live-voice.speak.qwen.healthFailed": "Qwen \u0915\u0940 \u0938\u094D\u0935\u093E\u0938\u094D\u0925\u094D\u092F \u091C\u093E\u0901\u091A \u0935\u093F\u092B\u0932 \u0930\u0939\u0940\u0964",
  "dsh-live-voice.speak.qwen.label": "Qwen3 TTS \u2014 \u0938\u094D\u0925\u093E\u0928\u0940\u092F MLX \u0938\u0930\u094D\u0935\u0930",
  "dsh-live-voice.speak.qwen.name": "\u0938\u094D\u0925\u093E\u0928\u0940\u092F Qwen3",
  "dsh-live-voice.speak.qwen.requestFailed": "Qwen \u0938\u0947\u091F\u093F\u0902\u0917\u094D\u0938 \u0915\u093E \u0905\u0928\u0941\u0930\u094B\u0927 \u0935\u093F\u092B\u0932 \u0930\u0939\u093E\u0964",
  "dsh-live-voice.speak.qwen.restartRequired": "Qwen \u0938\u0947\u091F\u093F\u0902\u0917\u094D\u0938 \u0915\u0947 \u0930\u0942\u091F \u0932\u094B\u0921 \u0928\u0939\u0940\u0902 \u0939\u0948\u0902\u0964 \u0905\u092A\u0921\u0947\u091F \u0915\u093F\u090F \u0917\u090F \u092A\u094D\u0932\u0917\u0907\u0928 \u0930\u0942\u091F \u0932\u094B\u0921 \u0915\u0930\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F DSH \u0938\u0930\u094D\u0935\u0930 \u0915\u094B \u0938\u093E\u092E\u093E\u0928\u094D\u092F \u0930\u0942\u092A \u0938\u0947 \u092A\u0941\u0928\u0903 \u0936\u0941\u0930\u0942 \u0915\u0930\u0928\u093E \u0939\u094B\u0917\u093E; \u0915\u0947\u0935\u0932 \u092F\u0939 \u092A\u0947\u091C \u0930\u0940\u092B\u093C\u094D\u0930\u0947\u0936 \u0915\u0930\u0928\u093E \u092A\u0930\u094D\u092F\u093E\u092A\u094D\u0924 \u0928\u0939\u0940\u0902 \u0939\u0948\u0964",
  "dsh-live-voice.speak.qwen.save": "Qwen \u0938\u0947\u091F\u093F\u0902\u0917\u094D\u0938 \u0938\u0939\u0947\u091C\u0947\u0902",
  "dsh-live-voice.speak.qwen.saved": "DSH \u0939\u094B\u0938\u094D\u091F \u092A\u0930 \u0938\u0939\u0947\u091C\u093E \u0917\u092F\u093E\u0964 \u091A\u0932 \u0930\u0939\u0947 Qwen \u0905\u0928\u0941\u0930\u094B\u0927 \u0930\u0926\u094D\u0926 \u0915\u0930 \u0926\u093F\u090F \u0917\u090F\u0964",
  "dsh-live-voice.speak.qwen.signInRequired": "Qwen \u0938\u0947\u091F\u093F\u0902\u0917\u094D\u0938 \u092A\u094D\u0930\u092C\u0902\u0927\u093F\u0924 \u0915\u0930\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F DSH \u092E\u0947\u0902 \u0938\u093E\u0907\u0928 \u0907\u0928 \u0915\u0930\u0947\u0902\u0964",
  "dsh-live-voice.speak.qwen.test": "Qwen \u0938\u0930\u094D\u0935\u0930 \u0915\u0940 \u091C\u093E\u0901\u091A \u0915\u0930\u0947\u0902",
  "dsh-live-voice.speak.qwen.voice": "Qwen \u0915\u0940 \u0906\u0935\u093E\u091C\u093C",
  "dsh-live-voice.speak.qwen.voiceHelp": "\u0921\u093F\u092B\u093C\u0949\u0932\u094D\u091F \u0930\u0942\u092A \u0938\u0947 Aiden \u0915\u093E \u0909\u092A\u092F\u094B\u0917 \u0939\u094B\u0924\u093E \u0939\u0948\u0964 \u092F\u0947 \u092A\u0939\u0932\u0947 \u0938\u0947 \u0924\u092F \u0906\u0935\u093E\u091C\u093C\u0947\u0902 \u092C\u094D\u0930\u093E\u091C\u093C\u0940\u0932\u093F\u092F\u093E\u0908 \u092A\u0941\u0930\u094D\u0924\u0917\u093E\u0932\u0940 \u0915\u0947 \u092E\u0942\u0932 \u0935\u0915\u094D\u0924\u093E\u0913\u0902 \u0915\u0940 \u0906\u0935\u093E\u091C\u093C\u0947\u0902 \u0928\u0939\u0940\u0902 \u0939\u0948\u0902\u0964",
  "dsh-live-voice.speak.qwen.voices.aiden": "Aiden \u2014 \u092A\u0941\u0930\u0941\u0937, \u0905\u092E\u0947\u0930\u093F\u0915\u0940 \u0905\u0902\u0917\u094D\u0930\u0947\u091C\u093C\u0940",
  "dsh-live-voice.speak.qwen.voices.dylan": "Dylan \u2014 \u092A\u0941\u0930\u0941\u0937, \u092C\u0940\u091C\u093F\u0902\u0917 \u091A\u0940\u0928\u0940",
  "dsh-live-voice.speak.qwen.voices.eric": "Eric \u2014 \u092A\u0941\u0930\u0941\u0937, \u0938\u093F\u091A\u0941\u0906\u0928 \u091A\u0940\u0928\u0940",
  "dsh-live-voice.speak.qwen.voices.onoAnna": "Ono Anna \u2014 \u092E\u0939\u093F\u0932\u093E, \u091C\u093E\u092A\u093E\u0928\u0940",
  "dsh-live-voice.speak.qwen.voices.ryan": "Ryan \u2014 \u092A\u0941\u0930\u0941\u0937, \u0905\u0902\u0917\u094D\u0930\u0947\u091C\u093C\u0940",
  "dsh-live-voice.speak.qwen.voices.serena": "Serena \u2014 \u092E\u0939\u093F\u0932\u093E, \u091A\u0940\u0928\u0940",
  "dsh-live-voice.speak.qwen.voices.sohee": "Sohee \u2014 \u092E\u0939\u093F\u0932\u093E, \u0915\u094B\u0930\u093F\u092F\u093E\u0908",
  "dsh-live-voice.speak.qwen.voices.uncleFu": "Uncle Fu \u2014 \u092A\u0941\u0930\u0941\u0937, \u091A\u0940\u0928\u0940",
  "dsh-live-voice.speak.qwen.voices.vivian": "Vivian \u2014 \u092E\u0939\u093F\u0932\u093E, \u091A\u0940\u0928\u0940",
  "dsh-live-voice.speak.rate.help": "\u0938\u093E\u092A\u0947\u0915\u094D\u0937 \u0917\u0924\u093F: 1 \u0938\u093E\u092E\u093E\u0928\u094D\u092F \u0939\u0948\u0964",
  "dsh-live-voice.speak.rate.label": "\u092C\u094B\u0932\u0928\u0947 \u0915\u0940 \u0917\u0924\u093F",
  "dsh-live-voice.speak.responseDelay.help": "\u0906\u092A\u0915\u0947 \u092C\u094B\u0932\u0928\u093E \u092C\u0902\u0926 \u0915\u0930\u0928\u0947 \u0915\u0947 \u092C\u093E\u0926 \u0938\u0939\u093E\u092F\u0915 \u0915\u093E \u0938\u094D\u0935\u091A\u093E\u0932\u093F\u0924 \u092A\u094D\u0932\u0947\u092C\u0948\u0915 \u0907\u0924\u0928\u0940 \u0926\u0947\u0930 \u0924\u0915 \u0932\u0917\u093E\u0924\u093E\u0930 \u092E\u094C\u0928 \u0930\u0939\u0928\u0947 \u0915\u0940 \u092A\u094D\u0930\u0924\u0940\u0915\u094D\u0937\u093E \u0915\u0930\u0924\u093E \u0939\u0948\u0964 \u0926\u094B\u092C\u093E\u0930\u093E \u092C\u094B\u0932\u0928\u0947 \u092A\u0930 \u092A\u094D\u0930\u0924\u0940\u0915\u094D\u0937\u093E \u092B\u093F\u0930 \u0938\u0947 \u0936\u0941\u0930\u0942 \u0939\u094B\u0924\u0940 \u0939\u0948\u0964",
  "dsh-live-voice.speak.responseDelay.label": "\u0938\u0939\u093E\u092F\u0915 \u0915\u0947 \u091C\u0935\u093E\u092C \u0915\u093E \u0935\u093F\u0932\u0902\u092C",
  "dsh-live-voice.speak.segmentGap.help": "\u0932\u0917\u093E\u0924\u093E\u0930 \u092C\u094B\u0932\u0947 \u0917\u090F \u0939\u093F\u0938\u094D\u0938\u094B\u0902 \u0915\u0947 \u092C\u0940\u091A \u0907\u0924\u0928\u0947 \u092E\u093F\u0932\u0940\u0938\u0947\u0915\u0902\u0921 \u0930\u0941\u0915\u0947\u0902\u0964 \u0921\u093F\u092B\u093C\u0949\u0932\u094D\u091F 200 ms \u0939\u0948\u0964",
  "dsh-live-voice.speak.segmentGap.label": "\u092C\u094B\u0932\u0947 \u0917\u090F \u0939\u093F\u0938\u094D\u0938\u094B\u0902 \u0915\u0947 \u092C\u0940\u091A \u0935\u093F\u0930\u093E\u092E",
  "dsh-live-voice.speak.status.paused": "\u0935\u093E\u091A\u0928 \u0920\u0939\u0930\u093E \u0939\u0941\u0906 \u0939\u0948",
  "dsh-live-voice.speak.status.playing": "\u092A\u0922\u093C\u0915\u0930 \u0938\u0941\u0928\u093E\u092F\u093E \u091C\u093E \u0930\u0939\u093E \u0939\u0948"
};
var hi_default = Object.freeze(hi);

// src/client/i18n/base.ts
var liveVoiceLanguageDefinitions = Object.freeze([
  { id: "pt-BR", label: "Portugu\xEAs (Brasil)", fallback: "en" },
  { id: "fr", label: "Fran\xE7ais", fallback: "en" },
  { id: "es", label: "Espa\xF1ol", fallback: "en" },
  { id: "hi", label: "\u0939\u093F\u0928\u094D\u0926\u0940", fallback: "en" }
]);

// src/client/locale.ts
var LIVE_VOICE_LOCALE_NAMESPACE = "dsh-live-voice";
var LIVE_VOICE_LANGUAGES = liveVoiceLanguageDefinitions;
var liveVoiceDictionaries = Object.freeze({
  en: en_default,
  zh: zh_default,
  "pt-BR": pt_BR_default,
  fr: fr_default,
  es: es_default,
  hi: hi_default
});
function createFallbackTranslator(locale = "en") {
  return (key, params = {}) => {
    const template = liveVoiceDictionaries[locale]?.[key] ?? en_default[key] ?? key;
    return String(template).replace(
      /\{([A-Za-z0-9_]+)\}/g,
      (_, name) => String(params[name] ?? "{" + name + "}")
    );
  };
}
function registerLiveVoiceLocales(ctx) {
  if (!ctx.locale) return createFallbackTranslator();
  const registeredLanguages = new Set(
    (ctx.locale.getSnapshot?.().locales || []).map(
      (language) => language.id.toLowerCase()
    )
  );
  for (const language of LIVE_VOICE_LANGUAGES) {
    if (registeredLanguages.has(language.id.toLowerCase())) continue;
    ctx.effect(
      () => ctx.locale.addLanguage(language),
      "dsh-live-voice: " + language.id + " language"
    );
    registeredLanguages.add(language.id.toLowerCase());
  }
  for (const [locale, dictionary] of Object.entries(liveVoiceDictionaries))
    ctx.effect(
      () => ctx.locale.register(LIVE_VOICE_LOCALE_NAMESPACE, locale, dictionary),
      "dsh-live-voice: " + locale + " dictionary"
    );
  return ctx.locale.bind(LIVE_VOICE_LOCALE_NAMESPACE);
}

// src/client/releases.ts
var CURRENT_VERSION = "0.3.0";
var TESTED_DSH_VERSION = "0.1.6-alpha.2";
var REPOSITORY_URL = "https://github.com/victorwads/dsh-live-voice";
var RELEASES_URL = `${REPOSITORY_URL}/releases`;
var LATEST_RELEASE_API_URL = "https://api.github.com/repos/victorwads/dsh-live-voice/releases/latest";
var RELEASE_CHECK_STORAGE_KEY = "dsh-live-voice.latest-release-check";
var RELEASE_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1e3;
var LIVE_VOICE_BADGE_URL = "https://cdn.simpleicons.org/npm/white";
var DSH_BADGE_URL = "https://cdn.simpleicons.org/deepseek/white";
var TESTED_DSH_RELEASE_URL = `https://github.com/deepseek-ai/deepseek-harness/releases/tag/v${TESTED_DSH_VERSION}`;
function versionParts(version) {
  const normalized = String(version || "").trim().replace(/^v/i, "").split("+", 1)[0];
  const [core = "", prerelease = ""] = normalized.split("-", 2);
  const numbers = core.split(".").map((part) => {
    const match = part.match(/^\d+/);
    return match ? Number(match[0]) : 0;
  });
  while (numbers.length < 3) numbers.push(0);
  return { numbers, prerelease: prerelease ? prerelease.split(".") : [] };
}
function compareIdentifier(left, right) {
  const leftNumber = /^\d+$/.test(left) ? Number(left) : null;
  const rightNumber = /^\d+$/.test(right) ? Number(right) : null;
  if (leftNumber !== null && rightNumber !== null) return Math.sign(leftNumber - rightNumber);
  if (leftNumber !== null) return -1;
  if (rightNumber !== null) return 1;
  return left.localeCompare(right);
}
function compareVersions(left, right) {
  const a = versionParts(left);
  const b = versionParts(right);
  for (let index = 0; index < Math.max(a.numbers.length, b.numbers.length); index++) {
    const difference = (a.numbers[index] || 0) - (b.numbers[index] || 0);
    if (difference) return Math.sign(difference);
  }
  if (!a.prerelease.length && !b.prerelease.length) return 0;
  if (!a.prerelease.length) return 1;
  if (!b.prerelease.length) return -1;
  for (let index = 0; index < Math.max(a.prerelease.length, b.prerelease.length); index++) {
    if (a.prerelease[index] === void 0) return -1;
    if (b.prerelease[index] === void 0) return 1;
    const difference = compareIdentifier(a.prerelease[index], b.prerelease[index]);
    if (difference) return difference;
  }
  return 0;
}
function readCached(storage, now) {
  try {
    const cached = JSON.parse(storage?.getItem(RELEASE_CHECK_STORAGE_KEY) || "null");
    if (cached && Number.isFinite(cached.checkedAt) && now - cached.checkedAt >= 0 && now - cached.checkedAt < RELEASE_CHECK_INTERVAL_MS)
      return cached;
  } catch {
  }
  return null;
}
function writeCached(storage, value) {
  try {
    storage?.setItem(RELEASE_CHECK_STORAGE_KEY, JSON.stringify(value));
  } catch {
  }
}
async function checkLatestRelease({
  fetchImpl = globalThis.window?.fetch?.bind(globalThis.window),
  storage = globalThis.window?.localStorage,
  now = Date.now()
} = {}) {
  const cached = readCached(storage, now);
  if (cached) return cached;
  const attempted = { checkedAt: now, release: null };
  writeCached(storage, attempted);
  if (typeof fetchImpl !== "function") return attempted;
  try {
    const response = await fetchImpl(LATEST_RELEASE_API_URL, {
      headers: { Accept: "application/vnd.github+json" }
    });
    if (!response.ok) return attempted;
    const body = await response.json();
    if (typeof body?.tag_name !== "string" || !body.tag_name.trim()) return attempted;
    const release = {
      tag: body.tag_name.trim(),
      url: typeof body.html_url === "string" && body.html_url.startsWith("https://github.com/") ? body.html_url : RELEASES_URL
    };
    const result = { checkedAt: now, release };
    writeCached(storage, result);
    return result;
  } catch {
    return attempted;
  }
}
function hasNewerRelease(release, currentVersion = CURRENT_VERSION) {
  return Boolean(release?.tag && compareVersions(release.tag, currentVersion) > 0);
}

// src/client/components.ts
var EMPTY_LOCALE_SNAPSHOT = Object.freeze({ revision: 0 });
function createComponents(React2, translate = createFallbackTranslator(), locale) {
  const t = (key, params) => translate(key, params);
  const localize = (value) => typeof value === "string" && value.startsWith("dsh-live-voice.") ? t(value) : value;
  const h = (type, props, ...children) => {
    const nextProps = props && typeof props === "object" ? {
      ...props,
      ...typeof props["aria-label"] === "string" ? { "aria-label": localize(props["aria-label"]) } : {},
      ...typeof props.title === "string" ? { title: localize(props.title) } : {},
      ...typeof props.label === "string" ? { label: localize(props.label) } : {},
      ...typeof props.visibleLabel === "string" ? { visibleLabel: localize(props.visibleLabel) } : {}
    } : props;
    return React2.createElement(type, nextProps, ...children.map(localize));
  };
  const WhisperSettings = createWhisperSettings(React2, t);
  const QwenSettings = createQwenSettings(React2, t);
  function useController(controller) {
    const localeSubscribe = React2.useCallback(
      (listener) => locale?.subscribe?.(listener) || (() => {
      }),
      []
    );
    const localeSnapshot = React2.useCallback(
      () => locale?.getSnapshot?.() || EMPTY_LOCALE_SNAPSHOT,
      []
    );
    React2.useSyncExternalStore(localeSubscribe, localeSnapshot, localeSnapshot);
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
      skipNext: "M5 5l10 7-10 7V5M19 5v14",
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
        {
          type: "button",
          "aria-label": "dsh-live-voice.commons.dismissError",
          onClick: onDismiss
        },
        "dsh-live-voice.commons.dismiss"
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
        label: pending ? "dsh-live-voice.recognition.microphone.checking" : unavailable ? reason || "dsh-live-voice.recognition.status.unavailable" : "dsh-live-voice.commons.conversation.start",
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
    const status = state.answeringQuestion && state.recognizing ? "dsh-live-voice.recognition.status.answer" : state.answeringQuestion && state.listening ? "dsh-live-voice.recognition.status.awaitingAnswer" : remaining ? t("dsh-live-voice.settings.autoSend.countdown", { remaining }) : state.starting ? "dsh-live-voice.recognition.microphone.starting" : state.paused ? "dsh-live-voice.speak.status.paused" : state.speaking ? "dsh-live-voice.speak.status.playing" : state.recognizing ? "dsh-live-voice.recognition.status.processing" : state.listening ? "dsh-live-voice.recognition.status.listening" : state.conversation ? "dsh-live-voice.commons.conversation.idle" : "dsh-live-voice.commons.status.ready";
    return h(
      "div",
      {
        className: overlay ? "dlv-bar-wrap dlv-question-overlay" : "dlv-bar-wrap",
        style: overlay ? overlayStyle : void 0
      },
      h(
        "div",
        {
          className: "dlv-pill",
          role: "group",
          "aria-label": "dsh-live-voice.commons.controls.title"
        },
        capture && !state.conversation ? h(Button, {
          label: "dsh-live-voice.recognition.dictation.cancel",
          icon: "close",
          onClick: () => invoke("cancelDictation")
        }) : null,
        state.conversation ? h(Button, {
          label: "dsh-live-voice.commons.conversation.end",
          icon: "close",
          onClick: () => invoke("endConversation")
        }) : null,
        h(Waveform, { controller, enabled: Boolean(state.listening) }),
        h("span", { className: "dlv-status", role: "status", "aria-live": "polite" }, status),
        h(Button, {
          className: "dlv-live-toggle",
          label: "dsh-live-voice.settings.delivery.toggle",
          title: t("dsh-live-voice.settings.delivery.status", {
            mode: state.settings.sendingMode === "steer" ? t("dsh-live-voice.settings.delivery.steerDescription") : state.settings.sendingMode === "queue" ? t("dsh-live-voice.commons.queue") : t("dsh-live-voice.commons.off")
          }),
          icon: state.settings.sendingMode === "queue" ? "queue" : "send",
          visibleLabel: state.settings.sendingMode === "steer" ? "dsh-live-voice.commons.send" : state.settings.sendingMode === "queue" ? "dsh-live-voice.commons.delivery.queueBadge" : "dsh-live-voice.commons.toggle.offBadge",
          "aria-label": t("dsh-live-voice.settings.delivery.status", {
            mode: t(
              state.settings.sendingMode === "steer" ? "dsh-live-voice.settings.delivery.steerDescription" : state.settings.sendingMode === "queue" ? "dsh-live-voice.commons.queue" : "dsh-live-voice.commons.manual"
            )
          }),
          "aria-pressed": ["queue", "steer"].includes(state.settings.sendingMode),
          "data-mode": state.settings.sendingMode || "manual",
          onClick: () => invoke("updateSettings", {
            sendingMode: !["queue", "steer"].includes(state.settings.sendingMode) ? "queue" : state.settings.sendingMode === "queue" ? "steer" : "manual"
          })
        }),
        h(Button, {
          className: `dlv-live-toggle${state.speechSegmentsRemaining > 0 ? " dlv-live-toggle-expanded" : ""}`,
          label: "dsh-live-voice.speak.autoPlayback.label",
          title: state.speechSegmentsRemaining > 0 ? t(
            state.speechSegmentsRemaining === 1 ? "dsh-live-voice.speak.autoPlayback.remainingOne" : "dsh-live-voice.speak.autoPlayback.remainingOther",
            {
              state: t(
                state.settings.announceAssistantMessages !== false ? "dsh-live-voice.commons.on" : "dsh-live-voice.commons.off"
              ),
              count: state.speechSegmentsRemaining
            }
          ) : t("dsh-live-voice.speak.autoPlayback.status", {
            state: t(
              state.settings.announceAssistantMessages !== false ? "dsh-live-voice.commons.on" : "dsh-live-voice.commons.off"
            )
          }),
          icon: state.settings.announceAssistantMessages !== false ? "speaker" : "speakerOff",
          visibleLabel: state.settings.announceAssistantMessages === false ? "dsh-live-voice.commons.toggle.offBadge" : state.speechSegmentsRemaining > 0 ? String(state.speechSegmentsRemaining) : "dsh-live-voice.commons.on",
          role: "switch",
          "aria-checked": state.settings.announceAssistantMessages !== false,
          onClick: () => invoke("updateSettings", {
            announceAssistantMessages: state.settings.announceAssistantMessages === false
          })
        }),
        remaining ? h(Button, {
          label: "dsh-live-voice.settings.autoSend.cancel",
          icon: "close",
          onClick: () => invoke("cancelAutoSend")
        }) : null,
        state.conversation && !capture ? h(Button, {
          label: "dsh-live-voice.recognition.microphone.takeControl",
          icon: "mic",
          onClick: () => invoke("startConversation")
        }) : null,
        capture ? h(Button, {
          className: "dlv-live-toggle dlv-mic-state",
          label: state.muted ? "dsh-live-voice.recognition.microphone.resume" : "dsh-live-voice.recognition.microphone.ignore",
          title: t("dsh-live-voice.recognition.microphone.inputStatus", {
            state: t(
              state.muted ? "dsh-live-voice.commons.input.ignoring" : "dsh-live-voice.commons.input.listening"
            )
          }),
          icon: state.muted ? "micOff" : "mic",
          visibleLabel: state.muted ? "dsh-live-voice.commons.input.ignoringBadge" : "dsh-live-voice.commons.input.listeningBadge",
          "aria-pressed": Boolean(state.muted),
          "data-muted": state.muted ? "true" : "false",
          onClick: () => invoke(state.muted ? "resumeListeningInput" : "muteListening")
        }) : null,
        // Keep the playback controls mounted during the configured gap between
        // queued segments; only Pause is unavailable when no audio is active.
        state.speechSegmentsRemaining > 1 ? h(Button, {
          label: "dsh-live-voice.speak.playback.next",
          icon: "skipNext",
          onClick: () => invoke("skipSpeechSegment")
        }) : null,
        state.speechSegmentsRemaining > 0 && state.capabilities[state.settings.engine]?.pause ? h(Button, {
          label: "dsh-live-voice.speak.playback.pause",
          icon: "pause",
          disabled: !state.speaking || state.paused,
          onClick: () => invoke("pauseSpeech")
        }) : null,
        state.paused && state.capabilities[state.settings.engine]?.resume ? h(Button, {
          label: "dsh-live-voice.speak.playback.resume",
          icon: "play",
          onClick: () => invoke("resumeSpeech")
        }) : null,
        state.speechSegmentsRemaining > 0 ? h(Button, {
          label: "dsh-live-voice.speak.playback.stopAll",
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
      label: label || (active ? "dsh-live-voice.speak.playback.stop" : "dsh-live-voice.speak.playback.message"),
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
    const [latestRelease, setLatestRelease] = React2.useState(null);
    React2.useEffect(() => {
      let active = true;
      void checkLatestRelease().then((result) => {
        if (active) setLatestRelease(result.release);
      });
      return () => {
        active = false;
      };
    }, []);
    const updateAvailable = hasNewerRelease(latestRelease);
    const tabs = [
      { id: "conversation", label: "dsh-live-voice.settings.tabs.conversation" },
      { id: "speech", label: "dsh-live-voice.settings.tabs.speak" },
      {
        id: "recognition",
        label: "dsh-live-voice.settings.tabs.recognition"
      }
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
      { value: "", label: "dsh-live-voice.commons.systemDefault" },
      ...audioDevices.filter(
        (device) => device.kind === kind && device.deviceId && device.deviceId !== "default"
      ).map((device, index) => ({
        value: device.deviceId,
        label: device.label || t("dsh-live-voice.commons.device.numberedLabel", {
          device: t(fallback),
          number: index + 1
        })
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
      {
        className: "dlv-settings",
        "aria-label": "dsh-live-voice.settings.title"
      },
      h(
        "div",
        { className: "dlv-settings-heading" },
        h("h3", null, "dsh-live-voice.commons.pluginName"),
        h(
          "div",
          {
            className: "dlv-version-badges",
            "aria-label": "dsh-live-voice.commons.version.title"
          },
          h(
            "a",
            {
              className: "dlv-shields-badge",
              href: RELEASES_URL,
              target: "_blank",
              rel: "noreferrer",
              "aria-label": t("dsh-live-voice.commons.version.link", {
                version: CURRENT_VERSION
              }),
              title: t("dsh-live-voice.commons.version.label", {
                version: CURRENT_VERSION
              })
            },
            h("img", { src: LIVE_VOICE_BADGE_URL, alt: "" }),
            h("span", null, `v${CURRENT_VERSION}`)
          ),
          h(
            "a",
            {
              className: "dlv-shields-badge",
              href: TESTED_DSH_RELEASE_URL,
              target: "_blank",
              rel: "noreferrer",
              "aria-label": t("dsh-live-voice.commons.version.compatibilityLink", {
                version: TESTED_DSH_VERSION
              }),
              title: t("dsh-live-voice.commons.version.compatibility", {
                version: TESTED_DSH_VERSION
              })
            },
            h("img", { src: DSH_BADGE_URL, alt: "" }),
            h("span", null, `v${TESTED_DSH_VERSION}`)
          )
        ),
        h("span", { className: "dlv-heading-divider", "aria-hidden": true }),
        updateAvailable ? h(
          "a",
          {
            className: "dlv-version-badge dlv-update-badge",
            href: latestRelease.url,
            target: "_blank",
            rel: "noreferrer",
            "aria-label": t("dsh-live-voice.commons.update.link", {
              version: latestRelease.tag
            }),
            title: t("dsh-live-voice.commons.update.version", {
              version: latestRelease.tag
            })
          },
          h("span", { className: "dlv-update-icon", "aria-hidden": true }, "\u2191"),
          "dsh-live-voice.commons.update.label"
        ) : null,
        updateAvailable ? h("span", { className: "dlv-heading-divider", "aria-hidden": true }) : null,
        h(
          "a",
          {
            className: "dlv-version-badge dlv-star-badge",
            href: REPOSITORY_URL,
            target: "_blank",
            rel: "noreferrer",
            "aria-label": "dsh-live-voice.commons.repository.starLink",
            title: "dsh-live-voice.commons.repository.starLink"
          },
          h("span", { className: "dlv-star-icon", "aria-hidden": true }, "\u2605"),
          "dsh-live-voice.commons.repository.starLabel"
        )
      ),
      onClose ? h(Button, {
        label: "dsh-live-voice.settings.close",
        icon: "close",
        onClick: onClose
      }) : null,
      h(
        "div",
        {
          className: "dlv-settings-tabs",
          role: "tablist",
          "aria-label": "dsh-live-voice.settings.title"
        },
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
          field("dsh-live-voice.speak.engine.label", "engine", [
            {
              value: "qwen-http",
              label: "dsh-live-voice.speak.qwen.label",
              disabled: capabilities["qwen-http"]?.supported === false
            },
            {
              value: "say",
              label: "dsh-live-voice.speak.macos.label",
              disabled: capabilities.say?.supported === false
            },
            {
              value: "browser",
              label: "dsh-live-voice.speak.browser.label",
              disabled: capabilities.browser?.supported === false
            }
          ]),
          settings.engine !== "say" ? field(
            "dsh-live-voice.speak.output.device",
            "outputDeviceId",
            deviceOptions("audiooutput", "dsh-live-voice.speak.output.fallbackName")
          ) : h("small", null, "dsh-live-voice.speak.macos.outputHelp"),
          settings.engine === "browser" ? h(
            React2.Fragment,
            null,
            h("small", null, "dsh-live-voice.speak.browser.outputHelp"),
            field("dsh-live-voice.speak.browser.voice", "voice", [
              { value: "", label: "dsh-live-voice.speak.browser.automaticVoice" },
              ...(capabilities.browser?.voices || []).map((voice) => ({
                value: voice.voiceURI || voice.name,
                label: voice.name + " \u2014 " + (voice.lang || t("dsh-live-voice.commons.unknownLanguage"))
              }))
            ])
          ) : null,
          settings.engine === "qwen-http" ? h(
            React2.Fragment,
            null,
            field(
              "dsh-live-voice.speak.qwen.voice",
              "voice",
              qwenVoices.map((voice) => ({
                value: voice.value,
                label: `dsh-live-voice.speak.qwen.voices.${voice.value === "uncle_fu" ? "uncleFu" : voice.value === "ono_anna" ? "onoAnna" : voice.value}`
              }))
            ),
            h("small", null, "dsh-live-voice.speak.qwen.voiceHelp"),
            subcard("dsh-live-voice.speak.qwen.connection", [
              h(QwenSettings, { key: "qwen-output-settings", controller })
            ])
          ) : null,
          subcard("dsh-live-voice.settings.filters.title", [
            h(
              "label",
              { key: "output-code-filter", className: "dlv-check" },
              h("input", {
                type: "checkbox",
                checked: settings.outputCodeFilterEnabled !== false,
                onChange: (event) => invoke("updateSettings", { outputCodeFilterEnabled: event.target.checked })
              }),
              " ",
              "dsh-live-voice.speak.filters.code.enabled"
            ),
            h(
              "label",
              { key: "output-code-lines" },
              "dsh-live-voice.speak.filters.code.maxLines",
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
              "dsh-live-voice.speak.filters.code.replacement",
              h("input", {
                type: "text",
                maxLength: 300,
                key: `output-code-notice-${settings.outputCodeNotice}`,
                defaultValue: settings.outputCodeNotice || t("dsh-live-voice.speak.filters.code.notice"),
                disabled: settings.outputCodeFilterEnabled === false,
                onBlur: (event) => invoke("updateSettings", { outputCodeNotice: event.target.value })
              })
            )
          ]),
          h(
            "div",
            { className: "dlv-settings-subcard" },
            h(
              "label",
              null,
              h("input", {
                type: "checkbox",
                checked: settings.agentVoiceContextEnabled !== false,
                onChange: (event) => invoke("updateSettings", { agentVoiceContextEnabled: event.target.checked })
              }),
              "dsh-live-voice.speak.agentContext.enabled"
            ),
            h("small", null, "dsh-live-voice.speak.agentContext.enabledHelp"),
            h("label", null, "dsh-live-voice.speak.agentContext.label"),
            h("small", null, "dsh-live-voice.speak.agentContext.help"),
            h("textarea", {
              key: `agent-voice-context-${settings.agentVoiceContext}`,
              defaultValue: settings.agentVoiceContext,
              maxLength: 4e3,
              rows: 7,
              onBlur: (event) => invoke("updateSettings", { agentVoiceContext: event.target.value })
            }),
            h(
              "button",
              {
                type: "button",
                disabled: settings.agentVoiceContext === defaultAgentVoiceContext,
                onClick: () => invoke("updateSettings", { agentVoiceContext: defaultAgentVoiceContext })
              },
              "dsh-live-voice.speak.agentContext.restore"
            )
          ),
          h(
            "label",
            null,
            "dsh-live-voice.speak.rate.label",
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
            h("small", null, "dsh-live-voice.speak.rate.help")
          ),
          h(
            "label",
            null,
            "dsh-live-voice.speak.segmentGap.label",
            h("input", {
              type: "number",
              min: 0,
              max: 2e3,
              step: 50,
              value: settings.segmentGapMs ?? 200,
              onChange: (event) => {
                const segmentGapMs = Number(event.target.value);
                if (Number.isFinite(segmentGapMs) && segmentGapMs >= 0 && segmentGapMs <= 2e3)
                  invoke("updateSettings", { segmentGapMs });
              }
            }),
            h("small", null, "dsh-live-voice.speak.segmentGap.help")
          ),
          h("p", null, "dsh-live-voice.speak.engine.playbackHelp"),
          ...["qwen-http", "say", "browser"].filter((id2) => capabilities[id2]?.supported === false).map(
            (id2) => h(
              "p",
              { key: id2, role: "status" },
              t("dsh-live-voice.commons.engine.failure", {
                engine: t(
                  id2 === "qwen-http" ? "dsh-live-voice.speak.qwen.name" : id2 === "say" ? "dsh-live-voice.speak.macos.name" : "dsh-live-voice.speak.browser.name"
                ),
                reason: capabilities[id2].reason
              })
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
                onClick: () => invoke("speak", t("dsh-live-voice.speak.output.testPhrase"))
              },
              state.speaking ? "dsh-live-voice.speak.output.testing" : "dsh-live-voice.speak.output.test"
            ),
            state.speaking || state.paused ? h(
              "button",
              { type: "button", onClick: () => invoke("stopSpeech") },
              "dsh-live-voice.speak.output.stopTest"
            ) : null,
            h(
              "button",
              { type: "button", onClick: () => invoke("refreshCapabilities") },
              "dsh-live-voice.settings.engine.refresh"
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
            "dsh-live-voice.recognition.engine.label",
            h(
              "select",
              {
                value: settings.recognitionEngine,
                onChange: (event) => invoke(
                  "updateSettings",
                  event.target.value === "browser" && settings.recognitionLang === "auto" ? { recognitionEngine: "browser", recognitionLang: "pt-BR" } : { recognitionEngine: event.target.value }
                )
              },
              h("option", { value: "browser" }, "dsh-live-voice.recognition.browser.label"),
              h("option", { value: "qwen-http" }, "dsh-live-voice.recognition.qwen.label"),
              h("option", { value: "whisper-http" }, "dsh-live-voice.recognition.whisper.label"),
              h(
                "optgroup",
                { label: "dsh-live-voice.recognition.planned.vote" },
                h(
                  "option",
                  { value: "webgpu", disabled: true },
                  "dsh-live-voice.recognition.planned.webGpu"
                ),
                h(
                  "option",
                  { value: "sherpa-onnx", disabled: true },
                  "dsh-live-voice.recognition.planned.sherpa"
                ),
                h(
                  "option",
                  { value: "parakeet", disabled: true },
                  "dsh-live-voice.recognition.planned.parakeet"
                ),
                h(
                  "option",
                  { value: "voxtral", disabled: true },
                  "dsh-live-voice.recognition.planned.voxtral"
                )
              )
            )
          ),
          h(
            "small",
            { className: "dlv-recognition-engine-description" },
            settings.recognitionEngine === "qwen-http" ? "dsh-live-voice.recognition.whisper.endpointHelp" : settings.recognitionEngine === "whisper-http" ? "dsh-live-voice.recognition.qwen.endpointHelp" : "dsh-live-voice.recognition.browser.help"
          ),
          field(
            "dsh-live-voice.recognition.microphone.device",
            "inputDeviceId",
            deviceOptions("audioinput", "dsh-live-voice.recognition.microphone.label")
          ),
          settings.recognitionEngine === "browser" ? h("small", null, "dsh-live-voice.recognition.browser.microphoneHelp") : null,
          field("dsh-live-voice.recognition.language.label", "recognitionLang", [
            ...settings.recognitionEngine !== "browser" ? [
              {
                value: "auto",
                label: "dsh-live-voice.recognition.language.automatic"
              }
            ] : [],
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
              " ",
              "dsh-live-voice.recognition.browser.localProcessing"
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
              " ",
              "dsh-live-voice.recognition.browser.autoInstallPack"
            ) : h(
              "p",
              { role: "status" },
              "dsh-live-voice.recognition.browser.remoteServiceWarning"
            )
          ) : h(
            "p",
            { role: "status" },
            settings.recognitionEngine === "qwen-http" ? "dsh-live-voice.recognition.qwen.captureHelp" : "dsh-live-voice.recognition.whisper.captureHelp"
          ),
          settings.recognitionEngine === "whisper-http" ? subcard("dsh-live-voice.commons.connection.title", [
            h(WhisperSettings, { key: "settings", controller })
          ]) : null,
          settings.recognitionEngine === "qwen-http" && settings.engine !== "qwen-http" ? subcard("dsh-live-voice.speak.qwen.connection", [
            h(QwenSettings, { key: "qwen-recognition-settings", controller })
          ]) : null,
          h("p", null, "dsh-live-voice.recognition.providerSettings.help"),
          subcard("dsh-live-voice.recognition.commands.title", [
            h(
              "label",
              { key: "voice-commands-enabled", className: "dlv-check" },
              h("input", {
                type: "checkbox",
                checked: settings.voiceCommandsEnabled !== false,
                onChange: (event) => invoke("updateSettings", { voiceCommandsEnabled: event.target.checked })
              }),
              " ",
              "dsh-live-voice.recognition.commands.enabled"
            ),
            h(
              "small",
              { key: "voice-command-help" },
              "dsh-live-voice.recognition.voiceCommands.help"
            ),
            ...[
              [
                "dsh-live-voice.recognition.commands.send",
                "voiceCommandSend",
                "send, send message"
              ],
              [
                "dsh-live-voice.recognition.commands.queue",
                "voiceCommandQueue",
                "queue, queue message"
              ],
              [
                "dsh-live-voice.commons.conversation.end",
                "voiceCommandEnd",
                "end, end conversation"
              ],
              [
                "dsh-live-voice.recognition.commands.mute",
                "voiceCommandMute",
                "mute, stop listening"
              ],
              [
                "dsh-live-voice.recognition.commands.resume",
                "voiceCommandResume",
                "resume, start listening"
              ],
              [
                "dsh-live-voice.recognition.commands.stopSpeech",
                "voiceCommandStopSpeaking",
                "stop talking, stop speaking, shut up"
              ],
              [
                "dsh-live-voice.recognition.commands.clear",
                "voiceCommandClear",
                "clear all, clear message"
              ]
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
          subcard("dsh-live-voice.settings.filters.title", [
            h(
              "label",
              { key: "recognition-filter", className: "dlv-check" },
              h("input", {
                type: "checkbox",
                checked: settings.recognitionFilterEnabled !== false,
                onChange: (event) => invoke("updateSettings", { recognitionFilterEnabled: event.target.checked })
              }),
              " ",
              "dsh-live-voice.recognition.minimumWords.enabled"
            ),
            h(
              "label",
              { key: "recognition-minimum-words" },
              "dsh-live-voice.recognition.minimumWords.label",
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
              h("small", null, "dsh-live-voice.recognition.minimumWords.help")
            )
          ]),
          capabilities.capture?.supported === false ? h(
            "p",
            { role: "status" },
            t("dsh-live-voice.recognition.microphone.failure", {
              reason: capabilities.capture.reason
            })
          ) : capabilities.capture?.permission === "prompt" ? h("p", { role: "status" }, "dsh-live-voice.recognition.microphone.permissionHelp") : null,
          capabilities.recognition?.supported === false ? h("p", { role: "status" }, capabilities.recognition.reason) : null,
          usesPluginVoiceDetection(settings.recognitionEngine) ? h(
            "details",
            {
              className: "dlv-settings-subcard",
              "aria-label": "dsh-live-voice.recognition.silenceDetection.title"
            },
            h("summary", null, "dsh-live-voice.recognition.silenceDetection.label"),
            h(
              "div",
              { className: "dlv-settings-subcard-body" },
              h("p", null, "dsh-live-voice.recognition.silenceDetection.help"),
              h(
                "label",
                { className: "dlv-setting-field" },
                "dsh-live-voice.recognition.maxUtterance.label",
                h("input", {
                  type: "number",
                  min: 10,
                  max: 300,
                  step: 1,
                  value: settings.recognitionMaxUtteranceSeconds ?? 60,
                  onChange: (event) => {
                    const value = Number(event.target.value);
                    if (Number.isInteger(value) && value >= 10 && value <= 300)
                      invoke("updateSettings", { recognitionMaxUtteranceSeconds: value });
                  }
                }),
                h("small", null, "dsh-live-voice.recognition.maxUtterance.help")
              ),
              h(
                "div",
                {
                  className: "dlv-preset-group",
                  role: "radiogroup",
                  "aria-label": "dsh-live-voice.recognition.silenceDetection.pauseLabel"
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
                      h("strong", null, `dsh-live-voice.recognition.presets.${value}.label`),
                      h(
                        "small",
                        null,
                        `dsh-live-voice.recognition.presets.${value}.description`
                      )
                    )
                  )
                )
              ),
              h(
                "p",
                { className: "dlv-vad-summary" },
                t("dsh-live-voice.recognition.silenceDetection.duration", {
                  milliseconds: voiceDetectionPresets[settings.voiceDetectionPreset]?.silenceMs || voiceDetectionPresets.natural.silenceMs
                })
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
          " ",
          "dsh-live-voice.speak.autoPlayback.enabled"
        ),
        h("p", { key: "policy" }, "dsh-live-voice.speak.autoPlayback.help"),
        h(
          "label",
          { key: "interrupt-message", className: "dlv-check" },
          h("input", {
            type: "checkbox",
            checked: settings.interruptSpeechOnUserMessage === true,
            onChange: (event) => invoke("updateSettings", { interruptSpeechOnUserMessage: event.target.checked })
          }),
          " ",
          "dsh-live-voice.speak.interruption.enabled"
        ),
        h(
          "p",
          { key: "interrupt-message-description", className: "dlv-setting-description" },
          settings.interruptSpeechOnUserMessage ? "dsh-live-voice.speak.interruption.enabledHelp" : "dsh-live-voice.speak.interruption.disabledHelp"
        ),
        h(
          "label",
          { key: "hold-to-talk", className: "dlv-check" },
          h("input", {
            type: "checkbox",
            checked: settings.holdToTalkEnabled !== false,
            onChange: (event) => invoke("updateSettings", { holdToTalkEnabled: event.target.checked })
          }),
          " ",
          "dsh-live-voice.recognition.holdToTalk.enabled"
        ),
        h(
          "p",
          { key: "hold-to-talk-description", className: "dlv-setting-description" },
          "dsh-live-voice.recognition.holdToTalk.help"
        ),
        field("dsh-live-voice.recognition.mode.label", "mode", [
          {
            value: "speaker",
            label: "dsh-live-voice.recognition.speakerMode.label"
          },
          {
            value: "headphones",
            label: "dsh-live-voice.recognition.headphoneMode.label"
          }
        ]),
        h(
          "p",
          { key: "mode-description", className: "dlv-setting-description" },
          settings.mode === "headphones" ? "dsh-live-voice.recognition.headphoneMode.help" : "dsh-live-voice.recognition.speakerMode.help"
        ),
        h(
          "label",
          { key: "speech-delay" },
          "dsh-live-voice.speak.responseDelay.label",
          h(
            "select",
            {
              value: String(settings.assistantSpeechDelaySeconds || 3),
              onChange: (event) => invoke("updateSettings", {
                assistantSpeechDelaySeconds: Number(event.target.value)
              })
            },
            [1, 2, 3, 4, 5, 6, 8, 10].map(
              (seconds) => h(
                "option",
                { key: seconds, value: String(seconds) },
                t("dsh-live-voice.commons.seconds", { seconds })
              )
            )
          ),
          h("small", null, "dsh-live-voice.speak.responseDelay.help")
        ),
        field("dsh-live-voice.settings.delivery.label", "sendingMode", [
          {
            value: "manual",
            label: "dsh-live-voice.settings.delivery.manualLabel"
          },
          {
            value: "queue",
            label: "dsh-live-voice.settings.delivery.queueLabel"
          },
          {
            value: "steer",
            label: "dsh-live-voice.settings.delivery.steerLabel"
          }
        ]),
        settings.sendingMode !== "manual" ? h(
          "label",
          { key: "delay" },
          "dsh-live-voice.settings.autoSend.delay",
          h(
            "select",
            {
              value: String(settings.autoSendDelaySeconds || 4),
              onChange: (event) => invoke("updateSettings", {
                autoSendDelaySeconds: Number(event.target.value)
              })
            },
            [2, 3, 4, 5, 6, 8, 10].map(
              (seconds) => h(
                "option",
                { key: seconds, value: String(seconds) },
                t("dsh-live-voice.commons.seconds", { seconds })
              )
            )
          ),
          h("small", null, "dsh-live-voice.recognition.autoSend.countdownHelp")
        ) : h(
          "p",
          {
            key: "manual",
            className: "dlv-setting-description"
          },
          "dsh-live-voice.recognition.manualSend.help"
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
.dlv-settings-heading{display:flex;align-items:center;gap:8px;min-width:0}.dlv-settings-heading h3{white-space:nowrap}.dlv-heading-divider{height:1px;min-width:12px;flex:1;background:var(--dsw-alias-border-l1)}.dlv-settings-heading .dlv-star-badge{flex:none}
.dlv-version-badges{display:flex;flex:none;gap:5px;align-items:center}.dlv-shields-badge{display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;height:20px;gap:4px;padding:3px 5px;border:1px solid var(--dsw-alias-border-l1);border-radius:5px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);font-size:10px;font-weight:650;line-height:12px;text-decoration:none}.dlv-shields-badge img{display:block;width:12px;height:12px;max-width:100%}.dlv-shields-badge:focus-visible{border-radius:4px;outline:2px solid var(--dsw-alias-label-primary);outline-offset:3px}.dlv-version-badge{display:inline-flex;align-items:center;min-height:24px;box-sizing:border-box;padding:3px 8px;border:1px solid var(--dsw-alias-border-l1);border-radius:999px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);font-size:11px;font-weight:650;line-height:16px;text-decoration:none}.dlv-version-badges a.dlv-version-badge:hover{border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary)}.dlv-star-badge{padding:4px 10px;color:var(--dsw-alias-label-primary)}.dlv-update-icon{margin-right:4px;font-size:14px;line-height:1}.dlv-star-icon{margin-right:4px;color:#f59e0b;font-size:14px;line-height:1;text-shadow:0 0 8px rgba(245,158,11,.28)}.dlv-version-badges a.dlv-star-badge:hover{border-color:#f59e0b;background:rgba(245,158,11,.08)}.dlv-update-badge{border-color:var(--dsw-alias-state-business-primary);color:var(--dsw-alias-state-business-primary)}
.dlv-settings-tabs{border-bottom:.5px solid var(--dsw-alias-border-l2);display:flex;align-items:flex-end;gap:22px;overflow-x:auto}.dlv-settings-tab{position:relative;flex:none;padding:7px 1px 9px;border:0;background:transparent;color:var(--dsw-alias-label-tertiary);font:inherit;font-size:13px;line-height:20px;cursor:pointer}.dlv-settings-tab:hover,.dlv-settings-tab[data-active=true]{color:var(--dsw-alias-label-primary)}.dlv-settings-tab[data-active=true]:after,.dlv-settings-tab:focus-visible:after{content:"";position:absolute;right:0;bottom:-1px;left:0;height:2px;border-radius:2px 2px 0 0;background:var(--dsw-alias-label-primary)}.dlv-settings-tab:focus-visible{border-radius:2px;outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px;color:var(--dsw-alias-label-primary)}.dlv-settings-panel{min-width:0;padding-top:2px}.dlv-settings-panel[hidden]{display:none}.dlv-settings-group{margin:0;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;min-width:0;display:grid;gap:14px;padding:16px}.dlv-settings-group legend{padding:0 6px;font-weight:600;color:var(--dsw-alias-label-primary)}.dlv-settings-card-body{display:grid;gap:12px;padding:12px 0}.dlv-settings-subcard{border:1px solid var(--dsw-alias-border-l2);border-radius:8px;min-width:0}.dlv-settings-subcard>summary{cursor:pointer;font-weight:650;list-style:none;display:flex;align-items:center;justify-content:space-between;padding:10px}.dlv-settings-subcard>summary::-webkit-details-marker{display:none}.dlv-settings-subcard>summary:after{content:"\u203A";transform:rotate(90deg);transition:transform .15s}.dlv-settings-subcard:not([open])>summary:after{transform:rotate(0)}.dlv-settings-subcard-body{display:grid;gap:10px;padding:0 10px 10px}
.dlv-settings label{display:grid;gap:6px;font-size:14px}.dlv-settings label.dlv-check{display:flex;align-items:center;gap:8px}.dlv-settings label.dlv-check input{width:auto}
.dlv-settings :is(input,select,textarea){box-sizing:border-box;width:100%;padding:8px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:inherit;font:inherit}
.dlv-settings small,.dlv-settings p{font-size:13px;color:var(--dsw-alias-label-secondary);line-height:1.5}
.dlv-preset-group{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.dlv-settings label.dlv-preset{display:flex;align-items:flex-start;gap:8px;padding:10px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;cursor:pointer}.dlv-settings label.dlv-preset:has(input:checked){border-color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-1)}.dlv-settings label.dlv-preset input{width:auto;margin-top:3px}.dlv-preset span{display:grid;gap:3px}.dlv-vad-summary{font-weight:500}
.dlv-settings-actions{display:flex;flex-wrap:wrap;gap:8px}.dlv-settings-actions button{padding:8px 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:inherit;cursor:pointer}.dlv-settings-actions button:disabled{opacity:.45;cursor:default}
@media(max-width:480px){.dlv-settings-heading{gap:6px}.dlv-heading-divider{min-width:4px}.dlv-settings-heading .dlv-star-badge{padding:3px 6px;font-size:10px}.dlv-preset-group{grid-template-columns:1fr}.dlv-pill{flex-wrap:wrap}.dlv-wave{flex-basis:90px}.dlv-status{flex-basis:100px}}
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
var inject = ["slots", "connection", "uiConversation", "uiSession", "locale"];
function apply(ctx) {
  const t = registerLiveVoiceLocales(ctx);
  const e = import_react.default.createElement;
  const { MicrophoneButtons, RecordingBar, SpeakButton, SettingsPanel } = createComponents(
    import_react.default,
    t,
    ctx.locale
  );
  const controllers = /* @__PURE__ */ new Map();
  const retiring = /* @__PURE__ */ new Set();
  let disposed = false;
  let voiceModeActive = false;
  const publishVoiceContext = (entry, active = entry?.controller?.getSnapshot().conversation === true) => {
    if (!entry) return;
    const settings = entry.controller.getSnapshot().settings;
    const body = JSON.stringify({
      sessionId: entry.key,
      active: active && settings.announceAssistantMessages !== false && settings.agentVoiceContextEnabled !== false,
      context: settings.agentVoiceContext
    });
    if (body === entry.lastVoiceContextBody) return;
    entry.lastVoiceContextBody = body;
    void fetch("/api/dsh-live-voice/voice-context", {
      method: "PUT",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body
    }).catch(() => {
    });
  };
  const ownership = new VoiceOwnership();
  const recognitionSettingKeys = /* @__PURE__ */ new Set([
    "recognitionEngine",
    "recognitionProcessLocally",
    "recognitionAutoInstall",
    "voiceDetectionPreset",
    "recognitionMaxUtteranceSeconds"
  ]);
  const changesRecognition = (next) => Object.keys(next).some((key) => recognitionSettingKeys.has(key));
  const recognitionFor = (settings, meter) => settings.recognitionEngine === "qwen-http" ? new QwenHttpRecognitionEngine({
    meter,
    voiceDetectionPreset: settings.voiceDetectionPreset,
    maxUtteranceSeconds: settings.recognitionMaxUtteranceSeconds
  }) : settings.recognitionEngine === "whisper-http" ? new WhisperHttpRecognitionEngine({
    meter,
    voiceDetectionPreset: settings.voiceDetectionPreset,
    maxUtteranceSeconds: settings.recognitionMaxUtteranceSeconds
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
    entry.unsubscribeVoiceContext?.();
    entry.unsubscribeVoiceContext = null;
    entry.unsubscribePendingQuestion?.();
    entry.unsubscribePendingQuestion = null;
    entry.questionCapture = null;
    entry.controller.patch({ answeringQuestion: false });
    publishVoiceContext(entry, false);
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
      closed: false,
      lastVoiceContextBody: null
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
    const engineSay = new HostAudioSpeakingEngine({
      endpoint: "/api/dsh-live-voice/say/speech",
      capability: "/api/dsh-live-voice/say/capabilities",
      lang: settings.lang || "pt-BR",
      synthesisRate: () => 175,
      playbackRate: (rate) => rate
    });
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
          if (!owner) return;
          if (mode === "steer") {
            owner.submitAccelerated?.();
            return;
          }
          owner.actions.submit?.();
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
              if (text)
                run(entry.controller, entry.controller.speak(text, capture.interaction.key));
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
    entry.unsubscribeVoiceContext = controller.subscribe(() => publishVoiceContext(entry));
    publishVoiceContext(entry);
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
      publishVoiceContext(entry);
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
        const result = original(...args);
        Promise.resolve(result).finally(() => publishVoiceContext(entry));
        return result;
      };
    }
    for (const method of ["startDictation", "startHoldToTalk", "startConversation", "speak"]) {
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
            const result = original(...args);
            Promise.resolve(result).finally(() => publishVoiceContext(entry));
            return result;
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
      entry.composers.set(token.current, {
        actions: props.inputActions,
        submitAccelerated: () => {
          const active = document.activeElement;
          const editor = active?.nodeType === 1 && active.isContentEditable ? active : document.querySelector('[contenteditable="true"]');
          if (!editor || editor.nodeType !== 1) return;
          editor.focus();
          const KeyboardEventCtor = editor.ownerDocument.defaultView?.KeyboardEvent;
          if (!KeyboardEventCtor) return;
          editor.dispatchEvent(
            new KeyboardEventCtor("keydown", {
              key: "Enter",
              code: "Enter",
              ctrlKey: true,
              bubbles: true,
              cancelable: true
            })
          );
        }
      });
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
          say: new HostAudioSpeakingEngine({
            endpoint: "/api/dsh-live-voice/say/speech",
            capability: "/api/dsh-live-voice/say/capabilities",
            synthesisRate: () => 175,
            playbackRate: (rate) => rate
          }),
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
        update(next);
        browser.lang = c.getSnapshot().settings.lang;
        qwen.lang = c.getSnapshot().settings.lang;
        const settings2 = c.getSnapshot().settings;
        if (changesRecognition(next)) c.replaceRecognition(recognitionFor(settings2, c.meter));
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
          if (changesRecognition(next))
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
      {
        name: "settings.section",
        id: "dsh-live-voice",
        order: 65,
        label: () => t("dsh-live-voice.commons.pluginName")
      },
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
      label: unavailable ? capability?.reason || t("dsh-live-voice.speak.output.checking") : void 0,
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
      () => ctx.slots.register(
        { name, id: id2, order, label: () => t("dsh-live-voice.commons.pluginName") },
        component
      )
    );
  ctx.effect(() => {
    const stop = () => {
      ownership.cancel();
      for (const entry of controllers.values())
        run(entry.controller, entry.controller.endConversation());
    };
    let holdToTalk = null;
    const candidate = () => {
      const candidates = [...controllers.values()].filter(
        (entry) => entry.buttons > 0 && entry.composers.size > 0
      );
      return candidates.length === 1 ? candidates[0] : null;
    };
    const releaseHoldToTalk = () => {
      const entry = holdToTalk;
      holdToTalk = null;
      if (!entry || entry.closed) return;
      run(entry.controller, entry.controller.releaseHoldToTalk());
    };
    const onKeyDown = (event) => {
      if (disposed || event.defaultPrevented || event.repeat) return;
      if (event.key === "Escape" && holdToTalk) {
        const entry2 = holdToTalk;
        holdToTalk = null;
        event.preventDefault();
        run(entry2.controller, entry2.controller.cancelDictation());
        return;
      }
      if (event.ctrlKey && event.shiftKey && event.code === "Space") {
        const entry2 = candidate();
        if (!entry2) return;
        event.preventDefault();
        const c = entry2.controller;
        run(
          c,
          c.getSnapshot().listening || c.getSnapshot().starting ? c.stopListening() : c.startDictation()
        );
        return;
      }
      if (event.key !== "Control" || event.altKey || event.metaKey || event.shiftKey) return;
      const entry = candidate();
      if (!entry || !entry.controller.getSnapshot().settings.holdToTalkEnabled) return;
      holdToTalk = entry;
      run(entry.controller, entry.controller.startHoldToTalk());
    };
    const onKeyUp = (event) => {
      if (event.key === "Control") releaseHoldToTalk();
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
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", releaseHoldToTalk);
    window.addEventListener("pagehide", stop);
    return () => {
      disposed = true;
      ownership.close();
      window.speechSynthesis?.removeEventListener?.("voiceschanged", refreshCapabilities);
      navigator.mediaDevices?.removeEventListener?.("devicechange", refreshCapabilities);
      document.removeEventListener("visibilitychange", visibilityChanged);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", releaseHoldToTalk);
      window.removeEventListener("pagehide", stop);
      for (const entry of controllers.values()) retire(entry);
    };
  });
}
return module.exports;}});
