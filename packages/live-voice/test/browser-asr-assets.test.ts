// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, symlink, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { registerBrowserAsrAssets } from '../src/app/server/browserAsrAssets.ts';
test('browser ASR runtime routes expose exact versioned packaged assets and reject path/method/symlink abuse', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'browser-asr-assets-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await writeFile(join(directory, 'asr.worker.js'), 'self.onmessage=()=>{}');
  await symlink(join(directory, 'asr.worker.js'), join(directory, 'manifest.json'));
  const routes = [],
    effects = [];
  registerBrowserAsrAssets(
    {
      connection: {
        fetch: {
          register: (route) => {
            routes.push(route);
            return () => {};
          },
        },
      },
      effect: (fn) => effects.push(fn),
    },
    { version: '0.6.0', directory },
  );
  const worker = routes.find((route) => route.path.endsWith('asr.worker.js'));
  assert.ok(worker);
  assert.deepEqual(worker.methods, ['GET']);
  const response = await worker.fetch(new Request('https://dsh.local' + worker.path));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  const busted = await worker.fetch(
    new Request('https://dsh.local' + worker.path + '?runtime=new-model-catalog'),
  );
  assert.equal(busted.status, 200);
  assert.match(response.headers.get('content-type'), /javascript/);
  assert.equal(response.headers.get('cross-origin-resource-policy'), 'same-origin');
  assert.equal(
    (await worker.fetch(new Request('https://dsh.local' + worker.path + 'evil'))).status,
    404,
  );
  assert.equal(
    (await worker.fetch(new Request('https://dsh.local' + worker.path, { method: 'POST' }))).status,
    405,
  );
  const manifest = routes.find((route) => route.path.endsWith('manifest.json'));
  assert.equal(
    (await manifest.fetch(new Request('https://dsh.local' + manifest.path))).status,
    404,
  );
  const missing = routes.find((route) => route.path.endsWith('.wasm'));
  assert.equal((await missing.fetch(new Request('https://dsh.local' + missing.path))).status, 404);
  assert.throws(
    () => registerBrowserAsrAssets({}, { version: '../private', directory }),
    /invalid-version/,
  );
  assert.equal(effects.length, 1);
});
