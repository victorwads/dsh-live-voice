// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { apply } from '../src/app/client/apply.tsx';
import { VoiceCoordinator } from '../src/modules/core/coordinator.ts';
import { MeetingController } from '../src/modules/conversation/models/meeting.js';

const h = React.createElement;
function deferred() {
  let resolve;
  const promise = new Promise((r) => {
    resolve = r;
  });
  return { promise, resolve };
}
async function fixture(t, { pendingStore = true } = {}) {
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
  dom.window.localStorage.setItem(
    'dsh-live-voice.settings',
    JSON.stringify({ engine: 'say', mode: 'headphones' }),
  );
  let serverSettings = {};
  t.mock.method(globalThis, 'fetch', async (url, options = {}) => {
    if (url === '/api/dsh-live-voice/settings') {
      if (options.method === 'PUT')
        serverSettings = { ...serverSettings, ...JSON.parse(options.body) };
      return Response.json({ ok: true, value: serverSettings });
    }
    return Response.json({ ok: true, value: {} });
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
  t.mock.method(VoiceCoordinator.prototype, 'startHoldToTalk', async function () {
    calls.push(['hold-start', this]);
  });
  t.mock.method(VoiceCoordinator.prototype, 'releaseHoldToTalk', async function () {
    calls.push(['hold-release', this]);
  });
  t.mock.method(VoiceCoordinator.prototype, 'startConversation', async function () {
    calls.push(['conversation', this]);
  });
  t.mock.method(VoiceCoordinator.prototype, 'speak', async function (...args) {
    calls.push(['speak', this, ...args]);
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
  const pending = new Map();
  const pendingListeners = new Set();
  const pendingInteractions = {
    getSnapshot: () => pending,
    subscribe(listener) {
      pendingListeners.add(listener);
      return () => pendingListeners.delete(listener);
    },
  };
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
    uiSession: pendingStore ? { pendingInteractions } : {},
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
    serverSettings: () => serverSettings,
    render,
    props,
    Buttons,
    Dock: slots.get('conversation.input.dock'),
    Action,
    Settings: slots.get('settings.section'),
    controllers,
    calls,
    holds,
    store,
    publishPending(id, interaction) {
      if (interaction) pending.set(id, interaction);
      else pending.delete(id);
      for (const listener of pendingListeners) listener();
    },
    pendingListeners,
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
  assert.equal(
    f.controllers[0].getSnapshot().settings.engine,
    'browser',
    'legacy browser preferences are ignored',
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
  assert.equal(f.serverSettings().engine, 'say');
  assert.deepEqual(JSON.parse(localStorage.getItem('dsh-live-voice.settings')), {
    engine: 'say',
    mode: 'headphones',
  });
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
  assert.equal(f.serverSettings().engine, 'say');
  assert.deepEqual(JSON.parse(localStorage.getItem('dsh-live-voice.settings')), {
    engine: 'say',
    mode: 'headphones',
  });
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
  assert.deepEqual(written, [], 'interim recognition is status-only');
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

test('holding Control globally starts one temporary capture and release finishes it', async (t) => {
  const f = await fixture(t);
  await f.render(h(f.Buttons, f.props('a')));
  f.controllers[0].updateSettings({ holdToTalkEnabled: true });
  const key = (type) =>
    document.dispatchEvent(
      new window.KeyboardEvent(type, {
        key: 'Control',
        code: 'ControlLeft',
        ctrlKey: type === 'keydown',
        bubbles: true,
        cancelable: true,
      }),
    );
  await act(async () => {
    key('keydown');
    key('keydown');
  });
  assert.equal(f.calls.filter(([name]) => name === 'hold-start').length, 1);
  await act(async () => key('keyup'));
  assert.equal(f.calls.filter(([name]) => name === 'hold-release').length, 1);
  f.controllers[0].updateSettings({ holdToTalkEnabled: false });
  await act(async () => {
    key('keydown');
    key('keyup');
  });
  assert.equal(f.calls.filter(([name]) => name === 'hold-start').length, 1);
});

test('hold-Control is ignored when more than one composer session is mounted', async (t) => {
  const f = await fixture(t);
  await f.render([
    h(f.Buttons, { ...f.props('a'), key: 'one' }),
    h(f.Buttons, { ...f.props('b'), key: 'two' }),
  ]);
  await act(async () => {
    document.dispatchEvent(
      new window.KeyboardEvent('keydown', {
        key: 'Control',
        code: 'ControlLeft',
        ctrlKey: true,
        bubbles: true,
      }),
    );
  });
  assert.equal(f.calls.filter(([name]) => name === 'hold-start').length, 0);
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

test('voice conversation mode follows the composer across chat switches until explicitly ended', async (t) => {
  const f = await fixture(t);
  await f.render(h(f.Buttons, { ...f.props('a'), key: 'a' }));
  const a = f.controllers[0];
  await a.startConversation();
  a.patch({ conversation: true, listening: true });

  await f.render(h(f.Buttons, { ...f.props('b'), key: 'b' }));
  const b = f.controllers.at(-1);
  assert.notEqual(b, a);
  assert.ok(
    f.calls.some(([name, controller]) => name === 'conversation' && controller === b),
    'the next composer resumes voice conversation mode',
  );

  await b.endConversation();
  await f.render(h(f.Buttons, { ...f.props('c'), key: 'c' }));
  const c = f.controllers.at(-1);
  assert.equal(
    f.calls.some(([name, controller]) => name === 'conversation' && controller === c),
    false,
    'an explicit end keeps the following composer out of voice mode',
  );
});

test('restarting voice conversation baselines visible assistant history before new speech arrives', async (t) => {
  const f = await fixture(t);
  const observed = [];
  t.mock.method(VoiceCoordinator.prototype, 'observeMessage', function (...args) {
    observed.push(args);
  });
  await f.render(h(f.Buttons, f.props('a')));
  const c = f.controllers[0];
  observed.length = 0;

  await c.endConversation();
  const store = f.store('a');
  await act(async () => {
    store.getSnapshot().nodes.get('one').data.blocks[0].text = 'Text streamed while voice was off.';
    store.listeners.forEach((fn) => fn());
  });
  observed.length = 0;
  await c.startConversation();

  assert.deepEqual(
    observed.map(([, , options]) => options),
    [{ complete: true, baseline: true }],
    'restarting voice consumes visible history instead of queuing it for playback',
  );
  f.close();
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

test('steer delivery dispatches an accelerated composer gesture instead of normal submission', async (t) => {
  const f = await fixture(t);
  const calls = [];
  const editor = document.createElement('div');
  editor.setAttribute('contenteditable', 'true');
  document.body.append(editor);
  editor.addEventListener('keydown', (event) =>
    calls.push([event.key, event.ctrlKey, event.metaKey]),
  );
  const actions = {
    setDraft() {},
    submit() {
      calls.push(['normal-submit']);
    },
  };
  await f.render(h(f.Buttons, f.props('a', actions)));
  const controller = f.controllers[0];
  controller.composer.submit('steer');
  assert.deepEqual(calls, [['Enter', true, false]]);
  controller.composer.submit('queue');
  assert.deepEqual(calls, [['Enter', true, false], ['normal-submit']]);
  // Changing the reported DSH policy takes effect without remounting the composer.
  await act(async () => controller.updateSettings({ dshBusyEnterBehavior: 'steer' }));
  calls.length = 0;
  controller.composer.submit('steer');
  controller.composer.submit('queue');
  assert.deepEqual(calls, [
    ['Enter', false, false],
    ['Enter', true, false],
  ]);

  // A missing accelerated editor must not fall back to the wrong delivery mode.
  editor.remove();
  calls.length = 0;
  controller.composer.submit('queue');
  assert.deepEqual(calls, []);
});

test('voice controls mount when DSH omits the legacy pending-interaction store', async (t) => {
  const f = await fixture(t, { pendingStore: false });
  await f.render(h(f.Buttons, f.props('a')));
  assert.equal(f.controllers.length, 1);
  assert.equal(f.pendingListeners.size, 0);
});

test('new pending questions are spoken once only while voice conversation mode is active', async (t) => {
  const f = await fixture(t);
  await f.render(h(f.Buttons, f.props('a')));
  const controller = f.controllers[0];
  controller.patch({ conversation: true });
  const question = {
    kind: 'question',
    key: 'question:1',
    questions: [{ id: 'engine', question: 'Which speech engine should I use?' }],
  };
  await act(async () => f.publishPending('a', question));
  await act(async () => f.publishPending('a', question));
  const spoken = f.calls.filter(([name]) => name === 'speak');
  assert.equal(spoken.length, 1);
  assert.equal(spoken[0][2], 'Which speech engine should I use?');
  assert.equal(spoken[0][3], 'question:1');
  await f.render(null);
  assert.equal(f.pendingListeners.size, 0);
});

test('pending questions stay silent outside voice conversation mode', async (t) => {
  const f = await fixture(t);
  await f.render(h(f.Buttons, f.props('a')));
  await act(async () =>
    f.publishPending('a', {
      kind: 'question',
      key: 'question:quiet',
      questions: [{ id: 'one', question: 'Should remain silent?' }],
    }),
  );
  assert.equal(f.calls.filter(([name]) => name === 'speak').length, 0);
});

test('spoken finals answer pending questions as custom text without touching the chat draft', async (t) => {
  const f = await fixture(t);
  const writes = [];
  await f.render(h(f.Buttons, f.props('a', { setDraft: (text) => writes.push(text) })));
  const controller = f.controllers[0];
  controller.patch({ conversation: true, listening: true });
  const replies = [];
  await act(async () =>
    f.publishPending('a', {
      kind: 'question',
      key: 'question:hands-free',
      questions: [
        { id: 'first', question: 'Which engine?' },
        { id: 'second', question: 'Which voice?' },
      ],
      answer: async (reply) => replies.push(reply),
    }),
  );
  controller.onResult({ interim: 'Nave', final: '' });
  controller.onResult({ interim: '', final: 'Navegador' });
  await act(async () => {});
  controller.patch({ listening: true });
  controller.onResult({ interim: '', final: 'Voz local' });
  await act(async () => {});
  assert.deepEqual(replies, [
    {
      answers: [
        { id: 'first', selected: [], custom: 'Navegador' },
        { id: 'second', selected: [], custom: 'Voz local' },
      ],
    },
  ]);
  assert.deepEqual(writes, []);
  assert.deepEqual(
    f.calls.filter(([name]) => name === 'speak').map((call) => call[2]),
    ['Which engine?', 'Which voice?'],
  );
});

test('sharing requests permission on first click without ending normal voice or blocking speech', async (t) => {
  const f = await fixture(t);
  let requests = 0;
  let meeting;
  navigator.mediaDevices.getDisplayMedia = () => {
    requests++;
    return Promise.resolve({ getTracks: () => [] });
  };
  t.mock.method(MeetingController.prototype, 'start', async function (source, request) {
    meeting = this;
    assert.equal(source, 'shared');
    await request;
    this.patch('shared', { listening: true });
  });
  await f.render(h(f.Buttons, f.props('a')));
  const c = f.controllers[0];
  const before = f.calls.filter(([name]) => name === 'end').length;
  await act(async () => document.querySelector('[aria-label="Shared audio"]').click());
  assert.equal(requests, 1);
  assert.equal(f.calls.filter(([name]) => name === 'end').length, before);
  await c.speak('Test speech', 'test');
  assert.equal(f.calls.filter(([name]) => name === 'speak').length, 1);
  await c.startConversation();
  assert.equal(f.calls.filter(([name]) => name === 'conversation').length, 1);
  assert.equal(meeting.getSnapshot().shared.listening, true);
  const stops = f.calls.filter(([name]) => name === 'stop').length;
  await act(async () => document.querySelector('[aria-label="Shared audio"]').click());
  assert.equal(meeting.getSnapshot().shared.listening, false);
  assert.equal(f.calls.filter(([name]) => name === 'stop').length, stops);
});

test('all three bars stay ordered captions, shared audio, microphone with no duplicate microphone or autoplay controls', async (t) => {
  const f = await fixture(t);
  window.requestAnimationFrame = () => 1;
  window.cancelAnimationFrame = () => {};
  let meeting;
  navigator.mediaDevices.getDisplayMedia = () => Promise.resolve({ getTracks: () => [] });
  t.mock.method(MeetingController.prototype, 'start', async function (source, request) {
    meeting = this;
    await request;
    this.patch('shared', { listening: true });
  });
  await f.render(h(React.Fragment, null, h(f.Buttons, f.props('a')), h(f.Dock, f.props('a'))));
  const c = f.controllers[0];
  await act(async () => {
    c.patch({
      conversation: true,
      listening: true,
      speaking: true,
      speechText: 'Visible captions',
      speechSegmentsRemaining: 3,
      speechSegmentsTotal: 3,
      speechSegmentIndex: 1,
    });
    document.querySelector('[aria-label="Shared audio"]').click();
  });
  const bars = [...document.querySelectorAll('.dlv-pill')];
  assert.equal(bars.length, 3);
  assert.ok(bars[0].classList.contains('dlv-speech-pill'));
  assert.equal(bars[1].getAttribute('aria-label'), 'Shared audio');
  assert.equal(bars[2].getAttribute('aria-label'), 'Voice controls');
  assert.equal(bars[2].querySelectorAll('.dlv-mic-state').length, 1);
  assert.equal(bars[2].firstElementChild.classList.contains('dlv-mic-state'), true);
  assert.equal(bars[2].querySelectorAll('button').length, 2, 'only microphone and delivery mode');
  assert.equal(bars[2].querySelector('[role="switch"]'), null);
  assert.equal(bars[2].querySelector('.dlv-speech-count'), null);
  assert.equal(bars[0].querySelector('[role="switch"]'), null);
  assert.equal(document.querySelectorAll('[role="switch"]').length, 1);
  assert.equal(bars[0].querySelector('.dlv-speech-count').textContent, '1/3');
  await act(async () => {
    c.patch({ speaking: false, speechSegmentsRemaining: 0, speechRunActive: false });
  });
  assert.equal(document.querySelectorAll('.dlv-pill').length, 2);
  assert.ok(
    document.querySelector('[role="switch"]'),
    'autoplay remains accessible without speech',
  );
  assert.equal(meeting.getSnapshot().shared.listening, true);
});

test('composer autoplay remains between shared audio and microphone while idle, toggles settings without stopping either source', async (t) => {
  const f = await fixture(t);
  await f.render(h(f.Buttons, f.props('a')));
  const buttons = [...document.querySelectorAll('button')];
  assert.equal(buttons[0].getAttribute('aria-label'), 'Shared audio');
  assert.equal(buttons[1].getAttribute('role'), 'switch');
  assert.equal(buttons[2].classList.contains('dlv-mic'), true);
  const c = f.controllers[0];
  let updates = [];
  c.updateSettings = (next) => {
    updates.push(next);
    c.patch({ settings: { ...c.getSnapshot().settings, ...next } });
  };
  const before = f.calls.length;
  await act(async () => buttons[1].click());
  assert.deepEqual(updates, [{ announceAssistantMessages: false }]);
  assert.equal(buttons[1].getAttribute('aria-checked'), 'false');
  await act(async () => buttons[1].click());
  assert.equal(buttons[1].getAttribute('aria-checked'), 'true');
  assert.equal(f.calls.length, before, 'capture and speech lifecycle actions are untouched');
});
