// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { createComponents } from '../src/client/components.ts';
test('mounted voice UI exposes controls, distinct states, and capability failures', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost' });
  const previous = { window: globalThis.window, document: globalThis.document };
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  dom.window.HTMLCanvasElement.prototype.getContext = () => null;
  const callbacks = new Set();
  const calls = [];
  let state = {
    conversation: false,
    listening: false,
    recognizing: false,
    starting: false,
    speaking: false,
    paused: false,
    settings: {
      engine: 'browser',
      recognitionEngine: 'browser',
      recognitionProcessLocally: true,
      recognitionAutoInstall: true,
      voiceDetectionPreset: 'natural',
      recognitionMaxUtteranceSeconds: 60,
      lang: 'pt-BR',
      mode: 'speaker',
      rate: 1,
    },
    capabilities: {
      browser: { supported: true, pause: true, resume: true },
      say: { supported: false },
      recognition: { supported: true },
      capture: { supported: true, permission: 'granted' },
    },
  };
  const controller = {
    subscribe: (cb) => {
      callbacks.add(cb);
      return () => callbacks.delete(cb);
    },
    getSnapshot: () => state,
    meter: { level: () => 0 },
    startConversation: () => calls.push('conversation'),
    endConversation: () => calls.push('end'),
    stopSpeech: () => calls.push('stop'),
    resumeSpeech: () => calls.push('resume'),
    speak: (text) => calls.push(['speak', text]),
    updateSettings: (value) => {
      calls.push(['settings', value]);
      state = { ...state, settings: { ...state.settings, ...value } };
      callbacks.forEach((cb) => cb());
    },
    clearError: () => calls.push('clear'),
  };
  const { MicrophoneButtons, RecordingBar, SettingsPanel } = createComponents(React);
  const root = createRoot(document.getElementById('root'));
  const click = (label) => document.querySelector('[aria-label="' + label + '"]').click();
  try {
    await act(async () =>
      root.render(
        React.createElement(
          React.Fragment,
          null,
          React.createElement(MicrophoneButtons, { controller }),
          React.createElement(RecordingBar, { controller }),
          React.createElement(SettingsPanel, { controller, onClose: () => calls.push('close') }),
        ),
      ),
    );
    const microphoneButtons = document.querySelectorAll('.dlv-mic');
    assert.equal(microphoneButtons.length, 1, 'only the conversation launcher is shown');
    assert.equal(microphoneButtons[0].getAttribute('aria-label'), 'Start voice conversation');
    assert.equal(
      microphoneButtons[0].querySelector('path').getAttribute('d'),
      'M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0V5M6 10v2a6 6 0 0 0 12 0v-2M12 18v4M8 22h8',
      'conversation launcher uses the microphone icon',
    );
    await act(async () => click('Start voice conversation'));
    assert.deepEqual(calls, ['conversation']);
    assert.equal(document.querySelector('[aria-label="Voice controls"]'), null);
    assert.equal(document.querySelector('option[value=say]').disabled, true);
    const tabs = [...document.querySelectorAll('[role=tab]')];
    assert.deepEqual(
      tabs.map((tab) => tab.textContent),
      ['Conversation', 'Speech', 'Speech recognition'],
    );
    assert.deepEqual(
      tabs.map((tab) => tab.getAttribute('aria-selected')),
      ['true', 'false', 'false'],
      'Conversation is the initial settings tab',
    );
    const panels = [...document.querySelectorAll('[role=tabpanel]')];
    assert.equal(panels.length, 3);
    assert.deepEqual(
      panels.map((panel) => panel.hidden),
      [true, true, false],
      'only the Conversation panel is visible initially',
    );
    const conversation = panels.find((panel) => panel.id.endsWith('-panel-conversation'));
    assert.equal(conversation.hidden, false);
    assert.match(conversation.textContent, /Automatically speak new assistant messages/);
    assert.match(conversation.textContent, /Stop assistant speech when I send a message/);
    assert.match(conversation.textContent, /does not stop the assistant audio/);
    assert.match(conversation.textContent, /Assistant response delay/);
    assert.match(conversation.textContent, /continuous silence/);
    assert.match(conversation.textContent, /Sending mode/);
    assert.match(conversation.textContent, /Gated listening releases the microphone/);
    await act(async () =>
      tabs[0].dispatchEvent(
        new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
      ),
    );
    assert.equal(tabs[1].getAttribute('aria-selected'), 'true');
    assert.equal(document.getElementById(tabs[1].getAttribute('aria-controls')).hidden, false);
    const speechPanel = document.getElementById(tabs[1].getAttribute('aria-controls'));
    assert.ok(speechPanel.textContent.includes('Test selected speech output'));
    assert.ok(speechPanel.textContent.includes('Refresh available engines'));
    assert.equal(conversation.textContent.includes('Test selected speech output'), false);
    await act(async () => tabs[2].click());
    assert.equal(tabs[2].getAttribute('aria-selected'), 'true');
    assert.equal(document.getElementById(tabs[2].getAttribute('aria-controls')).hidden, false);
    assert.equal(
      [...document.querySelectorAll('.dlv-settings label')].some((label) =>
        label.textContent.includes('Recognition engine'),
      ),
      true,
    );
    assert.equal(
      document.querySelector('option[value=whisper-http]').textContent,
      'Whisper HTTP — DSH host',
    );
    assert.equal(
      document.querySelector('[aria-label="Silence detection settings"]'),
      null,
      'browser provider controls its own segmentation',
    );
    const checks = [...document.querySelectorAll('input[type=checkbox]')];
    assert.equal(checks.length, 8);
    assert.equal(checks.filter((input) => input.checked).length, 7);
    assert.equal(
      checks.find((input) =>
        input.parentElement.textContent.includes('Stop assistant speech when I send a message'),
      ).checked,
      false,
    );
    const localRecognition = checks.find((input) =>
      input.parentElement.textContent.includes('Process recognition locally'),
    );
    await act(async () => localRecognition.click());
    assert.deepEqual(calls.at(-1), ['settings', { recognitionProcessLocally: false }]);
    assert.equal(
      [...document.querySelectorAll('button')].find(
        (b) => b.textContent === 'Test selected speech output',
      ).disabled,
      false,
    );
    await act(async () =>
      [...document.querySelectorAll('button')]
        .find((b) => b.textContent === 'Test selected speech output')
        .click(),
    );
    assert.equal(calls.at(-1)[0], 'speak');
    await act(async () => {
      state = { ...state, settings: { ...state.settings, recognitionEngine: 'whisper-http' } };
      callbacks.forEach((cb) => cb());
    });
    const language = [...document.querySelectorAll('label')]
      .find((label) => label.textContent.includes('Recognition language'))
      .querySelector('select');
    assert.equal(
      language.querySelector('option[value=auto]').textContent,
      'Automatic — detect language',
    );
    await act(async () => {
      language.value = 'auto';
      language.dispatchEvent(new window.Event('change', { bubbles: true }));
    });
    assert.deepEqual(calls.at(-1), ['settings', { recognitionLang: 'auto' }]);
    const connection = [...document.querySelectorAll('.dlv-settings-subcard > summary')].find(
      (summary) => summary.textContent === 'Connection settings',
    );
    assert.ok(connection);
    assert.equal(
      connection.parentElement.querySelector('fieldset'),
      null,
      'connection fields are not wrapped in another card',
    );
    const detection = document.querySelector('[aria-label="Silence detection settings"]');
    assert.ok(detection);
    const maxUtterance = [...detection.querySelectorAll('label')]
      .find((label) => label.textContent.includes('Maximum continuous speech'))
      .querySelector('input');
    assert.equal(maxUtterance.value, '60');
    assert.equal(maxUtterance.min, '10');
    assert.equal(maxUtterance.max, '300');
    assert.equal(detection.querySelectorAll('input[type=radio]').length, 3);
    const long = [...detection.querySelectorAll('input[type=radio]')].find(
      (input) => input.value === 'long',
    );
    await act(async () => long.click());
    assert.deepEqual(calls.at(-1), ['settings', { voiceDetectionPreset: 'long' }]);
    await act(async () => {
      state = { ...state, conversation: true, listening: true, recognizing: true };
      callbacks.forEach((cb) => cb());
    });
    assert.equal(document.querySelector('[role=status]').textContent, 'Recognizing speech…');
    const autoSendToggle = document.querySelector('[aria-label="Automatic delivery mode"]');
    const assistantSpeechToggle = document.querySelector(
      '[aria-label="Automatic assistant speech"]',
    );
    assert.equal(autoSendToggle.classList.contains('dlv-live-toggle'), true);
    assert.equal(autoSendToggle.getAttribute('aria-pressed'), 'false');
    assert.equal(autoSendToggle.textContent, 'OFF');
    assert.equal(assistantSpeechToggle.getAttribute('aria-checked'), 'true');
    assert.equal(assistantSpeechToggle.textContent, 'ON');
    const muteMicrophone = document.querySelector('[aria-label="Ignore composer input"]');
    assert.ok(muteMicrophone);
    assert.equal(
      muteMicrophone.querySelector('path').getAttribute('d'),
      'M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0V5M6 10v2a6 6 0 0 0 12 0v-2M12 18v4M8 22h8',
      'listening state uses the open microphone icon',
    );
    await act(async () => autoSendToggle.click());
    assert.deepEqual(calls.at(-1), ['settings', { sendingMode: 'queue' }]);
    assert.equal(autoSendToggle.getAttribute('aria-pressed'), 'true');
    assert.equal(autoSendToggle.textContent, 'QUEUE');
    await act(async () => autoSendToggle.click());
    assert.deepEqual(calls.at(-1), ['settings', { sendingMode: 'steer' }]);
    assert.equal(autoSendToggle.textContent, 'SEND');
    await act(async () => assistantSpeechToggle.click());
    assert.deepEqual(calls.at(-1), ['settings', { announceAssistantMessages: false }]);
    assert.equal(assistantSpeechToggle.getAttribute('aria-checked'), 'false');
    assert.equal(assistantSpeechToggle.textContent, 'OFF');
    await act(async () => {
      state = { ...state, speaking: true, paused: true };
      callbacks.forEach((cb) => cb());
    });
    await act(async () => click('Resume speech'));
    await act(async () => click('Stop all speech'));
    await act(async () => click('End voice conversation'));
    assert.deepEqual(
      calls.map((item) => (Array.isArray(item) ? item[0] : item)),
      [
        'conversation',
        'settings',
        'speak',
        'settings',
        'settings',
        'settings',
        'settings',
        'settings',
        'resume',
        'stop',
        'end',
      ],
    );
    await act(async () => click('Close voice settings'));
    assert.equal(calls.at(-1), 'close');
    await act(async () => root.render(React.createElement(MicrophoneButtons, { controller })));
    controller.explainRecognition = () => {
      throw new Error('Missing local language pack');
    };
    await act(async () => {
      state = {
        ...state,
        conversation: false,
        listening: false,
        recognizing: false,
        capabilities: {
          browser: { supported: true, pause: true, resume: true },
          recognition: { supported: false },
          capture: { supported: true },
        },
      };
      callbacks.forEach((cb) => cb());
    });
    await act(async () => click('Speech recognition unavailable'));
    assert.match(document.querySelector('[role=alert]').textContent, /Missing local language pack/);
    await act(async () => click('Dismiss voice error'));
    assert.equal(document.querySelector('[role=alert]'), null);
  } finally {
    await act(async () => root.unmount());
    assert.equal(callbacks.size, 0);
    dom.window.close();
    Object.assign(globalThis, previous);
    delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  }
});

test('Qwen speech output exposes and persists the selected preset voice', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost' });
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    fetch: globalThis.fetch,
  };
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.fetch = async () =>
    Response.json({
      ok: true,
      value: { baseUrl: 'http://127.0.0.1:8080/', timeoutMs: 300000 },
    });
  const callbacks = new Set();
  const calls = [];
  const state = {
    settings: {
      engine: 'qwen-http',
      recognitionEngine: 'browser',
      voice: 'aiden',
      lang: 'pt-BR',
      mode: 'speaker',
      rate: 1,
    },
    capabilities: { 'qwen-http': { supported: true } },
  };
  const controller = {
    subscribe: (callback) => {
      callbacks.add(callback);
      return () => callbacks.delete(callback);
    },
    getSnapshot: () => state,
    updateSettings: (value) => calls.push(value),
    endConversation: () => {},
    refreshCapabilities: () => {},
  };
  const { SettingsPanel } = createComponents(React);
  const root = createRoot(document.getElementById('root'));
  try {
    await act(async () => root.render(React.createElement(SettingsPanel, { controller })));
    const label = [...document.querySelectorAll('label')].find((candidate) =>
      candidate.textContent.startsWith('Qwen voice'),
    );
    assert.ok(label);
    const select = label.querySelector('select');
    assert.equal(select.value, 'aiden');
    assert.equal(select.querySelectorAll('option').length, 9);
    await act(async () => {
      select.value = 'ryan';
      select.dispatchEvent(new window.Event('change', { bubbles: true }));
    });
    assert.deepEqual(calls.at(-1), { voice: 'ryan' });
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    Object.assign(globalThis, previous);
    delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  }
});
