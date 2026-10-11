// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { getEventListeners } from 'node:events';
import { BrowserRecognitionEngine } from '../src/modules/recognition/engines/browser/BrowserRecognitionEngine.ts';
import { detectExternalAudioSupport } from '../src/modules/recognition/engines/browser/externalAudioSupport.ts';

function fixture({
  overload = true,
  policy = 'denied',
  load = true,
  local = true,
  prefixed = false,
  probeError,
} = {}) {
  const frames = [],
    probes = [],
    instances = [],
    starts = [],
    timers = new Map(),
    checks = [],
    installs = [];
  let micCaptures = 0,
    available = 'available',
    id = 0;
  const video = {
    kind: 'video',
    readyState: 'live',
    stops: 0,
    stop() {
      this.stops++;
      this.readyState = 'ended';
    },
  };
  const audio = {
    kind: 'audio',
    readyState: 'live',
    stops: 0,
    stop() {
      this.stops++;
      this.readyState = 'ended';
    },
  };
  class Recognition {
    static async available(options) {
      checks.push(options);
      return available;
    }
    static async install(options) {
      installs.push(options);
      available = 'available';
      return true;
    }
    constructor() {
      if (local) this.processLocally = false;
      instances.push(this);
    }
    start() {
      this.track = arguments[0];
      starts.push(this);
    }
    abort() {
      this.aborted = true;
      this.onend?.();
    }
    stop() {
      this.onend?.();
    }
  }
  class FrameRecognition {
    constructor() {
      probes.push(this);
    }
    start() {
      const track = arguments[0],
        frame = frames.at(-1);
      assert.equal(frame.allow, "microphone 'none'");
      assert.equal(frame.isConnected, true);
      assert.equal(track, video);
      assert.equal(track.readyState, 'ended');
      if (probeError) throw Object.assign(new Error('probe failed'), { name: probeError });
      if (overload) throw Object.assign(new Error('invalid track'), { name: 'InvalidStateError' });
      // A legacy API ignores the track, but the verified policy denies capture.
      if (frame.contentDocument.featurePolicy.allowsFeature('microphone')) micCaptures++;
    }
    abort() {
      this.aborted = true;
    }
  }
  const globals = {
    [prefixed ? 'webkitSpeechRecognition' : 'SpeechRecognition']: Recognition,
    navigator: {
      mediaDevices: {
        getUserMedia() {
          micCaptures++;
          assert.fail('probe must not capture');
        },
      },
    },
    setTimeout(fn) {
      timers.set(++id, fn);
      return id;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
    document: {
      body: {
        append(frame) {
          frame.isConnected = true;
          if (load) frame.onload();
        },
      },
      createElement(tag) {
        assert.equal(tag, 'iframe');
        const frame = {
          isConnected: false,
          remove() {
            this.isConnected = false;
            this.removed = true;
          },
          contentWindow: {
            [prefixed ? 'webkitSpeechRecognition' : 'SpeechRecognition']: FrameRecognition,
          },
          contentDocument: {
            featurePolicy:
              policy === 'missing'
                ? undefined
                : {
                    features: () => (policy === 'unknown' ? [] : ['microphone']),
                    allowsFeature: () => policy === 'allowed',
                  },
            createElement(tag) {
              assert.equal(tag, 'canvas');
              return {
                captureStream: () => ({ getVideoTracks: () => [video], getTracks: () => [video] }),
              };
            },
          },
        };
        frames.push(frame);
        return frame;
      },
    },
  };
  const meter = { stream: { getAudioTracks: () => [audio] } };
  return {
    globals,
    meter,
    audio,
    video,
    frames,
    probes,
    starts,
    instances,
    timers,
    checks,
    installs,
    micCaptures: () => micCaptures,
    availability: (value) => {
      available = value;
    },
    engine: (options) =>
      new BrowserRecognitionEngine({ globals, meter, inputSource: 'shared', ...options }),
    tick() {
      const pending = [...timers.values()];
      timers.clear();
      pending.forEach((fn) => fn());
    },
  };
}

for (const prefixed of [false, true])
  test(
    'safe overload probe accepts optional start.length=0, including prefixed constructor ' +
      prefixed,
    async () => {
      const f = fixture({ prefixed });
      assert.equal(
        f.globals[prefixed ? 'webkitSpeechRecognition' : 'SpeechRecognition'].prototype.start
          .length,
        0,
      );
      assert.equal(await detectExternalAudioSupport(f.globals), true);
      assert.equal(f.probes.length, 1);
      assert.equal(f.probes[0].aborted, true);
      assert.equal(f.frames[0].removed, true);
      assert.equal(f.frames[0].onload, null);
      assert.equal(f.video.readyState, 'ended');
      assert.equal(f.audio.stops, 0);
      assert.equal(f.micCaptures(), 0);
      assert.equal(f.timers.size, 0);
      assert.equal(f.starts.length, 0);
    },
  );

for (const options of [
  { overload: false },
  { policy: 'missing' },
  { policy: 'unknown' },
  { policy: 'allowed' },
  { probeError: 'NotAllowedError' },
  { probeError: 'TypeError' },
])
  test('unsafe or unsupported probe fails closed ' + JSON.stringify(options), async () => {
    const f = fixture(options);
    assert.equal(await detectExternalAudioSupport(f.globals), false);
    assert.equal(f.micCaptures(), 0);
    assert.equal(f.starts.length, 0);
    assert.equal(f.frames[0].removed, true);
    assert.equal(f.timers.size, 0);
    if (options.policy) assert.equal(f.probes.length, 0);
    else assert.equal(f.probes[0].aborted, true);
  });

test('probe timeout, abort, unavailable DOM and detached frames release resources without starting recognition', async () => {
  assert.equal(await detectExternalAudioSupport({}), false);
  const f = fixture({ load: false }),
    abort = new AbortController();
  const pending = detectExternalAudioSupport(f.globals, { signal: abort.signal });
  abort.abort();
  assert.equal(await pending, false);
  assert.equal(getEventListeners(abort.signal, 'abort').length, 0);
  assert.equal(f.timers.size, 0);
  assert.equal(f.frames[0].removed, true);
  const timed = fixture({ load: false }),
    timeout = detectExternalAudioSupport(timed.globals);
  timed.tick();
  assert.equal(await timeout, false);
  assert.equal(timed.frames[0].removed, true);
  const detached = fixture({ load: false }),
    work = detectExternalAudioSupport(detached.globals);
  detached.frames[0].isConnected = false;
  detached.frames[0].onload();
  assert.equal(await work, false);
  assert.equal(detached.probes.length, 0);
});

test('shared capability separates external support from local packs and preserves remote opt-in/autoInstall', async () => {
  const unsupported = fixture({ overload: false });
  const denied = unsupported.engine();
  assert.deepEqual(await denied.capability(), {
    supported: false,
    local: true,
    externalAudio: false,
    code: 'external-audio-unsupported',
    reason:
      'This browser cannot safely recognize shared audio. Choose Qwen or Whisper HTTP for shared audio.',
  });
  assert.equal(unsupported.checks.length, 0);
  await assert.rejects(denied.start(), { code: 'external-audio-unsupported' });
  assert.equal(unsupported.starts.length, 0);
  const f = fixture({ local: false }),
    engine = f.engine();
  const local = await engine.capability();
  assert.equal(local.externalAudio, true);
  assert.equal(local.supported, false);
  assert.equal(local.code, 'browser-local-unavailable');
  await assert.rejects(engine.start(), { code: 'browser-local-unavailable' });
  assert.equal(f.starts.length, 0);
  const remote = f.engine({ processLocally: false });
  assert.equal((await remote.capability()).local, false);
  await remote.start();
  assert.equal(f.starts.at(-1).track, f.audio);
  await remote.stop();
  const packs = fixture();
  packs.availability('downloadable');
  assert.equal((await packs.engine({ autoInstallLocalPack: false }).capability()).supported, false);
  assert.equal(packs.installs.length, 0);
  assert.equal((await packs.engine().capability()).supported, true);
  assert.equal(packs.installs.length, 1);
  assert.equal(packs.checks.at(-1).processLocally, true);
});

test('shared Browser forwards the exact meter-owned track across restart/reset and filters stale results/activity', async () => {
  const f = fixture(),
    engine = f.engine(),
    results = [],
    activity = [];
  await engine.start({
    onResult: (result) => results.push(result),
    onActivity: (value) => activity.push(value),
  });
  const first = f.starts.at(-1),
    stale = first.onresult;
  first.onspeechstart();
  first.onspeechend();
  first.onresult({
    results: [Object.assign([{ transcript: 'meeting words' }], { isFinal: true })],
  });
  first.onend();
  f.tick();
  const second = f.starts.at(-1);
  assert.notEqual(second, first);
  assert.equal(engine.reset(), true);
  const third = f.starts.at(-1);
  assert.deepEqual(
    f.starts.map((r) => r.track),
    [f.audio, f.audio, f.audio],
  );
  stale({ results: [Object.assign([{ transcript: 'obsolete' }], { isFinal: true })] });
  assert.equal(results.length, 1);
  assert.deepEqual(activity, [true, false]);
  assert.equal(first.onresult, null);
  assert.equal(second.onresult, null);
  await engine.stop();
  assert.equal(third.aborted, true);
  assert.equal(f.audio.stops, 0);
  assert.equal(f.meter.stream.getAudioTracks()[0].readyState, 'live');
  assert.equal(f.timers.size, 0);
});

for (const invalid of ['ended', 'video', 'missing'])
  test('shared track validation never falls back to microphone: ' + invalid, async () => {
    const f = fixture(),
      engine = f.engine();
    if (invalid === 'ended') f.audio.readyState = 'ended';
    if (invalid === 'video') f.audio.kind = 'video';
    if (invalid === 'missing') f.meter.stream = null;
    await assert.rejects(engine.start(), {
      name: 'InvalidStateError',
      code: 'invalid-audio-track',
    });
    assert.equal(f.starts.length, 0);
    assert.equal(f.audio.stops, 0);
    assert.equal(engine.active, false);
  });

test('ended track on restart or reset fails without replacing/ending the meter track', async () => {
  for (const reset of [false, true]) {
    const f = fixture(),
      engine = f.engine(),
      errors = [];
    await engine.start({ onError: (error) => errors.push(error) });
    f.audio.readyState = 'ended';
    f.meter.stream = { getAudioTracks: () => [{ kind: 'audio', readyState: 'live' }] };
    if (reset) assert.equal(engine.reset(), false);
    else {
      f.starts.at(-1).onend();
      f.tick();
    }
    assert.equal(errors[0].code, 'invalid-audio-track');
    assert.equal(f.starts.length, 1);
    assert.equal(engine.active, false);
    assert.equal(f.audio.stops, 0);
  }
});

test('stop during shared capability discovery cancels the iframe and obsolete native start', async () => {
  const f = fixture({ load: false }),
    engine = f.engine();
  const work = engine.start();
  await engine.stop();
  await assert.rejects(work, { name: 'AbortError' });
  assert.equal(f.frames[0].removed, true);
  assert.equal(f.timers.size, 0);
  assert.equal(f.starts.length, 0);
  assert.equal(f.audio.stops, 0);
});

test('ordinary microphone Browser recognition never probes DOM or forwards a meter track', async () => {
  const f = fixture(),
    engine = new BrowserRecognitionEngine({ globals: f.globals, meter: f.meter });
  await engine.start();
  assert.equal(f.frames.length, 0);
  assert.equal(f.starts[0].track, undefined);
  await engine.stop();
  assert.equal(f.audio.stops, 0);
});

test('DOM/canvas failures and abort exceptions fail closed and still remove the frame', async () => {
  const dom = fixture();
  dom.globals.document.body.append = () => {
    throw new Error('CSP blocked');
  };
  assert.equal(await detectExternalAudioSupport(dom.globals), false);
  assert.equal(dom.frames[0].removed, true);
  assert.equal(dom.timers.size, 0);
  const canvas = fixture({ load: false });
  const work = detectExternalAudioSupport(canvas.globals);
  canvas.frames[0].contentDocument.createElement = () => {
    throw new Error('canvas unavailable');
  };
  canvas.frames[0].onload();
  assert.equal(await work, false);
  assert.equal(canvas.frames[0].removed, true);
  assert.equal(canvas.probes.length, 0);
  const abort = fixture({ load: false });
  const pending = detectExternalAudioSupport(abort.globals);
  abort.frames[0].contentWindow.SpeechRecognition.prototype.abort = () => {
    throw new Error('abort failed');
  };
  abort.frames[0].onload();
  assert.equal(await pending, false);
  assert.equal(abort.frames[0].removed, true);
  assert.equal(abort.video.readyState, 'ended');
  assert.equal(abort.micCaptures(), 0);
});

test('shared native start failure and graceful finish do not stop the meter-owned track', async () => {
  const failed = fixture();
  failed.globals.SpeechRecognition.prototype.start = function () {
    throw new Error('native start failed');
  };
  const broken = failed.engine();
  await assert.rejects(broken.start(), /native start failed/);
  assert.equal(broken.active, false);
  assert.equal(failed.instances.at(-1).aborted, true);
  assert.equal(failed.audio.stops, 0);
  const f = fixture(),
    engine = f.engine();
  await engine.start();
  await engine.finish();
  assert.equal(engine.active, false);
  assert.equal(f.audio.stops, 0);
  assert.equal(f.timers.size, 0);
  await engine.stop();
  assert.equal(f.audio.stops, 0);
});
