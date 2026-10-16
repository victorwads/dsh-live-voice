// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { WhisperHttpRecognitionEngine } from '../src/modules/recognition/engines/whisper/WhisperRecognitionEngine.js';
import { mockRecordingRepository } from './helpers/recording.js';
import { TRANSCRIPTION_BOUNDARY_MARGIN_MS } from '../src/modules/recording/RecordingRecognition.js';
const tick = () => new Promise((resolve) => setImmediate(resolve));
async function fixture(rate = 16000, kind = 'microphone', max = 60) {
  let ingest, classify;
  const requests = [],
    processing = [],
    results = [];
  const recordings = mockRecordingRepository();
  const engine = new WhisperHttpRecognitionEngine({
    recordings,
    meter: { context: { sampleRate: rate }, source: {} },
    inputSource: kind,
    voiceDetectionEngine: 'silero',
    voiceDetectionPreset: 'short',
    voiceDetectionMinimumSpeechMs: 50,
    maxUtteranceSeconds: max,
    recordingPreRollMs: 0,
    recordingPostRollMs: 0,
    vadAvailable: async () => true,
    vadFactory: (options) => {
      classify = options.onProbability;
      return { release() {} };
    },
    vadCapture: async (_c, _s, _v, callback) => {
      ingest = callback;
      return { finish: async () => {}, release() {} };
    },
    globals: {
      fetch: async (_url, options) => {
        requests.push(new Int16Array(options.body, 44));
        return Response.json({ ok: true, value: { text: 'boundary words' } });
      },
    },
  });
  await engine.start({
    onProcessingChange: (state) => processing.push(state),
    onResult: (result) => results.push(result),
  });
  return {
    engine,
    recordings,
    requests,
    results,
    processing,
    frame(seconds, probability, value = 0) {
      ingest(new Float32Array(Math.round(seconds * rate)).fill(value), rate);
      classify({ probability, pcm: new Float32Array(Math.round(seconds * 16000)) });
    },
  };
}
for (const rate of [16000, 48000])
  for (const kind of ['microphone', 'shared']) {
    test(kind + ': 800 ms context waits for saved post-roll at ' + rate + ' Hz', async (t) => {
      const f = await fixture(rate, kind);
      t.after(() => f.engine.stop());
      assert.equal(TRANSCRIPTION_BOUNDARY_MARGIN_MS, 800);
      f.frame(1, 0, 0.1);
      f.frame(0.2, 0.9, 0.2);
      f.frame(0.4, 0, 0.3);
      await tick();
      assert.equal(f.requests.length, 0, 'silence confirmation alone has only 400 ms of tail');
      assert.ok(f.processing.at(-1).deliveryPending > 0);
      f.frame(0.4 - 1 / rate, 0, 0.4);
      await tick();
      assert.equal(f.requests.length, 0, 'never start one sample early');
      f.frame(1 / rate, 0, 0.5);
      await tick();
      assert.equal(f.requests.length, 1);
      assert.equal(f.requests[0].length, Math.round(1.8 * 16000));
      assert.equal(
        f.requests[0].at(-1),
        Math.trunc((rate === 16000 ? 0.5 : (0.4 + 0.4 + 0.5) / 3) * 32767),
      );
      const saved = (await f.recordings.list())[0];
      assert.equal(saved.attempts[0].startSample, Math.round(0.2 * rate));
      assert.equal(saved.attempts[0].endSample, 2 * rate);
      assert.equal(saved.attempts[0].speechStartSample, rate);
      assert.equal(
        saved.pins.at(-1).atSample,
        Math.round(1.2 * rate),
        'VAD boundary stays unchanged',
      );
      assert.equal(f.results[0].startedAt, Date.parse(saved.startedAt) + 1000);
    });
  }
test('max-length chunks overlap on both sides without waiting on the PCM write queue', async (t) => {
  const f = await fixture(16000, 'microphone', 1);
  t.after(() => f.engine.stop());
  f.frame(1, 0.9, 0.1);
  await tick();
  assert.equal(f.requests.length, 0);
  f.frame(0.8, 0.9, 0.2);
  await tick();
  assert.equal(f.requests.length, 1);
  f.frame(0.2, 0.9, 0.3);
  f.frame(0.8, 0.9, 0.4);
  await tick();
  assert.equal(f.requests.length, 2);
  const attempts = (await f.recordings.list())[0].attempts;
  assert.equal(attempts[0].endSample, 28800);
  assert.equal(attempts[1].startSample, 3200);
  assert.equal(attempts[1].endSample, 44800);
  assert.equal((await f.recordings.list())[0].pins.length, 2);
});
test('capture finish clips pending context to actual audio; stop cancels it', async () => {
  for (const cancel of [false, true]) {
    const f = await fixture();
    f.frame(0.1, 0.9, 0.2);
    f.frame(0.4, 0, 0.3);
    await tick();
    assert.equal(f.requests.length, 0);
    if (cancel) await f.engine.stop();
    else await f.engine.finish();
    await tick();
    assert.equal(f.requests.length, cancel ? 0 : 1);
    if (!cancel) {
      assert.equal(f.requests[0].length, 8000);
      await f.engine.stop();
    }
  }
});
