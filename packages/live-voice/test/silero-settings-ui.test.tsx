// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { LiveVoiceTranslationProvider } from '../src/app/client/i18n/index.ts';
import { defaultSettings } from '../src/modules/core/settings.ts';
import { appDictionaries } from '../src/app/client/i18n/catalogs/index.ts';
import { SilenceDetectionSettings } from '../src/modules/settings/sections/recognition/SilenceDetectionSettings.tsx';

test('every UI locale explicitly labels both numeric pauses and custom paragraph help', () => {
  const prefix = 'dsh-live-voice.recognition.silenceDetection.';
  assert.deepEqual(Object.keys(appDictionaries).sort(), ['en', 'es', 'fr', 'hi', 'pt-BR', 'zh']);
  for (const [locale, dictionary] of Object.entries(appDictionaries)) {
    for (const key of [
      'chunkPause',
      'customParagraphHelp',
      'customParagraphLabel',
      'paragraphPause',
    ])
      assert.ok(dictionary[prefix + key]?.trim(), locale + ': ' + key);
    assert.match(dictionary[prefix + 'chunkPause'], /{milliseconds}/);
    assert.match(dictionary[prefix + 'paragraphPause'], /{milliseconds}/);
    assert.match(dictionary[prefix + 'duration'], /{milliseconds}/);
    assert.match(dictionary[prefix + 'duration'], /{paragraphMilliseconds}/);
    assert.notEqual(
      dictionary[prefix + 'customLabel'],
      dictionary[prefix + 'customParagraphLabel'],
    );
    assert.match(dictionary[prefix + 'customParagraphHelp'], /100/);
    assert.match(dictionary[prefix + 'customParagraphHelp'], /30/);
  }
});

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

test('VAD fields use compact paired rows with accessible help instead of inline paragraphs', async (t) => {
  const { render } = setup(t);
  await render({ ...defaultSettings, recognitionEngine: 'whisper-http' });
  const pairs = [...document.querySelectorAll('.dlv-field-pair')];
  assert.equal(pairs.length, 2);
  assert.equal(pairs[0].querySelectorAll('select').length, 1);
  assert.equal(pairs[0].querySelectorAll('input[type=number]').length, 1);
  assert.equal(pairs[1].querySelectorAll('input[type=number]').length, 2);
  assert.equal(document.querySelectorAll('.dlv-section-content > small').length, 0);
  assert.equal(document.querySelectorAll('.dlv-hint-trigger').length, 8);
  for (const input of document.querySelectorAll('input[type=number]'))
    assert.ok(input.labels.length);
});

test('preset cards show both numeric pauses and keep descriptions in tooltips', async (t) => {
  const { render, calls } = setup(t);
  await render({ ...defaultSettings, recognitionEngine: 'whisper-http' });
  assert.match(document.querySelector('summary').textContent, /Silence detection and paragraphs/);
  const cards = [...document.querySelectorAll('.dlv-preset')];
  for (const [index, silence, paragraph] of [
    [0, 400, 2000],
    [1, 1000, 3000],
    [2, 2000, 4000],
    [3, 1000, 3000],
  ]) {
    const lines = [...cards[index].querySelectorAll('small')].map((line) => line.textContent);
    assert.deepEqual(lines, [
      'Before transcribing: ' + silence + ' ms',
      'New paragraph: ' + paragraph + ' ms',
    ]);
    assert.ok(cards[index].querySelector('.dlv-hint-trigger'));
    assert.equal(cards[index].querySelector('[role="tooltip"]').hidden, true);
  }
  assert.equal(
    document.querySelector('.dlv-vad-summary').textContent,
    'Before transcribing: 400 ms · New paragraph: 2000 ms',
  );
  const help = cards[0].querySelector('.dlv-hint-trigger');
  await act(async () => help.dispatchEvent(new window.MouseEvent('click', { bubbles: true })));
  assert.equal(cards[0].querySelector('[role="tooltip"]').hidden, false);
  assert.match(cards[0].querySelector('[role="tooltip"]').textContent, /Transcribe quickly/);
  assert.deepEqual(calls, []);
});

test('custom chunk and paragraph fields commit independently on blur and reject unsafe values', async (t) => {
  const { render, calls } = setup(t);
  const settings = {
    ...defaultSettings,
    recognitionEngine: 'qwen-http',
    voiceDetectionPreset: 'custom',
    voiceDetectionCustomSilenceMs: 1800,
    voiceDetectionCustomParagraphMs: 12000,
  };
  await render(settings);
  const pairs = [...document.querySelectorAll('.dlv-field-pair')];
  assert.equal(pairs.length, 3);
  const [chunk, paragraph] = pairs[2].querySelectorAll('input[type=number]');
  assert.equal(chunk.value, '1800');
  assert.equal(paragraph.value, '12000');
  assert.equal(chunk.min, '100');
  assert.equal(chunk.max, '10000');
  assert.equal(paragraph.min, '100');
  assert.equal(paragraph.max, '30000');
  for (const field of [chunk, paragraph]) {
    assert.equal(field.step, '1');
    assert.ok(field.labels.length);
    assert.ok(field.closest('.dlv-form-field').querySelector('.dlv-hint-trigger'));
  }
  assert.equal(
    document.querySelector('.dlv-vad-summary').textContent,
    'Before transcribing: 1800 ms · New paragraph: 12000 ms',
  );
  const enter = async (input, raw) =>
    act(async () => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(
        input,
        raw,
      );
      input.dispatchEvent(new window.Event('input', { bubbles: true }));
    });
  const blur = async (input) =>
    act(async () => input.dispatchEvent(new window.FocusEvent('focusout', { bubbles: true })));
  await enter(paragraph, '100');
  assert.deepEqual(calls, []);
  await blur(paragraph);
  assert.deepEqual(calls, [{ voiceDetectionCustomParagraphMs: 100 }]);
  await enter(paragraph, '30000');
  await blur(paragraph);
  assert.deepEqual(calls.at(-1), { voiceDetectionCustomParagraphMs: 30000 });
  await enter(chunk, '400');
  await blur(chunk);
  assert.deepEqual(calls.at(-1), { voiceDetectionCustomSilenceMs: 400 });
  calls.length = 0;
  for (const raw of ['', '99', '30001', '3000.5']) {
    await enter(paragraph, raw);
    await blur(paragraph);
    assert.equal(paragraph.value, '12000');
    assert.deepEqual(calls, []);
  }
  await act(async () => document.querySelector('input[type=radio][value=natural]').click());
  assert.deepEqual(calls, [{ voiceDetectionPreset: 'natural' }]);
  await render({ ...settings, voiceDetectionPreset: 'natural' });
  assert.equal(document.querySelectorAll('.dlv-field-pair').length, 2);
  assert.equal(
    document.querySelector('.dlv-vad-summary').textContent,
    'Before transcribing: 1000 ms · New paragraph: 3000 ms',
  );
  await render(settings);
  assert.deepEqual(
    [...document.querySelectorAll('.dlv-field-pair')[2].querySelectorAll('input')].map(
      (input) => input.value,
    ),
    ['1800', '12000'],
  );
});

test('missing or invalid detector settings show Silero without overwriting explicit energy', async (t) => {
  const { render, calls } = setup(t);
  assert.equal(defaultSettings.voiceDetectionEngine, 'silero');
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
      assert.equal(select.value, settings.voiceDetectionEngine === 'energy' ? 'energy' : 'silero');
      assert.deepEqual(calls, []);
    }
  }
});

test('only an explicit detector selection sends the Silero settings patch', async (t) => {
  const { render, calls } = setup(t);
  for (const recognitionEngine of ['whisper-http', 'qwen-http']) {
    calls.length = 0;
    const select = await render({
      ...defaultSettings,
      recognitionEngine,
      voiceDetectionEngine: 'energy',
    });
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
