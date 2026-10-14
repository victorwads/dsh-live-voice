import test from 'node:test';
import assert from 'node:assert/strict';
import { createSettingsClient } from '../src/modules/settings/models/settingsStorage.ts';
import {
  mergeSettingsDocuments,
  settingsDocument,
} from '../src/modules/settings/models/settingsDocument.ts';

test('a later oversized merge cannot turn an earlier committed generic save into failure', async () => {
  let raw = {};
  const client = createSettingsClient(async (_url, options) => {
    if (options.method === 'PUT') {
      try {
        raw = mergeSettingsDocuments(raw, JSON.parse(options.body));
      } catch {
        return Response.json({ ok: false }, { status: 400 });
      }
    }
    return Response.json({ ok: true, value: raw, hostPlatform: 'linux' });
  });
  await client.ready;
  const first = client.save({ firstFuture: 'a'.repeat(33000) });
  const second = client.save({ secondFuture: 'b'.repeat(33000) });
  const rejected = assert.rejects(second);
  await first;
  await rejected;
  assert.equal(client.getSnapshot().firstFuture.length, 33000);
  assert.equal(client.getSnapshot().secondFuture, undefined);
  assert.deepEqual(raw, { firstFuture: 'a'.repeat(33000) });
  await client.save({ anotherFuture: [null, true] });
  assert.deepEqual(raw.anotherFuture, [null, true]);
});

test('observers and mutable unknown-field snapshots cannot damage queued transport patches', async () => {
  let raw = {};
  const client = createSettingsClient(async (_url, options) => {
    if (options.method === 'PUT') raw = mergeSettingsDocuments(raw, JSON.parse(options.body));
    return Response.json({ ok: true, value: raw });
  });
  await client.ready;
  client.subscribe((snapshot) => {
    if (snapshot.future) snapshot.future.nested[0] = 'view-only mutation';
    throw new Error('observer');
  });
  await client.save({ future: { nested: ['stored'] } });
  await client.save({ volume: 0.5 });
  assert.deepEqual(raw.future, { nested: ['stored'] });
});

test('JSON structural validation never invokes getters or toJSON', () => {
  let invoked = false;
  const accessor = {};
  Object.defineProperty(accessor, 'future', {
    enumerable: true,
    get() {
      invoked = true;
      return 1;
    },
  });
  assert.throws(() => settingsDocument(accessor));
  assert.throws(() =>
    settingsDocument({
      toJSON() {
        invoked = true;
        return {};
      },
    }),
  );
  assert.equal(invoked, false);
});

test('unsafe successful transport responses reject without replacing the last valid preferences', async () => {
  const client = createSettingsClient(async (_url, options) =>
    Response.json({
      ok: true,
      value:
        options.method === 'GET'
          ? { volume: 0.6, future: [null] }
          : JSON.parse('{"__proto__":{"polluted":true}}'),
    }),
  );
  await client.ready;
  await assert.rejects(client.save({ volume: 0.3 }));
  assert.equal(client.getSnapshot().volume, 0.6);
  assert.deepEqual(client.getSnapshot().future, [null]);
  assert.equal({}.polluted, undefined);
});
