// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { LiveVoiceTranslationProvider } from '../src/app/client/i18n/index.ts';
import { defaultSettings } from '../src/modules/core/settings.ts';
import { SilenceDetectionSettings } from '../src/modules/settings/sections/recognition/SilenceDetectionSettings.tsx';

function setup(t, available = true) {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ available }));
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://dsh.local/' });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const root = createRoot(document.getElementById('root'));
  const calls = [];
  t.after(async () => {
    await act(async () => root.unmount());
    dom.window.close();
    delete globalThis.window;
    delete globalThis.document;
    delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  });
  return {
    calls,
    render: async (settings) => {
      await act(async () =>
        root.render(
          <LiveVoiceTranslationProvider>
            <SilenceDetectionSettings
              settings={settings}
              updateSettings={(patch) => calls.push(patch)}
            />
          </LiveVoiceTranslationProvider>,
        ),
      );
      return document.querySelector('select');
    },
  };
}

test('missing or invalid detector settings show energy without opting in to Silero', async (t) => {
  const { render, calls } = setup(t);
  assert.equal(defaultSettings.voiceDetectionEngine, 'energy');
  for (const recognitionEngine of ['whisper-http', 'qwen-http']) {
    const legacySettings = { ...defaultSettings, recognitionEngine };
    delete legacySettings.voiceDetectionEngine;
    for (const settings of [
      legacySettings,
      { ...legacySettings, voiceDetectionEngine: undefined },
      { ...legacySettings, voiceDetectionEngine: null },
      { ...legacySettings, voiceDetectionEngine: '' },
      { ...legacySettings, voiceDetectionEngine: 'unknown-detector' },
      { ...legacySettings, voiceDetectionEngine: 'energy' },
    ]) {
      const select = await render(settings);
      assert.ok(select);
      assert.equal(select.value, 'energy');
      assert.equal(select.querySelector('option[value="silero"]').selected, false);
      assert.deepEqual(calls, []);
    }
  }
});

test('only an explicit detector selection sends the Silero settings patch', async (t) => {
  const { render, calls } = setup(t);
  for (const recognitionEngine of ['whisper-http', 'qwen-http']) {
    calls.length = 0;
    const select = await render({ ...defaultSettings, recognitionEngine });
    assert.equal(select.value, 'energy');
    assert.deepEqual(calls, []);
    await act(async () => {
      select.value = 'silero';
      select.dispatchEvent(new window.Event('change', { bubbles: true }));
    });
    assert.deepEqual(calls, [{ voiceDetectionEngine: 'silero' }]);
  }
});

test('a saved Silero selection is shown without writing settings on render', async (t) => {
  const { render, calls } = setup(t);
  for (const recognitionEngine of ['whisper-http', 'qwen-http']) {
    const select = await render({
      ...defaultSettings,
      recognitionEngine,
      voiceDetectionEngine: 'silero',
    });
    assert.ok(select);
    assert.equal(select.value, 'silero');
    assert.equal(select.querySelector('option[value="silero"]').selected, true);
    assert.deepEqual(calls, []);
  }
});

test('missing assets disable only Silero and preserve the energy selector', async (t) => {
  const { render, calls } = setup(t, false);
  const select = await render({
    ...defaultSettings,
    recognitionEngine: 'whisper-http',
    voiceDetectionEngine: 'silero',
  });
  assert.ok(select);
  assert.equal(select.disabled, false);
  assert.equal(select.querySelector('option[value="energy"]').disabled, false);
  assert.equal(select.querySelector('option[value="silero"]').disabled, true);
  assert.ok(document.querySelector('[role="radiogroup"]'));
  assert.deepEqual(calls, []);
});

test('future non-Browser engines retain the silence detector section', async (t) => {
  const { render } = setup(t);
  const select = await render({ ...defaultSettings, recognitionEngine: 'future-engine' });
  assert.ok(select);
  assert.ok(document.querySelector('[role="radiogroup"]'));
});

test('Browser recognition hides plugin silence detection even with saved Silero', async (t) => {
  const { render, calls } = setup(t);
  await render({
    ...defaultSettings,
    recognitionEngine: 'whisper-http',
    voiceDetectionEngine: 'silero',
  });
  for (const voiceDetectionEngine of ['energy', 'silero', undefined]) {
    const select = await render({
      ...defaultSettings,
      recognitionEngine: 'browser',
      voiceDetectionEngine,
    });
    assert.equal(select, null);
    assert.equal(document.getElementById('root').childElementCount, 0);
    assert.deepEqual(calls, []);
  }
});
