// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assistantMessages,
  addressedTurn,
  latestUserSequence,
  pendingQuestionSpeech,
} from '../src/modules/conversation/models/chat.ts';
test('pending question speech reads question prompts only', () => {
  assert.equal(
    pendingQuestionSpeech({
      kind: 'question',
      questions: [
        { id: 'one', question: 'Which engine?', options: [{ label: 'Browser' }] },
        { id: 'two', question: 'Which language?', header: 'Language' },
      ],
    }),
    'Which engine?',
  );
  assert.equal(pendingQuestionSpeech({ kind: 'plan-review', questions: [] }), '');
});

test('user sequence ignores assistant rows and recognizes steering', () => {
  assert.equal(
    latestUserSequence({
      nodes: new Map([
        ['a', { kind: 'user', anchorSeq: 5 }],
        ['b', { kind: 'steering', anchorSeq: 9 }],
        ['c', { kind: 'assistant-step', anchorSeq: 99 }],
      ]),
    }),
    9,
  );
  assert.equal(latestUserSequence(undefined), -1);
});
test('reads public chat store and excludes reasoning and hidden rows', () => {
  const snapshot = {
    nodes: {
      values: () => [
        {
          kind: 'assistant-step',
          visibility: 'visible',
          data: {
            turn: 2,
            step: 1,
            status: 'settled',
            finalNode: { messageId: 'b' },
            blocks: [{ kind: 'text', text: 'Second' }],
          },
        },
        {
          kind: 'assistant-step',
          visibility: 'visible',
          data: {
            turn: 2,
            step: 0,
            status: 'settled',
            finalNode: { messageId: 'a' },
            blocks: [
              { kind: 'reasoning', text: 'private' },
              { kind: 'text', text: 'First' },
            ],
          },
        },
        {
          kind: 'assistant-step',
          visibility: 'hidden',
          data: { turn: 1, step: 0, blocks: [{ kind: 'text', text: 'hidden' }] },
        },
      ],
    },
  };
  const m = assistantMessages(snapshot);
  assert.deepEqual(addressedTurn(m, 'b'), { text: 'First\n\nSecond', id: '2:1' });
  assert.equal(m.length, 2);
});

test('manual turn speech includes intermediate responses but never other turns', () => {
  const messages = [
    { turn: 1, step: 0, id: '1:0', messageId: 'old', text: 'Other turn' },
    { turn: 2, step: 2, id: '2:2', messageId: 'last', text: 'Final response' },
    { turn: 2, step: 0, id: '2:0', messageId: 'first', text: 'Markdown examples' },
    { turn: 2, step: 1, id: '2:1', messageId: 'middle', text: 'Intermediate response' },
  ];
  assert.deepEqual(addressedTurn(messages, 'last'), {
    id: '2:2',
    text: 'Markdown examples\n\nIntermediate response\n\nFinal response',
  });
  assert.equal(addressedTurn(messages, 'missing').text, '');
  assert.equal(addressedTurn([{ text: 'Unaddressed' }], undefined).text, '');
});
