// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { VoiceCoordinator } from '../src/modules/core/coordinator.ts';
import { HostAudioSpeakingEngine } from '../src/modules/speak/engines/audio/HostAudioEngine.ts';
import { QwenHttpSpeakingEngine } from '../src/modules/speak/engines/qwen/QwenSpeakingEngine.ts';
const turn = () => new Promise((resolve) => setImmediate(resolve));
function coordinator(engine, settings = {}) {
  return new VoiceCoordinator({
    engines: { browser: engine },
    settings: { mode: 'headphones', segmentGapMs: 0, ...settings },
    recognition: { stop() {} },
    meter: { stop() {} },
    composer: { getDraft: () => '', setDraft() {} },
  });
}

for (const provider of ['say', 'qwen']) {
  test(
    provider + ' HTTP uses the same prefetch pipeline and never requests the next segment again',
    async (t) => {
      const requests = [],
        audio = [],
        revoked = [];
      let nextUrl = 0;
      const globals = {
        fetch: async (url, options) => {
          requests.push({ url, ...JSON.parse(options.body) });
          return new Response(new Blob(['test'], { type: 'audio/mp4' }));
        },
        URL: {
          createObjectURL: () => 'blob:' + ++nextUrl,
          revokeObjectURL: (url) => revoked.push(url),
        },
        Audio: class extends EventTarget {
          constructor(url) {
            super();
            this.url = url;
            this.paused = true;
            audio.push(this);
          }
          async play() {
            this.paused = false;
            this.dispatchEvent(new Event('playing'));
          }
          pause() {
            this.paused = true;
          }
        },
      };
      const engine =
        provider === 'qwen'
          ? new QwenHttpSpeakingEngine({ globals })
          : new HostAudioSpeakingEngine({ globals, endpoint: '/api/dsh-live-voice/speech' });
      const c = coordinator(engine);
      t.after(() => c.dispose());
      c.observeMessage('message', 'First. Second. Third. Fourth.\n');
      await turn();
      assert.equal(audio.filter((value) => !value.paused).length, 1);
      const initialRequests = requests.length;
      assert.equal(initialRequests, 4, 'three future segments prepare while the first plays');
      assert.equal(
        c.queue.every((item) => item.prepared),
        true,
      );
      const first = audio.find((value) => !value.paused);
      first.paused = true;
      first.dispatchEvent(new Event('ended'));
      await turn();
      assert.equal(c.snapshot.speechText, 'Second.');
      assert.equal(requests.length, initialRequests, 'next playback reuses prepared audio');
      await c.stopSpeech(false);
      assert.equal(c.snapshot.speechRunActive, false);
      assert.equal(new Set(revoked).size, initialRequests);
    },
  );
}

test('resuming paused synthesis tears down newly enabled speaker-mode input before playback', async () => {
  let ready, finish;
  const events = [];
  const engine = {
    prepare: () =>
      new Promise((resolve) => {
        ready = resolve;
      }),
    playPrepared: () => {
      events.push('play');
      return new Promise((resolve) => {
        finish = resolve;
      });
    },
    stop: () => finish?.(),
  };
  const c = coordinator(engine, { mode: 'speaker' });
  c.recognition = {
    capability: () => ({ supported: true }),
    start() {
      events.push('input:start');
    },
    stop() {
      events.push('input:stop');
    },
  };
  c.meter = { start: () => true, stop() {} };
  c.observeMessage('reply', 'Held reply.', { complete: true });
  await turn();
  await c.pauseSpeech();
  await c.startConversation();
  assert.equal(c.snapshot.listening, true);
  ready({ dispose() {} });
  await turn();
  await c.resumeSpeech();
  await turn();
  assert.equal(c.snapshot.listening, false);
  assert.ok(events.lastIndexOf('input:stop') > events.indexOf('input:start'));
  assert.ok(events.indexOf('play') > events.lastIndexOf('input:stop'));
  await c.dispose();
});

test('resume followed immediately by pause cannot bypass a pending launch gate', async () => {
  let ready, finish;
  let plays = 0;
  const engine = {
    prepare: () =>
      new Promise((resolve) => {
        ready = resolve;
      }),
    playPrepared: () => {
      plays++;
      return new Promise((resolve) => {
        finish = resolve;
      });
    },
    stop: () => finish?.(),
    pause: () => true,
  };
  const c = coordinator(engine);
  c.observeMessage('reply', 'Held reply.', { complete: true });
  await turn();
  await c.pauseSpeech();
  ready({ dispose() {} });
  await turn();
  const resumed = c.resumeSpeech();
  const paused = c.pauseSpeech();
  await Promise.all([resumed, paused]);
  await turn();
  assert.equal(c.snapshot.paused, true);
  assert.equal(plays, 0);
  await c.resumeSpeech();
  await turn();
  assert.equal(plays, 1);
  await c.dispose();
});

for (const action of ['resume', 'stop']) {
  test('pause during synthesis blocks late playback until ' + action, async () => {
    let ready, finish;
    const prepared = { dispose() {} };
    let plays = 0;
    const engine = {
      prepare: () =>
        new Promise((resolve) => {
          ready = resolve;
        }),
      playPrepared: () => {
        plays++;
        return new Promise((resolve) => {
          finish = resolve;
        });
      },
      pause: () => false,
      stop: () => finish?.(),
    };
    const c = coordinator(engine);
    c.observeMessage('message', 'Reply.', { complete: true });
    await turn();
    await c.pauseSpeech();
    assert.equal(c.snapshot.paused, true);
    ready(prepared);
    await turn();
    assert.equal(plays, 0, 'late preparation cannot launch a paused segment');
    if (action === 'resume') {
      await c.resumeSpeech();
      await turn();
      assert.equal(plays, 1);
    } else {
      await c.stopSpeech(false);
      await turn();
      assert.equal(plays, 0);
      assert.equal(c.listeners.size, 0, 'cancel releases the launch-gate subscription');
    }
    await c.dispose();
  });
}
