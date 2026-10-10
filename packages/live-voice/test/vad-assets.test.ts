import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, writeFile, rm, readFile, readdir, symlink, truncate } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  registerVadAssetRoutes,
  VAD_ASSET_TYPES,
  MAX_VAD_ASSET_BYTES,
} from '../src/app/server/vadAssets.js';

function fixture(directory: string) {
  const routes = new Map<string, any>();
  let cleanup: () => unknown;
  const ctx = {
    connection: {
      fetch: {
        register(route: any) {
          routes.set(route.path, route);
          return () => routes.delete(route.path);
        },
      },
    },
    effect(callback: () => () => unknown) {
      cleanup = callback();
    },
  };
  registerVadAssetRoutes(ctx, { directory, version: '0.4.1' });
  return { routes, cleanup: () => cleanup(), ctx };
}
const base = '/api/dsh-live-voice/vad/0.4.1/';

test('VAD assets register only exact versioned GET paths and dispose all routes', () => {
  const { routes, cleanup } = fixture('/unused');
  assert.deepEqual(
    [...routes.keys()].sort(),
    Object.keys(VAD_ASSET_TYPES)
      .map((name) => base + name)
      .concat(base + 'availability')
      .sort(),
  );
  for (const route of routes.values()) {
    assert.deepEqual(route.methods, ['GET']);
    assert.equal(route.requestBody, 'buffered');
  }
  for (const suffix of [
    '../package.json',
    '%2e%2e/package.json',
    'nested/vad.worker.js',
    'unknown.js',
    'ort-wasm-simd-threaded.jsep.wasm',
  ])
    assert.equal(routes.has(base + suffix), false);
  assert.equal(routes.has('/api/dsh-live-voice/vad/old/vad.worker.js'), false);
  cleanup();
  assert.equal(routes.size, 0);
});

test('VAD assets return native binary responses, precise MIME, private cache and same-origin policy', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'dlv-vad-assets-'));
  try {
    const { routes } = fixture(directory);
    for (const [name, mime] of Object.entries(VAD_ASSET_TYPES)) {
      const bytes = new Uint8Array([0, 97, 115, 109, 255]);
      await writeFile(join(directory, name), bytes);
      const response = await routes
        .get(base + name)
        .fetch(new Request('http://localhost' + base + name));
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('content-type'), mime);
      assert.equal(response.headers.get('content-length'), '5');
      assert.match(response.headers.get('cache-control')!, /^private,.*immutable$/);
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
      assert.equal(response.headers.get('cross-origin-resource-policy'), 'same-origin');
      assert.equal(response.headers.has('access-control-allow-origin'), false);
      assert.deepEqual(new Uint8Array(await response.arrayBuffer()), bytes);
    }
    const route = routes.get(base + 'vad.worker.js');
    assert.equal(
      (
        await route.fetch(
          new Request('http://localhost' + base + 'vad.worker.js', { method: 'POST' }),
        )
      ).status,
      405,
    );
    assert.equal(
      (await route.fetch(new Request('http://localhost' + base + '%76ad.worker.js'))).status,
      404,
    );
    assert.equal(
      (await route.fetch(new Request('http://localhost' + base + '../package.json'))).status,
      404,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('Missing, symlinked, and oversized assets fail closed without filesystem details', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'dlv-vad-assets-'));
  try {
    const { routes } = fixture(directory);
    const request = new Request('http://localhost' + base + 'vad.worker.js');
    const route = routes.get(base + 'vad.worker.js');
    assert.equal((await route.fetch(request)).status, 404);
    await writeFile(join(directory, 'secret'), 'private');
    await symlink(join(directory, 'secret'), join(directory, 'vad.worker.js'));
    assert.equal((await route.fetch(request)).status, 404);
    await rm(join(directory, 'vad.worker.js'));
    await writeFile(join(directory, 'vad.worker.js'), '');
    await truncate(join(directory, 'vad.worker.js'), MAX_VAD_ASSET_BYTES + 1);
    const response = await route.fetch(request);
    assert.equal(response.status, 404);
    assert.equal(await response.text(), 'VAD asset unavailable');
    assert.equal(response.headers.get('cache-control'), 'no-store');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('Availability checks every required npm binary without downloading it', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'dlv-vad-availability-'));
  try {
    const { routes } = fixture(directory);
    const request = () =>
      routes
        .get(base + 'availability')
        .fetch(new Request('http://localhost' + base + 'availability'));
    assert.deepEqual(await (await request()).json(), { available: false });
    for (const name of [
      'vad.worker.js',
      'vad.capture.js',
      'silero_vad_v5.onnx',
      'ort-wasm-simd-threaded.mjs',
    ])
      await writeFile(join(directory, name), 'asset');
    assert.deepEqual(await (await request()).json(), { available: false });
    await writeFile(join(directory, 'ort-wasm-simd-threaded.wasm'), 'asset');
    assert.deepEqual(await (await request()).json(), { available: true });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('Invalid asset versions cannot add routes', () => {
  const { ctx } = fixture('/unused');
  for (const version of ['../secret', 'a/b', 'a%2fb', '', 'a?b'])
    assert.throws(() => registerVadAssetRoutes(ctx, { version }), /Invalid VAD asset version/);
});

test('Published lib VAD assets contain only matched WASM EP builds, model, licenses and complete hashes', async () => {
  const packageRoot = fileURLToPath(new URL('../', import.meta.url));
  const metadata = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'));
  assert.equal(metadata.dependencies['@ricky0123/vad-web'], '0.0.31');
  assert.equal(metadata.dependencies['onnxruntime-web'], '1.22.0');
  assert.ok(metadata.files.includes('lib/'));
  const worker = await readFile(join(packageRoot, 'lib/vad/vad.worker.js'), 'utf8');
  assert.ok(
    worker.includes(JSON.stringify(metadata.version)),
    'Worker must embed the package version',
  );
  const directory = join(packageRoot, 'lib/vad');
  assert.deepEqual((await readdir(directory)).sort(), Object.keys(VAD_ASSET_TYPES).sort());
  const manifest = JSON.parse(await readFile(join(directory, 'manifest.json'), 'utf8'));
  assert.equal(manifest.pluginVersion, metadata.version);
  assert.deepEqual(manifest.dependencies, {
    '@ricky0123/vad-web': '0.0.31',
    'onnxruntime-web': '1.22.0',
  });
  assert.deepEqual(
    Object.keys(manifest.files).sort(),
    Object.keys(VAD_ASSET_TYPES)
      .filter((name) => name !== 'manifest.json')
      .sort(),
  );
  for (const [name, entry] of Object.entries(manifest.files) as [string, any][]) {
    const bytes = await readFile(join(directory, name));
    assert.equal(entry.bytes, bytes.length);
    assert.equal(entry.sha256, createHash('sha256').update(bytes).digest('hex'));
    assert.ok(bytes.length > 0 && bytes.length <= MAX_VAD_ASSET_BYTES);
  }
  assert.match(await readFile(join(directory, 'LICENSE.silero.txt'), 'utf8'), /Silero Team/);
  assert.match(
    await readFile(join(directory, 'LICENSE.onnxruntime.txt'), 'utf8'),
    /Microsoft Corporation/,
  );
  const { routes } = fixture(directory);
  for (const filename of Object.keys(VAD_ASSET_TYPES))
    assert.equal(
      (await routes.get(base + filename).fetch(new Request('http://localhost' + base + filename)))
        .status,
      200,
    );
});

test(
  'Installed DSH native asset admission and exact dispatch',
  {
    skip:
      !process.env.DSH_CONNECTION_MODULE &&
      'Set DSH_CONNECTION_MODULE to installed connection lib/index.js',
  },
  async () => {
    // Real registry/trust logic with a fixture browser-auth owner, not cookie minting.
    const { HostConnectionService } = await import(process.env.DSH_CONNECTION_MODULE!);
    const service = Object.create(HostConnectionService.prototype);
    Object.assign(service, {
      fetchRoutes: new Map(),
      interceptors: new Map(),
      trustedHosts: [],
      ctx: { get: () => undefined },
      operator: {},
      browserAuth: {
        isAuthenticated: (request: any) => request.headers.get('cookie') === 'fixture=valid',
      },
    });
    const owner = { effect: (callback: () => () => unknown) => callback() };
    const directory = await mkdtemp(join(tmpdir(), 'dlv-vad-connection-'));
    try {
      await writeFile(join(directory, 'vad.worker.js'), 'self.fixture = true;');
      registerVadAssetRoutes(
        {
          connection: {
            fetch: { register: (route: any) => service.registerFetchRoute(owner, route) },
          },
          effect: () => undefined,
        },
        { directory, version: '0.4.1' },
      );
      const handler = service.createSharedFetchHandler('/api');
      async function admitted(request: Request) {
        const result = service.admit(request);
        return 'rejection' in result
          ? new Response(null, { status: result.rejection })
          : handler.fetch(request);
      }
      const url = 'http://localhost:3080' + base + 'vad.worker.js';
      assert.equal(
        (await admitted(new Request(url, { headers: { host: 'localhost:3080' } }))).status,
        401,
      );
      const headers = {
        host: 'localhost:3080',
        cookie: 'fixture=valid',
        'sec-fetch-site': 'same-origin',
      };
      assert.equal((await admitted(new Request(url, { headers }))).status, 200);
      assert.equal(
        (
          await admitted(
            new Request(url, { headers: { ...headers, origin: 'http://localhost:3080' } }),
          )
        ).status,
        200,
      );
      assert.equal(
        (
          await admitted(
            new Request(url, { headers: { ...headers, origin: 'https://evil.invalid' } }),
          )
        ).status,
        403,
      );
      assert.equal(
        (
          await admitted(
            new Request(url, { headers: { ...headers, 'sec-fetch-site': 'cross-site' } }),
          )
        ).status,
        403,
      );
      assert.equal((await admitted(new Request(url, { method: 'POST', headers }))).status, 404);
      for (const name of ['unknown.js', '%76ad.worker.js'])
        assert.equal(
          (await admitted(new Request('http://localhost:3080' + base + name, { headers }))).status,
          404,
        );
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  },
);

// Authentication belongs to DSH's HTTP carrier BEFORE Fetch registry dispatch.
// These fixture tests do not claim to validate browser-session admission. The
// lead must verify native Worker/import GETs against the authenticated DSH runtime.
