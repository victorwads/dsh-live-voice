import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultSettings, normalizeSettings } from '../src/modules/core/settings.ts';

test('energy is unchanged by default and only explicit Silero selection opts in', () => {
  assert.equal(defaultSettings.voiceDetectionEngine, 'energy');
  for (const input of [
    undefined,
    null,
    {},
    { voiceDetectionPreset: 'long' },
    ...[true, false, 1, 'Silero', 'auto', ''].map((voiceDetectionEngine) => ({
      voiceDetectionEngine,
    })),
  ]) {
    assert.equal(normalizeSettings(input).voiceDetectionEngine, 'energy');
  }
  const saved = normalizeSettings({ voiceDetectionEngine: 'silero', voiceDetectionPreset: 'long' });
  assert.equal(normalizeSettings(JSON.parse(JSON.stringify(saved))).voiceDetectionEngine, 'silero');
  assert.equal(saved.voiceDetectionPreset, 'long');
});
