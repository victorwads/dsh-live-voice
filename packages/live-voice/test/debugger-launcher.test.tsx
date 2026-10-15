// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { DebuggerLauncher } from '../src/modules/settings/components/DebuggerLauncher.tsx';
import { createDebuggerInstall } from '../src/modules/settings/services/debuggerInstall.ts';
import { CURRENT_VERSION } from '../src/modules/settings/services/releases.ts';
import { publishDeveloperExtension } from '../src/modules/core/developerExtension.ts';
import { RecordingSettings } from '../src/modules/settings/sections/recognition/RecordingSettings.tsx';
import { defaultSettings } from '../src/modules/core/settings.ts';
import { createLiveVoiceSettings } from '../src/modules/settings/components/createLiveVoiceSettings.tsx';
import { defaultSettings } from '../src/modules/core/settings.ts';
import { withAppLanguage, liveVoiceDictionaries } from '../src/app/client/i18n/index.ts';

async function setup(t) {
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://dsh.local/' });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  // jsdom has no top-layer/focus implementation. Native dialog behavior is browser-owned.
  dom.window.HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
    this.querySelector('button')?.focus();
  };
  dom.window.HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
  const root = createRoot(document.getElementById('root'));
  t.after(async () => {
    await act(async () => root.unmount());
    dom.window.close();
    delete globalThis.window;
    delete globalThis.document;
    delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  });
  return root;
}
function localized(Component, locale) {
  const snapshot = { active: locale, revision: 0 };
  return withAppLanguage(Component, { subscribe: () => () => {}, getSnapshot: () => snapshot });
}

test('settings factory forwards the application installer and keeps inactive errors out of closed dialog', async (t) => {
  const root = await setup(t);
  let inventories = 0;
  const installer = createDebuggerInstall({
    manager: () => ({
      listBundles: async () => {
        inventories++;
        return { ok: true, value: [] };
      },
      installBundle: async () => ({ ok: true, value: {} }),
    }),
    isBusy: () => false,
  });
  const snapshot = { settings: defaultSettings, capabilities: {}, errors: {} };
  const controller = {
    subscribe: () => () => {},
    getSnapshot: () => snapshot,
    updateSettings: async () => {},
  };
  const Panel = localized(createLiveVoiceSettings(), 'en');
  await act(async () => root.render(<Panel controller={controller} debuggerInstall={installer} />));
  assert.equal(document.querySelector('[role=alert]'), null);
  const button = document.querySelector('.dlv-diagnostics-button');
  await act(async () => button.click());
  const install = [...document.querySelectorAll('dialog button')].find(
    (button) => button.textContent === 'Install now',
  );
  assert.ok(install);
  await act(async () => install.click());
  assert.equal(inventories, 1);
  assert.equal(installer.getSnapshot().phase, 'confirm');
});

test('all six locales expose an accessible missing-debugger dialog, explicit confirmation, Escape and focus return', async (t) => {
  const root = await setup(t);
  for (const locale of Object.keys(liveVoiceDictionaries)) {
    let calls = 0;
    const installer = createDebuggerInstall({
      manager: () => ({
        listBundles: async () => ({ ok: true, value: [] }),
        installBundle: async () => {
          calls++;
          return {
            ok: true,
            value: {
              application: 'restart-required',
              bundle: 'dsh-live-voice-debugger',
              version: CURRENT_VERSION,
            },
          };
        },
      }),
    });
    const Launcher = localized(DebuggerLauncher, locale);
    await act(async () => root.render(<Launcher installer={installer} />));
    const copy = liveVoiceDictionaries[locale];
    const trigger = document.querySelector('.dlv-diagnostics-button');
    assert.equal(trigger.textContent, copy['dsh-live-voice.debugger.label']);
    assert.equal(calls, 0);
    await act(async () => trigger.click());
    const dialog = document.querySelector('dialog');
    assert.equal(dialog.open, true);
    assert.equal(
      document.getElementById(dialog.getAttribute('aria-labelledby')).textContent,
      copy['dsh-live-voice.debugger.title'],
    );
    assert.equal(
      document.getElementById(dialog.getAttribute('aria-describedby')).textContent,
      copy['dsh-live-voice.debugger.description'],
    );
    await act(async () => dialog.querySelector('button').click());
    assert.equal(installer.getSnapshot().phase, 'confirm');
    assert.equal(calls, 0);
    const confirm = dialog.querySelector('button');
    assert.ok(
      document
        .getElementById(confirm.getAttribute('aria-describedby'))
        .textContent.includes(CURRENT_VERSION),
    );
    await act(async () => dialog.dispatchEvent(new window.Event('cancel', { cancelable: true })));
    assert.equal(dialog.open, false);
    assert.equal(document.activeElement, trigger);
    assert.equal(installer.getSnapshot().phase, 'idle');
    await act(async () => trigger.click());
    await act(async () => dialog.querySelector('button').click());
    await act(async () => dialog.querySelector('button').click());
    assert.equal(calls, 1);
    assert.equal(installer.getSnapshot().phase, 'restart');
    assert.equal(dialog.querySelectorAll('button').length, 1, 'restart never offers reinstall');
    assert.equal(
      dialog.querySelector('[role="status"]').textContent,
      copy['dsh-live-voice.debugger.restart'].replace('{version}', CURRENT_VERSION),
    );
    await act(async () => root.render(null));
  }
});

test('applied install waits for real extension registration, survives remount and becomes ready without reload', async (t) => {
  const root = await setup(t);
  let calls = 0;
  let settle;
  const installer = createDebuggerInstall({
    manager: () => ({
      listBundles: async () => ({ ok: true, value: [] }),
      installBundle: () => {
        calls++;
        return new Promise((resolve) => {
          settle = resolve;
        });
      },
    }),
  });
  const Launcher = localized(DebuggerLauncher, 'en');
  const render = () => root.render(<Launcher installer={installer} />);
  await act(async () => render());
  await act(async () => document.querySelector('.dlv-diagnostics-button').click());
  await act(async () => document.querySelector('dialog button').click());
  await act(async () => document.querySelector('dialog button').click());
  await act(async () => document.querySelector('dialog button').click()); // close while installing
  await act(async () => root.render(null));
  await act(async () => render());
  await act(async () => document.querySelector('.dlv-diagnostics-button').click());
  assert.equal(calls, 1);
  assert.equal(document.querySelectorAll('dialog button').length, 1);
  await act(async () =>
    settle({
      ok: true,
      value: {
        application: 'applied',
        bundle: 'dsh-live-voice-debugger',
        version: CURRENT_VERSION,
      },
    }),
  );
  assert.match(
    document.querySelector('dialog [role="status"]').textContent,
    /Waiting for diagnostics to register/,
  );
  let remove;
  await act(async () => {
    remove = publishDeveloperExtension(window, {
      version: 1,
      label: () => 'Debugger',
      component: () => <button data-debugger>Diagnostics ready</button>,
    });
  });
  assert.ok(document.querySelector('[data-debugger]'));
  assert.match(
    document.querySelector('dialog [role="status"]').textContent,
    /Diagnostics are ready/,
  );
  await act(async () => document.querySelector('dialog button').click());
  assert.equal(document.activeElement, document.querySelector('[data-debugger]'));
  await act(async () => remove());
  assert.ok(document.querySelector('.dlv-diagnostics-button'));
  assert.equal(calls, 1);
});

test('unavailable manager stays explanatory and recorded-session dependency help is a section heading Hint', async (t) => {
  const root = await setup(t);
  const Launcher = localized(DebuggerLauncher, 'en');
  await act(async () => root.render(<Launcher />));
  await act(async () => document.querySelector('.dlv-diagnostics-button').click());
  assert.match(document.querySelector('dialog [role="alert"]').textContent, /DSH plugin manager/);
  assert.equal(document.querySelectorAll('dialog button').length, 1);
  for (const locale of Object.keys(liveVoiceDictionaries)) {
    const Recording = localized(RecordingSettings, locale);
    await act(async () =>
      root.render(<Recording settings={defaultSettings} updateSettings={() => {}} />),
    );
    const section = document.querySelector('.dlv-settings-section');
    const hint = section.querySelector('summary [role="tooltip"]');
    assert.equal(
      hint.textContent,
      liveVoiceDictionaries[locale]['dsh-live-voice.recording.managementHelp'],
    );
    assert.equal(hint.hidden, true);
    await act(async () => section.querySelector('summary .dlv-hint-trigger').click());
    assert.equal(hint.hidden, false);
    assert.equal(section.open, false, 'help does not expand collapsed recording controls');
    await act(async () => root.render(null));
  }
});
