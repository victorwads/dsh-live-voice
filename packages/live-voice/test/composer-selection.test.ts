import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { preserveComposerSelection } from '../src/app/client/composerSelection.ts';

for (const [anchor, focus] of [
  [2, 2],
  [1, 4],
  [4, 1],
  [5, 5],
]) {
  test(
    'append preserves contenteditable selection ' + anchor + ':' + focus + ' across rebuilt nodes',
    () => {
      const dom = new JSDOM('<div contenteditable="true" tabindex="0">hello</div>');
      const doc = dom.window.document;
      const editor = doc.querySelector('div')!;
      editor.focus();
      const selection = doc.getSelection()!;
      selection.setBaseAndExtent(editor.firstChild!, anchor, editor.firstChild!, focus);
      let adopted: number[] = [];
      doc.addEventListener('selectionchange', () => {
        adopted = [selection.anchorOffset, selection.focusOffset];
      });
      preserveComposerSelection(() => {
        editor.textContent = 'hello appended speech';
        selection.collapse(editor.firstChild, editor.textContent.length);
      }, doc);
      assert.equal(editor.textContent, 'hello appended speech');
      assert.equal(doc.activeElement, editor);
      assert.equal(selection.anchorOffset, anchor);
      assert.equal(selection.focusOffset, focus);
      assert.deepEqual(
        adopted,
        [anchor, focus],
        'publish restored selection through editor event bridge',
      );
      dom.window.close();
    },
  );
}

test('multiline selection survives changed paragraph and text-node structure', () => {
  const dom = new JSDOM('<div contenteditable="true" tabindex="0"><p>hello</p><p>world</p></div>');
  const doc = dom.window.document;
  const editor = doc.querySelector('div')!;
  editor.focus();
  const selection = doc.getSelection()!;
  selection.setBaseAndExtent(editor.lastChild!.firstChild!, 3, editor.firstChild!.firstChild!, 1);
  preserveComposerSelection(() => {
    editor.innerHTML = '<p>hello</p><p>world appended</p>';
    selection.collapse(editor, 2);
  }, doc);
  assert.equal(selection.anchorNode, editor.lastChild!.firstChild);
  assert.equal(selection.anchorOffset, 3);
  assert.equal(selection.focusNode, editor.firstChild!.firstChild);
  assert.equal(selection.focusOffset, 1);
  dom.window.close();
});

test('append does not steal focus from a different field or change its selection', () => {
  const dom = new JSDOM(
    '<textarea>another field</textarea><div contenteditable="true" tabindex="0">draft</div>',
  );
  const doc = dom.window.document;
  const field = doc.querySelector('textarea')!;
  const editor = doc.querySelector('div')!;
  field.focus();
  field.setSelectionRange(2, 7, 'backward');
  preserveComposerSelection(() => {
    editor.textContent += ' speech';
    editor.focus();
  }, doc);
  assert.equal(doc.activeElement, field);
  assert.equal(field.selectionStart, 2);
  assert.equal(field.selectionEnd, 7);
  assert.equal(field.selectionDirection, 'backward');
  dom.window.close();
});
