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
    settings: () => ({ recognitionEngine: 'whisper-http', recognitionLang: 'pt-BR' }),
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
