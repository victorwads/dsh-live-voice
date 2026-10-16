import test from 'node:test';
import assert from 'node:assert/strict';
import { searchSegments } from '../src/segmentSearch.js';
import type { RecordingSegment } from '../../live-voice/src/modules/recording/types.js';
function segment(
  id: string,
  text?: string,
  status: 'success' | 'error' | 'pending' = 'success',
): RecordingSegment {
  return {
    id,
    kind: 'speech',
    startSample: 0,
    endSample: 100,
    open: false,
    attempts:
      text === undefined
        ? []
        : [
            {
              id,
              text,
              status,
              segmentId: id,
              startSample: 0,
              endSample: 100,
              engine: 'test',
              createdAt: '',
            },
          ],
  };
}
test('transcript search ranks exact, phrase, words, partial words, then fuzzy; ties remain chronological', () => {
  const segments = [
    segment('fuzzy', 'perdi as palabres finais'),
    segment('partial', 'palavras finais completas'),
    segment('words', 'finais das palavras'),
    segment('phrase', 'ouvi palavras finais aqui'),
    segment('exact', 'PALAVRAS FINAIS!'),
    segment('tie', 'palavras finais'),
    segment('empty'),
    segment('error', 'palavras finais', 'error'),
    segment('pending', 'palavras finais', 'pending'),
  ];
  assert.deepEqual(
    searchSegments(segments, 'palavras finais').map((s) => s.id),
    ['exact', 'tie', 'partial', 'phrase', 'words', 'fuzzy'],
  );
  assert.deepEqual(searchSegments(segments, 'unrelated words'), []);
  assert.strictEqual(searchSegments(segments, '  '), segments);
  assert.deepEqual(searchSegments(segments, '!?'), []);
});
test('search ignores case and diacritics, checks every successful attempt, and limits short-word typos', () => {
  const accented = segment('accent', 'CAPTAÇÃO DA SESSÃO');
  const retry = segment('retry', 'no match');
  retry.attempts.push({ ...retry.attempts[0], id: 'retry2', text: 'captação da sessão' });
  assert.deepEqual(
    searchSegments([accented, retry], 'captacao sessao').map((s) => s.id),
    ['accent', 'retry'],
  );
  assert.deepEqual(searchSegments([segment('short', 'voz')], 'vos'), []);
  assert.deepEqual(
    searchSegments([segment('zh', '最后几个字被切掉了')], '最后几个字').map((s) => s.id),
    ['zh'],
  );
});
