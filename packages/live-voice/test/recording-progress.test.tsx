// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { recordingDuration } from '../src/modules/conversation/models/recordingDuration.ts';
import { RecognitionBar } from '../src/modules/conversation/components/RecognitionBar.tsx';
import { withAppLanguage } from '../src/app/client/i18n/index.ts';
import { RECORDING_KEY } from '../src/modules/recording/types.ts';

test('compact saved recording durations floor samples and keep unlimited hours', () => {
  for (const [seconds, expected] of [
    [0, '0s'],
    [4, '4s'],
    [5, '5s'],
    [59, '59s'],
    [60, '1m 0s'],
    [62, '1m 2s'],
    [3599, '59m 59s'],
    [3600, '1h 0m 0s'],
    [3905, '1h 5m 5s'],
    [1080305, '300h 5m 5s'],
  ]) {
    assert.equal(recordingDuration(seconds * 16000 + 15999, 16000), expected);
  }
  for (const [saved, rate] of [
    [NaN, 16000],
    [-1, 16000],
    [Infinity, 16000],
    [100, 0],
    [100, Infinity],
  ])
    assert.equal(recordingDuration(saved, rate), '0s');
});

test('saved frontier renders only timer before wave with accessible explanation', async (t) => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost' });
  const restore = [];
  for (const [key, value] of Object.entries({
    window: dom.window,
    document: dom.window.document,
    IS_REACT_ACT_ENVIRONMENT: true,
  })) {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
    restore.push(() =>
      descriptor ? Object.defineProperty(globalThis, key, descriptor) : delete globalThis[key],
    );
  }
  dom.window.HTMLCanvasElement.prototype.getContext = () => null;
  const callbacks = new Set();
  let session = {
    id: 'mic',
    storage: 'indexeddb',
    savedSamples: 64000,
    capturedSamples: 999999,
    sampleRate: 16000,
  };
  dom.window[RECORDING_KEY] = {
    get: async () => session,
    subscribe: (fn) => {
      callbacks.add(fn);
      return () => callbacks.delete(fn);
    },
  };
  const controller = { recordingId: () => 'mic', meter: { level: () => 0 } };
  const snapshot = { active: 'pt-BR', revision: 0 };
  const locale = { subscribe: () => () => {}, getSnapshot: () => snapshot };
  const Bar = withAppLanguage(RecognitionBar, locale);
  const root = createRoot(document.getElementById('root'));
  t.after(async () => {
    await act(async () => root.unmount());
    dom.window.close();
    for (const fn of restore) fn();
  });
  await act(async () =>
    root.render(
      <Bar
        controller={controller}
        listening={false}
        label="Microfone"
        status="Aguardando"
        leading={<button>Microfone</button>}
      />,
    ),
  );
  const badge = document.querySelector('.dlv-recording-progress');
  assert.equal(badge.textContent, '4s');
  assert.equal(badge.querySelector('[aria-hidden]'), null);
  assert.equal(badge.title, 'Áudio salvo até 4s');
  assert.equal(badge.getAttribute('aria-label'), 'Áudio salvo até 4s');
  assert.equal(badge.previousElementSibling.tagName, 'BUTTON');
  assert.ok(badge.nextElementSibling.matches('.dlv-wave'));
  assert.equal(document.querySelectorAll('[role=status]').length, 1);
  assert.equal(document.querySelector('[role=status]').textContent, 'Aguardando');
  await act(async () => {
    session = { ...session, savedSamples: 1080305 * 16000 };
    callbacks.forEach((fn) => fn());
  });
  assert.equal(badge.textContent, '300h 5m 5s');
  await act(async () => {
    session = { ...session, storage: 'memory' };
    callbacks.forEach((fn) => fn());
  });
  assert.equal(document.querySelector('.dlv-recording-progress'), null);
});
