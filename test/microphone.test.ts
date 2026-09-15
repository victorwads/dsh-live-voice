// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { getEventListeners } from 'node:events';
import { MicrophoneMeter } from '../src/core/microphone.ts';

const deferred = () => {
  let resolve, reject;
  const promise = new Promise((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
};
const stream = () => {
  const track = {
    stopped: 0,
    stop() {
      this.stopped++;
    },
  };
  return { track, getTracks: () => [track] };
};
function fixture({ pendingResume = false, pendingClose = false } = {}) {
  const requests = [],
    contexts = [];
  class AudioContext {
    constructor() {
      this.state = 'suspended';
      this.resuming = deferred();
      this.closing = deferred();
      this.closed = 0;
      contexts.push(this);
    }
    createAnalyser() {
      return {
        fftSize: 256,
        getFloatTimeDomainData(samples) {
          samples.fill(0.1);
        },
      };
    }
    createMediaStreamSource() {
      return { connect() {}, disconnect() {} };
    }
    resume() {
      return pendingResume ? this.resuming.promise : Promise.resolve();
    }
    close() {
      this.closed++;
      return pendingClose ? this.closing.promise : Promise.resolve();
    }
  }
  const meter = new MicrophoneMeter({
    AudioContext,
    navigator: {
      mediaDevices: {
        getUserMedia() {
          const request = deferred();
          requests.push(request);
          return request.promise;
        },
      },
    },
  });
  return { meter, requests, contexts };
}

test('capture capability distinguishes security, APIs and denied permission', async () => {
  assert.equal(
    (
      await new MicrophoneMeter({
        location: { hostname: 'remote.test' },
        isSecureContext: false,
        navigator: { mediaDevices: { getUserMedia() {} } },
        AudioContext: class {},
      }).capability()
    ).supported,
    false,
  );
  assert.match(
    (
      await new MicrophoneMeter({
        location: { hostname: 'localhost' },
        navigator: {},
        AudioContext: class {},
      }).capability()
    ).reason,
    /does not expose microphone/,
  );
  const denied = await new MicrophoneMeter({
    location: { hostname: 'localhost' },
    navigator: {
      mediaDevices: { getUserMedia() {} },
      permissions: { query: async () => ({ state: 'denied' }) },
    },
    AudioContext: class {},
  }).capability();
  assert.deepEqual(denied, {
    supported: false,
    permission: 'denied',
    reason:
      'Microphone permission is denied. Allow it in browser settings, then refresh availability.',
  });
  const prompt = await new MicrophoneMeter({
    location: { hostname: 'localhost' },
    navigator: { mediaDevices: { getUserMedia() {} } },
    AudioContext: class {},
  }).capability();
  assert.deepEqual(prompt, { supported: true, permission: 'prompt' });
});

test('stop resolves pending start before permission settles and stops late tracks', async () => {
  const { meter, requests, contexts } = fixture();
  const starting = meter.start();
  await meter.stop();
  assert.equal(await starting, false);
  const late = stream();
  requests[0].resolve(late);
  await Promise.resolve();
  assert.equal(late.track.stopped, 1);
  assert.equal(contexts.length, 0);
  assert.equal(meter.level(), 0);
});

test('signal abort cancels pending permission and removes its listener', async () => {
  const { meter, requests } = fixture();
  const controller = new AbortController();
  const starting = meter.start({ signal: controller.signal });
  controller.abort();
  assert.equal(await starting, false);
  assert.equal(getEventListeners(controller.signal, 'abort').length, 0);
  requests[0].reject(new Error('late permission denial'));
  await Promise.resolve();
  assert.equal(await meter.start({ signal: controller.signal }), false);
  assert.equal(requests.length, 1);
});

test('replacement starts without waiting on old permission and late streams cannot replace it', async () => {
  const { meter, requests, contexts } = fixture();
  const first = meter.start();
  const second = meter.start();
  assert.equal(await first, false);
  const fresh = stream();
  requests[1].resolve(fresh);
  assert.equal(await second, true);
  const late = stream();
  requests[0].resolve(late);
  await Promise.resolve();
  assert.equal(late.track.stopped, 1);
  assert.equal(fresh.track.stopped, 0);
  assert.equal(meter.stream, fresh);
  assert.equal(contexts.length, 1);
  assert.ok(meter.level() > 0);
  await meter.stop();
  assert.equal(fresh.track.stopped, 1);
});

test('aborted pending resume and close never block or close a newer context', async () => {
  for (const rejectResume of [true, false]) {
    const { meter, requests, contexts } = fixture({ pendingResume: true, pendingClose: true });
    const controller = new AbortController();
    const first = meter.start({ signal: controller.signal });
    const oldStream = stream();
    requests[0].resolve(oldStream);
    await Promise.resolve();
    controller.abort();
    assert.equal(await first, false);
    assert.equal(oldStream.track.stopped, 1);
    assert.equal(contexts[0].closed, 1);
    assert.equal(getEventListeners(controller.signal, 'abort').length, 0);
    const second = meter.start();
    const fresh = stream();
    requests[1].resolve(fresh);
    await Promise.resolve();
    contexts[1].resuming.resolve();
    assert.equal(await second, true);
    if (rejectResume) contexts[0].resuming.reject(new Error('obsolete resume rejection'));
    else contexts[0].resuming.resolve();
    await Promise.resolve();
    await Promise.resolve();
    assert.equal(meter.context, contexts[1]);
    assert.equal(contexts[1].closed, 0);
    assert.equal(contexts[0].closed, 1);
    assert.equal(fresh.track.stopped, 0);
    await meter.stop();
    assert.equal(contexts[1].closed, 1);
    assert.equal(fresh.track.stopped, 1);
  }
});

test('current resume failure rejects and releases only its own resources', async () => {
  const { meter, requests, contexts } = fixture({ pendingResume: true });
  const controller = new AbortController();
  const starting = meter.start({ signal: controller.signal });
  const rejected = assert.rejects(starting, /resume failed/);
  const audio = stream();
  requests[0].resolve(audio);
  await Promise.resolve();
  contexts[0].resuming.reject(new Error('resume failed'));
  await rejected;
  assert.equal(audio.track.stopped, 1);
  assert.equal(contexts[0].closed, 1);
  assert.equal(meter.context, null);
  assert.equal(getEventListeners(controller.signal, 'abort').length, 0);
});

test('abort after successful start releases metering and repeated stop is harmless', async () => {
  const { meter, requests, contexts } = fixture();
  const controller = new AbortController();
  const starting = meter.start({ signal: controller.signal });
  const audio = stream();
  requests[0].resolve(audio);
  assert.equal(await starting, true);
  controller.abort();
  await meter.stop();
  await meter.release();
  assert.equal(audio.track.stopped, 1);
  assert.equal(contexts[0].closed, 1);
  assert.equal(meter.level(), 0);
  assert.equal(getEventListeners(controller.signal, 'abort').length, 0);
});
