// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { BrowserSpeakingEngine } from '../src/modules/speak/engines/browser/BrowserSpeakingEngine.ts';
import { VoiceCoordinator } from '../src/modules/core/coordinator.ts';
import { SPEECH_QUEUE_PREFETCH_LIMIT } from '../src/modules/speak/services/speechQueue.ts';

const turn = () => new Promise((resolve) => setImmediate(resolve));
function fixture() {
  const voices = [
    { name: 'Local', voiceURI: 'local', lang: 'pt-BR', localService: true },
    { name: 'English', voiceURI: 'en', lang: 'en-US', localService: true },
  ];
  const utterances = [],
    spoken = [];
  const synth = {
    paused: false,
    cancels: 0,
    resumes: 0,
    getVoices: () => voices,
    speak: (utterance) => spoken.push(utterance),
    cancel() {
      this.cancels++;
    },
    pause() {
      this.paused = true;
    },
    resume() {
      this.paused = false;
      this.resumes++;
    },
  };
  const engine = new BrowserSpeakingEngine({
    globals: {
      speechSynthesis: synth,
      SpeechSynthesisUtterance: class {
        constructor(text) {
          this.text = text;
          utterances.push(this);
        }
      },
    },
  });
  return { engine, synth, utterances, spoken, voices };
}

test('browser preparation is inaudible, validates local voice and supports independent disposal', async () => {
  const f = fixture();
  const controller = new AbortController();
  const prepared = await f.engine.prepare('Prepared reply.', {
    lang: 'en-US',
    rate: 1.5,
    signal: controller.signal,
  });
  assert.equal(f.utterances.length, 1);
  assert.equal(f.utterances[0].voice.voiceURI, 'en');
  assert.equal(f.utterances[0].rate, 1.5);
  assert.equal(f.spoken.length, 0);
  assert.equal(f.synth.resumes, 0);
  assert.equal(f.synth.cancels, 0);
  const playback = f.engine.playPrepared(prepared, { retainPrepared: true });
  controller.abort();
  assert.equal(
    f.engine.current.utterance,
    f.spoken[0],
    'prefetch cancellation never aborts active audio',
  );
  f.spoken[0].onend();
  await playback;
  const replay = f.engine.playPrepared(prepared, { retainPrepared: true });
  assert.notEqual(f.spoken[1], f.spoken[0], 'history replay gets a fresh native utterance');
  f.spoken[1].onend();
  await replay;
  prepared.dispose();
  prepared.dispose();
  await assert.rejects(f.engine.playPrepared(prepared), { name: 'AbortError' });
  await assert.rejects(f.engine.prepare('Never.', { signal: controller.signal }), {
    name: 'AbortError',
  });
  await assert.rejects(f.engine.prepare('Never.', { voice: 'remote' }), /available local/);
});

test('browser cannot play a prepared voice that became unavailable', async () => {
  const f = fixture();
  const prepared = await f.engine.prepare('Reply.', { voice: 'local' });
  f.voices.splice(0, 1);
  await assert.rejects(f.engine.playPrepared(prepared), /no longer available/);
  assert.equal(f.spoken.length, 0);
  prepared.dispose();
});

test('prepared browser segments use the shared bounded window and honor the configured gap', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const f = fixture();
  const c = new VoiceCoordinator({
    engines: { browser: f.engine },
    settings: { mode: 'headphones', segmentGapMs: 400 },
    recognition: { stop() {} },
    meter: { stop() {} },
    composer: { getDraft: () => '', setDraft() {} },
  });
  t.after(() => c.dispose());
  c.observeMessage('stream', 'First. Second. Third. Fourth. Fifth.\n');
  await turn();
  assert.equal(f.spoken.length, 1);
  assert.equal(
    c.queue.slice(0, SPEECH_QUEUE_PREFETCH_LIMIT).every((item) => !!item.prepared),
    true,
  );
  assert.equal(c.queue.at(-1).prepared, undefined);
  assert.equal(f.engine.getPlaybackProgress(), null, 'preparation is not playback');
  f.spoken[0].onstart();
  assert.ok(f.engine.getPlaybackProgress());
  f.spoken[0].onend();
  await turn();
  t.mock.timers.tick(399);
  await turn();
  assert.equal(f.spoken.length, 1);
  t.mock.timers.tick(1);
  await turn();
  assert.equal(f.spoken.length, 2);
  assert.equal(
    f.synth.cancels,
    0,
    'natural segment handoff does not cancel the native synthesizer',
  );
  assert.equal(f.synth.resumes, 0, 'idle synthesizer does not receive unnecessary resumes');
  assert.equal(c.snapshot.speechText, 'Second.');
  await c.stopSpeech(false);
  assert.equal(f.synth.cancels, 1);
  assert.equal(c.snapshot.speechRunActive, false);
});
