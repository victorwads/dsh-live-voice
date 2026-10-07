// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { SharedAudioMeter } from '../src/modules/core/sharedAudio.js';
test('shared audio permission arriving after cancellation releases all tracks', async () => {
  let resolve;
  let stopped = 0;
  const meter = new SharedAudioMeter({});
  meter.provide(new Promise((done) => (resolve = done)));
  const abort = new AbortController();
  const starting = meter.start({ signal: abort.signal });
  await new Promise((done) => setImmediate(done));
  abort.abort();
  resolve({ getTracks: () => [{ stop: () => stopped++ }] });
  assert.equal(await starting, false);
  assert.equal(stopped, 1);
  assert.equal(meter.stream, null);
});
test('sharing without an audio track is rejected and video is released', async () => {
  let stopped = 0;
  const meter = new SharedAudioMeter({});
  meter.provide(
    Promise.resolve({ getTracks: () => [{ stop: () => stopped++ }], getAudioTracks: () => [] }),
  );
  await assert.rejects(meter.start(), /No shared audio/);
  assert.equal(stopped, 1);
  assert.equal(meter.current, null);
});
