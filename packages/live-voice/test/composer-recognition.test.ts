// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { apply } from '../src/app/client/apply.tsx';
import { MicrophoneMeter } from '../src/modules/core/microphone.ts';

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
      t.mock.method(globalThis, 'fetch', async () => Response.json({ ok: true, value: {} }));
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
      let snapshot = { draft: 'Draft', draftRev: 0 },
        pending = null,
        delay = false;
      const listeners = new Set();
      let writes = 0;
      const publish = (text) => {
        snapshot = { draft: text, draftRev: snapshot.draftRev + 1 };
        for (const fn of listeners) fn();
      };
      const actions = {
        setDraft(text) {
          writes++;
          // DSH updates the editor synchronously; only the subscribed publication can lag.
          const editor = document.querySelector('textarea');
          if (editor) editor.value = text;
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
      const results = [];
      let resultIndex = 0;
      const emit = (text, isFinal = false) => {
        results[resultIndex] = Object.assign([{ transcript: text }], { isFinal });
        native.onresult({ resultIndex, results });
        if (isFinal) resultIndex++;
      };
      await act(async () => native.onspeechstart());
      assert.equal(document.querySelector('textarea').value, 'Draft', 'activity alone is not text');
      await act(async () => emit('Olá'));
      assert.equal(
        document.querySelector('textarea').value,
        'Draft',
        'interim speech never changes the composer',
      );
      await act(async () => publish('Typed Draft Olá'));
      await act(async () => emit('Olá mundo'));
      assert.equal(
        document.querySelector('textarea').value,
        'Typed Draft Olá',
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
      assert.equal(document.querySelector('textarea').value, 'Typed Draft Olá Olá mundo novo');
      // Skip the exact voice echo: a manual edit is the next published editor state.
      delay = true;
      await act(async () => emit('primeiro trecho', true));
      await act(async () => publish('Typed Draft Olá Olá mundo novo primeiro trecho + manual'));
      await act(async () => emit('segundo trecho', true));
      assert.equal(
        pending,
        'Typed Draft Olá Olá mundo novo primeiro trecho + manual segundo trecho',
      );
      delay = false;
      await act(async () => publish(pending));
      delay = true;
      await act(async () => emit('pending chunk', true));
      await act(async () => publish(''));
      await act(async () => emit('after manual clear', true));
      assert.equal(
        pending,
        'after manual clear',
        'a newer empty editor revision must supersede pending voice text',
      );
      delay = false;
      await act(async () => publish(pending));
      const editor = document.querySelector('textarea');
      editor.focus();
      editor.setSelectionRange(1, 4, 'backward');
      await act(async () => emit('speech while editing', true));
      assert.equal(editor.selectionStart, 1);
      assert.equal(editor.selectionEnd, 4);
      assert.equal(editor.selectionDirection, 'backward');
      assert.equal(document.activeElement, editor);
      // A later chunk must append even after the user clears or replaces the composer.
      await act(async () => publish('replacement written manually'));
      await act(async () => emit('novo trecho', true));
      assert.equal(
        document.querySelector('textarea').value,
        'replacement written manually novo trecho',
      );
      const count = writes;
      const late = native.onresult;
      await act(async () => root.render(null));
      await act(async () =>
        late({ results: [Object.assign([{ transcript: 'late' }], { isFinal: true })] }),
      );
      assert.equal(writes, count, 'retired composer ignores late native results');
    },
  );
