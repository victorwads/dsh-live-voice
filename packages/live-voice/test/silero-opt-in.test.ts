import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultSettings, normalizeSettings } from '../src/modules/core/settings.ts';

test('Silero defaults for missing settings and explicit energy opts out', () => {
  assert.equal(defaultSettings.voiceDetectionEngine, 'silero');
  for (const input of [
    undefined,
    null,
    {},
    { voiceDetectionPreset: 'long' },
    ...[true, false, 1, 'Silero', 'auto', ''].map((voiceDetectionEngine) => ({
      voiceDetectionEngine,
    })),
  ]) {
    assert.equal(normalizeSettings(input).voiceDetectionEngine, 'silero');
  }
  assert.equal(
    normalizeSettings({ voiceDetectionEngine: 'energy' }).voiceDetectionEngine,
    'energy',
  );
  const saved = normalizeSettings({ voiceDetectionEngine: 'silero', voiceDetectionPreset: 'long' });
  assert.equal(normalizeSettings(JSON.parse(JSON.stringify(saved))).voiceDetectionEngine, 'silero');
  assert.equal(saved.voiceDetectionPreset, 'long');
});
