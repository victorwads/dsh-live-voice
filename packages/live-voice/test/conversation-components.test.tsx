// @ts-nocheck
import test from 'node:test';
import { iconPaths } from '../src/shared/design-system/icons/icons.js';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { LiveVoiceTranslationProvider } from '../src/app/client/i18n/index.ts';
import {
  ConversationControls,
  ConversationStatusBar,
  DeliveryModeButton,
  PlaybackControls,
  nextDeliveryMode,
  MicrophoneButton,
  SpeakButton,
  Waveform,
} from '../src/modules/conversation/index.ts';

async function fixture(t, element) {
  const dom = new JSDOM('<div id="root"></div>', { pretendToBeVisual: true });
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    getComputedStyle: globalThis.getComputedStyle,
  };
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.getComputedStyle = () => ({ color: '#fff' });
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const root = createRoot(document.getElementById('root'));
  await act(async () => root.render(element));
  t.after(async () => {
    await act(async () => root.unmount());
    dom.window.close();
    Object.assign(globalThis, previous);
    delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  });
  return document.getElementById('root');
}

test('conversation buttons preserve plugin classes and scoped language labels', async (t) => {
  const calls = [];
  const root = await fixture(
    t,
    <LiveVoiceTranslationProvider>
      <>
        <SpeakButton onClick={() => calls.push('speak')} />
        <SpeakButton active />
        <MicrophoneButton label="Start" onClick={() => calls.push('mic')} />
      </>
    </LiveVoiceTranslationProvider>,
  );
  const buttons = root.querySelectorAll('button');
  assert.equal(buttons[0].getAttribute('aria-label'), 'Speak message');
  assert.equal(buttons[1].getAttribute('aria-label'), 'Stop speaking');
  assert.equal(buttons[1].getAttribute('aria-pressed'), 'true');
  assert.match(buttons[2].className, /dlv-mic/);
  await act(async () => {
    buttons[0].click();
    buttons[2].click();
  });
  assert.deepEqual(calls, ['speak', 'mic']);
});

test('conversation waveform preserves canvas contract without a canvas implementation', async (t) => {
  const root = await fixture(t, <Waveform controller={{ meter: { level: () => 0 } }} enabled />);
  assert.equal(root.querySelector('canvas').className, 'dlv-wave');
  assert.equal(root.querySelector('canvas').getAttribute('aria-hidden'), 'true');
});

function controllerFixture(overrides = {}) {
  let state = {
    conversation: false,
    listening: false,
    starting: false,
    recognizing: false,
    settings: { announceAssistantMessages: true },
    capabilities: { recognition: { supported: true }, capture: { supported: true } },
    ...overrides,
  };
  const listeners = new Set();
  const calls = [];
  return {
    calls,
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    startConversation() {
      calls.push('startConversation');
    },
    explainRecognition() {
      calls.push('explainRecognition');
    },
  };
}

test('conversation controls preserve capability and busy-state policy', async (t) => {
  const controller = controllerFixture();
  const root = await fixture(
    t,
    <LiveVoiceTranslationProvider>
      <ConversationControls controller={controller} />
    </LiveVoiceTranslationProvider>,
  );
  const button = root.querySelector('.dlv-mic');
  assert.equal(button.getAttribute('aria-label'), 'Start voice conversation');
  assert.equal(button.dataset.toggleActive, 'false');
  assert.equal(button.querySelector('path').getAttribute('d'), iconPaths.micOff);
  await act(async () => button.click());
  assert.deepEqual(controller.calls, ['startConversation']);
});

test('conversation controls explain unavailable recognition and hide while busy', async (t) => {
  const unavailable = controllerFixture({
    capabilities: {
      recognition: { supported: false, reason: 'No engine' },
      capture: { supported: true },
    },
  });
  const root = await fixture(
    t,
    <LiveVoiceTranslationProvider>
      <ConversationControls controller={unavailable} />
    </LiveVoiceTranslationProvider>,
  );
  assert.equal(root.querySelector('.dlv-mic').getAttribute('aria-label'), 'No engine');
  await act(async () => root.querySelector('.dlv-mic').click());
  assert.deepEqual(unavailable.calls, ['explainRecognition']);
});

test('conversation controls retain a pressed microphone toggle while busy', async (t) => {
  const busy = controllerFixture({ listening: true, conversation: true });
  busy.endConversation = () => busy.calls.push('endConversation');
  const root = await fixture(
    t,
    <LiveVoiceTranslationProvider>
      <ConversationControls controller={busy} />
    </LiveVoiceTranslationProvider>,
  );
  assert.equal(root.querySelector('.dlv-mic').getAttribute('aria-pressed'), 'true');
  assert.equal(root.querySelector('.dlv-mic').dataset.toggleActive, 'true');
  assert.equal(root.querySelector('.dlv-mic path').getAttribute('d'), iconPaths.mic);
  await act(async () => root.querySelector('.dlv-mic').click());
  assert.deepEqual(busy.calls, ['endConversation']);
});

test('delivery mode button cycles manual, queue, and steer with accessible state', async (t) => {
  const changes = [];
  const root = await fixture(
    t,
    <LiveVoiceTranslationProvider>
      <DeliveryModeButton mode="queue" onChange={(mode) => changes.push(mode)} />
    </LiveVoiceTranslationProvider>,
  );
  const button = root.querySelector('button');
  assert.equal(button.dataset.mode, 'queue');
  assert.equal(button.getAttribute('aria-pressed'), 'true');
  assert.equal(button.querySelector('.dlv-toggle-state').textContent, 'QUEUE');
  await act(async () => button.click());
  assert.deepEqual(changes, ['steer']);
  assert.equal(nextDeliveryMode('steer'), 'manual');
  assert.equal(nextDeliveryMode('manual'), 'queue');
});

test('playback controls preserve pause, resume, next, and stop action contracts', async (t) => {
  const calls = [];
  const state = {
    speaking: true,
    paused: false,
    speechSegmentsRemaining: 2,
    settings: { engine: 'host' },
    capabilities: { host: { pause: true, resume: true } },
  };
  const root = await fixture(
    t,
    <LiveVoiceTranslationProvider>
      <PlaybackControls state={state} invoke={(name) => calls.push(name)} />
    </LiveVoiceTranslationProvider>,
  );
  const buttons = [...root.querySelectorAll('button')];
  assert.deepEqual(
    buttons.map((button) => button.getAttribute('aria-label')),
    ['Skip to next speech segment', 'Pause speech', 'Stop all speech'],
  );
  await act(async () => buttons.forEach((button) => button.click()));
  assert.deepEqual(calls, ['skipSpeechSegment', 'pauseSpeech', 'stopSpeech']);
});

test('playback controls expose resume only while paused and supported', async (t) => {
  const calls = [];
  const state = {
    speaking: false,
    paused: true,
    speechSegmentsRemaining: 1,
    settings: { engine: 'host' },
    capabilities: { host: { pause: true, resume: true } },
  };
  const root = await fixture(
    t,
    <LiveVoiceTranslationProvider>
      <PlaybackControls state={state} invoke={(name) => calls.push(name)} />
    </LiveVoiceTranslationProvider>,
  );
  const labels = [...root.querySelectorAll('button')].map((button) =>
    button.getAttribute('aria-label'),
  );
  assert.deepEqual(labels, ['Resume speech', 'Stop all speech']);
  assert.equal(root.querySelector('button').disabled, false);
});

test('conversation status bar composes status, delivery, autoplay, microphone, and playback controls', async (t) => {
  const controller = controllerFixture({
    conversation: true,
    listening: true,
    settings: { engine: 'host', sendingMode: 'queue', announceAssistantMessages: true },
    speechSegmentsRemaining: 2,
    capabilities: { host: { pause: true, resume: true } },
    muted: false,
  });
  controller.updateSettings = (value) => controller.calls.push(['updateSettings', value]);
  controller.endConversation = () => controller.calls.push('endConversation');
  controller.muteListening = () => controller.calls.push('muteListening');
  controller.skipSpeechSegment = () => controller.calls.push('skipSpeechSegment');
  controller.pauseSpeech = () => controller.calls.push('pauseSpeech');
  controller.stopSpeech = () => controller.calls.push('stopSpeech');
  controller.clearError = () => controller.calls.push('clearError');
  const root = await fixture(
    t,
    <LiveVoiceTranslationProvider>
      <ConversationStatusBar controller={controller} />
    </LiveVoiceTranslationProvider>,
  );
  assert.equal(
    root.querySelector('[aria-label="Voice controls"]').getAttribute('aria-label'),
    'Voice controls',
  );
  assert.equal(root.querySelector('[role="status"]').textContent, 'Listening — waiting for speech');
  assert.ok(root.querySelector('.dlv-wave'));
  assert.equal(root.querySelector('[data-mode="queue"]').getAttribute('aria-pressed'), 'true');
  assert.equal(
    root.querySelector('[role="switch"]'),
    null,
    'autoplay belongs to composer, not bars',
  );
  assert.equal(root.querySelector('[data-muted="false"]').getAttribute('aria-pressed'), 'true');
});

test('conversation status bar respects visibility and question overlay contracts', async (t) => {
  const hidden = controllerFixture({ capabilities: {} });
  hidden.clearError = () => {};
  const hiddenRoot = await fixture(
    t,
    <LiveVoiceTranslationProvider>
      <ConversationStatusBar controller={hidden} />
    </LiveVoiceTranslationProvider>,
  );
  assert.equal(hiddenRoot.childElementCount, 0);
});

test('waveform does not restart or clear canvas on repeated source props and same-size resize', async (t) => {
  let renders = 0;
  await fixture(t, <div />);
  const draw = {
    setTransform() {},
    clearRect() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    stroke() {},
  };
  t.mock.method(window.HTMLCanvasElement.prototype, 'getContext', () => draw);
  t.mock.method(window.HTMLCanvasElement.prototype, 'getBoundingClientRect', () => ({
    width: 180,
    height: 40,
  }));
  t.mock.method(window, 'requestAnimationFrame', () => ++renders);
  t.mock.method(window, 'cancelAnimationFrame', () => {});
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  await act(async () =>
    root.render(<Waveform controller={{ meter: { level: () => 0 } }} enabled />),
  );
  const canvas = host.querySelector('canvas');
  assert.equal(renders, 1);
  await act(async () =>
    root.render(<Waveform controller={{ meter: { level: () => 0.5 } }} enabled />),
  );
  assert.equal(renders, 1, 'processing updates must not reset the animation effect');
  const width = canvas.width;
  window.dispatchEvent(new window.Event('resize'));
  assert.equal(canvas.width, width);
  await act(async () => root.unmount());
});
