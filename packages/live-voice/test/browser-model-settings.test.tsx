// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { withAppLanguage, liveVoiceDictionaries } from '../src/app/client/i18n/index.ts';
import { BrowserModelSettings } from '../src/modules/recognition/local/BrowserModelSettings.tsx';
import { defaultSettings } from '../src/modules/core/settings.ts';
test('local model settings translate all six locales and require download consent; selecting models never downloads', async (t) => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://dsh.local/' });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const root = createRoot(document.getElementById('root'));
  t.after(async () => {
    await act(async () => root.unmount());
    dom.window.close();
    delete globalThis.window;
    delete globalThis.document;
    delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  });
  for (const locale of Object.keys(liveVoiceDictionaries)) {
    const calls = [];
    const snapshot = {
      models: { 'whisper-tiny': { phase: 'absent', loaded: 0, total: 122388197 } },
      gpu: 'available',
      storage: true,
      busy: false,
      availableBytes: 2e9,
    };
    const manager = {
      subscribe: () => () => {},
      getSnapshot: () => snapshot,
      refresh: async () => calls.push('refresh'),
      download: async (key) => calls.push(['download', key]),
      remove: async (key) => calls.push(['remove', key]),
    };
    const localeSnapshot = { active: locale, revision: 0 };
    const Local = withAppLanguage(BrowserModelSettings, {
      subscribe: () => () => {},
      getSnapshot: () => localeSnapshot,
    });
    await act(async () =>
      root.render(
        <Local
          key={locale}
          controller={{ localModels: manager }}
          settings={{ ...defaultSettings, recognitionEngine: 'whisper-browser' }}
          updateSettings={(next) => calls.push(next)}
        />,
      ),
    );
    const strings = liveVoiceDictionaries[locale],
      key = 'dsh-live-voice.recognition.local.';
    assert.ok(document.body.textContent.includes(strings[key + 'title']));
    assert.ok(document.body.textContent.includes(strings[key + 'phase.absent']));
    assert.equal(document.querySelector('[role=alert]'), null);
    const download = [...document.querySelectorAll('button')].find(
      (button) => button.textContent === strings[key + 'download'],
    );
    assert.ok(download);
    assert.equal(download.disabled, false);
    assert.ok(!calls.some((value) => Array.isArray(value) && value[0] === 'download'));
    await act(async () => download.click());
    assert.ok(document.querySelector('[role=group]'));
    assert.ok(!calls.some((value) => Array.isArray(value) && value[0] === 'download'));
    const confirm = [...document.querySelectorAll('button')].find(
      (button) => button.textContent === strings[key + 'confirm'],
    );
    await act(async () => confirm.click());
    assert.deepEqual(calls.at(-1), ['download', 'whisper-tiny']);
    await act(async () =>
      root.render(
        <Local
          key={locale}
          controller={{ localModels: manager }}
          settings={{
            ...defaultSettings,
            recognitionEngine: 'whisper-browser',
            browserWhisperModel: 'whisper-large-v3-turbo',
            browserAsrDevice: 'wasm',
          }}
          updateSettings={(next) => calls.push(next)}
        />,
      ),
    );
    assert.equal(document.body.textContent.includes(strings[key + 'error.f16_unavailable']), false);
    assert.ok(document.body.textContent.includes('Whisper large v3 turbo (q4)'));
    assert.ok(document.body.textContent.includes('Whisper medium (q4)'));
    assert.ok(document.body.textContent.includes('762 MB'));
    assert.equal(document.querySelectorAll('select')[1].value, 'wasm');
    assert.equal(document.querySelectorAll('select')[1].options.length, 2);
    const turboDownload = [...document.querySelectorAll('button')].find(
      (button) => button.textContent === strings[key + 'download'],
    );
    assert.equal(turboDownload.disabled, false);
  }
});
