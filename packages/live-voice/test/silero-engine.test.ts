// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { mockRecordingRepository } from './helpers/recording.js';
import { WhisperHttpRecognitionEngine } from '../src/modules/recognition/engines/whisper/WhisperRecognitionEngine.ts';
import { QwenHttpRecognitionEngine } from '../src/modules/recognition/engines/qwen/QwenRecognitionEngine.ts';
import { VoiceCoordinator } from '../src/modules/core/coordinator.ts';
import { sileroVadAvailable } from '../src/modules/recognition/vad/assets.ts';

function harness(Engine = WhisperHttpRecognitionEngine, mode = 'silero') {
  const requests = [],
    results = [],
    activity = [],
    errors = [];
  let onPcm,
    callbacks,
    released = 0,
    captureReleased = 0,
    factoryCalls = 0,
    processorCalls = 0;
  const processor = { connect() {}, disconnect() {} };
  const context = {
    sampleRate: 48000,
    destination: {},
    createScriptProcessor() {
      processorCalls++;
      return processor;
    },
    createGain() {
      return { gain: {}, connect() {}, disconnect() {} };
    },
  };
  const source = { connect() {}, disconnect() {} };
  const engine = new Engine({
    recordings: mockRecordingRepository(),
    voiceDetectionEngine: mode,
    meter: { context, source },
    globals: {
      fetch: async (url, options) => {
        requests.push({ url, options });
        return Response.json({ ok: true, value: { text: 'test speech' } });
      },
    },
    vadAvailable: async () => true,
    vadFactory: (options) => {
      factoryCalls++;
      callbacks = options;
      return {
        release() {
          released++;
        },
      };
    },
    vadCapture: async (_context, _source, _vad, ingest) => {
      onPcm = ingest;
      return {
        async finish() {
          captureReleased++;
        },
        release() {
          captureReleased++;
        },
      };
    },
  });
  return {
    engine,
    requests,
    results,
    activity,
    errors,
    processor,
    start: () =>
      engine.start({
        onResult: (x) => results.push(x),
        onActivity: (x) => activity.push(x),
        onError: (x) => errors.push(x),
      }),
    frame(probability, value = 0.001) {
      onPcm(new Float32Array(1536).fill(value), 48000);
      callbacks.onProbability({
        probability,
        pcm: new Float32Array(512).fill(value),
        sampleRate: 16000,
      });
    },
    reset() {
      callbacks.onReset();
    },
    get callbacks() {
      return callbacks;
    },
    get onPcm() {
      return onPcm;
    },
    counts: () => ({ released, captureReleased, factoryCalls, processorCalls }),
  };
}
const settle = () => new Promise((resolve) => setImmediate(resolve));

test('explicit energy never acquires Silero and uses the PCM processor', async () => {
  const h = harness(WhisperHttpRecognitionEngine, 'energy');
  await h.start();
  assert.equal(h.engine.voiceDetectionEngine, 'energy');
  assert.equal(h.counts().factoryCalls, 0);
  assert.equal(h.counts().processorCalls, 1);
  await h.engine.stop();
});

test('Silero probabilities accept quiet speech for both engines without RMS gating', async () => {
  for (const Engine of [WhisperHttpRecognitionEngine, QwenHttpRecognitionEngine]) {
    const h = harness(Engine);
    await h.start();
    assert.equal(h.counts().processorCalls, 0);
    for (let i = 0; i < 10; i++) h.frame(0.01);
    for (let i = 0; i < 10; i++) h.frame(0.9);
    for (let i = 0; i < 25; i++) h.frame(0.01);
    await settle();
    assert.equal(h.requests.length, 1);
    assert.equal(h.requests[0].options.credentials, 'same-origin');
    assert.equal(new DataView(h.requests[0].options.body).getUint32(24, true), 16000);
    assert.equal(h.results.length, 1);
    await h.engine.stop();
  }
});

test('Silero silence stays in the recording without queued PCM and short misfires do not transcribe', async () => {
  const h = harness();
  await h.start();
  for (let i = 0; i < 2000; i++) {
    h.frame(0.01);
    if (i % 64 === 63) await settle();
  }
  await settle();
  assert.equal(h.engine.session.writer.session.capturedSamples, 2000 * 1536);
  assert.equal(h.engine.session.transcriptionQueue.length, 0);
  assert.equal(h.engine.session.writer.session.pins.length, 1);
  assert.equal(
    'preRoll' in h.engine.session,
    false,
    'the engine must not retain legacy PCM buffers',
  );
  h.frame(0.9);
  for (let i = 0; i < 25; i++) h.frame(0.01);
  await settle();
  assert.equal(h.requests.length, 0);
  await h.engine.stop();
});

test('stopping one source does not affect the other and obsolete callbacks cannot write', async () => {
  const a = harness(),
    b = harness();
  await a.start();
  await b.start();
  const old = a.callbacks;
  const stalePcm = a.onPcm;
  const writer = a.engine.session.writer;
  await a.engine.stop();
  for (let i = 0; i < 10; i++) {
    stalePcm(new Float32Array(1536), 48000);
    old.onProbability({ probability: 0.9, pcm: new Float32Array(512) });
    b.frame(0.9);
  }
  for (let i = 0; i < 25; i++) b.frame(0.01);
  await settle();
  assert.equal(a.requests.length, 0);
  assert.equal(
    writer.session.capturedSamples,
    0,
    'stale capture PCM cannot append to a sealed recording',
  );
  assert.equal(b.requests.length, 1);
  await b.engine.stop();
});

test('stop during asset check cannot resurrect capture', async () => {
  const h = harness();
  let resolve;
  h.engine.vadAvailable = () =>
    new Promise((r) => {
      resolve = r;
    });
  const starting = h.start();
  await new Promise((r) => setImmediate(r));
  await h.engine.stop();
  resolve(true);
  await assert.rejects(starting, { name: 'AbortError' });
  assert.equal(h.counts().factoryCalls, 0);
  assert.equal(h.engine.session, null);
});

for (const Engine of [WhisperHttpRecognitionEngine, QwenHttpRecognitionEngine]) {
  for (const [reason, check] of [
    ['missing assets', async () => false],
    [
      '404 versioned route',
      () => sileroVadAvailable(async () => new Response('not found', { status: 404 })),
    ],
    [
      'network failure',
      () =>
        sileroVadAvailable(async () => {
          throw new Error('connection lost');
        }),
    ],
    ['malformed response', () => sileroVadAvailable(async () => new Response('invalid json'))],
    [
      'throwing availability probe',
      async () => {
        throw new Error('probe failed');
      },
    ],
  ]) {
    test(Engine.name + ': configured Silero fails closed on ' + reason, async () => {
      const h = harness(Engine);
      h.engine.vadAvailable = check;
      h.engine.vadErrorMessage = (e) =>
        e.code === 'unavailable' ? 'localized Silero unavailable' : 'localized Silero failed';
      await assert.rejects(h.start(), /localized Silero unavailable/);
      assert.equal(h.engine.session, null);
      assert.equal(h.engine.voiceDetectionEngine, 'silero');
      assert.equal(h.counts().processorCalls, 0);
      assert.equal(h.counts().factoryCalls, 0);
      assert.equal(h.requests.length, 0);
    });
  }
  test(
    Engine.name + ': frontend shows Silero failure and releases microphone without fallback',
    async (t) => {
      const h = harness(Engine);
      h.engine.vadAvailable = async () => false;
      h.engine.vadErrorMessage = () => 'localized Silero unavailable';
      h.engine.capability = async () => ({ supported: true });
      const meter = h.engine.meter;
      let stops = 0;
      meter.start = async () => true;
      meter.stop = async () => {
        stops++;
      };
      const coordinator = new VoiceCoordinator({
        recognition: h.engine,
        meter,
        engines: {},
        settings: { mode: 'headphones' },
        composer: { getDraft: () => '', setDraft() {} },
      });
      t.after(() => coordinator.dispose());
      await coordinator.startDictation();
      assert.equal(coordinator.snapshot.error, 'localized Silero unavailable');
      assert.equal(coordinator.snapshot.listening, false);
      assert.equal(coordinator.snapshot.starting, false);
      assert.equal(h.engine.session, null);
      assert.ok(stops > 0);
      assert.equal(h.counts().processorCalls, 0);
    },
  );
  for (const phase of ['model', 'worklet']) {
    test(
      Engine.name + ': ' + phase + ' loading failure reports error without energy capture',
      async () => {
        const h = harness(Engine);
        h.engine.vadErrorMessage = () => 'localized Silero failed';
        if (phase === 'model')
          h.engine.vadFactory = () => {
            throw new Error('model load failed');
          };
        else
          h.engine.vadCapture = async () => {
            throw new Error('worklet load failed');
          };
        await assert.rejects(h.start(), /localized Silero failed/);
        assert.equal(h.engine.session, null);
        assert.equal(h.engine.voiceDetectionEngine, 'silero');
        assert.equal(h.counts().processorCalls, 0);
        if (phase === 'worklet') assert.equal(h.counts().released, 3);
      },
    );
  }
  test(
    Engine.name + ': cancelled availability failure cannot overwrite a newer capture',
    async () => {
      const h = harness(Engine);
      let resolve;
      h.engine.vadAvailable = () =>
        new Promise((r) => {
          resolve = r;
        });
      const old = h.start();
      await settle();
      await h.engine.stop();
      h.engine.voiceDetectionEngine = 'energy';
      await h.start();
      const current = h.engine.session;
      resolve(false);
      await assert.rejects(old, { name: 'AbortError' });
      assert.equal(h.engine.session, current);
      assert.equal(current.detector, 'energy');
      await h.engine.stop();
    },
  );
  test(Engine.name + ': explicit energy does not check unavailable Silero', async () => {
    const h = harness(Engine, 'energy');
    h.engine.vadAvailable = () => {
      throw new Error('energy must not probe Silero');
    };
    await h.start();
    assert.equal(h.engine.session.detector, 'energy');
    assert.equal(h.counts().factoryCalls, 0);
    assert.equal(h.counts().processorCalls, 1);
    await h.engine.stop();
  });
}

for (const Engine of [WhisperHttpRecognitionEngine, QwenHttpRecognitionEngine]) {
  test(Engine.name + ': transient startup failure retries twice and succeeds', async () => {
    const h = harness(Engine);
    const attach = h.engine.vadCapture;
    let attempts = 0;
    h.engine.vadCapture = async (...args) => {
      if (++attempts < 3) throw new Error('temporary worklet failure');
      return attach(...args);
    };
    await h.start();
    assert.equal(attempts, 3);
    assert.equal(h.counts().factoryCalls, 3);
    assert.equal(h.errors.length, 0);
    await h.engine.stop();
  });
  test(
    Engine.name + ': recovery preserves the sample line, open speech and pending transcription',
    async () => {
      const h = harness(Engine);
      const processing = [];
      let reply;
      h.engine.g.fetch = () =>
        new Promise((resolve) => {
          reply = resolve;
        });
      await h.engine.start({
        onProcessingChange: (state) => processing.push(state),
        onResult: (result) => h.results.push(result),
      });
      const recording = h.engine.session;
      for (let i = 0; i < 10; i++) h.frame(0.9);
      await settle();
      const pins = recording.writer.session.pins.length;
      h.callbacks.onError(new Error('intermittent model failure'));
      assert.ok(processing.at(-1).pending > 0, 'recovery prevents premature playback');
      assert.ok(
        processing.at(-1).deliveryPending > 0,
        'recovery prevents premature automatic sending',
      );
      await settle();
      assert.equal(h.engine.session, recording);
      assert.equal(
        recording.writer.session.pins.length,
        pins,
        'restart cannot invent a silence pin',
      );
      for (let i = 0; i < 10; i++) h.frame(0.9);
      for (let i = 0; i < 40; i++) h.frame(0);
      await settle();
      assert.equal(typeof reply, 'function');
      reply(Response.json({ ok: true, value: { text: 'preserved speech' } }));
      await settle();
      assert.equal(recording.writer.session.capturedSamples, 60 * 1536);
      assert.equal(h.results[0].final, 'preserved speech');
      await h.engine.stop();
    },
  );
  test(Engine.name + ': two Silero retries reset only after successful inference', async () => {
    const h = harness(Engine);
    await h.start();
    const original = h.engine.session;
    for (let cycle = 0; cycle < 3; cycle++) {
      for (let attempt = 0; attempt < 2; attempt++) {
        const stale = h.callbacks;
        const stalePcm = h.onPcm;
        stale.onReset();
        stale.onError(new Error('same failed generation'));
        await settle();
        assert.equal(h.engine.session, original);
        assert.equal(h.errors.length, 0);
        const count = original.capturedSamples;
        stalePcm(new Float32Array(1536), 48000);
        stale.onProbability({ probability: 0.9, pcm: new Float32Array(512) });
        assert.equal(original.capturedSamples, count);
      }
      h.frame(0);
      await settle();
    }
    assert.equal(h.counts().factoryCalls, 7);
    assert.equal(h.counts().processorCalls, 0);
    await h.engine.stop();
  });
  test(Engine.name + ': persistent runtime failure reports once after two retries', async () => {
    const h = harness(Engine);
    await h.start();
    for (let attempt = 0; attempt < 3; attempt++) {
      h.callbacks.onError(new Error('model failed'));
      await settle();
    }
    assert.equal(h.counts().factoryCalls, 3);
    assert.equal(h.engine.session, null);
    assert.equal(h.errors.length, 1);
    assert.equal(h.counts().processorCalls, 0);
  });
  test(Engine.name + ': stop cancels a pending Silero reattachment', async () => {
    const h = harness(Engine);
    await h.start();
    let attach;
    let released = 0;
    h.engine.vadCapture = () =>
      new Promise((resolve) => {
        attach = resolve;
      });
    h.callbacks.onError(new Error('restart'));
    await settle();
    const stopped = h.engine.stop();
    attach({ finish: async () => {}, release: () => released++ });
    await stopped;
    assert.equal(h.engine.session, null);
    assert.equal(released, 1);
    assert.equal(h.errors.length, 0);
  });
}
