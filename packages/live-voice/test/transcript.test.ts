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
