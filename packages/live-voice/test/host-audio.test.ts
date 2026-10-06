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
  const playing = engine.playPrepared(prepared);
  await Promise.resolve();
  assert.equal(audio.paused, false);
  audio.dispatchEvent(new Event('ended'));
  await playing;
  assert.deepEqual(revoked, ['blob:test']);
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
