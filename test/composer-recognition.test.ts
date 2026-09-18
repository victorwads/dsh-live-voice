// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { apply } from '../src/client/index.ts';
import { MicrophoneMeter } from '../src/core/microphone.ts';

// Contract model, not the DSH/Lexical runtime: state is published by a shell,
// consumers subscribe independently, and setDraft updates the visible editor.
for (const staleSnapshot of [false, true])
  test(
    'native recognition reaches mounted reactive composer' +
      (staleSnapshot ? ' despite stale input prop' : ''),
    async (t) => {
      const dom = new JSDOM('<html><head></head><body><div id="root"></div></body></html>', {
        url: 'http://localhost',
      });
      const restore = [];
      let native;
      class Recognition {
        constructor() {
          this.processLocally = true;
        }
        static async available() {
          return 'available';
        }
        start() {
          native = this;
        }
        abort() {}
      }
      for (const [key, value] of Object.entries({
        window: dom.window,
        document: dom.window.document,
        navigator: dom.window.navigator,
        localStorage: dom.window.localStorage,
        SpeechRecognition: Recognition,
        IS_REACT_ACT_ENVIRONMENT: true,
      })) {
        const old = Object.getOwnPropertyDescriptor(globalThis, key);
        Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
        restore.push(() =>
          old ? Object.defineProperty(globalThis, key, old) : delete globalThis[key],
        );
      }
      t.mock.method(MicrophoneMeter.prototype, 'capability', async () => ({ supported: true }));
      t.mock.method(MicrophoneMeter.prototype, 'start', async () => true);
      t.mock.method(MicrophoneMeter.prototype, 'stop', async () => {});
      const slots = new Map(),
        cleanup = [];
      const chat = { nodes: new Map() };
      apply({
        slots: {
          inject: (_, fn) => fn(),
          register: ({ name }, component) => slots.set(name, component),
        },
        effect: (fn) => cleanup.push(fn()),
        connection: { rpc: async () => ({ supported: false }) },
        uiSession: {
          pendingInteractions: { getSnapshot: () => new Map(), subscribe: () => () => {} },
        },
        uiConversation: {
          binding: () => ({
            target: () => ({ getSnapshot: () => chat, subscribe: () => () => {} }),
          }),
        },
      });
      let snapshot = { draft: 'Draft' },
        pending = null,
        delay = false;
      const listeners = new Set();
      let writes = 0;
      const publish = (text) => {
        snapshot = { draft: text };
        for (const fn of listeners) fn();
      };
      const actions = {
        setDraft(text) {
          writes++;
          if (delay) pending = text;
          else publish(text);
        },
      };
      const useInput = (selector) =>
        selector(
          React.useSyncExternalStore(
            (fn) => {
              listeners.add(fn);
              return () => listeners.delete(fn);
            },
            () => snapshot,
          ),
        );
      const Buttons = slots.get('conversation.input.right'),
        Dock = slots.get('conversation.input.dock');
      const props = {
        sessionId: 'a',
        useInput,
        inputActions: actions,
        ...(staleSnapshot ? { input: { draft: 'STALE' } } : {}),
      };
      function Editor() {
        const input = useInput((x) => x);
        return React.createElement('textarea', { value: input.draft, onChange: () => {} });
      }
      const root = createRoot(document.getElementById('root'));
      const render = () =>
        root.render(
          React.createElement(
            React.StrictMode,
            null,
            React.createElement(Editor),
            React.createElement(Buttons, props),
            React.createElement(Dock, props),
          ),
        );
      t.after(async () => {
        await act(async () => {
          root.unmount();
          for (const fn of cleanup.reverse()) fn?.();
        });
        dom.window.close();
        for (const fn of restore) fn();
      });
      await act(async () => render());
      const button = [...document.querySelectorAll('button')].find(
        (b) => b.getAttribute('aria-label') === 'Start voice conversation',
      );
      assert.ok(button, 'voice conversation button mounted');
      await act(async () => button.click());
      assert.ok(native, 'real coordinator starts recognition adapter');
      const emit = (text, isFinal = false) => {
        const result = Object.assign([{ transcript: text }], { isFinal });
        native.onresult({ resultIndex: 0, results: [result] });
      };
      await act(async () => native.onspeechstart());
      assert.equal(document.querySelector('textarea').value, 'Draft', 'activity alone is not text');
      await act(async () => emit('Olá'));
      assert.equal(document.querySelector('textarea').value, 'Draft Olá');
      await act(async () => publish('Typed Draft Olá'));
      await act(async () => emit('Olá mundo'));
      assert.equal(
        document.querySelector('textarea').value,
        'Typed Draft Olá mundo',
        'external edit survives next hypothesis',
      );
      // Delay the shell publication and force both slot wrappers to commit unchanged
      // snapshots: they must not overwrite the optimistic voice draft.
      delay = true;
      await act(async () => emit('Olá mundo novo'));
      await act(async () => render());
      await act(async () => emit('Olá mundo novo', true));
      delay = false;
      await act(async () => publish(pending));
      assert.equal(document.querySelector('textarea').value, 'Typed Draft Olá mundo novo');
      const count = writes;
      const late = native.onresult;
      await act(async () => root.render(null));
      await act(async () =>
        late({ results: [Object.assign([{ transcript: 'late' }], { isFinal: true })] }),
      );
      assert.equal(writes, count, 'retired composer ignores late native results');
    },
  );
