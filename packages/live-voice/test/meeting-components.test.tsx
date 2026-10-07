// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import {
  MeetingToggle,
  MeetingBars,
} from '../src/modules/conversation/components/MeetingControls.js';
import { LiveVoiceTranslationProvider } from '../src/app/client/i18n/index.js';
test('shared audio toggle starts directly and only renders its own active bar without explanatory text', async (t) => {
  const dom = new JSDOM('<div id="root"></div>', { pretendToBeVisual: true });
  const old = { window: globalThis.window, document: globalThis.document };
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    IS_REACT_ACT_ENVIRONMENT: true,
  });
  const root = createRoot(document.getElementById('root'));
  t.after(async () => {
    await act(async () => root.unmount());
    dom.window.close();
    Object.assign(globalThis, old);
    delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  });
  const listeners = new Set();
  let snapshot = { shared: {}, microphone: { listening: true } };
  let starts = 0;
  const meeting = {
    jobs: new Map(),
    subscribe: (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    getSnapshot: () => snapshot,
    toggleTimestamps: () => {
      snapshot = { ...snapshot, timestamps: !snapshot.timestamps };
      listeners.forEach((fn) => fn());
    },
    stop: (source) => {
      assert.equal(source, 'shared');
      snapshot = { ...snapshot, shared: {} };
      listeners.forEach((fn) => fn());
    },
    patch: () => {},
  };
  await act(async () =>
    root.render(
      <LiveVoiceTranslationProvider>
        <MeetingToggle
          meeting={meeting}
          onToggle={() => {
            starts++;
            snapshot = { ...snapshot, shared: { listening: true } };
            listeners.forEach((fn) => fn());
          }}
        />
        <MeetingBars meeting={meeting} />
      </LiveVoiceTranslationProvider>,
    ),
  );
  assert.equal(document.querySelectorAll('[role="group"]').length, 0);
  await act(async () => document.querySelector('button[aria-label="Shared audio"]').click());
  assert.equal(starts, 1);
  assert.equal(document.querySelectorAll('[role="group"]').length, 1);
  assert.equal(document.querySelector('p'), null);
  assert.equal(document.querySelector('[role="status"]').textContent, 'Listening');
  const clock = document.querySelector('[aria-label="Transcript timestamps"]');
  assert.equal(clock.getAttribute('data-toggle-active'), 'false');
  assert.equal(clock.textContent, 'Timestamp');
  await act(async () => clock.click());
  assert.equal(clock.getAttribute('data-toggle-active'), 'true');
  await act(async () => document.querySelector('[role="group"] button').click());
  assert.equal(document.querySelectorAll('[role="group"]').length, 0);
  assert.equal(snapshot.microphone.listening, true);
});
