// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { MeetingController } from '../src/modules/conversation/models/meeting.js';
test('meeting sources recognize independently and reject stale results without submission', async () => {
  let draft = '';
  const sources = {};
  const meeting = new MeetingController({
    composer: {
      getDraft: () => draft,
      setDraft: (value) => (draft = value),
      submit: () => assert.fail('No meeting submission'),
    },
    settings: () => ({ recognitionEngine: 'whisper-http', recognitionLang: 'pt-BR', recognitionMinimumWords: 1, sendingMode: 'manual' }),
    translate: (key) => key,
    createSource: (source) => {
      const entry = {
        meter: {
          provide() {},
          start: async () => true,
          stop: async () => {},
          stream: { getTracks: () => [] },
        },
        engine: {
          capability: async () => ({ supported: true }),
          start: async (options) => (entry.callbacks = options),
          stop: async () => {},
        },
      };
      sources[source] = entry;
      return entry;
    },
  });
  await meeting.start('microphone');
  sources.microphone.callbacks.onResult({ final: 'First' });
  await meeting.start('shared');
  sources.shared.callbacks.onResult({ final: 'Second' });
  sources.microphone.callbacks.onProcessingChange({ pending: 2 });
  assert.equal(meeting.getSnapshot().microphone.pending, 2);
  assert.equal(meeting.getSnapshot().shared.pending, 0);
  assert.equal(draft, 'First\n\nThem: Second');
  const old = sources.microphone.callbacks;
  await meeting.stop('microphone');
  old.onResult({ final: 'Stale' });
  sources.shared.callbacks.onResult({ final: 'Only shared' });
  assert.equal(draft, 'First\n\nThem: Second\nOnly shared');
  await meeting.dispose();
  assert.equal(meeting.jobs.size, 0);
});

test('ending meeting during capability discovery never starts obsolete capture', async () => {
  let resolve;
  let starts = 0;
  const capability = new Promise((done) => (resolve = done));
  const meeting = new MeetingController({
    composer: { getDraft: () => '', setDraft: () => assert.fail('stale write') },
    settings: () => ({ recognitionEngine: 'whisper-http' }),
    translate: (key) => key,
    createSource: () => ({
      meter: {
        start: async () => {
          starts++;
          return true;
        },
        stop: async () => {},
      },
      engine: { capability: () => capability, start: async () => {}, stop: async () => {} },
    }),
  });
  const starting = meeting.start('microphone');
  await new Promise((done) => setImmediate(done));
  await meeting.end();
  resolve({ supported: true });
  await starting;
  assert.equal(starts, 0);
  assert.equal(meeting.getSnapshot().active, false);
});

function policyFixture(t) {
  let draft = '';
  const submissions = [], sources = {};
  let stops = 0;
  const meeting = new MeetingController({
    composer: { getDraft: () => draft, setDraft: text => { draft = text; },
      submit: mode => { submissions.push(mode); draft = ''; } },
    settings: () => ({ recognitionEngine: 'whisper-http', recognitionMinimumWords: 1 }),
    translate: key => key,
    createSource: source => {
      const entry = { meter: { provide() {}, start: async () => true,
        stop: async () => { stops++; }, stream: { getTracks: () => [] } },
        engine: { capability: async () => ({ supported: true }),
          start: async options => { entry.callbacks = options; }, stop: async () => {} } };
      sources[source] = entry;
      return entry;
    },
  });
  t.after(() => meeting.dispose());
  return { meeting, sources, submissions, draft: () => draft, stops: () => stops };
}

test('both sources share exact commands and ignore semantics without closing capture or muting the other', async t => {
  const f = policyFixture(t);
  await f.meeting.start('microphone'); await f.meeting.start('shared');
  const mic = f.meeting.input('microphone'), shared = f.meeting.input();
  const result = text => f.sources.shared.callbacks.onResult({ final: text });
  result('mute');
  assert.equal(shared.getSnapshot().muted, true);
  assert.equal(mic.getSnapshot().muted, false);
  assert.equal(f.stops(), 0);
  result('ignored words'); assert.equal(f.draft(), '');
  result('resume'); result('hello there'); result('send');
  assert.deepEqual(f.submissions, ['steer']);
  shared.updateSettings({ voiceCommandsEnabled: false, sendingMode: 'steer' });
  f.meeting.applySettings({ voiceCommandsEnabled: true, sendingMode: 'manual', microphoneEnabled: false });
  assert.equal(shared.getSnapshot().settings.voiceCommandsEnabled, false);
  assert.equal(shared.getSnapshot().settings.sendingMode, 'steer');
  assert.equal(shared.getSnapshot().muted, false);
  shared.updateSettings({ sendingMode: 'manual' });
  result('send'); assert.match(f.draft(), /send$/);
  shared.updateSettings({ voiceCommandsEnabled: true }); result('end');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.meeting.getSnapshot().shared.listening, false);
  assert.equal(f.meeting.getSnapshot().microphone.listening, true);
  result('stale words'); assert.match(f.draft(), /send$/);
});

test('automatic delivery waits for processing and is cancelled by ignore, manual edit, stop and disposal', async t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const f = policyFixture(t); await f.meeting.start('shared');
  const input = f.meeting.input(), cb = f.sources.shared.callbacks;
  input.updateSettings({ sendingMode: 'queue', autoSendDelaySeconds: 1 });
  cb.onProcessingChange({ pending: 1 }); cb.onResult({ final: 'first words' });
  assert.equal(input.getSnapshot().autoSendAt, null);
  cb.onProcessingChange({ pending: 0 });
  assert.ok(input.getSnapshot().autoSendAt);
  t.mock.timers.tick(1000); assert.deepEqual(f.submissions, ['queue']);
  input.updateSettings({ sendingMode: 'steer' });
  cb.onResult({ final: 'next words' }); input.muteListening();
  t.mock.timers.tick(1000); assert.equal(f.submissions.length, 1);
  cb.onProcessingChange({ pending: 0 }); assert.equal(input.getSnapshot().autoSendAt, null);
  input.resumeListeningInput(); cb.onResult({ final: 'more words' });
  f.meeting.composer.setDraft('manually changed');
  t.mock.timers.tick(1000); assert.equal(f.submissions.length, 1);
  cb.onResult({ final: 'new words' }); t.mock.timers.tick(1000);
  assert.deepEqual(f.submissions, ['queue', 'steer']);
  cb.onResult({ final: 'never sent' }); await f.meeting.stop('shared');
  t.mock.timers.tick(1000); assert.equal(f.submissions.length, 2);
  await f.meeting.start('shared');
  f.sources.shared.callbacks.onResult({ final: 'never sent either' });
  await f.meeting.dispose(); t.mock.timers.tick(1000);
  assert.equal(f.submissions.length, 2);
});

test('timestamps use identical source-local controls, including single-source dictation', async t => {
  const f = policyFixture(t); await f.meeting.start('microphone');
  f.meeting.input('microphone').toggleTimestamps();
  f.sources.microphone.callbacks.onResult({ final: 'timestamped words', startedAt: new Date(2026, 9, 9, 12, 34, 56).getTime() });
  assert.equal(f.draft(), '[2026/10/09 12:34:56] timestamped words');
  await f.meeting.start('shared');
  assert.equal(f.meeting.input().getSnapshot().timestamps, undefined);
  f.sources.shared.callbacks.onResult({ final: 'no timestamp' });
  assert.match(f.draft(), /\n\nThem: no timestamp$/);
  f.meeting.input().toggleTimestamps();
  assert.equal(f.meeting.input().getSnapshot().timestamps, true);
});

test('shared capture starts and restarts Listening independently of global microphone mute', async t => {
  const f = policyFixture(t);
  f.meeting.settings = () => ({ recognitionEngine: 'whisper-http', microphoneEnabled: false, recognitionMinimumWords: 1 });
  await f.meeting.start('shared');
  assert.equal(f.meeting.input().getSnapshot().muted, false);
  f.meeting.input().muteListening(); await f.meeting.stop('shared'); await f.meeting.start('shared');
  assert.equal(f.meeting.input().getSnapshot().muted, false);
  f.sources.shared.callbacks.onResult({ final: 'fresh capture words' });
  assert.equal(f.draft(), 'fresh capture words');
});

test('accepted-source delivery resumes after the other source is idle without inventing sends from its draft', async t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const f = policyFixture(t); await f.meeting.start('shared'); await f.meeting.start('microphone');
  const input = f.meeting.input();
  let ready = false;
  input.composer.canAutoSend = () => ready;
  input.updateSettings({ sendingMode: 'queue', autoSendDelaySeconds: 1 });
  f.sources.shared.callbacks.onResult({ final: 'eligible shared words' });
  assert.equal(input.getSnapshot().autoSendAt, null);
  ready = true; f.meeting.refreshDeliveryReadiness();
  assert.ok(input.getSnapshot().autoSendAt);
  ready = false; f.meeting.refreshDeliveryReadiness();
  t.mock.timers.tick(1000); assert.equal(f.submissions.length, 0);
  ready = true; f.meeting.refreshDeliveryReadiness();
  t.mock.timers.tick(1000); assert.deepEqual(f.submissions, ['queue']);
  f.meeting.composer.setDraft('typed text alone');
  f.sources.shared.callbacks.onProcessingChange({ pending: 0 });
  t.mock.timers.tick(1000); assert.equal(f.submissions.length, 1);
  f.sources.shared.callbacks.onResult({ final: 'accepted words' });
  ready = false; t.mock.timers.tick(1000); assert.equal(f.submissions.length, 1);
  ready = true; f.meeting.refreshDeliveryReadiness();
  t.mock.timers.tick(1000); assert.equal(f.submissions.length, 2);
});
