// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { createConversationComponents } from '../src/modules/conversation/components/createConversationComponents.tsx';
import { createLiveVoiceSettings } from '../src/modules/settings/components/createLiveVoiceSettings.tsx';
import { withAppLanguage } from '../src/app/client/i18n/index.ts';
import { createFallbackTranslator, liveVoiceDictionaries } from '../src/app/client/i18n/index.ts';
import { normalizeSettings } from '../src/modules/core/settings.ts';

test('settings labels and help render from every locale catalog', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost' });
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    act: globalThis.IS_REACT_ACT_ENVIRONMENT,
  };
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  dom.window.localStorage.setItem(
    'dsh-live-voice.latest-release-check',
    JSON.stringify({ checkedAt: Date.now() }),
  );
  const state = {
    settings: normalizeSettings({}),
    capabilities: { recognition: { supported: true }, capture: { supported: true } },
  };
  const controller = {
    subscribe: () => () => {},
    getSnapshot: () => state,
    updateSettings() {},
    clearError() {},
  };
  const root = createRoot(document.getElementById('root'));
  try {
    for (const locale of Object.keys(liveVoiceDictionaries)) {
      const localeSnapshot = { active: locale, revision: 0 };
      const dshLocale = {
        subscribe: () => () => {},
        getSnapshot: () => localeSnapshot,
      };
      const SettingsPanel = withAppLanguage(createLiveVoiceSettings(), dshLocale);
      await act(async () => root.render(React.createElement(SettingsPanel, { controller })));
      const tabs = [...document.querySelectorAll('[role="tab"]')];
      const rendered = [];
      for (const tab of tabs) {
        await act(async () => tab.click());
        rendered.push(document.getElementById('root').textContent);
      }
      const text = rendered.join(' ');
      for (const suffix of [
        'speak.autoPlayback.label',
        'speak.autoPlayback.help',
        'speak.interruption.enabled',
        'speak.interruption.disabledHelp',
        'recognition.holdToTalk.enabled',
        'recognition.holdToTalk.help',
        'recognition.speakerMode.help',
        'speak.responseDelay.help',
        'settings.delivery.manualLabel',
        'speak.filters.code.enabled',
        'recognition.commands.enabled',
        'recognition.minimumWords.enabled',
      ])
        assert.ok(
          text.includes(liveVoiceDictionaries[locale]['dsh-live-voice.' + suffix]),
          locale + ': ' + suffix,
        );
      assert.ok(!text.includes('dsh-live-voice.'), text.match(/dsh-live-voice\.[^\s<]*/)?.[0]);
    }
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    globalThis.window = previous.window;
    globalThis.document = previous.document;
    globalThis.IS_REACT_ACT_ENVIRONMENT = previous.act;
  }
});

test('voice controls follow a live DSH locale change without changing speech settings', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost' });
  const previous = { window: globalThis.window, document: globalThis.document };
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const listeners = new Set();
  let active = 'en';
  let revision = 0;
  let localeSnapshot = { active, revision };
  const locale = {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot() {
      return localeSnapshot;
    },
  };
  const state = {
    conversation: false,
    listening: false,
    recognizing: false,
    starting: false,
    speaking: false,
    paused: false,
    settings: { lang: 'pt-BR', recognitionLang: 'pt-BR' },
    capabilities: { recognition: { supported: true }, capture: { supported: true } },
  };
  const controller = {
    subscribe: () => () => {},
    getSnapshot: () => state,
    startConversation: () => {},
  };
  const translate = (key, params) => createFallbackTranslator(active)(key, params);
  const { MicrophoneButtons } = createConversationComponents(React, translate, locale);
  const root = createRoot(document.getElementById('root'));
  try {
    await act(async () => root.render(React.createElement(MicrophoneButtons, { controller })));
    assert.equal(
      document.querySelector('.dlv-mic').getAttribute('aria-label'),
      'Start voice conversation',
    );
    active = 'pt-BR';
    revision += 1;
    localeSnapshot = { active, revision };
    await act(async () => listeners.forEach((listener) => listener()));
    assert.equal(
      document.querySelector('.dlv-mic').getAttribute('aria-label'),
      'Iniciar conversa por voz',
    );
    assert.equal(state.settings.lang, 'pt-BR');
    assert.equal(state.settings.recognitionLang, 'pt-BR');
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    Object.assign(globalThis, previous);
    delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  }
});
