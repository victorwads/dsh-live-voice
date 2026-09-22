// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import {
  CheckboxField,
  ErrorMessage,
  IconButton,
  SelectField,
  SettingsSubcard,
  SettingsTabs,
} from '../src/shared/design-system/index.ts';

async function fixture(t, element) {
  const dom = new JSDOM('<div id="root"></div>');
  const previous = { window: globalThis.window, document: globalThis.document };
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const root = createRoot(document.getElementById('root'));
  await act(async () => root.render(element));
  t.after(async () => {
    await act(async () => root.unmount());
    dom.window.close();
    Object.assign(globalThis, previous);
    delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  });
  return document.getElementById('root');
}

test('design-system buttons preserve accessible labels and plugin classes', async (t) => {
  const root = await fixture(
    t,
    <IconButton icon="mic" label="Start voice" visibleLabel="On" className="dlv-mic" />,
  );
  const button = root.querySelector('button');
  assert.equal(button.type, 'button');
  assert.equal(button.getAttribute('aria-label'), 'Start voice');
  assert.match(button.className, /dlv-icon-button/);
  assert.match(button.className, /dlv-mic/);
  assert.equal(button.querySelector('svg').getAttribute('aria-hidden'), 'true');
  assert.equal(button.querySelector('.dlv-toggle-state').textContent, 'On');
});

test('design-system fields preserve labels, values, descriptions, and change events', async (t) => {
  const calls = [];
  const root = await fixture(
    t,
    <>
      <SelectField
        label="Engine"
        value="browser"
        options={[
          { value: 'browser', label: 'Browser' },
          { value: 'local', label: 'Local' },
        ]}
        onChange={(event) => calls.push(event.target.value)}
      />
      <CheckboxField label="Enabled" description="Feature help" defaultChecked />
    </>,
  );
  const select = root.querySelector('select');
  assert.equal(select.closest('label').textContent, 'EngineBrowserLocal');
  await act(async () => {
    select.value = 'local';
    select.dispatchEvent(new window.Event('change', { bubbles: true }));
  });
  assert.deepEqual(calls, ['local']);
  assert.equal(root.querySelector('input[type="checkbox"]').checked, true);
  assert.equal(root.querySelector('.dlv-setting-description').textContent, 'Feature help');
});

test('design-system feedback and settings layout preserve semantic contracts', async (t) => {
  const calls = [];
  const root = await fixture(
    t,
    <>
      <SettingsTabs
        label="Live Voice settings"
        active="conversation"
        tabs={[
          { id: 'conversation', label: 'Conversation' },
          { id: 'speech', label: 'Speech' },
        ]}
        onChange={(id) => calls.push(id)}
      />
      <SettingsSubcard title="Advanced" open>
        <span>Body</span>
      </SettingsSubcard>
      <ErrorMessage
        error="Failure"
        dismissLabel="Dismiss error"
        onDismiss={() => calls.push('dismiss')}
      />
    </>,
  );
  assert.equal(
    root.querySelector('[role="tablist"]').getAttribute('aria-label'),
    'Live Voice settings',
  );
  assert.equal(root.querySelector('[role="tab"]').getAttribute('aria-selected'), 'true');
  await act(async () => root.querySelectorAll('[role="tab"]')[1].click());
  assert.equal(root.querySelector('details').open, true);
  assert.equal(root.querySelector('summary').textContent, 'Advanced');
  assert.equal(root.querySelector('[role="alert"]').textContent.trim(), 'Failure×');
  await act(async () => root.querySelector('[role="alert"] button').click());
  assert.deepEqual(calls, ['speech', 'dismiss']);
});
