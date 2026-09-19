// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSettings, defaultSettings } from '../src/core/settings.ts';
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
    'natural',
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
    microphoneEnabled: false,
    announceAssistantMessages: false,
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
  };
  assert.deepEqual(normalizeSettings(options), options);
});

test('legacy automatic sending migrates to queue and tri-state modes survive normalization', () => {
  assert.equal(normalizeSettings({ sendingMode: 'automatic' }).sendingMode, 'queue');
  assert.equal(normalizeSettings({ sendingMode: 'queue' }).sendingMode, 'queue');
  assert.equal(normalizeSettings({ sendingMode: 'steer' }).sendingMode, 'steer');
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
