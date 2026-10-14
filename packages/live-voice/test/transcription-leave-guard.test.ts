import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createTranscriptionLeaveGuard } from '../src/app/client/transcriptionLeaveGuard.ts';

function source(initial = {}) {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    read: () => [state],
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    patch: (next) => {
      state = next;
      for (const listener of listeners) listener();
    },
    listeners,
  };
}
function fixture(t) {
  const dom = new JSDOM('', { url: 'http://localhost' });
  const guard = createTranscriptionLeaveGuard(dom.window as unknown as Window);
  t.after(() => {
    guard.dispose();
    dom.window.close();
  });
  const leave = () => {
    const event = new dom.window.Event('beforeunload', { cancelable: true });
    dom.window.dispatchEvent(event);
    return event.defaultPrevented;
  };
  return { dom, guard, leave };
}

test('leave confirmation follows every transcription phase and ignores playback or idle voice mode', (t) => {
  const { guard, leave } = fixture(t);
  const microphone = source();
  guard.watch(microphone.read, microphone.subscribe);
  assert.equal(leave(), false);
  for (const state of [
    { starting: true },
    { listening: true },
    { recognizing: true },
    { pendingTranscriptions: 2 },
    { pending: 1 },
  ]) {
    microphone.patch(state);
    assert.equal(leave(), true);
  }
  microphone.patch({ conversation: true, speaking: true, paused: true });
  assert.equal(leave(), false);
  microphone.patch({ error: 'capture failed', starting: false, listening: false });
  assert.equal(leave(), false);
});

test('independent sources share one active-only listener and one stopping source cannot clear the other', (t) => {
  const { dom, guard, leave } = fixture(t);
  let added = 0,
    removed = 0;
  const add = dom.window.addEventListener.bind(dom.window),
    remove = dom.window.removeEventListener.bind(dom.window);
  dom.window.addEventListener = (...args) => {
    if (args[0] === 'beforeunload') added++;
    return add(...args);
  };
  dom.window.removeEventListener = (...args) => {
    if (args[0] === 'beforeunload') removed++;
    return remove(...args);
  };
  const mic = source(),
    meeting = source();
  const releaseMic = guard.watch(mic.read, mic.subscribe);
  const releaseMeeting = guard.watch(meeting.read, meeting.subscribe);
  assert.equal(added, 0);
  mic.patch({ listening: true });
  meeting.patch({ listening: true });
  mic.patch({ listening: true });
  assert.equal(added, 1);
  assert.equal(leave(), true);
  mic.patch({});
  assert.equal(removed, 0);
  assert.equal(leave(), true);
  releaseMeeting();
  releaseMeeting();
  assert.equal(removed, 1);
  assert.equal(leave(), false);
  mic.patch({ starting: true });
  assert.equal(added, 2);
  releaseMic();
  assert.equal(removed, 2);
  assert.equal(mic.listeners.size, 0);
  assert.equal(meeting.listeners.size, 0);
});

test('cancelled leave requests never stop capture and disposed guards release all subscriptions', (t) => {
  const { guard, leave } = fixture(t);
  const mic = source({ listening: true });
  guard.watch(mic.read, mic.subscribe);
  assert.equal(leave(), true);
  assert.equal(leave(), true);
  assert.deepEqual(mic.read(), [{ listening: true }]);
  guard.dispose();
  guard.dispose();
  assert.equal(leave(), false);
  assert.equal(mic.listeners.size, 0);
  mic.patch({ listening: true });
  guard.watch(mic.read, mic.subscribe);
  assert.equal(mic.listeners.size, 0);
  assert.equal(leave(), false);
});
