// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { VoiceCoordinator } from '../src/core/coordinator.ts';
const turn = () => new Promise((resolve) => setImmediate(resolve));
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
function fixture(settings = {}) {
  const log = [],
    spoken = [],
    sessions = [];
  let draft = 'typed';
  let active;
  const recognition = {
    lang: 'old',
    async capability() {
      log.push('cap:' + this.lang);
      return { supported: true };
    },
    async start(options) {
      sessions.push(options);
      log.push('input:start');
    },
    async stop() {
      log.push('input:stop');
    },
    reset() {
      log.push('input:reset');
      return true;
    },
  };
  const meter = {
    async capability() {
      return { supported: true, permission: 'prompt' };
    },
    async start() {
      log.push('meter:start');
      return true;
    },
    async stop() {
      log.push('meter:stop');
    },
  };
  const engine = {
    capability() {
      return { supported: true };
    },
    speak(text) {
      log.push('speak:' + text);
      const done = deferred();
      active = done;
      spoken.push({ text, ...done });
      return done.promise;
    },
    async stop() {
      log.push('speech:stop');
      active?.reject(Object.assign(new Error('cancel'), { name: 'AbortError' }));
      active = null;
    },
    pause() {
      log.push('pause');
      return true;
    },
    resume() {
      log.push('resume');
      return true;
    },
  };
  const coordinator = new VoiceCoordinator({
    recognition,
    meter,
    engines: { browser: engine },
    settings,
    composer: {
      getDraft: () => draft,
      setDraft: (value) => {
        draft = value;
      },
    },
  });
  return { coordinator, recognition, meter, engine, spoken, sessions, log, draft: () => draft };
}

test('speech capability publishes before pending recognition discovery', async () => {
  const f = fixture();
  const pending = deferred();
  f.recognition.capability = () => pending.promise;
  const refresh = f.coordinator.refreshCapabilities();
  await turn();
  assert.equal(f.coordinator.snapshot.capabilities.browser.supported, true);
  assert.equal(f.coordinator.snapshot.capabilities.recognition, undefined);
  pending.resolve({ supported: false });
  await refresh;
  assert.equal(f.coordinator.snapshot.capabilities.browser.supported, true);
  await f.coordinator.dispose();
});

test('late capability refresh cannot overwrite newer device availability', async () => {
  const f = fixture();
  const first = deferred();
  let calls = 0;
  f.engine.capability = () => (++calls === 1 ? first.promise : { supported: true });
  const old = f.coordinator.refreshCapabilities();
  await f.coordinator.refreshCapabilities();
  first.resolve({ supported: false, reason: 'Stale' });
  await old;
  assert.equal(f.coordinator.snapshot.capabilities.browser.supported, true);
  await f.coordinator.dispose();
});

test('end conversation does not wait for hung capability discovery', async () => {
  const f = fixture();
  f.recognition.capability = () => new Promise(() => {});
  const start = f.coordinator.startConversation();
  await turn();
  await f.coordinator.endConversation();
  await start;
  assert.equal(f.coordinator.snapshot.starting, false);
  assert.equal(f.coordinator.snapshot.listening, false);
  await f.coordinator.dispose();
});

test('speaker gating reserves playback and preserves incoming chunk order', async () => {
  const f = fixture();
  await f.coordinator.startConversation();
  f.coordinator.observeMessage('a', 'First. ');
  assert.equal(f.coordinator.snapshot.speaking, true);
  f.coordinator.observeMessage('a', 'First. Second. ');
  await turn();
  assert.deepEqual(
    f.spoken.map((item) => item.text),
    ['First.'],
  );
  assert.equal(f.coordinator.snapshot.listening, false);
  assert.ok(f.log.lastIndexOf('input:stop') < f.log.indexOf('speak:First.'));
  f.spoken[0].resolve();
  await turn();
  assert.deepEqual(
    f.spoken.map((item) => item.text),
    ['First.', 'Second.'],
  );
  f.spoken[1].resolve();
  await turn();
  assert.equal(f.coordinator.snapshot.listening, true);
  await f.coordinator.dispose();
});

test('headphones retain capture during playback', async () => {
  const f = fixture({ mode: 'headphones' });
  await f.coordinator.startConversation();
  f.coordinator.observeMessage('a', 'Answer', { complete: true });
  await turn();
  assert.equal(f.coordinator.snapshot.speaking, true);
  assert.equal(f.coordinator.snapshot.listening, true);
  assert.equal(f.coordinator.snapshot.listening, true);
  await f.coordinator.stopSpeech(false);
  await f.coordinator.dispose();
});

test('global stop invalidates result callbacks and stops every resource', async () => {
  const f = fixture({ mode: 'headphones' });
  await f.coordinator.startConversation();
  const callbacks = f.sessions.at(-1);
  f.coordinator.observeMessage('a', 'Answer', { complete: true });
  await turn();
  await f.coordinator.endConversation();
  callbacks.onResult({ final: 'stale' });
  callbacks.onActivity(true);
  assert.equal(f.draft(), 'typed');
  for (const key of ['conversation', 'listening', 'recognizing', 'speaking', 'paused', 'starting'])
    assert.equal(f.coordinator.snapshot[key], false, key);
  assert.ok(f.log.includes('meter:stop'));
  await f.coordinator.dispose();
});

test('late microphone start is released before replacement capture begins', async () => {
  const f = fixture();
  const gate = deferred();
  let starts = 0;
  f.meter.start = async () => {
    f.log.push('meter:start');
    return ++starts === 1 ? gate.promise : true;
  };
  const first = f.coordinator.startConversation();
  await turn();
  const second = f.coordinator.startDictation();
  gate.resolve(true);
  await Promise.all([first, second]);
  assert.equal(f.sessions.length, 1);
  assert.equal(f.coordinator.snapshot.listening, true);
  assert.equal(f.coordinator.snapshot.conversation, false);
  await f.coordinator.dispose();
});

test('late recognition start and callbacks cannot survive disposal', async () => {
  const f = fixture();
  const gate = deferred();
  f.recognition.start = async (options) => {
    f.sessions.push(options);
    await gate.promise;
  };
  const starting = f.coordinator.startConversation();
  await turn();
  const disposed = f.coordinator.dispose();
  f.sessions[0].onResult({ final: 'stale' });
  gate.resolve();
  await Promise.all([starting, disposed]);
  assert.equal(f.draft(), 'typed');
  assert.equal(f.coordinator.snapshot.listening, false);
  await f.coordinator.startConversation();
  await f.coordinator.speak('never');
  assert.equal(f.spoken.length, 0);
});

test('concurrent manual speech requests cannot start obsolete text', async () => {
  const f = fixture();
  const first = f.coordinator.speak('obsolete');
  const second = f.coordinator.speak('latest');
  await turn();
  assert.deepEqual(
    f.spoken.map((item) => item.text),
    ['latest'],
  );
  f.spoken[0].resolve();
  await Promise.all([first, second]);
  await f.coordinator.dispose();
});

test('capability sees updated recognition language; failed input startup cleans both resources', async () => {
  const f = fixture();
  f.coordinator.updateSettings({ recognitionLang: 'en-US' });
  await f.coordinator.refreshCapabilities();
  assert.ok(f.log.includes('cap:en-US'));
  f.meter.start = async () => false;
  await f.coordinator.startConversation();
  assert.equal(f.coordinator.snapshot.starting, false);
  assert.equal(f.coordinator.snapshot.conversation, false);
  assert.match(f.coordinator.snapshot.error, /Microphone/);
  assert.ok(f.log.includes('input:stop'));
  await f.coordinator.dispose();
});

test('cleanup failure still attempts all resources and exposes an error', async () => {
  const f = fixture();
  await f.coordinator.startConversation();
  f.recognition.stop = async () => {
    throw new Error('input failure');
  };
  await f.coordinator.endConversation();
  assert.match(f.coordinator.snapshot.error, /input failure/);
  assert.ok(f.log.includes('meter:stop'));
  assert.ok(f.log.includes('speech:stop'));
  await f.coordinator.dispose();
});

test('failed speaker gate prevents playback rather than speaking over capture', async () => {
  const f = fixture();
  await f.coordinator.startConversation();
  f.recognition.stop = async () => {
    throw new Error('cannot gate');
  };
  f.coordinator.observeMessage('a', 'Answer', { complete: true });
  await turn();
  assert.equal(f.spoken.length, 0);
  assert.match(f.coordinator.snapshot.error, /cannot gate/);
  assert.equal(f.coordinator.snapshot.speaking, false);
  await f.coordinator.dispose();
});

test('failed speech teardown blocks replacement playback and microphone startup', async () => {
  const f = fixture();
  f.engine.stop = async () => {
    throw new Error('cannot stop playback');
  };
  await f.coordinator.speak('unsafe');
  assert.equal(f.spoken.length, 0);
  await f.coordinator.startConversation();
  assert.equal(f.sessions.length, 0);
  assert.match(f.coordinator.snapshot.error, /cannot stop playback/);
  await f.coordinator.dispose();
});

test('engine failures retain diagnostics after automatic listening recovery', async () => {
  const f = fixture();
  await f.coordinator.startConversation();
  f.coordinator.observeMessage('a', 'Answer', { complete: true });
  await turn();
  f.spoken[0].reject(new Error('synthesis failure'));
  await turn();
  assert.equal(f.coordinator.snapshot.listening, true);
  assert.match(f.coordinator.snapshot.error, /synthesis failure/);
  await f.coordinator.dispose();
});

test('late pause result cannot resurrect naturally completed playback state', async () => {
  const f = fixture({ mode: 'headphones' });
  const gate = deferred();
  f.engine.pause = () => gate.promise;
  f.coordinator.speak('Answer');
  await turn();
  const paused = f.coordinator.pauseSpeech();
  f.spoken[0].resolve();
  await turn();
  gate.resolve(true);
  await paused;
  assert.equal(f.coordinator.snapshot.speaking, false);
  assert.equal(f.coordinator.snapshot.paused, false);
  await f.coordinator.dispose();
});

test('late pause result cannot resurrect stopped playback state', async () => {
  const f = fixture({ mode: 'headphones' });
  const gate = deferred();
  f.engine.pause = () => gate.promise;
  await f.coordinator.startConversation();
  f.coordinator.observeMessage('a', 'Answer', { complete: true });
  await turn();
  const paused = f.coordinator.pauseSpeech();
  await f.coordinator.endConversation();
  gate.resolve(true);
  await paused;
  assert.equal(f.coordinator.snapshot.paused, false);
  await f.coordinator.dispose();
});

test('disabled automatic assistant announcements consume text without queueing speech', async () => {
  const f = fixture({ announceAssistantMessages: false });
  await f.coordinator.startConversation();
  f.coordinator.observeMessage('silent', 'Do not announce this.', { complete: true });
  await turn();
  assert.deepEqual(f.spoken, []);
  f.coordinator.updateSettings({ announceAssistantMessages: true });
  f.coordinator.observeMessage('silent', 'Do not announce this.', { complete: true });
  await turn();
  assert.deepEqual(f.spoken, [], 'enabling does not replay text observed while disabled');
  await f.coordinator.dispose();
});

test('turning off automatic assistant speech discards delayed queued phrases', async () => {
  const f = fixture({ assistantSpeechDelaySeconds: 1 });
  await f.coordinator.startConversation();
  const callbacks = f.sessions.at(-1);
  callbacks.onActivity(true);
  f.coordinator.observeMessage('queued', 'Do not speak later.', { complete: true });
  assert.equal(f.coordinator.queue.length, 1);
  f.coordinator.updateSettings({ announceAssistantMessages: false });
  assert.equal(f.coordinator.queue.length, 0);
  callbacks.onActivity(false);
  await new Promise((resolve) => setTimeout(resolve, 1100));
  assert.deepEqual(f.spoken, []);
  await f.coordinator.dispose();
});

test('headphone interruption requires sustained activity and resumes automatically', async () => {
  const f = fixture({ mode: 'headphones' });
  f.coordinator.snapshot.settings.assistantSpeechDelaySeconds = 0.1;
  await f.coordinator.startConversation();
  void f.coordinator.speak('A sufficiently long answer');
  await turn();
  f.sessions[0].onActivity(true);
  await new Promise((resolve) => setTimeout(resolve, 5));
  f.sessions[0].onActivity(false);
  await new Promise((resolve) => setTimeout(resolve, 110));
  assert.equal(f.log.includes('pause'), false, 'brief noise does not pause playback');
  f.sessions[0].onActivity(true);
  await new Promise((resolve) => setTimeout(resolve, 110));
  assert.equal(f.coordinator.snapshot.paused, true);
  f.sessions[0].onActivity(false);
  await turn();
  assert.equal(f.coordinator.snapshot.paused, false);
  assert.ok(f.log.includes('resume'));
  await f.coordinator.stopSpeech(false);
  await f.coordinator.dispose();
});

test('automatic sending waits after a final phrase and remains cancellable', async () => {
  const submitted = [];
  const f = fixture({ sendingMode: 'queue', autoSendDelaySeconds: 2 });
  f.coordinator.composer.submit = () => submitted.push(f.draft());
  await f.coordinator.startDictation();
  f.sessions[0].onResult({ final: 'hello world' });
  assert.ok(f.coordinator.snapshot.autoSendAt);
  f.coordinator.cancelAutoSend();
  assert.equal(f.coordinator.snapshot.autoSendAt, null);
  await new Promise((resolve) => setTimeout(resolve, 2100));
  assert.deepEqual(submitted, []);
  await f.coordinator.dispose();
});

test('automatic sending uses DSH submit only when the draft is still unchanged', async () => {
  const submitted = [];
  const f = fixture({ sendingMode: 'queue', autoSendDelaySeconds: 2 });
  f.coordinator.composer.submit = () => submitted.push(f.draft());
  await f.coordinator.startDictation();
  f.sessions[0].onResult({ final: 'hello world' });
  await new Promise((resolve) => setTimeout(resolve, 2100));
  assert.deepEqual(submitted, ['typed hello world']);
  await f.coordinator.dispose();
});

test('successful automatic send resets recognition before the next utterance', async () => {
  const submitted = [];
  const f = fixture({ sendingMode: 'queue', autoSendDelaySeconds: 2 });
  f.coordinator.composer.submit = () => submitted.push(f.draft());
  await f.coordinator.startDictation();
  f.sessions[0].onResult({ final: 'hello world' });
  await new Promise((resolve) => setTimeout(resolve, 2100));

  assert.deepEqual(submitted, ['typed hello world']);
  assert.equal(f.log.filter((entry) => entry === 'input:reset').length, 1);
  await f.coordinator.dispose();
});

test('steer delivery passes the direct mode to the DSH composer', async () => {
  const submitted = [];
  const f = fixture({ sendingMode: 'steer', autoSendDelaySeconds: 2 });
  f.coordinator.composer.submit = (mode) => submitted.push([f.draft(), mode]);
  await f.coordinator.startDictation();
  f.sessions[0].onResult({ final: 'interrupt now' });
  await new Promise((resolve) => setTimeout(resolve, 2100));
  assert.deepEqual(submitted, [['typed interrupt now', 'steer']]);
  await f.coordinator.dispose();
});

test('new speech activity cancels a pending automatic send', async () => {
  const submitted = [];
  const f = fixture({ sendingMode: 'queue', autoSendDelaySeconds: 2 });
  f.coordinator.composer.submit = () => submitted.push(f.draft());
  await f.coordinator.startDictation();
  f.sessions[0].onResult({ final: 'hello world' });
  assert.ok(f.coordinator.snapshot.autoSendAt);
  f.sessions[0].onActivity(true);
  assert.equal(f.coordinator.snapshot.autoSendAt, null);
  await new Promise((resolve) => setTimeout(resolve, 2100));
  assert.deepEqual(submitted, []);
  await f.coordinator.dispose();
});

test('a breathing pause cannot start queued assistant speech and renewed speech restarts delay', async () => {
  const f = fixture({ assistantSpeechDelaySeconds: 1 });
  await f.coordinator.startConversation();
  const callbacks = f.sessions.at(-1);
  callbacks.onActivity(true);
  f.coordinator.observeMessage('a', 'Wait for me.', { complete: true });
  callbacks.onActivity(false);
  await new Promise((resolve) => setTimeout(resolve, 600));
  callbacks.onActivity(true);
  await new Promise((resolve) => setTimeout(resolve, 600));
  assert.equal(f.spoken.length, 0);
  callbacks.onActivity(false);
  await new Promise((resolve) => setTimeout(resolve, 1100));
  assert.deepEqual(
    f.spoken.map((item) => item.text),
    ['Wait for me.'],
  );
  f.spoken[0].resolve();
  await turn();
  await f.coordinator.dispose();
});
