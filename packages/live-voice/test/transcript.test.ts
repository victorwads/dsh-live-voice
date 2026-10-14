import test from 'node:test';
import assert from 'node:assert/strict';
import { TranscriptDraft } from '../src/modules/core/transcript.ts';

test('dictation appends only final chunks to the current composer', () => {
  const d = new TranscriptDraft();
  assert.equal(d.update('Manual text', 'partial'), 'Manual text');
  assert.equal(d.update('Manual text', 'final chunk', true), 'Manual text final chunk');
  assert.equal(
    d.update('Manual text final chunk + typed', 'next chunk', true),
    'Manual text final chunk + typed next chunk',
  );
});

test('chunk newlines normalize to spaces and only paragraph metadata inserts two newlines', () => {
  const draft = new TranscriptDraft();
  assert.equal(draft.update('First', 'second\nthird', true), 'First second third');
  assert.equal(draft.update('First', 'Second paragraph', true, true), 'First\n\nSecond paragraph');
  assert.equal(draft.update('First\n\n', 'Second', true, true), 'First\n\nSecond');
  assert.equal(draft.update('', 'First', true, true), 'First');
});

test('interim revisions, cancellation and empty finals never rewrite composer text', () => {
  const d = new TranscriptDraft();
  for (const text of ['', 'edited by user', 'typed\n']) {
    assert.equal(d.update(text, 'hypothesis'), text);
    assert.equal(d.update(text, 'revised hypothesis'), text);
    assert.equal(d.update(text, '', true), text);
    d.reset();
    assert.equal(
      d.update(text, 'final', true),
      text + (text && !/\s$/.test(text) ? ' ' : '') + 'final',
    );
  }
});
