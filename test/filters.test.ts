// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterSpeechOutput,
  hasMinimumWords,
  hasUnclosedCodeFence,
  matchVoiceCommand,
  normalizeVoiceCommand,
  splitSpeechOutput,
} from '../src/modules/core/filters.ts';

test('voice commands match the whole normalized chunk', () => {
  assert.equal(normalizeVoiceCommand('  ÉND, conversation!!! '), 'end conversation');
  assert.equal(matchVoiceCommand('Énd, conversation!', { end: 'end, end conversation' }), 'end');
  assert.equal(matchVoiceCommand('please end conversation', { end: 'end conversation' }), null);
});

test('recognition word filter counts words rather than characters', () => {
  assert.equal(hasMinimumWords('hum', 2), false);
  assert.equal(hasMinimumWords('end conversation', 2), true);
  assert.equal(hasMinimumWords('olá, mundo!', 2), true);
});

test('speech segmentation uses only line breaks, never punctuation', () => {
  assert.deepEqual(splitSpeechOutput('One sentence. Another? Still same!'), [
    'One sentence. Another? Still same!',
  ]);
  assert.deepEqual(splitSpeechOutput('First.\nSecond?\nThird!'), ['First.', 'Second?', 'Third!']);
});

test('speech output reads short code and replaces code longer than its line limit', () => {
  const fence = String.fromCharCode(96).repeat(3);
  const short = 'Before\n\n' + fence + 'js\na()\nb()\n' + fence + '\nAfter';
  assert.equal(filterSpeechOutput(short), 'Before\n\na()\nb()\nAfter');
  const long = 'Before\n' + fence + 'js\n1\n2\n3\n4\n5\n6\n' + fence + '\nAfter';
  assert.equal(filterSpeechOutput(long), 'Before\nLook the code on out conversation\nAfter');
  assert.equal(filterSpeechOutput(long, { filterCodeBlocks: false }), long);
});

test('unclosed code fences are detected while assistant text streams', () => {
  const fence = String.fromCharCode(96).repeat(3);
  assert.equal(hasUnclosedCodeFence('Text ' + fence + 'js\nconst x = 1;'), true);
  assert.equal(hasUnclosedCodeFence('Text ' + fence + 'js\nx()\n' + fence), false);
});
