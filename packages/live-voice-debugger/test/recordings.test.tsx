// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import {
  RECORDING_KEY,
  RECORDING_CHANGED,
  recordingSegments,
} from '../../live-voice/src/modules/recording/types.ts';
import { createRecordingInspector } from '../src/recordingInspector.ts';
import { DebuggerPanel } from '../src/DebuggerPanel.tsx';
import { copyFor, dictionaries } from '../src/locales.ts';

const flush = async () => {
  for (let i = 0; i < 8; i++) await Promise.resolve();
};
const deferred = () => {
  let resolve;
  const promise = new Promise((r) => {
    resolve = r;
  });
  return { promise, resolve };
};
const session = (id = 'mic', kind = 'microphone', sourceId = id) => ({
  id,
  kind,
  sourceId,
  label: sourceId,
  startedAt: '2026-10-14T12:00:00Z',
  state: 'completed',
  sampleRate: 100,
  capturedSamples: 1000,
  savedSamples: 900,
  persistent: true,
  codec: 'audio/wav',
  pins: [
    { id: 'silence', kind: 'silence-start', atSample: 0, confirmedAtSample: 0, delaySamples: 0 },
    { id: 'speech', kind: 'speech-start', atSample: 200, confirmedAtSample: 210, delaySamples: 10 },
  ],
  attempts: [
    {
      id: 'attempt',
      segmentId: 'speech',
      startSample: 180,
      endSample: 900,
      engine: 'test-engine',
      createdAt: '2026-10-14T12:00:00Z',
      status: 'success',
      text: 'test transcript',
    },
  ],
});
function service(records) {
  const listeners = new Set();
  return {
    version: 1,
    list: async () => records,
    get: async (id) => records.find((s) => s.id === id) ?? null,
    segments: recordingSegments,
    audio: async () => new Blob(['audio']),
    export: async () => new Blob(['{}']),
    remove: async (id) => {
      const i = records.findIndex((s) => s.id === id);
      records.splice(i, 1);
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    notify: () => [...listeners].forEach((f) => f()),
    listeners,
  };
}

test('recording inspector rejects stale selection/service results and never mutates inspection', async () => {
  const oldList = deferred();
  const old = service([session()]);
  old.list = () => oldList.promise;
  let mutations = 0;
  old.audio =
    old.export =
    old.remove =
      () => {
        mutations++;
      };
  const target = { [RECORDING_KEY]: old };
  let view;
  const inspector = createRecordingInspector(target, (next) => {
    view = next;
  });
  inspector.discover();
  const next = service([session('a'), session('b')]);
  target[RECORDING_KEY] = next;
  inspector.discover();
  await flush();
  assert.equal(view.selected.id, 'a');
  assert.equal(old.listeners.size, 0);
  oldList.resolve([session('obsolete')]);
  await flush();
  assert.equal(view.selected.id, 'a');
  const staleGet = deferred();
  next.get = (id) => (id === 'b' ? staleGet.promise : Promise.resolve(session(id)));
  inspector.select('b');
  await flush();
  inspector.select('a');
  await flush();
  staleGet.resolve(session('b'));
  await flush();
  assert.equal(view.selected.id, 'a');
  assert.equal(mutations, 0);
  inspector.dispose();
  assert.equal(next.listeners.size, 0);
});

test('recording inspector refreshes subscriptions, reports promise failures and releases removed services', async () => {
  const records = [session()];
  const current = service(records);
  const target = { [RECORDING_KEY]: current };
  let view;
  const inspector = createRecordingInspector(target, (next) => {
    view = next;
  });
  inspector.discover();
  await flush();
  records.push(session('shared', 'shared'));
  current.notify();
  await flush();
  assert.equal(view.sessions.length, 2);
  current.list = async () => {
    throw new Error('private raw error');
  };
  current.notify();
  await flush();
  assert.equal(view.failed, true);
  delete target[RECORDING_KEY];
  inspector.discover();
  assert.equal(view.service, null);
  assert.equal(current.listeners.size, 0);
  inspector.dispose();
});

test('integrated primary recordings tab separates sources, plays silence, exports and confirms delete', async (t) => {
  const owner = new JSDOM('<div id="root"></div>');
  const target = new JSDOM('');
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    IS_REACT_ACT_ENVIRONMENT: globalThis.IS_REACT_ACT_ENVIRONMENT,
  };
  Object.assign(globalThis, {
    window: owner.window,
    document: owner.window.document,
    IS_REACT_ACT_ENVIRONMENT: true,
  });
  const root = createRoot(document.getElementById('root'));
  t.after(async () => {
    await act(async () => root.unmount());
    Object.assign(globalThis, previous);
    owner.window.close();
    target.window.close();
  });
  const records = [session(), session('share-a', 'shared'), session('share-b', 'shared')];
  const current = service(records);
  target.window[RECORDING_KEY] = current;
  const audioCalls = [],
    urls = [],
    revoked = [],
    exports = [],
    removed = [];
  let downloaded;
  owner.window.URL.createObjectURL = (blob) => {
    const url = 'blob:test-' + urls.length;
    urls.push(url);
    return url;
  };
  owner.window.URL.revokeObjectURL = (url) => revoked.push(url);
  target.window.URL.createObjectURL = () => assert.fail('Must use popup owner');
  owner.window.HTMLMediaElement.prototype.play = async () => {};
  owner.window.HTMLMediaElement.prototype.pause = () => {};
  owner.window.HTMLMediaElement.prototype.load = () => {};
  owner.window.HTMLAnchorElement.prototype.click = function () {
    downloaded = this.download;
  };
  current.audio = async (...args) => {
    audioCalls.push(args);
    return new Blob(['audio']);
  };
  current.export = async (id) => {
    exports.push(id);
    return new Blob(['{}']);
  };
  current.remove = async (id) => {
    removed.push(id);
    records.splice(
      records.findIndex((s) => s.id === id),
      1,
    );
    current.notify();
  };
  const copy = copyFor();
  await act(async () => {
    root.render(<DebuggerPanel copy={copy} target={target.window} onClose={() => {}} />);
    await flush();
  });
  assert.equal(
    document.querySelector('[role=tab][aria-selected=true]').textContent,
    copy.recordingTitle,
  );
  const select = document.querySelector('.dlvd-recordings select');
  assert.equal(select.options.length, 4);
  assert.match(document.querySelector('.dlvd-recording-detail').textContent, /test transcript/);
  const button = (label) =>
    [...document.querySelectorAll('.dlvd-recordings button')].find((b) => b.textContent === label);
  await act(async () => {
    button(copy.recordingPlay).click();
    await flush();
  });
  assert.deepEqual(audioCalls[0], ['mic', 0, 200]);
  await act(async () => {
    button(copy.recordingPlaySession).click();
    await flush();
  });
  assert.deepEqual(audioCalls[1], ['mic', undefined, undefined]);
  assert.deepEqual(revoked, [urls[0]]);
  await act(async () => {
    button(copy.recordingExport).click();
    await flush();
  });
  assert.deepEqual(exports, ['mic']);
  assert.equal(downloaded, 'recording-mic.json');
  await act(async () => button(copy.recordingDelete).click());
  assert.deepEqual(removed, []);
  await act(async () => button(copy.recordingCancel).click());
  assert.deepEqual(removed, []);
  await act(async () => button(copy.recordingDelete).click());
  await act(async () => {
    document.querySelector('.dlvd-delete-confirm button').click();
    await flush();
  });
  assert.deepEqual(removed, ['mic']);
  assert.ok(revoked.includes(urls[1]));
  assert.ok(revoked.includes(urls[2]));
  await act(async () => {
    select.value = select.options[2].value;
    select.dispatchEvent(new owner.window.Event('change', { bubbles: true }));
    await flush();
  });
  assert.ok(document.querySelector('.dlvd-recording-detail').textContent.includes('share-b'));
  await act(async () => {
    delete target.window[RECORDING_KEY];
    target.window.dispatchEvent(new target.window.Event(RECORDING_CHANGED));
  });
  assert.ok(
    document.querySelector('.dlvd-recordings').textContent.includes(copy.recordingUnavailable),
  );
  assert.equal(current.listeners.size, 0);
});

test('recording actions localize errors and reject late playback after selection or disposal', async (t) => {
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
  const root = createRoot(document.getElementById('root'));
  t.after(() => {
    Object.assign(globalThis, previous);
    dom.window.close();
  });
  const current = service([session()]);
  dom.window[RECORDING_KEY] = current;
  const urls = [],
    revoked = [];
  let pauses = 0;
  dom.window.URL.createObjectURL = () => {
    const url = 'blob:' + urls.length;
    urls.push(url);
    return url;
  };
  dom.window.URL.revokeObjectURL = (url) => revoked.push(url);
  dom.window.HTMLMediaElement.prototype.play = async () => {};
  dom.window.HTMLMediaElement.prototype.pause = () => {
    pauses++;
  };
  dom.window.HTMLMediaElement.prototype.load = () => {};
  const copy = copyFor('pt-BR');
  await act(async () => {
    root.render(<DebuggerPanel copy={copy} onClose={() => {}} />);
    await flush();
  });
  const button = (label) =>
    [...document.querySelectorAll('.dlvd-recordings button')].find((b) => b.textContent === label);
  current.audio = async () => {
    throw new Error('private failure');
  };
  await act(async () => {
    button(copy.recordingPlay).click();
    await flush();
  });
  assert.ok(document.querySelector('[role=alert]').textContent.includes(copy.recordingAudioError));
  assert.ok(!document.body.textContent.includes('private failure'));
  const obsolete = deferred();
  current.audio = () => obsolete.promise;
  await act(async () => {
    button(copy.recordingPlay).click();
  });
  await act(async () => document.querySelector('.dlvd-timeline button').click());
  await act(async () => {
    obsolete.resolve(new Blob(['obsolete']));
    await flush();
  });
  assert.equal(urls.length, 0);
  current.audio = async () => new Blob(['audio']);
  await act(async () => {
    button(copy.recordingPlaySession).click();
    await flush();
  });
  assert.equal(urls.length, 1);
  const late = deferred();
  current.audio = () => late.promise;
  await act(async () => {
    button(copy.recordingPlay).click();
  });
  assert.equal(pauses, 1);
  assert.deepEqual(revoked, urls);
  await act(async () => root.unmount());
  await act(async () => {
    late.resolve(new Blob(['late']));
    await flush();
  });
  assert.equal(urls.length, 1);
  assert.equal(current.listeners.size, 0);
});

test('all six recording catalogs contain the same nonempty localized keys', () => {
  const keys = Object.keys(dictionaries.en).filter((k) => k.startsWith('recording'));
  for (const copy of Object.values(dictionaries)) {
    assert.deepEqual(
      Object.keys(copy).filter((k) => k.startsWith('recording')),
      keys,
    );
    for (const key of keys) assert.ok(copy[key].trim());
  }
});
