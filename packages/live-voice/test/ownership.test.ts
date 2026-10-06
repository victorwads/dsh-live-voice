// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { VoiceOwnership } from '../src/modules/core/ownership.ts';
test('latest concurrent hardware request wins', async () => {
  const gate = new VoiceOwnership(),
    calls = [];
  const a = { endConversation: async () => calls.push('stop a') },
    b = { endConversation: async () => calls.push('stop b') };
  await Promise.all([
    gate.run(a, [a, b], () => calls.push('start a')),
    gate.run(b, [a, b], () => calls.push('start b')),
  ]);
  assert.deepEqual(calls, ['stop a', 'start b']);
});
test('handoff does not wait for full playback duration', async () => {
  const gate = new VoiceOwnership();
  let finish;
  const a = { endConversation: async () => finish?.() },
    b = { endConversation: async () => {} };
  let started = false;
  const first = gate.run(
    a,
    [a, b],
    () =>
      new Promise((r) => {
        finish = r;
      }),
  );
  await new Promise((r) => setImmediate(r));
  await gate.run(b, [a, b], () => {
    started = true;
  });
  await first;
  assert.equal(started, true);
});
test('closed ownership does not start delayed requests', async () => {
  const gate = new VoiceOwnership();
  let started = false;
  const owner = { endConversation: async () => {} };
  const pending = gate.run(owner, [owner], () => {
    started = true;
  });
  gate.close();
  await pending;
  assert.equal(started, false);
});
