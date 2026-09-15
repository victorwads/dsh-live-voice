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
    announceAssistantMessages: false,
    interruptSpeechOnUserMessage: true,
    recognitionLang: 'en-US',
    sendingMode: 'automatic',
    autoSendDelaySeconds: 5,
    assistantSpeechDelaySeconds: 5,
    mode: 'headphones',
    lang: 'en-US',
    voice: 'Samantha',
    rate: 1.4,
  };
  assert.deepEqual(normalizeSettings(options), options);
});
