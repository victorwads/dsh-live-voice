// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { LiveVoiceTranslationProvider } from '../src/app/client/i18n/index.ts';
import { defaultSettings } from '../src/modules/core/settings.ts';
import { LiveVoiceSettings } from '../src/modules/settings/index.ts';
import { publishDeveloperExtension } from '../src/modules/core/developerExtension.ts';

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
  const panels = [...document.querySelectorAll('[role="tabpanel"]')];
  for (const panel of panels) {
    const general = [...panel.querySelectorAll('details')].find((details) =>
      details.querySelector(':scope > summary')?.textContent?.includes('General'),
    );
    assert.ok(general, 'each tab groups its primary fields under General');
    assert.equal(general.open, false, 'sections start collapsed');
    assert.ok(general.querySelector('summary svg'), 'section headings show an icon');
  }
  const conversation = panels[2];
  const general = [...conversation.querySelectorAll('details')].find((details) =>
    details.querySelector(':scope > summary')?.textContent?.includes('General'),
  );
  await act(async () => general.querySelector('summary').click());
  assert.equal(general.open, true);
  const delivery = general.querySelector('select');
  assert.ok(delivery);
  await act(async () => {
    delivery.value = 'queue';
    delivery.dispatchEvent(new window.Event('change', { bubbles: true }));
  });
  assert.deepEqual(calls, [{ sendingMode: 'queue' }]);
  const policyLabel = [...general.querySelectorAll('label')].find((label) =>
    label.textContent.includes('In your DSH, what does Enter do when the agent is busy?'),
  );
  const policy = policyLabel.querySelector('select');
  assert.equal(policy.value, 'queue');
  assert.deepEqual(
    [...policy.options].map((option) => option.value),
    ['steer', 'queue'],
  );
  const help = document.getElementById(policy.getAttribute('aria-describedby'));
  assert.match(help.textContent, /uses your answer to choose the correct action/);
  assert.match(help.textContent, /does not change DSH settings/);
  await act(async () => {
    policy.value = 'steer';
    policy.dispatchEvent(new window.Event('change', { bubbles: true }));
  });
  assert.deepEqual(calls.at(-1), { dshBusyEnterBehavior: 'steer' });
  let removeDeveloper;
  await act(async () => {
    removeDeveloper = publishDeveloperExtension(window, {
      version: 1,
      label: () => 'Developer',
      component: () => <p>Developer controls</p>,
    });
  });
  assert.equal(document.querySelectorAll('[role="tab"]').length, 4);
  const developerTab = [...document.querySelectorAll('[role="tab"]')].find(
    (tab) => tab.textContent === 'Developer',
  );
  await act(async () => developerTab.click());
  assert.equal(document.querySelectorAll('[role="tabpanel"]')[3].hidden, false);
  await act(async () => removeDeveloper());
  assert.equal(document.querySelectorAll('[role="tab"]').length, 3);
  assert.equal(document.querySelectorAll('[role="tabpanel"]')[2].hidden, false);
});
