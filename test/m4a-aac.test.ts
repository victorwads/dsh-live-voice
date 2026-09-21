// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { wavToM4aAac } from '../src/engines/speaking/m4a-aac.ts';

test('AAC transcoder securely converts WAV and removes temporary files', async () => {
  const calls = [];
  const result = Buffer.from([0, 0, 0, 16, 0x66, 0x74, 0x79, 0x70, 0x4d, 0x34, 0x41, 0x20, 0, 0, 0, 0]);
  const fs = {
    async mkdtemp(prefix) { calls.push(['mkdtemp', prefix]); return '/tmp/dsh-live-voice-aac-1'; },
    async chmod(path, mode) { calls.push(['chmod', path, mode]); },
    async writeFile(path, bytes, options) { calls.push(['writeFile', path, Buffer.from(bytes), options]); },
    async readFile(path) { calls.push(['readFile', path]); return result; },
    async rm(path, options) { calls.push(['rm', path, options]); },
  };
  const run = async (file, args, options) => calls.push(['run', file, args, options]);
  const output = await wavToM4aAac(Buffer.from('RIFF1234WAVE'.padEnd(44, ' ')), { fs, run, tempRoot: '/tmp' });
  assert.deepEqual(output, result);
  assert.deepEqual(calls.find(([kind]) => kind === 'run').slice(1, 3), [
    '/usr/bin/afconvert',
    ['-f', 'm4af', '-d', 'aac', '-b', '64000', '/tmp/dsh-live-voice-aac-1/speech.wav', '/tmp/dsh-live-voice-aac-1/speech.m4a'],
  ]);
  assert.deepEqual(calls.at(-1), ['rm', '/tmp/dsh-live-voice-aac-1', { recursive: true, force: true }]);
});

test('AAC transcoder rejects stale work and still removes its directory', async () => {
  const controller = new AbortController();
  let removed = false;
  const fs = {
    async mkdtemp() { return '/tmp/dsh-live-voice-aac-2'; }, async chmod() {}, async writeFile() {},
    async readFile() { throw new Error('should not read'); }, async rm() { removed = true; },
  };
  const run = async () => { controller.abort(); };
  await assert.rejects(wavToM4aAac(Buffer.alloc(44), { fs, run, signal: controller.signal }), { name: 'AbortError' });
  assert.equal(removed, true);
});
