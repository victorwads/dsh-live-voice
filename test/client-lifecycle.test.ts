// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { apply } from '../src/client/index.ts';
import { VoiceCoordinator } from '../src/core/coordinator.ts';

const h = React.createElement;
function deferred() {
  let resolve;
  const promise = new Promise((r) => {
    resolve = r;
  });
  return { promise, resolve };
}
async function fixture(t) {
  const dom = new JSDOM(
    '<!doctype html><html><head></head><body><div id="root"></div></body></html>',
    { url: 'http://localhost' },
  );
  const restore = [];
  for (const [key, value] of Object.entries({
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    localStorage: dom.window.localStorage,
    IS_REACT_ACT_ENVIRONMENT: true,
  })) {
    const old = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
    restore.push(() => {
      if (old) Object.defineProperty(globalThis, key, old);
      else delete globalThis[key];
    });
  }
  dom.window.speechSynthesis = new dom.window.EventTarget();
  Object.defineProperty(dom.window.navigator, 'mediaDevices', {
    configurable: true,
    value: new dom.window.EventTarget(),
  });
  const controllers = [];
  const calls = [];
  const holds = new Map();
  t.mock.method(VoiceCoordinator.prototype, 'refreshCapabilities', async function () {
    controllers.push(this);
    this.patch({
      capabilities: {
        browser: { supported: true, pause: true, resume: true },
        say: { supported: true, pause: true, resume: true },
        recognition: { supported: false },
        capture: { supported: true, permission: 'prompt' },
      },
    });
  });
  t.mock.method(VoiceCoordinator.prototype, 'startDictation', async function () {
    calls.push(['start', this]);
  });
  t.mock.method(VoiceCoordinator.prototype, 'startConversation', async function () {
    calls.push(['conversation', this]);
  });
  t.mock.method(VoiceCoordinator.prototype, 'speak', async function () {
    calls.push(['speak', this]);
  });
  t.mock.method(VoiceCoordinator.prototype, 'stopListening', async function () {
    calls.push(['stop', this]);
  });
  t.mock.method(VoiceCoordinator.prototype, 'stopSpeech', async function () {});
  t.mock.method(VoiceCoordinator.prototype, 'endConversation', async function () {
    calls.push(['end', this]);
    await holds.get(this)?.promise;
  });
  t.mock.method(VoiceCoordinator.prototype, 'dispose', async function () {
    this.disposed = true;
    calls.push(['dispose', this]);
    await holds.get(this)?.promise;
  });
  const stores = new Map();
  const slots = new Map();
  const cleanup = [];
  function store(id) {
    if (!stores.has(id)) {
      const listeners = new Set();
      const snapshot = {
        nodes: new Map([
          [
            'one',
            {
              kind: 'assistant-step',
              data: {
                turn: 1,
                step: 0,
                status: 'settled',
                finalNode: { messageId: 'm' },
                blocks: [{ kind: 'text', text: 'History.' }],
              },
            },
          ],
        ]),
      };
      stores.set(id, {
        listeners,
        getSnapshot: () => snapshot,
        subscribe(fn) {
          listeners.add(fn);
          return () => listeners.delete(fn);
        },
      });
    }
    return stores.get(id);
  }
  const ctx = {
    connection: {
      rpc: async () => {
        throw Error('unexpected RPC');
      },
    },
    uiConversation: {
      binding: (id) => ({
        target: (name) => {
          assert.equal(name, 'chat');
          return store(id);
        },
      }),
    },
    effect: (fn) => cleanup.push(fn()),
    slots: {
      inject: (_name, fn) => fn(),
      register: ({ name }, component) => slots.set(name, component),
    },
  };
  apply(ctx);
  const root = createRoot(document.getElementById('root'));
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    for (const fn of cleanup.reverse()) fn?.();
  };
  const render = async (children) =>
    act(async () => {
      root.render(h(React.StrictMode, null, children));
    });
  const props = (id, actions = { setDraft() {} }) => ({
    sessionId: id,
    inputActions: actions,
    input: { draft: 'Draft' },
    messageId: 'm',
  });
  const Buttons = slots.get('conversation.input.right'),
    Action = slots.get('conversation.chat.assistant-actions');
  t.after(async () => {
    await act(async () => {
      root.unmount();
      close();
    });
    dom.window.close();
    for (const fn of restore) fn();
  });
  return {
    render,
    props,
    Buttons,
    Action,
    Settings: slots.get('settings.section'),
    controllers,
    calls,
    holds,
    store,
    close,
  };
}

test('real assistant-step rows enable playback even without local recognition', async (t) => {
  const f = await fixture(t);
  await f.render(h(f.Action, f.props('a')));
  await act(async () =>
    f.controllers[0].patch({
      capabilities: {
        browser: { supported: true },
        recognition: { supported: false },
        capture: { supported: true },
      },
    }),
  );
  const button = document.querySelector('button');
  assert.equal(button.disabled, false);
  await act(async () => button.click());
  assert.equal(f.calls.filter(([name]) => name === 'speak').length, 1);
});

test('native Settings owns preferences without a composer gear', async (t) => {
  const f = await fixture(t);
  await f.render(h(f.Buttons, f.props('a')));
  assert.equal(document.querySelector('[aria-label="Voice settings"]'), null);
  await f.render(h(f.Settings));
  assert.ok(document.querySelector('[aria-label="Live Voice settings"]'));
  const select = document.querySelector('select');
  await act(async () => {
    select.value = 'say';
    select.dispatchEvent(new window.Event('change', { bubbles: true }));
  });
  assert.equal(JSON.parse(localStorage.getItem('dsh-live-voice.settings')).engine, 'say');
  const test = [...document.querySelectorAll('button')].find(
    (button) => button.textContent === 'Test selected speech output',
  );
  await act(async () => test.click());
  assert.equal(f.calls.filter(([name]) => name === 'speak').length, 1);
});

test('changing Settings stops active voice, persists immediately, and applies next-run preferences', async (t) => {
  const f = await fixture(t);
  await f.render([h(f.Buttons, { ...f.props('a'), key: 'a' }), h(f.Settings, { key: 'settings' })]);
  const session = f.controllers[0];
  session.patch({ conversation: true, listening: true });
  const engine = document.querySelector('select');
  await act(async () => {
    engine.value = 'say';
    engine.dispatchEvent(new window.Event('change', { bubbles: true }));
  });
  assert.equal(JSON.parse(localStorage.getItem('dsh-live-voice.settings')).engine, 'say');
  assert.ok(f.calls.some(([name, controller]) => name === 'end' && controller === session));
  assert.equal(session.getSnapshot().settings.engine, 'say');
  assert.equal(document.querySelector('[role=alert]'), null);
});

test('recognized browser text writes through the actual InputState and InputActions slot contract', async (t) => {
  const f = await fixture(t);
  const written = [];
  await f.render(h(f.Buttons, f.props('a', { setDraft: (text) => written.push(text) })));
  const c = f.controllers[0];
  c.patch({ listening: true });
  c.onResult({ interim: 'Olá mundo', final: '' });
  assert.deepEqual(written, ['Draft Olá mundo']);
  c.onResult({ interim: '', final: 'Olá mundo' });
  assert.equal(written.at(-1), 'Draft Olá mundo');
});

test('StrictMode shares committed owners and releases action-only sessions on final unmount', async (t) => {
  const f = await fixture(t);
  await f.render([
    h(f.Action, { ...f.props('a'), key: 'one' }),
    h(f.Action, { ...f.props('a'), key: 'two' }),
  ]);
  assert.equal(f.controllers.length, 1);
  assert.equal(f.store('a').listeners.size, 1);
  assert.equal(f.controllers[0].consumed.get('1:0'), 'History.'.length);
  await f.render(null);
  assert.equal(f.store('a').listeners.size, 0);
  assert.equal(f.calls.filter(([name]) => name === 'dispose').length, 1);
  await f.render(h(f.Action, f.props('a')));
  assert.equal(f.controllers.length, 2, 'remount gets a fresh non-retained session');
});

test('abandoned Suspense render creates no session or chat subscriptions', async (t) => {
  const f = await fixture(t);
  const never = new Promise(() => {});
  function Suspend() {
    throw never;
  }
  await f.render(
    h(React.Suspense, { fallback: 'waiting' }, h(f.Action, f.props('abandoned')), h(Suspend)),
  );
  assert.equal(f.controllers.length, 0);
});

test('composer detach is immediate while action owner survives, updates use latest actions', async (t) => {
  const f = await fixture(t);
  const old = [],
    fresh = [];
  const view = (actions) => [
    h(f.Buttons, { ...f.props('a', actions), key: 'buttons' }),
    h(f.Action, { ...f.props('a'), key: 'action' }),
  ];
  await f.render(view({ setDraft: (text) => old.push(text) }));
  const c = f.controllers[0];
  c.composer.setDraft('one');
  await f.render(view({ setDraft: (text) => fresh.push(text) }));
  c.composer.setDraft('two');
  await f.render([h(f.Action, { ...f.props('a'), key: 'action' })]);
  c.composer.setDraft('late');
  assert.deepEqual(old, ['one']);
  assert.deepEqual(fresh, ['two']);
  assert.equal(c.disposed, false);
  await c.startDictation();
  assert.equal(f.calls.filter(([name]) => name === 'start').length, 0);
});

test('one keyboard handler across duplicate mounts; ambiguous sessions are ignored', async (t) => {
  const f = await fixture(t);
  const key = () =>
    document.dispatchEvent(
      new window.KeyboardEvent('keydown', {
        code: 'Space',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      }),
    );
  await f.render([
    h(f.Buttons, { ...f.props('a'), key: 'one' }),
    h(f.Buttons, { ...f.props('a'), key: 'two' }),
  ]);
  await act(async () => {
    key();
  });
  assert.equal(f.calls.filter(([name]) => name === 'start').length, 1);
  await f.render([
    h(f.Buttons, { ...f.props('a'), key: 'one' }),
    h(f.Buttons, { ...f.props('b'), key: 'two' }),
  ]);
  await act(async () => {
    key();
  });
  assert.equal(f.calls.filter(([name]) => name === 'start').length, 1);
  f.close();
  await act(async () => {
    key();
  });
  assert.equal(f.calls.filter(([name]) => name === 'start').length, 1);
  assert.equal(f.store('a').listeners.size, 0);
  assert.equal(f.store('b').listeners.size, 0);
});

test('stop cancels queued acquisition without cancelling another session handoff on unmount', async (t) => {
  const f = await fixture(t);
  await f.render([
    h(f.Buttons, { ...f.props('a'), key: 'a' }),
    h(f.Buttons, { ...f.props('b'), key: 'b' }),
  ]);
  const [a, b] = f.controllers;
  const hold = deferred();
  f.holds.set(a, hold);
  const cancelled = b.startDictation();
  await Promise.resolve();
  await b.stopListening();
  hold.resolve();
  await cancelled;
  assert.equal(f.calls.filter(([name]) => name === 'start').length, 0);
  const hold2 = deferred();
  f.holds.set(a, hold2);
  const next = b.startDictation();
  await Promise.resolve();
  await f.render([h(f.Buttons, { ...f.props('b'), key: 'b' })]);
  hold2.resolve();
  await next;
  assert.deepEqual(
    f.calls.filter(([name]) => name === 'start').map(([, c]) => c),
    [b],
  );
});

test('retiring owner teardown stays in handoff barrier after registry removal', async (t) => {
  const f = await fixture(t);
  await f.render(h(f.Buttons, f.props('a')));
  const a = f.controllers[0];
  const hold = deferred();
  f.holds.set(a, hold);
  await f.render(null);
  assert.equal(f.store('a').listeners.size, 0);
  await f.render(h(f.Buttons, f.props('b')));
  const b = f.controllers[1];
  const started = b.startDictation();
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(f.calls.filter(([name]) => name === 'start').length, 0);
  hold.resolve();
  await started;
  assert.deepEqual(
    f.calls.filter(([name]) => name === 'start').map(([, c]) => c),
    [b],
  );
});

test('late browser voices refresh live sessions and listener detaches on disposal', async (t) => {
  const f = await fixture(t);
  await f.render(h(f.Action, f.props('a')));
  assert.equal(f.controllers.length, 1);
  await act(async () => window.speechSynthesis.dispatchEvent(new window.Event('voiceschanged')));
  assert.equal(f.controllers.length, 2);
  f.close();
  window.speechSynthesis.dispatchEvent(new window.Event('voiceschanged'));
  assert.equal(f.controllers.length, 2);
});

test('device and visibility changes refresh live sessions and Settings, then detach', async (t) => {
  const f = await fixture(t);
  await f.render([h(f.Action, { ...f.props('a'), key: 'a' }), h(f.Settings, { key: 'settings' })]);
  const initial = f.controllers.length;
  await act(async () => navigator.mediaDevices.dispatchEvent(new window.Event('devicechange')));
  assert.ok(f.controllers.length > initial);
  const afterDevice = f.controllers.length;
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
  await act(async () => document.dispatchEvent(new window.Event('visibilitychange')));
  assert.ok(f.controllers.length > afterDevice);
  const afterVisible = f.controllers.length;
  f.close();
  navigator.mediaDevices.dispatchEvent(new window.Event('devicechange'));
  assert.equal(f.controllers.length, afterVisible);
});

test('new user messages continue speech by default and optional interruption ignores history pagination', async (t) => {
  const f = await fixture(t);
  await f.render(h(f.Action, f.props('a')));
  const c = f.controllers[0];
  let stops = 0;
  t.mock.method(c, 'stopSpeech', async () => {
    stops++;
  });
  await act(async () => c.patch({ speaking: true }));
  const store = f.store('a');
  await act(async () => {
    store.getSnapshot().nodes.set('user', { kind: 'user', anchorSeq: 10 });
    store.listeners.forEach((fn) => fn());
  });
  assert.equal(stops, 0, 'default preserves current speech');
  await act(async () => c.updateSettings({ interruptSpeechOnUserMessage: true }));
  await act(async () => {
    store.getSnapshot().nodes.set('new-user', { kind: 'steering', anchorSeq: 11 });
    store.listeners.forEach((fn) => fn());
  });
  assert.equal(stops, 1);
  await act(async () => {
    store.getSnapshot().nodes.set('old', { kind: 'user', anchorSeq: 3 });
    store.listeners.forEach((fn) => fn());
  });
  assert.equal(stops, 1);
});

test('pagehide and plugin disposal invalidate pending starts and stale controllers', async (t) => {
  const f = await fixture(t);
  await f.render(h(f.Buttons, f.props('a')));
  const c = f.controllers[0];
  const pending = c.startDictation();
  window.dispatchEvent(new window.Event('pagehide'));
  await pending;
  assert.equal(f.calls.filter(([name]) => name === 'start').length, 0);
  f.close();
  await c.startConversation();
  await c.speak('stale');
  assert.equal(f.calls.filter(([name]) => name === 'conversation' || name === 'speak').length, 0);
  assert.equal(f.store('a').listeners.size, 0);
});
