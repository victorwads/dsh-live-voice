// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSettings, defaultSettings } from '../src/modules/core/settings.ts';

test('speech segment gap defaults to 400 ms and accepts bounded integer values', () => {
  assert.equal(defaultSettings.segmentGapMs, 400);
  assert.equal(normalizeSettings({}).segmentGapMs, 400);
  assert.equal(normalizeSettings({ segmentGapMs: 325.6 }).segmentGapMs, 326);
  for (const value of [-1, 2001, Infinity, NaN, '200'])
    assert.equal(normalizeSettings({ segmentGapMs: value }).segmentGapMs, 400);
});
