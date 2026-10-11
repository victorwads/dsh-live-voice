// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { SessionSpeechMemory } from '../src/modules/speak/services/sessionSpeechMemory.ts';
import { VoiceCoordinator } from '../src/modules/core/coordinator.ts';
const turn = () => new Promise(setImmediate);
const message = (turn, text = 'Text.', time) => ({ id: turn + ':0', turn, step: 0, text, time });

test('session cursors distinguish known continuation, newer messages and historical backfill', () => {
  const memory = new SessionSpeechMemory();
  const a = memory.session('a', 100);
  assert.equal(memory.baseline(a, message(2), true), true);
  a.baselined = true;
  assert.equal(memory.baseline(a, message(2, 'Extended.')), false);
  assert.equal(memory.baseline(a, message(3)), false);
  assert.equal(memory.baseline(a, message(1)), true);
  assert.equal(memory.baseline(a, message(4, 'Old.', 1)), true);
  assert.equal(memory.baseline(a, message(5, 'New.', 120)), false);
  assert.equal(memory.session('a'), a);
  assert.notEqual(memory.session('b'), a);
});

test('global toggle reset drops parked queues but retains cancellation tombstones', () => {
  const memory = new SessionSpeechMemory();
  const a = memory.session('a', 100);
  a.checkpoint = {
    pending: [{ id: '2:0', text: 'Pending' }],
    unfinished: ['3:0'],
    suppressed: ['1:0'],
  };
  memory.reset(200);
  assert.deepEqual(a.checkpoint.pending, []);
  assert.deepEqual(a.checkpoint.suppressed, ['1:0', '3:0', '2:0']);
  assert.equal(a.startedAt, 200);
  memory.clear();
  assert.notEqual(memory.session('a'), a);
});

function fixture() {
  const spoken = [];
  let finish;
  const engine = {
    speak: (text) => {
      spoken.push(text);
      return new Promise((resolve) => {
        finish = resolve;
      });
    },
    stop: () => finish?.(),
    pause: () => true,
    resume: () => true,
  };
  const c = new VoiceCoordinator({
    engines: { browser: engine },
    settings: { mode: 'headphones', segmentGapMs: 0 },
    recognition: { stop() {} },
    meter: { stop() {} },
    composer: { getDraft: () => '', setDraft() {} },
  });
  return { c, spoken, finish: () => finish?.() };
}

test('logical checkpoint retains active automatic segment exactly once without prepared resources', async () => {
  const f = fixture();
  f.c.observeMessage('2:0', 'First. Second.\nPartial');
  await turn();
  f.c.activeSpeechItem.prepared = { audio: {}, dispose() {} };
  const saved = f.c.checkpointSpeech();
  assert.deepEqual(saved.pending, [
    { id: '2:0', text: 'First.' },
    { id: '2:0', text: 'Second.' },
  ]);
  assert.equal(JSON.stringify(saved).includes('audio'), false);
  await f.c.suspendSpeech();
  const next = fixture();
  next.c.speechSuspended = true;
  next.c.restoreSpeech(saved);
  next.c.observeMessage('2:0', 'First. Second.\nPartial done.', { complete: true });
  await turn();
  assert.deepEqual(next.spoken, []);
  next.c.activateSpeech();
  await turn();
  assert.deepEqual(next.spoken, ['First.']);
  next.finish();
  await turn();
  next.finish();
  await turn();
  next.finish();
  await turn();
  assert.deepEqual(next.spoken, ['First.', 'Second.', 'Partial done.']);
  await f.c.dispose();
  await next.c.dispose();
});

test('checkpoint during a configured gap never requeues the completed segment', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const f = fixture();
  f.c.updateSettings({ segmentGapMs: 400 });
  f.c.observeMessage('auto', 'First. Second.\n');
  await turn();
  f.finish();
  await turn();
  assert.equal(f.c.snapshot.speaking, false);
  assert.deepEqual(f.c.checkpointSpeech().pending, [{ text: 'Second.', id: 'auto' }]);
  await f.c.dispose();
});

test('pending synthesis is checkpointed without retaining promises and late results cannot start', async () => {
  const f = fixture();
  let ready;
  let disposed = 0;
  f.c.engines.browser.prepare = () =>
    new Promise((resolve) => {
      ready = resolve;
    });
  f.c.observeMessage('auto', 'Preparing reply.', { complete: true });
  await turn();
  assert.equal(f.c.snapshot.speechLoading, true);
  const saved = f.c.checkpointSpeech();
  assert.deepEqual(saved.pending, [{ text: 'Preparing reply.', id: 'auto' }]);
  await f.c.suspendSpeech();
  ready({ dispose: () => disposed++ });
  await turn();
  assert.equal(f.spoken.length, 0);
  assert.ok(disposed > 0);
  await f.c.dispose();
});

test('automatic suspension does not strand multi-segment manual message reads', async () => {
  const f = fixture();
  f.c.speechSuspended = true;
  const speaking = f.c.speak('First. Second.', 'manual');
  await turn();
  assert.deepEqual(f.spoken, ['First.']);
  f.finish();
  await speaking;
  await turn();
  assert.deepEqual(f.spoken, ['First.', 'Second.']);
  await f.c.dispose();
});

test('checkpoint preserves explicit pause but never resumes manual speech or questions', async () => {
  const f = fixture();
  f.c.observeMessage('auto', 'Held reply.', { complete: true });
  await turn();
  await f.c.pauseSpeech();
  const saved = f.c.checkpointSpeech();
  await f.c.suspendSpeech();
  f.c.restoreSpeech(saved);
  f.c.activateSpeech();
  await turn();
  assert.equal(f.c.snapshot.paused, true);
  assert.equal(f.spoken.length, 1);
  await f.c.resumeSpeech();
  await turn();
  assert.equal(f.spoken.length, 2);
  await f.c.stopSpeech(false);
  assert.deepEqual(f.c.checkpointSpeech().pending, []);
  const manual = f.c.speak('Manual prompt.', 'question');
  await turn();
  assert.deepEqual(f.c.checkpointSpeech().pending, []);
  await f.c.stopSpeech(false);
  await manual;
  await f.c.dispose();
});
