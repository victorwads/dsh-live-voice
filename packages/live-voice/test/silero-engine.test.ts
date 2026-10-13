// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { WhisperHttpRecognitionEngine } from '../src/modules/recognition/engines/whisper/WhisperRecognitionEngine.ts';
import { QwenHttpRecognitionEngine } from '../src/modules/recognition/engines/qwen/QwenRecognitionEngine.ts';
import { VoiceCoordinator } from '../src/modules/core/coordinator.ts';
import { sileroVadAvailable } from '../src/modules/recognition/vad/assets.ts';

function harness(Engine = WhisperHttpRecognitionEngine, mode = 'silero') {
  const requests = [],
    results = [],
    activity = [],
    errors = [];
  let callbacks,
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
    vadCapture: async () => ({
      release() {
        captureReleased++;
      },
    }),
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
    counts: () => ({ released, captureReleased, factoryCalls, processorCalls }),
  };
}
const settle = () => new Promise((resolve) => setImmediate(resolve));

test('energy default never acquires Silero or changes the legacy RMS processor', async () => {
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
    for (let i = 0; i < 16; i++) h.frame(0.01);
    await settle();
    assert.equal(h.requests.length, 1);
    assert.equal(h.requests[0].options.credentials, 'same-origin');
    assert.equal(new DataView(h.requests[0].options.body).getUint32(24, true), 16000);
    assert.equal(h.results.length, 1);
    await h.engine.stop();
  }
});

test('Silero silence buffers are bounded and short misfires do not transcribe', async () => {
  const h = harness();
  await h.start();
  for (let i = 0; i < 2000; i++) h.frame(0.01);
  assert.equal(h.engine.session.samples, 0);
  assert.equal(h.engine.session.preRoll.length, 10);
  h.frame(0.9);
  for (let i = 0; i < 16; i++) h.frame(0.01);
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
  await a.engine.stop();
  for (let i = 0; i < 10; i++) {
    old.onProbability({ probability: 0.9, pcm: new Float32Array(512) });
    b.frame(0.9);
  }
  for (let i = 0; i < 16; i++) b.frame(0.01);
  await settle();
  assert.equal(a.requests.length, 0);
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
        if (phase === 'worklet') assert.equal(h.counts().released, 1);
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

test('model failure reports an error and never silently falls back to energy', async () => {
  const h = harness();
  await h.start();
  h.callbacks.onError(new Error('model failed'));
  assert.equal(h.engine.session, null);
  assert.equal(h.errors.length, 1);
  assert.equal(h.counts().processorCalls, 0);
});
