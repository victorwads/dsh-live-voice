// @ts-nocheck
export const voiceDetectionPresets = Object.freeze({
  short: Object.freeze({
    silenceMs: 900,
    label: 'Short',
    description: 'Send quickly after a short pause.',
  }),
  natural: Object.freeze({
    silenceMs: 1500,
    label: 'Natural',
    description: 'Allow normal pauses between phrases.',
  }),
  long: Object.freeze({
    silenceMs: 2200,
    label: 'Long',
    description: 'Wait through longer thinking pauses.',
  }),
});
export const usesPluginVoiceDetection = (engine) => ['whisper-http', 'qwen-http'].includes(engine);
export const qwenVoices = Object.freeze([
  Object.freeze({ value: 'aiden', label: 'Aiden — male, American English' }),
  Object.freeze({ value: 'ryan', label: 'Ryan — male, English' }),
  Object.freeze({ value: 'uncle_fu', label: 'Uncle Fu — male, Chinese' }),
  Object.freeze({ value: 'dylan', label: 'Dylan — male, Beijing Chinese' }),
  Object.freeze({ value: 'eric', label: 'Eric — male, Sichuan Chinese' }),
  Object.freeze({ value: 'vivian', label: 'Vivian — female, Chinese' }),
  Object.freeze({ value: 'serena', label: 'Serena — female, Chinese' }),
  Object.freeze({ value: 'ono_anna', label: 'Ono Anna — female, Japanese' }),
  Object.freeze({ value: 'sohee', label: 'Sohee — female, Korean' }),
]);
export const defaultQwenVoice = qwenVoices[0].value;
export const isQwenVoice = (value) => qwenVoices.some((voice) => voice.value === value);
export const defaultAgentVoiceContext = `Live Voice output is active. Your entire user-facing response will be spoken aloud.
Be concise and conversational. Lead with the answer or next action. Avoid unnecessary repetition, long preambles, dense lists, raw code, paths, and verbose status narration.
Do not narrate routine tool activity by default. If the user explicitly asks you to keep them informed while working, provide brief spoken progress updates only at meaningful milestones.`;

export const defaultSettings = Object.freeze({
  engine: 'browser',
  recognitionEngine: 'browser',
  recognitionProcessLocally: true,
  recognitionAutoInstall: true,
  voiceDetectionPreset: 'natural',
  recognitionMaxUtteranceSeconds: 60,
  microphoneEnabled: true,
  holdToTalkEnabled: true,
  announceAssistantMessages: true,
  agentVoiceContextEnabled: true,
  agentVoiceContext: defaultAgentVoiceContext,
  interruptSpeechOnUserMessage: false,
  sendingMode: 'manual',
  autoSendDelaySeconds: 4,
  assistantSpeechDelaySeconds: 3,
  mode: 'speaker',
  lang: 'pt-BR',
  recognitionLang: 'pt-BR',
  voice: '',
  inputDeviceId: '',
  outputDeviceId: '',
  recognitionFilterEnabled: true,
  recognitionMinimumWords: 2,
  voiceCommandsEnabled: true,
  voiceCommandSend: 'send, send message',
  voiceCommandQueue: 'queue, queue message',
  voiceCommandEnd: 'end, end conversation',
  voiceCommandMute: 'mute, stop listening',
  voiceCommandResume: 'resume, start listening',
  voiceCommandStopSpeaking: 'stop talking, stop speaking, shut up',
  voiceCommandClear: 'clear all, clear message',
  outputCodeFilterEnabled: true,
  outputCodeMaxLines: 5,
  outputCodeNotice: 'Look the code on out conversation',
  rate: 1,
  segmentGapMs: 200,
});
const normalizeCommandPhrases = (value, fallback) =>
  typeof value === 'string' && value.length <= 1000 && !value.includes('\0')
    ? value
        .split(/[,\r\n]+/)
        .map((phrase) => phrase.trim())
        .filter(Boolean)
        .slice(0, 20)
        .join(', ')
    : fallback;

/** Persisted browser preferences are untrusted and may belong to an older version. */
export function normalizeSettings(value) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return {
    engine: ['browser', 'say', 'qwen-http'].includes(source.engine)
      ? source.engine
      : defaultSettings.engine,
    recognitionEngine: ['browser', 'whisper-http', 'qwen-http'].includes(source.recognitionEngine)
      ? source.recognitionEngine
      : defaultSettings.recognitionEngine,
    recognitionProcessLocally:
      typeof source.recognitionProcessLocally === 'boolean'
        ? source.recognitionProcessLocally
        : defaultSettings.recognitionProcessLocally,
    recognitionAutoInstall:
      typeof source.recognitionAutoInstall === 'boolean'
        ? source.recognitionAutoInstall
        : defaultSettings.recognitionAutoInstall,
    voiceDetectionPreset: Object.hasOwn(voiceDetectionPresets, source.voiceDetectionPreset)
      ? source.voiceDetectionPreset
      : defaultSettings.voiceDetectionPreset,
    recognitionMaxUtteranceSeconds:
      Number.isInteger(source.recognitionMaxUtteranceSeconds) &&
      source.recognitionMaxUtteranceSeconds >= 10 &&
      source.recognitionMaxUtteranceSeconds <= 300
        ? source.recognitionMaxUtteranceSeconds
        : defaultSettings.recognitionMaxUtteranceSeconds,
    microphoneEnabled:
      typeof source.microphoneEnabled === 'boolean'
        ? source.microphoneEnabled
        : defaultSettings.microphoneEnabled,
    holdToTalkEnabled:
      typeof source.holdToTalkEnabled === 'boolean'
        ? source.holdToTalkEnabled
        : defaultSettings.holdToTalkEnabled,
    announceAssistantMessages:
      typeof source.announceAssistantMessages === 'boolean'
        ? source.announceAssistantMessages
        : defaultSettings.announceAssistantMessages,
    agentVoiceContextEnabled:
      typeof source.agentVoiceContextEnabled === 'boolean'
        ? source.agentVoiceContextEnabled
        : defaultSettings.agentVoiceContextEnabled,
    agentVoiceContext:
      typeof source.agentVoiceContext === 'string' &&
      source.agentVoiceContext.length <= 4000 &&
      !source.agentVoiceContext.includes('\0')
        ? source.agentVoiceContext.trim()
        : defaultSettings.agentVoiceContext,
    interruptSpeechOnUserMessage:
      typeof source.interruptSpeechOnUserMessage === 'boolean'
        ? source.interruptSpeechOnUserMessage
        : defaultSettings.interruptSpeechOnUserMessage,
    sendingMode:
      source.sendingMode === 'automatic'
        ? 'queue'
        : ['manual', 'queue', 'steer'].includes(source.sendingMode)
          ? source.sendingMode
          : defaultSettings.sendingMode,
    autoSendDelaySeconds:
      Number.isInteger(source.autoSendDelaySeconds) &&
      source.autoSendDelaySeconds >= 2 &&
      source.autoSendDelaySeconds <= 10
        ? source.autoSendDelaySeconds
        : defaultSettings.autoSendDelaySeconds,
    assistantSpeechDelaySeconds:
      Number.isInteger(source.assistantSpeechDelaySeconds) &&
      source.assistantSpeechDelaySeconds >= 1 &&
      source.assistantSpeechDelaySeconds <= 10
        ? source.assistantSpeechDelaySeconds
        : defaultSettings.assistantSpeechDelaySeconds,
    mode: ['speaker', 'headphones'].includes(source.mode) ? source.mode : defaultSettings.mode,
    lang:
      typeof source.lang === 'string' && /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(source.lang)
        ? source.lang
        : defaultSettings.lang,
    recognitionLang:
      source.recognitionLang === 'auto' ||
      (typeof source.recognitionLang === 'string' &&
        /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(source.recognitionLang))
        ? source.recognitionLang
        : typeof source.lang === 'string' && /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(source.lang)
          ? source.lang
          : defaultSettings.recognitionLang,
    voice:
      typeof source.voice === 'string' && source.voice.length <= 200 && !source.voice.includes('\0')
        ? source.voice
        : '',
    inputDeviceId:
      typeof source.inputDeviceId === 'string' &&
      source.inputDeviceId.length <= 500 &&
      !source.inputDeviceId.includes('\0')
        ? source.inputDeviceId
        : '',
    outputDeviceId:
      typeof source.outputDeviceId === 'string' &&
      source.outputDeviceId.length <= 500 &&
      !source.outputDeviceId.includes('\0')
        ? source.outputDeviceId
        : '',
    recognitionFilterEnabled:
      typeof source.recognitionFilterEnabled === 'boolean'
        ? source.recognitionFilterEnabled
        : defaultSettings.recognitionFilterEnabled,
    recognitionMinimumWords:
      Number.isInteger(source.recognitionMinimumWords) &&
      source.recognitionMinimumWords >= 1 &&
      source.recognitionMinimumWords <= 20
        ? source.recognitionMinimumWords
        : defaultSettings.recognitionMinimumWords,
    voiceCommandsEnabled:
      typeof source.voiceCommandsEnabled === 'boolean'
        ? source.voiceCommandsEnabled
        : defaultSettings.voiceCommandsEnabled,
    voiceCommandSend: normalizeCommandPhrases(
      source.voiceCommandSend,
      defaultSettings.voiceCommandSend,
    ),
    voiceCommandQueue: normalizeCommandPhrases(
      source.voiceCommandQueue,
      defaultSettings.voiceCommandQueue,
    ),
    voiceCommandEnd: normalizeCommandPhrases(
      source.voiceCommandEnd,
      defaultSettings.voiceCommandEnd,
    ),
    voiceCommandMute: normalizeCommandPhrases(
      source.voiceCommandMute,
      defaultSettings.voiceCommandMute,
    ),
    voiceCommandResume: normalizeCommandPhrases(
      source.voiceCommandResume,
      defaultSettings.voiceCommandResume,
    ),
    voiceCommandStopSpeaking: normalizeCommandPhrases(
      source.voiceCommandStopSpeaking,
      defaultSettings.voiceCommandStopSpeaking,
    ),
    voiceCommandClear: normalizeCommandPhrases(
      source.voiceCommandClear,
      defaultSettings.voiceCommandClear,
    ),
    outputCodeFilterEnabled:
      typeof source.outputCodeFilterEnabled === 'boolean'
        ? source.outputCodeFilterEnabled
        : defaultSettings.outputCodeFilterEnabled,
    outputCodeMaxLines:
      Number.isInteger(source.outputCodeMaxLines) &&
      source.outputCodeMaxLines >= 0 &&
      source.outputCodeMaxLines <= 100
        ? source.outputCodeMaxLines
        : defaultSettings.outputCodeMaxLines,
    outputCodeNotice:
      typeof source.outputCodeNotice === 'string' &&
      source.outputCodeNotice.trim() &&
      source.outputCodeNotice.length <= 300 &&
      !source.outputCodeNotice.includes('\0')
        ? source.outputCodeNotice.trim()
        : defaultSettings.outputCodeNotice,
    rate: Number.isFinite(source.rate) && source.rate >= 0.1 && source.rate <= 3 ? source.rate : 1,
    segmentGapMs:
      Number.isFinite(source.segmentGapMs) && source.segmentGapMs >= 0 && source.segmentGapMs <= 2000
        ? Math.round(source.segmentGapMs)
        : 200,
  };
}
