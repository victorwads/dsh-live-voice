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
export const defaultSettings = Object.freeze({
  engine: 'browser',
  recognitionEngine: 'browser',
  recognitionProcessLocally: true,
  recognitionAutoInstall: true,
  voiceDetectionPreset: 'natural',
  announceAssistantMessages: true,
  interruptSpeechOnUserMessage: false,
  sendingMode: 'manual',
  autoSendDelaySeconds: 4,
  assistantSpeechDelaySeconds: 3,
  mode: 'speaker',
  lang: 'pt-BR',
  recognitionLang: 'pt-BR',
  voice: '',
  rate: 1,
});
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
    announceAssistantMessages:
      typeof source.announceAssistantMessages === 'boolean'
        ? source.announceAssistantMessages
        : defaultSettings.announceAssistantMessages,
    interruptSpeechOnUserMessage:
      typeof source.interruptSpeechOnUserMessage === 'boolean'
        ? source.interruptSpeechOnUserMessage
        : defaultSettings.interruptSpeechOnUserMessage,
    sendingMode: ['manual', 'automatic'].includes(source.sendingMode)
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
    rate: Number.isFinite(source.rate) && source.rate >= 0.1 && source.rate <= 3 ? source.rate : 1,
  };
}
