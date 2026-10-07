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
  assert.equal(
    filterSpeechOutput(long, { filterCodeBlocks: false }),
    'Before\n1\n2\n3\n4\n5\n6\nAfter',
  );
});

test('unclosed code fences are detected while assistant text streams', () => {
  const fence = String.fromCharCode(96).repeat(3);
  assert.equal(hasUnclosedCodeFence('Text ' + fence + 'js\nconst x = 1;'), true);
  assert.equal(hasUnclosedCodeFence('Text ' + fence + 'js\nx()\n' + fence), false);
});

test('Markdown speech normalizes formatting, links, images, lists, paths and tables', () => {
  const options = { lang: 'pt-BR' };
  assert.equal(
    filterSpeechOutput('# Título\n\n**Forte** e *suave*.', options),
    'Título\n\nForte e suave.',
  );
  assert.equal(
    filterSpeechOutput('[Documentação](https://example.com/private?token=abc)', options),
    'Link para Documentação',
  );
  assert.equal(
    filterSpeechOutput('https://example.com/private?token=abc', options),
    'Link para example.com',
  );
  assert.equal(filterSpeechOutput('![Diagrama](image.png)', options), 'Imagem: Diagrama');
  assert.equal(
    filterSpeechOutput('- [x] Feito\n- [ ] Falta', options),
    'Concluído: Feito\nPendente: Falta',
  );
  assert.equal(filterSpeechOutput('1. Abra\n2. Execute', options), '1. Abra\n2. Execute');
  assert.equal(
    filterSpeechOutput('Veja /src/modules/test.ts#L42-L50 e arquivo.ts:12.', options),
    'Veja test.ts, linhas 42 a 50 e arquivo.ts, linha 12.',
  );
  assert.equal(
    filterSpeechOutput(
      '| Nome | Estado |\n| --- | --- |\n| Voz | Pronta |\n| Fila | Ativa |',
      options,
    ),
    'Tabela com colunas: Nome, Estado\nVoz, Pronta\nFila, Ativa',
  );
  assert.equal(
    filterSpeechOutput(
      'Versão 0.3.3, total 123456789 e 550e8400-e29b-41d4-a716-446655440000.',
      options,
    ),
    'Versão 0.3.3, total 123456789 e identificador.',
  );
  assert.equal(
    filterSpeechOutput('[**Guia**][ref]\n\n[ref]: https://example.com', options),
    'Link para Guia',
  );
});
