// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { withAppLanguage, liveVoiceDictionaries } from '../src/app/client/i18n/index.ts';
import { BrowserModelSettings } from '../src/modules/recognition/local/BrowserModelSettings.tsx';
import { RecognitionEngineSettings } from '../src/modules/settings/sections/recognition/RecognitionEngineSettings.tsx';
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
    const Local = withAppLanguage(RecognitionEngineSettings, {
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
    const modelSelector =
      document.querySelector('select[aria-label="' + strings[key + 'model'] + '"]') ??
      [...document.querySelectorAll('select')].find((select) => select.value === 'whisper-small');
    assert.equal(modelSelector.value, 'whisper-small');
    assert.ok(
      [...modelSelector.options]
        .find((o) => o.value === 'whisper-small')
        .textContent.includes('(' + strings[key + 'recommended'] + ')'),
    );
    const engineSelect = [...document.querySelectorAll('select')].find(
      (select) => select.value === 'whisper-browser',
    );
    assert.equal(
      [...engineSelect.options].find((o) => o.value === 'whisper-browser').textContent,
      strings[key + 'whisperLabel'],
    );
    assert.ok(strings[key + 'whisperLabel'].includes('(' + strings[key + 'recommended'] + ')'));
    for (const option of engineSelect.options) {
      assert.ok(option.textContent.includes(' · '));
      assert.ok(!option.textContent.includes('—'));
    }
    for (const suffix of ['speak.browser.label', 'speak.macos.label', 'speak.qwen.label']) {
      assert.ok(strings['dsh-live-voice.' + suffix].includes(' · '));
      assert.ok(!strings['dsh-live-voice.' + suffix].includes('—'));
    }
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
    assert.deepEqual(calls.at(-1), ['download', 'whisper-small']);
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
    const runtimeSelector = [...document.querySelectorAll('select')].find(
      (select) => select.value === 'wasm',
    );
    assert.equal(runtimeSelector.value, 'wasm');
    assert.equal(runtimeSelector.options.length, 2);
    const turboSelector = [...document.querySelectorAll('select')].find(
      (select) => select.value === 'whisper-large-v3-turbo',
    );
    assert.equal(turboSelector.value, 'whisper-large-v3-turbo');
    const turboDownload = [...document.querySelectorAll('button')].find(
      (button) => button.textContent === strings[key + 'download'],
    );
    assert.equal(turboDownload.disabled, false);
  }
});
