// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { VoiceCoordinator } from '../../live-voice/src/modules/core/coordinator.ts';
import { WhisperHttpRecognitionEngine } from '../../live-voice/src/modules/recognition/engines/whisper/WhisperRecognitionEngine.ts';
import {
  DIAGNOSTIC_KEY,
  publishDiagnosticSource,
  readCoordinatorDiagnostics,
} from '../../live-voice/src/modules/core/diagnostics.ts';
import { createInspector } from '../src/inspector.ts';
import { DebuggerPanel } from '../src/DebuggerPanel.tsx';
import { copyFor, dictionaries } from '../src/locales.ts';
import { apply } from '../src/apply.tsx';
import { readDeveloperExtension } from '../../live-voice/src/modules/core/developerExtension.ts';

test('localizes plugin references in debugger copy', () => {
  for (const [locale, name] of Object.entries({
    'pt-BR': 'Voz ao Vivo',
    es: 'Voz en vivo',
    fr: 'Voix en direct',
    hi: 'लाइव वॉइस',
    zh: '实时语音',
  })) {
    assert.ok(dictionaries[locale].title.includes(name), locale);
    assert.ok(dictionaries[locale].waiting.includes(name), locale);
    for (const value of Object.values(dictionaries[locale]))
      assert.ok(!value.includes('Live Voice'), locale);
  }
});

function fixture(t) {
  let callbacks,
    draft = '';
  const coordinator = new VoiceCoordinator({
    recognition: {
      capability: async () => ({ supported: true }),
      start: async (options) => {
        callbacks = options;
      },
      stop: async () => {},
    },
    meter: {
      capability: async () => ({ supported: true }),
      start: async () => true,
      stop: async () => {},
      level: () => 0.25,
    },
    engines: { browser: { capability: async () => ({ supported: true }), stop: async () => {} } },
    composer: {
      getDraft: () => draft,
      setDraft: (text) => {
        draft = text;
      },
      submit() {},
    },
    settings: { mode: 'headphones', sendingMode: 'queue' },
  });
  const source = {
    version: 1,
    read: (options = {}) => ({
      sessions: { example: readCoordinatorDiagnostics(coordinator, options.includeContent) },
    }),
    subscribe: coordinator.subscribe,
  };
  t.after(() => coordinator.dispose());
  return {
    coordinator,
    source,
    activity: (active) => callbacks.onActivity(active),
    processing: (pending) => callbacks.onProcessingChange({ pending }),
    result: (text) => callbacks.onResult({ final: text }),
  };
}

test('reported DSH Enter behavior is visible without exposing private settings text', async (t) => {
  const f = fixture(t);
  const inspector = createInspector(f.source);
  t.after(() => inspector.dispose());
  for (const behavior of ['queue', 'steer']) {
    await f.coordinator.updateSettings({ dshBusyEnterBehavior: behavior });
    const settings = inspector.read().state.sessions.example.settings;
    assert.equal(settings.dshBusyEnterBehavior, behavior);
    assert.equal(typeof settings.voiceCommandSend, 'object');
  }
});

test('simulated recognition events expose real cross-domain transitions without leaking text', async (t) => {
  const f = fixture(t);
  const inspector = createInspector(f.source, () => 123, 8);
  t.after(() => inspector.dispose());
  await f.coordinator.startConversation();
  f.activity(true);
  assert.equal(inspector.read().state.sessions.example.vad.activity, true);
  f.processing(2);
  assert.equal(inspector.read().state.sessions.example.recognition.pendingTranscriptions, 2);
  f.activity(false);
  f.processing(0);
  f.result('Synthetic recognition phrase');
  const state = inspector.read().state.sessions.example;
  assert.equal(state.composer.characters, 28);
  assert.equal(state.delivery.countdownActive, true);
  assert.equal(JSON.stringify(inspector.read()).includes('Synthetic recognition phrase'), false);
  assert.equal(
    inspector.read(true).state.sessions.example.composer.draft,
    'Synthetic recognition phrase',
  );
  assert.ok(inspector.read().transitions.some((entry) => entry.module === 'delivery'));
  assert.ok(inspector.read().transitions.length <= 8);
  await f.coordinator.stopListening();
  assert.equal(inspector.read().state.sessions.example.delivery.countdownActive, false);
  assert.equal(inspector.read().state.sessions.example.capture.listening, false);
});

test('PCM chunks expose actual HTTP adapter VAD, buffered chunks and queued recognition', async (t) => {
  const processor = { connect() {}, disconnect() {} };
  const context = {
    sampleRate: 16000,
    destination: {},
    createScriptProcessor: () => processor,
    createGain: () => ({ gain: {}, connect() {}, disconnect() {} }),
  };
  const meter = { context, source: { connect() {}, disconnect() {} }, level: () => 0.2 };
  const engine = new WhisperHttpRecognitionEngine({
    meter,
    globals: { fetch: () => new Promise(() => {}) },
    voiceDetectionPreset: 'short',
  });
  await engine.start();
  t.after(() => engine.stop());
  const controller = {
    recognition: engine,
    meter,
    getSnapshot: () => ({ settings: { recognitionEngine: 'whisper-http' } }),
  };
  const emit = (value) =>
    processor.onaudioprocess({
      inputBuffer: { getChannelData: () => new Float32Array(4096).fill(value) },
    });
  emit(0.1);
  assert.equal(readCoordinatorDiagnostics(controller).chunker.containsSpeech, true);
  emit(0);
  assert.equal(readCoordinatorDiagnostics(controller).vad.silenceMs, 256);
  emit(0);
  assert.equal(readCoordinatorDiagnostics(controller).recognition.activeRequest, true);
  emit(0.1);
  emit(0);
  emit(0);
  const queue = readCoordinatorDiagnostics(controller).recognition.queue;
  assert.equal(queue.length, 1);
  assert.ok(queue[0].durationMs > 500);
  await engine.stop();
  assert.equal(readCoordinatorDiagnostics(controller).chunker.available, false);
});

test('diagnostic bridge tolerates replacement and old disposer cannot remove newer source', () => {
  const target = new EventTarget();
  const source = { version: 1, read: () => null, subscribe: () => () => {} };
  const removeOld = publishDiagnosticSource(target, source);
  const newer = { ...source };
  const removeNew = publishDiagnosticSource(target, newer);
  removeOld();
  assert.equal(target[DIAGNOSTIC_KEY], newer);
  removeNew();
  assert.equal(target[DIAGNOSTIC_KEY], undefined);
});

test('debugger catalogs have complete sorted keys and match DSH locales', () => {
  const keys = Object.keys(dictionaries.en);
  assert.deepEqual(keys, [...keys].sort());
  for (const locale of ['en', 'pt-BR', 'es', 'fr', 'hi', 'zh'])
    assert.deepEqual(Object.keys(dictionaries[locale]), keys);
  assert.equal(copyFor('pt-BR').activate, 'Abrir debugger em janela separada');
});

async function domFixture(t) {
  const dom = new JSDOM('<div id="root"></div>');
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    IS_REACT_ACT_ENVIRONMENT: globalThis.IS_REACT_ACT_ENVIRONMENT,
  };
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    IS_REACT_ACT_ENVIRONMENT: true,
  });
  t.after(() => {
    Object.assign(globalThis, previous);
    dom.window.close();
  });
  return dom;
}

test('floating panel updates at 100ms, waits for runtime and releases subscriptions on unmount', async (t) => {
  await domFixture(t);
  const root = createRoot(document.getElementById('root'));
  const timers = t.mock.timers;
  timers.enable({ apis: ['setInterval'] });
  await act(async () => root.render(<DebuggerPanel copy={copyFor()} onClose={() => {}} />));
  assert.match(document.body.textContent, /Waiting for a compatible/);
  let active = false,
    subscriptions = 0;
  window[DIAGNOSTIC_KEY] = {
    version: 1,
    read: () => ({
      sessions: {
        example: { capture: { listening: active }, speech: { queue: [{ characters: 12 }] } },
      },
    }),
    subscribe: () => {
      subscriptions++;
      return () => {
        subscriptions--;
      };
    },
  };
  await act(async () => timers.tick(100));
  assert.equal(subscriptions, 1);
  assert.match(document.body.textContent, /listeningfalse/);
  await act(async () =>
    [...document.querySelectorAll('button')]
      .find((button) => button.textContent === 'Pause events')
      .click(),
  );
  active = true;
  await act(async () => timers.tick(100));
  assert.equal(document.querySelectorAll('.dlvd-history > details').length, 0);
  await act(async () =>
    [...document.querySelectorAll('button')]
      .find((button) => button.textContent === 'Resume events')
      .click(),
  );
  await act(async () => timers.tick(100));
  assert.equal(document.querySelectorAll('.dlvd-history > details').length, 0);
  active = false;
  await act(async () => timers.tick(100));
  assert.equal(document.querySelectorAll('.dlvd-history > details').length, 1);
  await act(async () =>
    [...document.querySelectorAll('button')]
      .find((button) => button.textContent === 'Clear events')
      .click(),
  );
  assert.equal(document.querySelectorAll('.dlvd-history > details').length, 0);
  active = true;
  await act(async () => timers.tick(100));
  assert.match(document.body.textContent, /listeningtrue/);
  assert.match(document.body.textContent, /characters12/);
  const rate = document.querySelector('.dlvd-toolbar select');
  assert.equal(rate.value, '10');
  const historyCount = document.querySelectorAll('.dlvd-history > details').length;
  await act(async () => {
    rate.value = '1';
    rate.dispatchEvent(new window.Event('change', { bubbles: true }));
  });
  assert.equal(document.querySelectorAll('.dlvd-history > details').length, historyCount);
  active = false;
  await act(async () => timers.tick(100));
  assert.match(document.querySelector('.dlvd-state-pane').textContent, /listeningtrue/);
  await act(async () => timers.tick(900));
  assert.match(document.querySelector('.dlvd-state-pane').textContent, /listeningfalse/);
  const columns = document.querySelector('.dlvd-columns');
  assert.equal(columns.children.length, 2);
  assert.ok(columns.querySelector('.dlvd-state-pane .dlvd-scroll'));
  assert.ok(columns.querySelector('.dlvd-event-pane .dlvd-scroll'));
  assert.equal(columns.querySelector('.dlvd-state-pane select'), null);
  assert.ok(columns.querySelector('.dlvd-event-pane select'));
  await act(async () => root.unmount());
  assert.equal(subscriptions, 0);
});

test('optional plugin opens a separate window and keeps it after Settings unmount', async (t) => {
  await domFixture(t);
  const child = new JSDOM('<html><head></head><body></body></html>');
  let closed = false;
  Object.defineProperty(child.window, 'closed', { get: () => closed });
  child.window.close = () => {
    closed = true;
  };
  window.open = () => child.window;
  const disposers = [],
    registrations = [];
  const localeState = { active: 'en' };
  const ctx = {
    locale: {
      register: () => () => {},
      bind: () => (key) => copyFor()[key],
      subscribe: () => () => {},
      getSnapshot: () => localeState,
    },
    slots: {
      inject: (_, register) => register(),
      register: (meta, component) => registrations.push({ meta, component }),
    },
    effect: (effect) => {
      const dispose = effect();
      if (dispose) disposers.push(dispose);
    },
  };
  await act(async () => apply(ctx));
  assert.equal(registrations.length, 0);
  assert.equal(readDeveloperExtension().label(), 'Developer');
  assert.equal(document.querySelector('.dlvd-panel'), null);
  const root = createRoot(document.getElementById('root'));
  const Settings = readDeveloperExtension().component;
  await act(async () => root.render(<Settings />));
  window.open = () => null;
  await act(async () => document.querySelector('input').click());
  assert.match(document.querySelector('[role="alert"]').textContent, /blocked/);
  assert.equal(document.querySelector('input').checked, false);
  assert.equal(document.querySelector('.dlvd-panel'), null);
  window.open = () => child.window;
  await act(async () => document.querySelector('input').click());
  assert.equal(document.querySelector('.dlvd-panel'), null);
  assert.ok(child.window.document.querySelector('.dlvd-panel'));
  await act(async () => root.unmount());
  assert.equal(document.querySelector('.dlvd-panel'), null);
  assert.ok(child.window.document.querySelector('.dlvd-panel'));
  await act(async () =>
    child.window.document.querySelector('[aria-label="Close debugger"]').click(),
  );
  assert.equal(document.querySelector('.dlvd-panel'), null);
  await act(async () => {
    for (const dispose of disposers.reverse()) dispose();
  });
  assert.equal(document.querySelector('[data-plugin="dsh-live-voice-debugger"]'), null);
  assert.equal(readDeveloperExtension(), null);
  assert.equal(closed, true);
});
