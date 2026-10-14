// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { mockRecordingRepository } from './helpers/recording.js';
import { WhisperHttpRecognitionEngine } from '../src/modules/recognition/engines/whisper/WhisperRecognitionEngine.ts';
import { QwenHttpRecognitionEngine } from '../src/modules/recognition/engines/qwen/QwenRecognitionEngine.ts';
import { VoiceCoordinator } from '../src/modules/core/coordinator.ts';
import { MeetingController } from '../src/modules/conversation/models/meeting.ts';

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
const queuedReply = (h) =>
  h.coordinator.observeMessage('reply', 'Synthetic assistant reply.', { complete: true });

for (const Engine of [WhisperHttpRecognitionEngine, QwenHttpRecognitionEngine]) {
  for (const detector of ['silero', 'energy']) {
    test(
      Engine.name + ' ' + detector + ': a negative frame cannot discard an open segment',
      async (t) => {
        const h = fixture(Engine, detector);
        t.after(() => h.coordinator.dispose());
        await h.coordinator.startConversation();
        await tick();
        for (let i = 0; i < 100; i++) h.frame(true);
        queuedReply(h);
        h.frame(false);
        await tick();
        assert.equal(h.coordinator.snapshot.listening, true);
        assert.equal(h.spoken.length, 0);
        for (let i = 0; i < 15; i++) h.frame(false);
        await tick();
        assert.equal(h.requests.length, 1);
        assert.equal(wavSamples(h.requests[0]).length, 100 * 512 + 5120);
        assert.ok(
          wavSamples(h.requests[0])
            .subarray(0, 100 * 512)
            .every((x) => x === 8191),
        );
        assert.equal(h.spoken.length, 0, 'closed segment must still wait for transcription');
        await tick();
        h.respond(0);
        await tick();
        assert.match(h.draft(), /synthetic phrase 0/);
        assert.equal(h.spoken.length, 1, 'playback is allowed only after the final is committed');
      },
    );
  }
  for (const detector of ['silero', 'energy']) {
    test(
      Engine.name + ' ' + detector + ': max-length split cannot release continuous speech',
      async (t) => {
        const h = fixture(Engine, detector);
        t.after(() => h.coordinator.dispose());
        h.recognition.maxUtteranceSeconds = 0.3;
        await h.coordinator.startConversation();
        for (let i = 0; i < 10; i++) h.frame(true);
        await tick();
        assert.equal(h.requests.length, 1);
        queuedReply(h);
        await tick();
        h.respond(0);
        await tick();
        assert.equal(h.coordinator.snapshot.recognizing, true);
        assert.equal(h.coordinator.snapshot.listening, true);
        assert.equal(h.spoken.length, 0);
        h.recognition.maxUtteranceSeconds = 60;
        for (let i = 0; i < 16; i++) h.frame(false);
        await tick();
        assert.equal(h.coordinator.snapshot.recognizing, false);
      },
    );
  }
  test(Engine.name + ': older finals cannot clear a newer open utterance', async (t) => {
    const h = fixture(Engine);
    t.after(() => h.coordinator.dispose());
    await h.coordinator.startConversation();
    for (let n = 0; n < 2; n++) {
      for (let i = 0; i < 10; i++) h.frame(true);
      for (let i = 0; i < 16; i++) h.frame(false);
    }
    await tick();
    for (let i = 0; i < 100; i++) h.frame(true);
    queuedReply(h);
    for (let n = 0; n < 2; n++) {
      await tick();
      h.respond(n);
      await tick();
      assert.equal(
        h.coordinator.snapshot.recognizing,
        true,
        'capture activity belongs to the new utterance',
      );
    }
    assert.equal(h.coordinator.snapshot.pendingTranscriptions, 0);
    h.frame(false);
    await tick();
    assert.equal(h.coordinator.snapshot.listening, true);
    assert.equal(h.spoken.length, 0);
    for (let i = 0; i < 15; i++) h.frame(false);
    await tick();
    assert.equal(h.requests.length, 3);
    assert.equal(wavSamples(h.requests[2]).length, 5120 + 100 * 512 + 5120);
    assert.ok(
      wavSamples(h.requests[2])
        .subarray(5120, 5120 + 100 * 512)
        .every((x) => x === 8191),
      'pre/post-roll overlap must not discard any of the new utterance',
    );
    h.respond(2);
    await tick();
    assert.equal(h.draft(), 'synthetic phrase 0 synthetic phrase 1 synthetic phrase 2');
    assert.equal(h.spoken.length, 1);
  });
}

for (const outcome of ['filtered', 'muted', 'command', 'resume', 'question']) {
  test('an older ' + outcome + ' final does not clear managed capture activity', async (t) => {
    const h = fixture(WhisperHttpRecognitionEngine);
    t.after(() => h.coordinator.dispose());
    await h.coordinator.startConversation();
    if (outcome === 'filtered')
      h.coordinator.updateSettings({ recognitionFilterEnabled: true, recognitionMinimumWords: 10 });
    if (outcome === 'muted') h.coordinator.updateSettings({ microphoneEnabled: false });
    if (outcome === 'command')
      h.coordinator.updateSettings({ voiceCommandClear: 'synthetic phrase 0' });
    if (outcome === 'resume')
      h.coordinator.updateSettings({
        voiceCommandResume: 'synthetic phrase 0',
        microphoneEnabled: false,
      });
    if (outcome === 'question') h.coordinator.composer.handleQuestionResult = () => true;
    for (let i = 0; i < 10; i++) h.frame(true);
    for (let i = 0; i < 16; i++) h.frame(false);
    await tick();
    for (let i = 0; i < 100; i++) h.frame(true);
    await tick();
    h.respond(0);
    await tick();
    assert.equal(h.coordinator.snapshot.recognizing, true);
    if (outcome === 'resume') assert.equal(h.coordinator.snapshot.muted, false);
  });
}

for (const rejected of [false, true]) {
  test(
    'shared capture activity survives an older ' + (rejected ? 'rejected' : 'accepted') + ' final',
    async (t) => {
      let callbacks,
        draft = '';
      const activity = [];
      const meeting = new MeetingController({
        composer: {
          getDraft: () => draft,
          setDraft: (x) => {
            draft = x;
          },
          submit() {},
        },
        settings: () => ({ sendingMode: 'manual', recognitionFilterEnabled: false }),
        translate: (x) => x,
        onActivity: (_source, active) => activity.push(active),
        onSpeech: () => !rejected,
        createSource: () => ({
          meter: {
            provide() {},
            async start() {
              return true;
            },
            async stop() {},
            stream: { getTracks: () => [] },
          },
          engine: {
            activityManaged: true,
            async capability() {
              return { supported: true };
            },
            async start(c) {
              callbacks = c;
            },
            async stop() {},
          },
        }),
      });
      t.after(() => meeting.dispose());
      await meeting.start('shared');
      callbacks.onActivity(true);
      callbacks.onResult({ final: 'synthetic older phrase' });
      assert.equal(meeting.input().snapshot.recognizing, true);
      assert.equal(activity.at(-1), true);
      callbacks.onActivity(false);
      assert.equal(meeting.input().snapshot.recognizing, false);
    },
  );
}
