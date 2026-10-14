// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeSettings,
  defaultSettings,
  voiceDetectionSilenceMs,
  voiceDetectionParagraphMs,
  voiceDetectionPresets,
} from '../src/modules/core/settings.ts';
test('speech volume defaults safely and survives normalized persistence', () => {
  assert.equal(defaultSettings.volume, 1);
  for (const volume of [0, 0.37, 1]) {
    assert.equal(
      normalizeSettings(JSON.parse(JSON.stringify(normalizeSettings({ volume })))).volume,
      volume,
    );
  }
  for (const volume of [undefined, null, NaN, Infinity, -0.1, 1.1, '0.5', true]) {
    assert.equal(normalizeSettings({ volume }).volume, 1);
  }
});

test('reported DSH busy-Enter behavior survives normalization and defaults to legacy queue', () => {
  assert.equal(normalizeSettings({}).dshBusyEnterBehavior, 'queue');
  for (const behavior of ['steer', 'queue']) {
    const settings = normalizeSettings({ dshBusyEnterBehavior: behavior });
    assert.equal(
      normalizeSettings(JSON.parse(JSON.stringify(settings))).dshBusyEnterBehavior,
      behavior,
    );
  }
  for (const behavior of [null, '', 'automatic', true, 1])
    assert.equal(
      normalizeSettings({ dshBusyEnterBehavior: behavior }).dshBusyEnterBehavior,
      'queue',
    );
});

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
  assert.equal(voiceDetectionSilenceMs(normalizeSettings({})), 400);
  assert.equal(voiceDetectionSilenceMs({}), 400);
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
    ['short', 400],
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

test('paragraph presets are independent of chunk pauses and unknown presets use short', () => {
  for (const [preset, silenceMs, paragraphMs] of [
    ['short', 400, 2000],
    ['natural', 1000, 3000],
    ['long', 2000, 4000],
  ]) {
    assert.equal(voiceDetectionPresets[preset].silenceMs, silenceMs);
    assert.equal(voiceDetectionPresets[preset].paragraphMs, paragraphMs);
    const settings = normalizeSettings({
      voiceDetectionPreset: preset,
      voiceDetectionCustomSilenceMs: 300,
      voiceDetectionCustomParagraphMs: 12000,
    });
    assert.equal(voiceDetectionSilenceMs(settings), silenceMs);
    assert.equal(voiceDetectionParagraphMs(settings), paragraphMs);
  }
  for (const settings of [
    {},
    { voiceDetectionPreset: 'unknown' },
    { voiceDetectionPreset: 'toString' },
    { voiceDetectionPreset: '__proto__' },
  ])
    assert.equal(voiceDetectionParagraphMs(settings), 2000);
});

test('custom paragraph timings persist independently and reject malformed values', () => {
  assert.equal(defaultSettings.voiceDetectionCustomParagraphMs, 3000);
  for (const value of [100, 400, 1800, 3000, 10000, 30000]) {
    const settings = normalizeSettings({
      voiceDetectionPreset: 'custom',
      voiceDetectionCustomSilenceMs: 10000,
      voiceDetectionCustomParagraphMs: value,
    });
    const restored = normalizeSettings(JSON.parse(JSON.stringify(settings)));
    assert.equal(restored.voiceDetectionCustomParagraphMs, value);
    assert.equal(voiceDetectionParagraphMs(restored), value);
    assert.equal(voiceDetectionSilenceMs(restored), 10000);
  }
  for (const value of [undefined, null, '3000', true, 0, 99, 30001, 3000.5, NaN, Infinity]) {
    const raw = { voiceDetectionPreset: 'custom', voiceDetectionCustomParagraphMs: value };
    assert.equal(normalizeSettings(raw).voiceDetectionCustomParagraphMs, 3000);
    assert.equal(voiceDetectionParagraphMs(raw), 3000);
  }
  const independent = normalizeSettings({
    voiceDetectionPreset: 'custom',
    voiceDetectionCustomParagraphMs: 4000,
    voiceDetectionCustomSilenceMs: 0,
  });
  assert.equal(voiceDetectionParagraphMs(independent), 4000);
  assert.equal(voiceDetectionSilenceMs(independent), 1000);
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
    voiceDetectionEngine: 'energy',
    voiceDetectionPreset: 'short',
    voiceDetectionCustomSilenceMs: 400,
    voiceDetectionCustomParagraphMs: 3000,
    voiceDetectionThreshold: 0.5,
    voiceDetectionMinimumSpeechMs: 250,
    recordingEnabled: false,
    recordingKeepPrevious: 3,
    recordingBitrate: 48000,
    recordingPreRollMs: 320,
    recordingPostRollMs: 320,
    recognitionMaxUtteranceSeconds: 120,
    microphoneEnabled: false,
    holdToTalkEnabled: true,
    announceAssistantMessages: false,
    agentVoiceContextEnabled: defaultSettings.agentVoiceContextEnabled,
    agentVoiceContext: defaultSettings.agentVoiceContext,
    interruptSpeechOnUserMessage: true,
    recognitionLang: 'en-US',
    sendingMode: 'steer',
    dshBusyEnterBehavior: 'steer',
    autoSendDelaySeconds: 5,
    assistantSpeechDelaySeconds: 4,
    mode: 'headphones',
    lang: 'en-US',
    voice: 'Samantha',
    inputDeviceId: 'microphone-1',
    outputDeviceId: 'speaker-1',
    recognitionFilterEnabled: false,
    recognitionMinimumWords: 4,
    voiceCommandsEnabled: false,
    sharedVoiceCommandsEnabled: true,
    timestampsEnabled: true,
    sharedTimestampsEnabled: false,
    microphoneSourceName: 'Me',
    sharedSourceName: 'Them',
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
    volume: 0.6,
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
  assert.equal(
    defaultSettings.outputCodeNotice,
    'Você pode ver o código no histórico da nossa conversa.',
  );
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
  assert.equal(defaultSettings.holdToTalkEnabled, false);
  assert.equal(normalizeSettings({ holdToTalkEnabled: false }).holdToTalkEnabled, false);
  assert.equal(normalizeSettings({ holdToTalkEnabled: 'no' }).holdToTalkEnabled, false);
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

test('automatic send delay supports 600ms and 800ms with a six second maximum', () => {
  for (const value of [0.6, 0.8, 1, 2, 3, 4, 5, 6])
    assert.equal(normalizeSettings({ autoSendDelaySeconds: value }).autoSendDelaySeconds, value);
  for (const value of [0.5, 0.9, 7, 8, 10, NaN])
    assert.equal(normalizeSettings({ autoSendDelaySeconds: value }).autoSendDelaySeconds, 4);
  assert.equal(defaultSettings.autoSendDelaySeconds, 4);
});

test('assistant response delay defaults to zero and accepts only zero through four seconds', () => {
  assert.equal(defaultSettings.assistantSpeechDelaySeconds, 0);
  for (const value of [0, 1, 2, 3, 4])
    assert.equal(
      normalizeSettings({ assistantSpeechDelaySeconds: value }).assistantSpeechDelaySeconds,
      value,
    );
  for (const value of [-1, 5, 10, 0.5])
    assert.equal(
      normalizeSettings({ assistantSpeechDelaySeconds: value }).assistantSpeechDelaySeconds,
      0,
    );
});

test('meeting source names normalize safely', () => {
  assert.equal(
    normalizeSettings({ microphoneSourceName: '  Ana Silva  ' }).microphoneSourceName,
    'Ana Silva',
  );
  assert.equal(normalizeSettings({ sharedSourceName: '团队' }).sharedSourceName, '团队');
  assert.equal(normalizeSettings({ sharedSourceName: 'x'.repeat(80) }).sharedSourceName.length, 80);
  for (const value of [null, 42, '', '   ', 'x'.repeat(81), 'a\nb', 'a\0b', 'a\tb', 'a\u2028b']) {
    assert.equal(normalizeSettings({ microphoneSourceName: value }).microphoneSourceName, 'Me');
    assert.equal(normalizeSettings({ sharedSourceName: value }).sharedSourceName, 'Them');
  }
});

test('recoverable recording is opt-in and validates retention, bitrate, padding and detector bounds', () => {
  const defaults = {
    recordingEnabled: false,
    recordingKeepPrevious: 3,
    recordingBitrate: 48000,
    recordingPreRollMs: 320,
    recordingPostRollMs: 320,
    voiceDetectionThreshold: 0.5,
    voiceDetectionMinimumSpeechMs: 250,
  };
  const pick = (settings) =>
    Object.fromEntries(Object.keys(defaults).map((key) => [key, settings[key]]));
  assert.deepEqual(pick(normalizeSettings({})), defaults);
  for (const enabled of [true, false])
    assert.equal(normalizeSettings({ recordingEnabled: enabled }).recordingEnabled, enabled);
  for (const enabled of [1, 'true', null, undefined])
    assert.equal(normalizeSettings({ recordingEnabled: enabled }).recordingEnabled, false);
  const cases = [
    ['recordingKeepPrevious', [1, 3, 100], [0, -1, 101, 1.5, '3', null]],
    ['recordingBitrate', [24000, 32000, 48000, 64000, 96000], [0, 16000, 48001, '48000', null]],
    ['recordingPreRollMs', [0, 320, 2000], [-1, 2001, 320.5, '320', null]],
    ['recordingPostRollMs', [0, 320, 2000], [-1, 2001, 320.5, '320', null]],
    ['voiceDetectionThreshold', [0.05, 0.5, 0.95], [0, 0.049, 0.951, '0.5', null]],
    ['voiceDetectionMinimumSpeechMs', [50, 250, 2000], [0, 49, 2001, 250.5, '250', null]],
  ];
  for (const [key, valid, invalid] of cases) {
    for (const value of valid) {
      const saved = normalizeSettings(
        JSON.parse(JSON.stringify(normalizeSettings({ [key]: value }))),
      );
      assert.equal(saved[key], value, key);
    }
    for (const value of [...invalid, undefined, true, NaN, Infinity, -Infinity])
      assert.equal(normalizeSettings({ [key]: value })[key], defaults[key], key);
  }
});
