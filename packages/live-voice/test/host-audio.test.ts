// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { HostAudioSpeakingEngine } from '../src/modules/speak/engines/audio/HostAudioEngine.ts';

class AudioMock extends EventTarget {
  paused = true;
  playbackRate = 1;
  async play() {
    this.paused = false;
  }
  pause() {
    this.paused = true;
  }
}

test('host M4A engine prepares standardized audio and browser owns playback', async () => {
  const revoked = [],
    audio = new AudioMock();
  const engine = new HostAudioSpeakingEngine({
    endpoint: '/speech',
    globals: {
      fetch: async () => new Response(new Blob(['M4A-test'], { type: 'audio/mp4' })),
      URL: { createObjectURL: () => 'blob:test', revokeObjectURL: (url) => revoked.push(url) },
      Audio: class {
        constructor() {
          return audio;
        }
      },
    },
  });
  const prepared = await engine.prepare('hello');
  let started = 0;
  const playing = engine.playPrepared(prepared, { onPlaybackStart: () => started++ });
  assert.equal(started, 0);
  await Promise.resolve();
  assert.equal(audio.paused, false);
  audio.dispatchEvent(new Event('playing'));
  assert.equal(started, 1);
  audio.dispatchEvent(new Event('ended'));
  await playing;
  assert.deepEqual(revoked, ['blob:test']);
});

test('host speech applies latest playback volume without altering synthesis or pause state', async () => {
  const audio = new AudioMock();
  const engine = new HostAudioSpeakingEngine();
  for (const volume of [0, 0.4, 1]) {
    const playing = engine.playPrepared({ audio, dispose() {} }, { volume, retainPrepared: true });
    await Promise.resolve();
    assert.equal(audio.volume, volume);
    assert.equal(engine.pause(), true);
    engine.setVolume(0.2);
    assert.equal(audio.volume, 0.2);
    assert.equal(audio.paused, true);
    await engine.resume();
    assert.equal(audio.volume, 0.2);
    audio.dispatchEvent(new Event('ended'));
    await playing;
  }
  const playing = engine.playPrepared({ audio, dispose() {} });
  await Promise.resolve();
  assert.equal(audio.volume, 1);
  audio.dispatchEvent(new Event('ended'));
  await playing;
});

test('host audio maps synthesis and browser playback rates independently', async () => {
  const requests = [],
    audio = new AudioMock();
  const engine = new HostAudioSpeakingEngine({
    endpoint: '/speech',
    synthesisRate: () => 175,
    playbackRate: (rate) => rate,
    globals: {
      fetch: async (_url, options) => {
        requests.push(JSON.parse(options.body));
        return new Response(new Blob(['M4A-test'], { type: 'audio/mp4' }));
      },
      URL: { createObjectURL: () => 'blob:rate', revokeObjectURL() {} },
      Audio: class {
        constructor() {
          return audio;
        }
      },
    },
  });
  const prepared = await engine.prepare('hello', { rate: 1.6 });
  const playing = engine.playPrepared(prepared, { rate: 1.6 });
  await Promise.resolve();
  assert.equal(requests[0].rate, 175);
  assert.equal(audio.playbackRate, 1.6);
  audio.dispatchEvent(new Event('ended'));
  await playing;
});

test('host audio retains pause while output routing is pending and resumes only explicitly', async () => {
  let route;
  const audio = new AudioMock();
  const engine = new HostAudioSpeakingEngine();
  let plays = 0;
  audio.setSinkId = () =>
    new Promise((resolve) => {
      route = resolve;
    });
  audio.play = () => {
    plays++;
    return Promise.resolve();
  };
  const playing = engine.playPrepared({ audio, dispose() {} }, { outputDeviceId: 'selected' });
  await Promise.resolve();
  assert.equal(engine.pause(), true);
  route();
  await Promise.resolve();
  assert.equal(plays, 0);
  await engine.resume();
  assert.equal(plays, 1);
  audio.dispatchEvent(new Event('ended'));
  await playing;
});

for (const action of ['stop', 'abort', 'fail']) {
  test('host audio cannot launch after ' + action + ' during pending output routing', async () => {
    let route, fail;
    const pending = new Promise((resolve, reject) => {
      route = resolve;
      fail = reject;
    });
    const audio = new AudioMock();
    let plays = 0,
      disposals = 0;
    audio.setSinkId = () => pending;
    audio.play = () => {
      plays++;
      return Promise.resolve();
    };
    const engine = new HostAudioSpeakingEngine();
    const controller = new AbortController();
    const playing = engine.playPrepared(
      { audio, dispose: () => disposals++ },
      {
        outputDeviceId: 'selected',
        signal: controller.signal,
      },
    );
    const rejected = assert.rejects(
      playing,
      action === 'fail' ? /routing failed/ : { name: 'AbortError' },
    );
    await Promise.resolve();
    if (action === 'abort') controller.abort();
    if (action === 'stop') await engine.stop();
    if (action === 'fail') fail(new Error('routing failed'));
    else route();
    await rejected;
    assert.equal(plays, 0);
    assert.equal(engine.current, null);
    assert.ok(disposals > 0);
  });
}

test('host audio preparation aborts fetch and rejects stale work', async () => {
  const controller = new AbortController();
  const engine = new HostAudioSpeakingEngine({
    endpoint: '/speech',
    globals: {
      fetch: (_url, options) =>
        new Promise((_resolve, reject) =>
          options.signal.addEventListener('abort', () =>
            reject(Object.assign(new Error('aborted'), { name: 'AbortError' })),
          ),
        ),
      URL: {},
      Audio: class {},
    },
  });
  const preparing = engine.prepare('hello', { signal: controller.signal });
  controller.abort();
  await assert.rejects(preparing, { name: 'AbortError' });
});
