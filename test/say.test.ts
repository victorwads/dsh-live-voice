// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { SayEngine } from '../src/engines/speaking/say.ts';

const turn = () => new Promise((resolve) => setImmediate(resolve));
function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}
function fixture(options = {}) {
  const calls = []; const children = []; let counter = 0;
  const fs = {
    async access(...args) { calls.push(['access', ...args]); },
    async mkdtemp(prefix) { const path = prefix + ++counter; calls.push(['mkdtemp', path]); return path; },
    async chmod(...args) { calls.push(['chmod', ...args]); },
    async writeFile(...args) { calls.push(['writeFile', ...args]); },
    async rm(...args) { calls.push(['rm', ...args]); },
    ...options.fs,
  };
  const spawn = (...args) => {
    calls.push(['spawn', ...args]);
    if (options.spawnError) throw options.spawnError;
    const child = new EventEmitter(); child.signals = [];
    child.kill = (signal) => {
      child.signals.push(signal);
      options.kill?.(child, signal);
      return options.killResult ?? true;
    };
    children.push(child); return child;
  };
  const engine = new SayEngine({ fs, spawn, platform: 'darwin', tempRoot: '/fake-temp',
    killAfterMs: 5, closeAfterMs: 10, ...options.engine });
  return { engine, calls, children };
}

test('secure UTF-8 file argv; only close plus cleanup resolves speech', async () => {
  const cleanup = deferred();
  const { engine, calls, children } = fixture({ fs: { rm: () => cleanup.promise } });
  let settled = false;
  const text = '-v evil; $(touch /tmp/not-executed) 你好';
  const speech = engine.speak(text, { voice: 'Samantha', rate: 180 }).then(() => { settled = true; });
  await turn();
  assert.equal(engine.state, 'speaking');
  assert.deepEqual(calls.find(([name]) => name === 'writeFile').slice(2),
    [text, { encoding: 'utf8', mode: 0o600, flag: 'wx' }]);
  assert.deepEqual(calls.filter(([name]) => name === 'chmod').map((call) => call[2]), [0o700, 0o600]);
  assert.deepEqual(calls.find(([name]) => name === 'spawn').slice(1), [
    '/usr/bin/say', ['-f', '/fake-temp/dsh-live-voice-say-1/speech.txt', '-v', 'Samantha', '-r', '180'],
    { shell: false, stdio: 'ignore' },
  ]);
  children[0].emit('exit', 0, null); await turn(); assert.equal(settled, false);
  children[0].emit('close', 0, null); await turn(); assert.equal(settled, false);
  cleanup.resolve(); await speech;
  assert.equal(engine.state, 'idle'); assert.equal(engine.lastError, null);
});

test('capability checks platform and executable independently without spawning', async () => {
  const linux = fixture({ engine: { platform: 'linux' } });
  assert.deepEqual(await linux.engine.getCapabilities(),
    { supported: false, pause: false, resume: false, reason: 'unsupported-platform' });
  await assert.rejects(linux.engine.speak('hello'), { code: 'SAY_UNAVAILABLE' });
  assert.equal(linux.calls.length, 0);
  const unavailable = fixture({ fs: { access: async () => { throw new Error('missing'); } } });
  assert.equal((await unavailable.engine.getCapabilities()).reason, 'executable-unavailable');
  await assert.rejects(unavailable.engine.speak('hello'), { code: 'SAY_UNAVAILABLE' });
  assert.equal(unavailable.children.length, 0);
  assert.equal((await fixture().engine.getCapabilities()).pause, true);
});

test('spawn throw, process error, and nonzero close clean temporary files', async () => {
  const problem = new Error('spawn failed');
  const thrown = fixture({ spawnError: problem });
  await assert.rejects(thrown.engine.speak('hello'), (error) => error === problem);
  assert.equal(thrown.calls.at(-1)[0], 'rm');
  for (const emittedError of [true, false]) {
    const { engine, calls, children } = fixture();
    const speech = engine.speak('hello');
    const rejection = assert.rejects(speech, emittedError ? (error) => error === problem : { code: 'SAY_EXIT_FAILED' });
    await turn();
    if (emittedError) {
      children[0].emit('error', problem); await turn();
      assert.equal(calls.some(([name]) => name === 'rm'), false);
    }
    children[0].emit('close', 1, null); await rejection;
    assert.equal(calls.at(-1)[0], 'rm'); assert.equal(engine.state, 'error');
    assert.ok(engine.lastError);
  }
});

test('pre-abort does not allocate or spawn and abort during preparation cleans', async () => {
  const controller = new AbortController(); controller.abort('obsolete');
  const before = fixture();
  await assert.rejects(before.engine.speak('hello', { signal: controller.signal }), { name: 'AbortError' });
  assert.equal(before.calls.length, 0);
  const allocation = deferred(); const running = new AbortController();
  const during = fixture({ fs: { mkdtemp: () => allocation.promise } });
  const speech = during.engine.speak('hello', { signal: running.signal });
  const rejection = assert.rejects(speech, { name: 'AbortError' });
  await turn(); running.abort(); allocation.resolve('/fake-temp/private'); await rejection;
  assert.equal(during.children.length, 0);
  assert.deepEqual(during.calls.at(-1), ['rm', '/fake-temp/private', { recursive: true, force: true }]);
});

test('abort waits for close and cleanup; stop is asynchronous and idempotent', async () => {
  const cleanup = deferred(); const controller = new AbortController();
  const { engine, children } = fixture({ fs: { rm: () => cleanup.promise } });
  const speech = engine.speak('hello', { signal: controller.signal });
  const rejection = assert.rejects(speech, { name: 'AbortError' });
  await turn(); controller.abort();
  let stopped = false; const stop = engine.stop().then(() => { stopped = true; });
  assert.equal(engine.state, 'stopping'); assert.deepEqual(children[0].signals, ['SIGTERM']);
  children[0].emit('close', null, 'SIGTERM'); await turn(); assert.equal(stopped, false);
  cleanup.resolve(); await Promise.all([rejection, stop]);
  assert.equal(engine.state, 'idle'); await engine.stop();
});

test('replacement serializes through cleanup and only latest queued request spawns', async () => {
  const cleanup = deferred(); let removed = 0;
  const { engine, children } = fixture({ fs: { rm: () => ++removed === 1 ? cleanup.promise : Promise.resolve() } });
  const first = assert.rejects(engine.speak('first'), { name: 'AbortError' }); await turn();
  const second = assert.rejects(engine.speak('second'), { name: 'AbortError' });
  const third = engine.speak('third');
  assert.deepEqual(children[0].signals, ['SIGTERM']);
  children[0].emit('close', null, 'SIGTERM'); await turn(); assert.equal(children.length, 1);
  cleanup.resolve(); await Promise.all([first, second]); await turn();
  assert.equal(children.length, 2); children[1].emit('close', 0, null); await third;
});

test('pause and resume signal actual process; stopping paused speech wakes it first', async () => {
  const { engine, children } = fixture(); assert.equal(engine.pause(), false);
  const speech = assert.rejects(engine.speak('hello'), { name: 'AbortError' }); await turn();
  assert.equal(engine.pause(), true); assert.equal(engine.state, 'paused'); assert.equal(engine.pause(), false);
  assert.equal(engine.resume(), true); assert.equal(engine.state, 'speaking');
  assert.equal(engine.pause(), true);
  const stopped = engine.stop(); assert.equal(engine.resume(), false);
  assert.deepEqual(children[0].signals, ['SIGSTOP', 'SIGCONT', 'SIGSTOP', 'SIGCONT', 'SIGTERM']);
  children[0].emit('close', null, 'SIGTERM'); await Promise.all([speech, stopped]);
});

test('failed pause signal is exposed without falsely changing state', async () => {
  const { engine, children } = fixture({ killResult: false });
  const speech = engine.speak('hello'); await turn();
  assert.equal(engine.pause(), false); assert.equal(engine.state, 'speaking');
  assert.equal(engine.lastError.code, 'SAY_SIGNAL_FAILED');
  children[0].emit('close', 0, null); await speech;
});

test('cancellation escalates to SIGKILL and still waits for close', async () => {
  const { engine, children } = fixture({ kill(child, signal) {
    if (signal === 'SIGKILL') child.emit('close', null, signal);
  } });
  const speech = assert.rejects(engine.speak('hello'), { name: 'AbortError' }); await turn();
  await engine.stop(); await speech;
  assert.deepEqual(children[0].signals, ['SIGTERM', 'SIGKILL']);
});

test('unclosed child times out with error, cleans, and blocks overlapping speech', async () => {
  const { engine, children, calls } = fixture();
  const speech = assert.rejects(engine.speak('hello'), { code: 'SAY_STOP_TIMEOUT' }); await turn();
  await assert.rejects(engine.stop(), { code: 'SAY_STOP_TIMEOUT' }); await speech;
  assert.equal(engine.state, 'error'); assert.equal(calls.at(-1)[0], 'rm');
  await assert.rejects(engine.speak('never overlap'), { code: 'SAY_PROCESS_UNCLOSED' });
  assert.equal(children.length, 1);
  children[0].emit('close', null, 'SIGKILL');
  const next = engine.speak('safe now'); await turn();
  children[1].emit('close', 0, null); await next;
});

test('file preparation failure cleans; cleanup failure is exposed and never resolves', async () => {
  const brokenWrite = fixture({ fs: { writeFile: async () => { throw new Error('write failed'); } } });
  await assert.rejects(brokenWrite.engine.speak('hello'), /write failed/);
  assert.equal(brokenWrite.children.length, 0); assert.equal(brokenWrite.calls.at(-1)[0], 'rm');
  const { engine, children } = fixture({ fs: { rm: async () => { throw new Error('cleanup failed'); } } });
  const speech = assert.rejects(engine.speak('hello'), { code: 'SAY_CLEANUP_FAILED' }); await turn();
  children[0].emit('close', 0, null); await speech;
  assert.equal(engine.lastError.code, 'SAY_CLEANUP_FAILED');
});

test('abort during cleanup rejects instead of publishing stale success', async () => {
  const cleanup = deferred(); const controller = new AbortController();
  const { engine, children } = fixture({ fs: { rm: () => cleanup.promise } });
  const speech = assert.rejects(engine.speak('hello', { signal: controller.signal }), { name: 'AbortError' });
  await turn(); children[0].emit('close', 0, null); await turn();
  controller.abort(); cleanup.resolve(); await speech;
  assert.equal(engine.state, 'idle');
});

test('stop cancels queued replacements without spawning them', async () => {
  const { engine, children } = fixture();
  const first = assert.rejects(engine.speak('first'), { name: 'AbortError' }); await turn();
  const second = assert.rejects(engine.speak('second'), { name: 'AbortError' });
  const stopped = engine.stop();
  children[0].emit('close', null, 'SIGTERM'); await Promise.all([first, second, stopped]);
  assert.equal(children.length, 1); assert.equal(engine.state, 'idle');
});

test('invalid options reject before affecting an active request', async () => {
  const { engine, children } = fixture(); const speech = engine.speak('hello'); await turn();
  for (const [text, options] of [[null, {}], ['hello', { rate: 0 }], ['hello', { rate: Infinity }],
    ['hello', { voice: '' }], ['hello', { voice: 'bad\0voice' }], ['hello', { signal: {} }], ['hello', { signal: null }]]) {
    await assert.rejects(engine.speak(text, options), TypeError);
  }
  assert.deepEqual(children[0].signals, []); children[0].emit('close', 0, null); await speech;
  assert.throws(() => new SayEngine({ killAfterMs: -1 }), TypeError);
});
