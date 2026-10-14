import test from 'node:test';
import assert from 'node:assert/strict';
import {
  settingsDocument,
  mergeSettingsDocuments,
} from '../src/modules/settings/models/settingsDocument.ts';

function nested(count) {
  let value = null;
  for (let i = 0; i < count; i++) value = { child: value };
  return value;
}

test('generic settings documents retain JSON types and return safe detached plain objects', () => {
  const value = {
    future: {
      list: [null, false, true, 0, -12.5, '日本語 🎙️', {}, [], { children: [null] }],
      options: { active: false, nullable: null },
    },
    engine: 'not-known-by-this-host',
    recordingEnabled: 'not-a-boolean',
  };
  const document = settingsDocument(value);
  assert.deepEqual(document, value);
  assert.notEqual(document, value);
  assert.notEqual(document.future, value.future);
  assert.notEqual(document.future.list, value.future.list);
  assert.equal(Object.getPrototypeOf(document), Object.prototype);
  assert.equal(Object.getPrototypeOf(document.future), Object.prototype);
  value.future.list[0] = 'changed';
  assert.equal(document.future.list[0], null);
  document.future.options.active = true;
  assert.equal(value.future.options.active, false);
  assert.deepEqual(settingsDocument({}), {});
});

test('generic document merging is shallow, ordered, detached, and preserves unknown keys', () => {
  const original = { future: { old: true, retain: [null] }, unrelated: { active: false } };
  const patch = { future: { new: [1, null] }, rate: 999 };
  const result = mergeSettingsDocuments(original, patch, { rate: -5 });
  assert.deepEqual(result, { future: { new: [1, null] }, unrelated: { active: false }, rate: -5 });
  assert.deepEqual(original.future, { old: true, retain: [null] });
  patch.future.new.push(2);
  original.unrelated.active = true;
  assert.deepEqual(result.future, { new: [1, null] });
  assert.deepEqual(result.unrelated, { active: false });
  assert.deepEqual(mergeSettingsDocuments(), {});
});

test('generic settings reject invalid root documents and every non-JSON value', () => {
  for (const value of [null, [], 'text', 1, true, undefined, new Date(), new Map(), /pattern/]) {
    assert.throws(() => settingsDocument(value));
  }
  const cyclic = {};
  cyclic.self = cyclic;
  const invalidValues = [
    undefined,
    NaN,
    Infinity,
    -Infinity,
    1n,
    () => {},
    Symbol('x'),
    new Date(),
    new Map(),
    new Set(),
    new Uint8Array([1]),
    /pattern/,
    cyclic,
  ];
  for (const value of invalidValues) {
    assert.throws(() => settingsDocument({ future: value }));
    assert.throws(() => settingsDocument({ future: [null, value] }));
  }
  class Custom {
    value = 1;
  }
  assert.throws(() => settingsDocument({ future: new Custom() }));
  assert.throws(() => settingsDocument({ future: Object.create({ inherited: true }) }));
});

test('generic settings reject dangerous object keys recursively without prototype pollution', () => {
  for (const key of ['__proto__', 'constructor', 'prototype']) {
    const attack = JSON.parse('{"' + key + '":{"polluted":true}}');
    assert.throws(() => settingsDocument(attack));
    assert.throws(() => settingsDocument({ future: attack }));
    assert.throws(() => settingsDocument({ future: [null, { nested: attack }] }));
    assert.throws(() => mergeSettingsDocuments({ safe: true }, { future: attack }));
  }
  assert.equal({}.polluted, undefined);
});

test('generic settings enforce UTF-8 byte size, depth, and merged document bounds', () => {
  const boundary = { x: 'a'.repeat(64000 - Buffer.byteLength(JSON.stringify({ x: '' }), 'utf8')) };
  assert.equal(Buffer.byteLength(JSON.stringify(boundary), 'utf8'), 64000);
  assert.deepEqual(settingsDocument(boundary), boundary);
  assert.throws(() => settingsDocument({ x: boundary.x + 'a' }));
  const multibyte = { x: 'é'.repeat(32000) };
  assert.ok(
    JSON.stringify(multibyte).length < 64000,
    'character count alone would allow this payload',
  );
  assert.throws(() => settingsDocument(multibyte));
  assert.deepEqual(
    settingsDocument({ future: nested(15) }),
    { future: nested(15) },
    'depth 16 is accepted',
  );
  assert.throws(() => settingsDocument({ future: nested(16) }), 'depth 17 is rejected');
  assert.throws(() =>
    mergeSettingsDocuments({ first: 'a'.repeat(33000) }, { second: 'b'.repeat(33000) }),
  );
});

test('generic document safety never invokes accessors or custom JSON serializers', () => {
  let calls = 0;
  const getter = Object.defineProperty({}, 'future', {
    enumerable: true,
    get() {
      calls++;
      return 'unsafe';
    },
  });
  assert.throws(() => settingsDocument(getter));
  assert.equal(calls, 0);
  assert.throws(() =>
    settingsDocument({
      future: {
        toJSON() {
          calls++;
          return 'unsafe';
        },
      },
    }),
  );
  assert.equal(calls, 0);
  assert.throws(() => settingsDocument({ future: { [Symbol('hidden')]: 1 } }));
  assert.throws(() =>
    settingsDocument({ future: Object.defineProperty({}, 'hidden', { value: 1 }) }),
  );
  assert.throws(() => settingsDocument({ future: Array(2) }));
  const customArray = [null];
  customArray.extra = true;
  assert.throws(() => settingsDocument({ future: customArray }));
  const shared = { list: [null, true] };
  assert.deepEqual(
    settingsDocument({ a: shared, b: shared }),
    { a: shared, b: shared },
    'shared references without cycles are safely duplicated',
  );
});
