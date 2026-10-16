// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { mockRecordingRepository } from './helpers/recording.js';
import { WhisperHttpRecognitionEngine } from '../src/modules/recognition/engines/whisper/WhisperRecognitionEngine.ts';
import { QwenHttpRecognitionEngine } from '../src/modules/recognition/engines/qwen/QwenRecognitionEngine.ts';
import { VoiceCoordinator } from '../src/modules/core/coordinator.ts';

const tick = () => new Promise((resolve) => setImmediate(resolve));
const deferred = () => {
  let resolve;
  const promise = new Promise((r) => {
    resolve = r;
  });
  return { promise, resolve };
};
function fixture(Engine, detector = 'silero', delayedFinish = false) {
  let onPcm,
    callbacks,
    draft = '',
    speechDone;
  const requests = [],
    spoken = [],
    finishGate = deferred();
  const processor = { connect() {}, disconnect() {} };
  let vadReleased = false,
    captureReleased = false;
  const meter = {
    context: {
      sampleRate: 16000,
      destination: {},
      createScriptProcessor: () => processor,
      createGain: () => ({ gain: {}, connect() {}, disconnect() {} }),
    },
    source: { connect() {}, disconnect() {} },
    async start() {
      return true;
    },
    async stop() {},
  };
  const recognition = new Engine({
    recordings: mockRecordingRepository(),
    meter,
    voiceDetectionEngine: detector,
    vadAvailable: async () => true,
    vadFactory: (c) => {
      callbacks = c;
      return {
        release() {
          vadReleased = true;
        },
      };
    },
    vadCapture: async (_context, _source, _vad, ingest) => {
      onPcm = ingest;
      return {
        async finish() {
          if (delayedFinish) await finishGate.promise;
          captureReleased = true;
        },
        release() {
          captureReleased = true;
          finishGate.resolve();
        },
      };
    },
    globals: {
      fetch: (_url, options) => {
        const gate = deferred();
        requests.push({ options, resolve: gate.resolve });
        return gate.promise;
      },
    },
  });
  recognition.capability = async () => ({ supported: true });
  const coordinator = new VoiceCoordinator({
    recognition,
    meter,
    engines: {
      browser: {
        speak(text) {
          spoken.push(text);
          const gate = deferred();
          speechDone = gate.resolve;
          return gate.promise;
        },
        async stop() {
          speechDone?.();
        },
      },
    },
    composer: {
      getDraft: () => draft,
      setDraft: (x) => {
        draft = x;
      },
      submit() {},
    },
    settings: {
      mode: 'speaker',
      sendingMode: 'manual',
      recognitionFilterEnabled: false,
      assistantSpeechDelaySeconds: 0,
    },
  });
  return {
    recognition,
    coordinator,
    requests,
    spoken,
    finishGate,
    get vadReleased() {
      return vadReleased;
    },
    get captureReleased() {
      return captureReleased;
    },
    frame(active, value = active ? 0.25 : 0) {
      const pcm = new Float32Array(512).fill(value);
      if (detector === 'silero') {
        onPcm(pcm, 16000);
        callbacks.onProbability({ probability: active ? 0.9 : 0.01, pcm });
      } else processor.onaudioprocess?.({ inputBuffer: { getChannelData: () => pcm } });
    },
    respond(index) {
      requests[index].resolve(
        Response.json({ ok: true, value: { text: 'synthetic phrase ' + index } }),
      );
    },
    draft: () => draft,
  };
}
const wavSamples = (request) => new Int16Array(request.options.body, 44);

for (const Engine of [WhisperHttpRecognitionEngine, QwenHttpRecognitionEngine]) {
  test(Engine.name + ': finish drains delayed frames before closing the final WAV', async (t) => {
    const h = fixture(Engine, 'silero', true);
    t.after(() => h.coordinator.dispose());
    await h.coordinator.startHoldToTalk();
    for (let i = 0; i < 10; i++) h.frame(true);
    const finishing = h.recognition.finish();
    await tick();
    assert.equal(h.vadReleased, false);
    assert.equal(
      h.requests.length,
      0,
      'do not close WAV before capture/inference acknowledge finish',
    );
    for (let i = 0; i < 100; i++) h.frame(true, 0.5);
    h.finishGate.resolve();
    await finishing;
    assert.equal(h.requests.length, 1);
    const pcm = wavSamples(h.requests[0]);
    assert.equal(pcm.length, 110 * 512);
    assert.ok(
      pcm.subarray(10 * 512).every((x) => x === 16383),
      'every delayed tail sample must survive',
    );
    assert.equal(h.vadReleased, true);
    h.respond(0);
    await tick();
    assert.equal(h.draft(), 'synthetic phrase 0');
  });
  test(Engine.name + ': observers cannot start a second finish operation', async (t) => {
    const h = fixture(Engine, 'silero', true);
    t.after(() => h.coordinator.dispose());
    await h.coordinator.startHoldToTalk();
    for (let i = 0; i < 10; i++) h.frame(true);
    const session = h.recognition.session;
    const original = session.capture.finish.bind(session.capture);
    let calls = 0,
      nested,
      observed = false;
    session.capture.finish = () => {
      calls++;
      return original();
    };
    const processing = session.onProcessingChange;
    session.onProcessingChange = (state) => {
      processing(state);
      if (state.pending > 0 && !observed) {
        observed = true;
        nested = h.recognition.finish();
      }
    };
    const finish = h.recognition.finish();
    assert.equal(nested, finish);
    await tick();
    assert.equal(calls, 1);
    h.finishGate.resolve();
    await finish;
    assert.equal(h.requests.length, 1);
  });
  test(
    Engine.name + ': hold release cannot deliver before delayed capture is drained',
    async (t) => {
      const h = fixture(Engine, 'silero', true);
      t.after(() => h.coordinator.dispose());
      await h.coordinator.startHoldToTalk();
      for (let i = 0; i < 10; i++) h.frame(true);
      for (let i = 0; i < 25; i++) h.frame(false);
      const releasing = h.coordinator.releaseHoldToTalk();
      await tick();
      h.respond(0);
      await tick();
      assert.equal(h.coordinator.snapshot.autoSendAt, null);
      assert.equal(h.coordinator.snapshot.pendingTranscriptions, 1);
      for (let i = 0; i < 100; i++) h.frame(true);
      h.finishGate.resolve();
      await releasing;
      assert.equal(h.requests.length, 2);
      assert.equal(h.coordinator.snapshot.autoSendAt, null);
      h.respond(1);
      await tick();
      assert.ok(h.coordinator.snapshot.autoSendAt);
    },
  );
  test(
    Engine.name + ': replacement capture is untouched by an old finish and HTTP result',
    async (t) => {
      const h = fixture(Engine, 'silero', true);
      t.after(() => h.coordinator.dispose());
      await h.coordinator.startHoldToTalk();
      for (let i = 0; i < 10; i++) h.frame(true);
      for (let i = 0; i < 25; i++) h.frame(false);
      for (let i = 0; i < 10; i++) h.frame(true);
      await tick();
      const old = h.recognition.session;
      const gate = deferred();
      old.capture.finish = () => gate.promise;
      old.capture.release = () => {};
      const releasing = h.coordinator.releaseHoldToTalk();
      await h.coordinator.stopListening();
      await h.coordinator.startDictation();
      for (let i = 0; i < 100; i++) h.frame(true);
      const current = h.recognition.session;
      gate.resolve();
      await tick();
      h.respond(0);
      await releasing;
      await tick();
      assert.equal(h.recognition.session, current);
      assert.equal(current.writer.session.capturedSamples, 100 * 512);
      assert.equal(h.coordinator.snapshot.recognizing, true);
      assert.equal(h.coordinator.snapshot.listening, true);
      assert.equal(h.coordinator.snapshot.pendingTranscriptions, 0);
      assert.equal(h.coordinator.snapshot.autoSendAt, null);
      assert.equal(h.draft(), '');
      assert.equal(h.requests.length, 1);
    },
  );
  test(
    Engine.name + ': stop during finish cannot revive old capture or submit its tail',
    async (t) => {
      const h = fixture(Engine, 'silero', true);
      t.after(() => h.coordinator.dispose());
      await h.coordinator.startHoldToTalk();
      for (let i = 0; i < 10; i++) h.frame(true);
      const releasing = h.coordinator.releaseHoldToTalk();
      await h.coordinator.stopListening();
      await releasing;
      for (let i = 0; i < 100; i++) h.frame(true);
      assert.equal(h.requests.length, 0);
      assert.equal(h.coordinator.snapshot.autoSendAt, null);
      assert.equal(h.coordinator.snapshot.pendingTranscriptions, 0);
      assert.equal(h.coordinator.snapshot.listening, false);
    },
  );
}
