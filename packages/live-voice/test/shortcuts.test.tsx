// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { ShortcutField } from '../src/shared/design-system/forms/ShortcutField.js';
import {
  normalizeShortcut,
  shortcutFromEvent,
  matchesShortcut,
  releasesShortcut,
} from '../src/shared/design-system/forms/keyboardShortcut.js';
import { normalizeSettings } from '../src/modules/core/settings.js';

test('shortcut normalization preserves modifiers, chords and explicit unbinding', () => {
  for (const shortcut of [
    'Control',
    'Shift',
    'Alt',
    'Meta',
    'Control+Alt+Shift+Meta',
    'Alt+KeyM',
    'KeyM',
    '',
  ]) {
    const settings = normalizeSettings({ holdToTalkShortcut: shortcut, meetingShortcut: shortcut });
    assert.equal(
      normalizeSettings(JSON.parse(JSON.stringify(settings))).holdToTalkShortcut,
      shortcut,
    );
    assert.equal(settings.meetingShortcut, shortcut);
  }
  assert.equal(normalizeShortcut('Shift+Control+KeyM'), 'Control+Shift+KeyM');
  for (const value of [null, {}, 'Control+Control', 'KeyA+KeyB', 'Escape', 'Tab', 'arbitrary'])
    assert.equal(normalizeSettings({ holdToTalkShortcut: value }).holdToTalkShortcut, 'Control');
  const event = {
    key: 'm',
    code: 'KeyM',
    ctrlKey: true,
    altKey: true,
    shiftKey: false,
    metaKey: false,
  };
  assert.equal(shortcutFromEvent(event), 'Control+Alt+KeyM');
  assert.equal(matchesShortcut(event, 'Control+KeyM'), false);
  assert.equal(matchesShortcut(event, 'Control+Alt+KeyM'), true);
  assert.equal(releasesShortcut({ key: 'Alt' }, 'Alt+KeyM'), true);
  assert.equal(releasesShortcut({ key: 'm', code: 'KeyM' }, 'Alt+KeyM'), true);
  assert.equal(releasesShortcut({ key: 'Shift' }, 'Alt+KeyM'), false);
});

test('shortcut field records on release, supports replacement, cancel, conflict and clearing', async (t) => {
  const dom = new JSDOM('<div id="root"></div>');
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    act: globalThis.IS_REACT_ACT_ENVIRONMENT,
  };
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const root = createRoot(document.getElementById('root'));
  t.after(async () => {
    await act(async () => root.unmount());
    dom.window.close();
    globalThis.window = previous.window;
    globalThis.document = previous.document;
    globalThis.IS_REACT_ACT_ENVIRONMENT = previous.act;
  });
  const saved = [];
  function Field() {
    const [value, setValue] = React.useState('Control');
    return (
      <ShortcutField
        label="Shortcut"
        value={value}
        onChange={(next) => {
          saved.push(next);
          setValue(next);
        }}
        recordLabel="Set"
        editLabel="Replace"
        recordingLabel="Press keys"
        clearLabel="Clear"
        validate={(next) => (next === 'KeyX' ? 'Already assigned' : undefined)}
      />
    );
  }
  await act(async () => root.render(<Field />));
  const record = document.querySelector('.dlv-shortcut-record');
  assert.equal(
    document.querySelector('[role=status]'),
    null,
    'idle fields have no repeated helper lines',
  );
  const key = async (type, options) =>
    act(async () =>
      record.dispatchEvent(
        new window.KeyboardEvent(type, {
          bubbles: true,
          cancelable: true,
          ...options,
        }),
      ),
    );
  for (const [name, flag] of [
    ['Shift', 'shiftKey'],
    ['Alt', 'altKey'],
    ['Meta', 'metaKey'],
    ['Control', 'ctrlKey'],
  ]) {
    await act(async () => record.click());
    await key('keydown', { key: name, [flag]: true });
    await key('keyup', { key: name });
    assert.equal(saved.at(-1), name);
  }
  await act(async () => record.click());
  await key('keydown', { key: 'Control', ctrlKey: true });
  await key('keydown', { key: 'm', code: 'KeyM', ctrlKey: true, shiftKey: true });
  assert.equal(saved.at(-1), 'Control');
  await key('keyup', { key: 'm', code: 'KeyM', ctrlKey: true, shiftKey: true });
  assert.equal(saved.at(-1), 'Control+Shift+KeyM');
  assert.equal(record.textContent, 'Ctrl + Shift + M');
  await act(async () => record.blur());
  assert.notEqual(document.activeElement, record);
  await act(async () => record.click());
  assert.equal(document.activeElement, record, 'pointer activation must focus the recorder');
  const focusedKey = async (type, options) =>
    act(async () => {
      document.activeElement.dispatchEvent(
        new window.KeyboardEvent(type, {
          bubbles: true,
          cancelable: true,
          ...options,
        }),
      );
    });
  await focusedKey('keydown', { key: 'Control', code: 'ControlLeft', ctrlKey: true });
  await focusedKey('keydown', { key: ' ', code: 'Space', ctrlKey: true });
  await focusedKey('keyup', { key: ' ', code: 'Space', ctrlKey: true });
  await focusedKey('keyup', { key: 'Control', code: 'ControlLeft' });
  assert.equal(saved.at(-1), 'Control+Space');
  assert.equal(record.textContent, 'Ctrl + ␣');
  await act(async () => record.click());
  await key('keydown', { key: 'Escape' });
  assert.equal(record.dataset.recording, 'false');
  await act(async () => record.click());
  await key('keydown', { key: 'x', code: 'KeyX' });
  await key('keyup', { key: 'x', code: 'KeyX' });
  assert.equal(saved.at(-1), 'Control+Space');
  assert.equal(document.querySelector('[role=status]').textContent, 'Already assigned');
  await key('keydown', { key: 'Tab' });
  assert.equal(record.dataset.recording, 'false');
  await act(async () => document.querySelector('.dlv-shortcut-clear').click());
  assert.equal(saved.at(-1), '');
});
