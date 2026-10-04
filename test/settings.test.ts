// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeSettings,
  defaultSettings,
  voiceDetectionSilenceMs,
} from '../src/modules/core/settings.ts';
test('malformed persisted preferences cannot select remote engines or invalid options', () => {
  for (const input of [
    null,
    [],
    17,
    'text',
    { engine: 'cloud', mode: 'unknown', lang: '', rate: Infinity, voice: 'bad\0voice' },
  ])
    assert.deepEqual(normalizeSettings(input), defaultSettings);
});
test('Whisper HTTP recognition and simple voice detection presets survive normalization', () => {
  const settings = normalizeSettings({
    recognitionEngine: 'whisper-http',
    recognitionLang: 'auto',
    voiceDetectionPreset: 'long',
  });
  assert.equal(settings.recognitionEngine, 'whisper-http');
  assert.equal(settings.recognitionLang, 'auto');
  assert.equal(settings.voiceDetectionPreset, 'long');
  assert.equal(
    normalizeSettings({ voiceDetectionPreset: 'technical-garbage' }).voiceDetectionPreset,
    'short',
  );
});
test('short is the default without overriding existing saved profiles', () => {
  assert.equal(defaultSettings.voiceDetectionPreset, 'short');
  assert.equal(voiceDetectionSilenceMs(normalizeSettings({})), 500);
  assert.equal(voiceDetectionSilenceMs({}), 500);
  for (const preset of ['short', 'natural', 'long', 'custom'])
    assert.equal(normalizeSettings({ voiceDetectionPreset: preset }).voiceDetectionPreset, preset);
});

test('custom silence survives persistence and rejects malformed or unsafe timings', () => {
  for (const value of [100, 300, 400, 1800, 10000]) {
    const settings = normalizeSettings({
      voiceDetectionPreset: 'custom',
      voiceDetectionCustomSilenceMs: value,
    });
    assert.equal(settings.voiceDetectionPreset, 'custom');
    assert.equal(
      voiceDetectionSilenceMs(normalizeSettings(JSON.parse(JSON.stringify(settings)))),
      value,
    );
  }
  for (const value of [undefined, null, '300', 0, 99, 10001, 300.5, NaN, Infinity])
    assert.equal(
      voiceDetectionSilenceMs(
        normalizeSettings({ voiceDetectionPreset: 'custom', voiceDetectionCustomSilenceMs: value }),
      ),
      1000,
    );
  for (const [preset, ms] of [
    ['short', 500],
    ['natural', 1000],
    ['long', 2000],
  ])
    assert.equal(
      voiceDetectionSilenceMs(
        normalizeSettings({ voiceDetectionPreset: preset, voiceDetectionCustomSilenceMs: 300 }),
      ),
      ms,
    );
});

test('Qwen local ASR and TTS selections survive normalization', () => {
  const settings = normalizeSettings({
    engine: 'qwen-http',
    recognitionEngine: 'qwen-http',
    recognitionLang: 'pt-BR',
    voice: 'aiden',
  });
  assert.equal(settings.engine, 'qwen-http');
  assert.equal(settings.recognitionEngine, 'qwen-http');
  assert.equal(settings.recognitionLang, 'pt-BR');
  assert.equal(settings.voice, 'aiden');
});

test('valid local options survive normalization', () => {
  const options = {
    engine: 'say',
    recognitionEngine: 'browser',
    recognitionProcessLocally: false,
    recognitionAutoInstall: false,
    voiceDetectionPreset: 'short',
    voiceDetectionCustomSilenceMs: 400,
    recognitionMaxUtteranceSeconds: 120,
    microphoneEnabled: false,
    holdToTalkEnabled: true,
    announceAssistantMessages: false,
    agentVoiceContextEnabled: defaultSettings.agentVoiceContextEnabled,
    agentVoiceContext: defaultSettings.agentVoiceContext,
    interruptSpeechOnUserMessage: true,
    recognitionLang: 'en-US',
    sendingMode: 'steer',
    autoSendDelaySeconds: 5,
    assistantSpeechDelaySeconds: 5,
    mode: 'headphones',
    lang: 'en-US',
    voice: 'Samantha',
    inputDeviceId: 'microphone-1',
    outputDeviceId: 'speaker-1',
    recognitionFilterEnabled: false,
    recognitionMinimumWords: 4,
    voiceCommandsEnabled: false,
    voiceCommandSend: 'dispatch now',
    voiceCommandQueue: 'save for later',
    voiceCommandEnd: 'finish chat, close chat',
    voiceCommandMute: 'mute now, ignore me',
    voiceCommandResume: 'listen again, resume',
    voiceCommandStopSpeaking: 'silence, stop now',
    voiceCommandClear: 'clear all, remove everything',
    outputCodeFilterEnabled: false,
    outputCodeMaxLines: 9,
    outputCodeNotice: 'See the code above',
    rate: 1.4,
    segmentGapMs: 350,
  };
  assert.deepEqual(normalizeSettings(options), options);
});

test('legacy automatic sending migrates to queue and tri-state modes survive normalization', () => {
  assert.equal(normalizeSettings({ sendingMode: 'automatic' }).sendingMode, 'queue');
  assert.equal(normalizeSettings({ sendingMode: 'queue' }).sendingMode, 'queue');
  assert.equal(normalizeSettings({ sendingMode: 'steer' }).sendingMode, 'steer');
});

test('continuous-speech chunk duration defaults to 60 seconds and accepts safe overrides', () => {
  assert.equal(defaultSettings.recognitionMaxUtteranceSeconds, 60);
  assert.equal(
    normalizeSettings({ recognitionMaxUtteranceSeconds: 120 }).recognitionMaxUtteranceSeconds,
    120,
  );
  for (const value of [9, 301, 60.5, '60'])
    assert.equal(
      normalizeSettings({ recognitionMaxUtteranceSeconds: value }).recognitionMaxUtteranceSeconds,
      60,
    );
});

test('filter settings use safe defaults and reject malformed values', () => {
  assert.equal(defaultSettings.recognitionFilterEnabled, true);
  assert.equal(defaultSettings.recognitionMinimumWords, 2);
  assert.equal(defaultSettings.outputCodeFilterEnabled, true);
  assert.equal(defaultSettings.outputCodeMaxLines, 5);
  assert.equal(defaultSettings.outputCodeNotice, 'Look the code on out conversation');
  const invalid = normalizeSettings({
    recognitionMinimumWords: 0,
    outputCodeMaxLines: 101,
    outputCodeNotice: '',
  });
  assert.equal(invalid.recognitionMinimumWords, 2);
  assert.equal(invalid.outputCodeMaxLines, 5);
  assert.equal(invalid.outputCodeNotice, defaultSettings.outputCodeNotice);
});

test('microphone preference is global-state compatible and safely normalized', () => {
  assert.equal(defaultSettings.microphoneEnabled, true);
  assert.equal(defaultSettings.holdToTalkEnabled, true);
  assert.equal(normalizeSettings({ holdToTalkEnabled: false }).holdToTalkEnabled, false);
  assert.equal(normalizeSettings({ holdToTalkEnabled: 'no' }).holdToTalkEnabled, true);
  assert.equal(normalizeSettings({ microphoneEnabled: false }).microphoneEnabled, false);
  assert.equal(normalizeSettings({ microphoneEnabled: 'no' }).microphoneEnabled, true);
});

test('audio device preferences default to the system devices and reject malformed values', () => {
  assert.equal(defaultSettings.inputDeviceId, '');
  assert.equal(defaultSettings.outputDeviceId, '');
  assert.deepEqual(
    {
      inputDeviceId: normalizeSettings({ inputDeviceId: 'mic-2' }).inputDeviceId,
      outputDeviceId: normalizeSettings({ outputDeviceId: 'speaker-2' }).outputDeviceId,
    },
    { inputDeviceId: 'mic-2', outputDeviceId: 'speaker-2' },
  );
  assert.equal(normalizeSettings({ inputDeviceId: 'bad\0device' }).inputDeviceId, '');
  assert.equal(normalizeSettings({ outputDeviceId: 42 }).outputDeviceId, '');
});
