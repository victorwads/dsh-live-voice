// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { TranscriptDraft } from '../src/core/transcript.ts';
test('interim revisions replace only owned suffix and finals commit once', () => {
  const d = new TranscriptDraft();
  assert.equal(d.update('Hello', 'wor'), 'Hello wor');
  assert.equal(d.update('Hello wor', 'world'), 'Hello world');
  assert.equal(d.update('Hello world', 'world!', true), 'Hello world!');
  assert.equal(d.update('Hello world!', 'Next', true), 'Hello world! Next');
});
test('user edits survive interim and final callbacks without duplicates', () => {
  const d = new TranscriptDraft();
  d.update('Start', 'hello');
  assert.equal(d.update('Start edited', 'hello there'), 'Start edited');
  assert.equal(d.update('Start edited', 'hello there again'), 'Start edited');
  assert.equal(d.update('Start edited', 'hello there!', true), 'Start edited');
  assert.equal(d.update('Start edited', 'new sentence', true), 'Start edited new sentence');
});
test('editing outside the owned hypothesis preserves both user text and new speech', () => {
  const d = new TranscriptDraft();
  d.update('Original', 'hello');
  assert.equal(d.update('Edited hello plus typed', 'hello world'), 'Edited hello world plus typed');
  assert.equal(
    d.update('Edited hello world plus typed', 'hello world!', true),
    'Edited hello world! plus typed',
  );
});

test('clearing or sending composer prevents old hypothesis resurrection', () => {
  const d = new TranscriptDraft();
  d.update('', 'partial');
  assert.equal(d.update('', 'partial extended'), '');
  assert.equal(d.update('', 'partial final', true), '');
});
