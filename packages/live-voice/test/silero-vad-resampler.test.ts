import test from 'node:test';
import assert from 'node:assert/strict';
import {
  StreamingResampler,
  SileroFrameResampler,
} from '../src/modules/recognition/vad/StreamingResampler.js';
for (const rate of [16000, 44100, 48000])
  test('streaming resampler ' + rate + ' preserves phase across arbitrary chunks', () => {
    const input = Float32Array.from({ length: rate }, (_, i) => Math.sin(i * 0.03));
    const expected = new StreamingResampler().process(input, rate);
    const resampler = new StreamingResampler();
    const output = [];
    for (let at = 0; at < input.length; at += 137)
      output.push(...resampler.process(input.subarray(at, at + 137), rate));
    assert.equal(expected.length, 16000);
    assert.deepEqual(Float32Array.from(output), expected);
  });
test('resampler rejects invalid PCM/rate and requires explicit reset on rate change', () => {
  const r = new StreamingResampler();
  assert.throws(() => r.process(new Float32Array(1), NaN), /rate/);
  assert.throws(() => r.process(Float32Array.from([NaN]), 48000), /sample/);
  r.reset();
  r.process(new Float32Array(1), 48000);
  assert.throws(() => r.process(new Float32Array(1), 44100), /changed/);
  r.reset();
  assert.equal(r.process(new Float32Array(441), 44100).length, 160);
});
test('frame accumulators isolate sources and clear partial frames on reset', () => {
  const a = new SileroFrameResampler();
  const b = new SileroFrameResampler();
  assert.deepEqual(a.process(new Float32Array(1000).fill(1), 48000), []);
  assert.deepEqual(b.process(new Float32Array(1000).fill(2), 48000), []);
  const af = a.process(new Float32Array(536).fill(1), 48000);
  const bf = b.process(new Float32Array(536).fill(2), 48000);
  assert.equal(af.length, 1);
  assert.equal(bf.length, 1);
  assert.ok(af[0].every((v) => v === 1));
  assert.ok(bf[0].every((v) => v === 2));
  a.process(new Float32Array(600).fill(8), 48000);
  a.reset();
  const next = a.process(new Float32Array(1536).fill(3), 48000);
  assert.ok(next[0].every((v) => v === 3));
});
