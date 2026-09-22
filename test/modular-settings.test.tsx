// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { LiveVoiceTranslationProvider } from '../src/app/client/i18n/index.ts';
import { defaultSettings } from '../src/modules/core/settings.ts';
import { LiveVoiceSettings } from '../src/modules/settings/index.ts';

test('modular settings composes speech, recognition, and conversation tabs', async (t) => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://dsh.local/' });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.localStorage = dom.window.localStorage;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const state = {
    settings: { ...defaultSettings },
    capabilities: {
      browser: { supported: true },
      recognition: { supported: true },
      capture: { supported: true },
    },
  };
  const listeners = new Set();
  const calls = [];
  const controller = {
    getSnapshot: () => state,
    subscribe: (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    updateSettings: (next) => calls.push(next),
    clearError() {},
  };
  const root = createRoot(document.getElementById('root'));
  await act(async () =>
    root.render(
      <LiveVoiceTranslationProvider>
        <LiveVoiceSettings controller={controller} />
      </LiveVoiceTranslationProvider>,
    ),
  );
  t.after(async () => {
    await act(async () => root.unmount());
    dom.window.close();
    delete globalThis.window;
    delete globalThis.document;
    delete globalThis.localStorage;
    delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  });
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  assert.deepEqual(
    tabs.map((tab) => tab.textContent),
    ['Speech', 'Speech recognition', 'Conversation'],
  );
  assert.equal(document.querySelectorAll('[role="tabpanel"]')[0].hidden, true);
  assert.equal(document.querySelectorAll('[role="tabpanel"]')[2].hidden, false);
  assert.equal(tabs[2].getAttribute('aria-selected'), 'true');
  assert.equal(
    tabs[2].getAttribute('aria-controls'),
    document.querySelectorAll('[role="tabpanel"]')[2].id,
  );
  assert.equal(
    document.querySelectorAll('[role="tabpanel"]')[2].getAttribute('aria-labelledby'),
    tabs[2].id,
  );
  await act(async () =>
    tabs[2].dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Home', bubbles: true })),
  );
  assert.equal(document.querySelectorAll('[role="tabpanel"]')[0].hidden, false);
  await act(async () => tabs[2].click());
  assert.equal(document.querySelectorAll('[role="tabpanel"]')[2].hidden, false);
  const delivery = document.querySelectorAll('[role="tabpanel"]')[2].querySelector('select');
  assert.ok(delivery);
  await act(async () => {
    delivery.value = 'queue';
    delivery.dispatchEvent(new window.Event('change', { bubbles: true }));
  });
  assert.deepEqual(calls, [{ sendingMode: 'queue' }]);
});
