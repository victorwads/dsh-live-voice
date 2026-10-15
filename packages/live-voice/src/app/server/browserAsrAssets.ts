import { lstat, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
declare const __DLV_VERSION__: string;
/** Exact packaged filenames; model weights go directly to browser storage, not through host paths. */
export function registerBrowserAsrAssets(
  ctx: any,
  options: { version?: string; directory?: string } = {},
) {
  const version =
    options.version ?? (typeof __DLV_VERSION__ === 'string' ? __DLV_VERSION__ : 'test');
  if (!/^[a-zA-Z0-9][a-zA-Z0-9.+-]{0,127}$/.test(version)) throw new Error('invalid-version');
  const base = '/api/dsh-live-voice/asr/' + encodeURIComponent(version) + '/';
  const directory = options.directory ?? fileURLToPath(new URL('./asr/', import.meta.url));
  const names = [
    'asr.worker.js',
    'ort-wasm-simd-threaded.mjs',
    'ort-wasm-simd-threaded.wasm',
    'ort-wasm-simd-threaded.jsep.mjs',
    'ort-wasm-simd-threaded.jsep.wasm',
    'ort-wasm-simd-threaded.asyncify.mjs',
    'ort-wasm-simd-threaded.asyncify.wasm',
    'ort-wasm-simd-threaded.jspi.mjs',
    'ort-wasm-simd-threaded.jspi.wasm',
    'manifest.json',
  ];
  const disposers = names.map((name) =>
    ctx.connection.fetch.register({
      path: base + name,
      methods: ['GET'],
      requestBody: 'buffered',
      fetch: async (request: Request) => {
        if (new URL(request.url).pathname !== base + name) return new Response('', { status: 404 });
        if (request.method !== 'GET')
          return new Response('', { status: 405, headers: { allow: 'GET' } });
        const path = join(directory, name);
        try {
          const meta = await lstat(path);
          if (!meta.isFile() || meta.isSymbolicLink() || meta.size > 100 * 1024 * 1024)
            throw new Error('missing');
          return new Response(new Uint8Array(await readFile(path)), {
            headers: {
              'content-type': name.endsWith('.wasm')
                ? 'application/wasm'
                : name.endsWith('.json')
                  ? 'application/json'
                  : 'text/javascript; charset=utf-8',
              // The development version can be rebuilt in place. Never pin old workers/runtimes.
              'cache-control': 'private, no-store',
              'x-content-type-options': 'nosniff',
              'cross-origin-resource-policy': 'same-origin',
              'content-length': String(meta.size),
            },
          });
        } catch {
          return new Response('', { status: 404, headers: { 'cache-control': 'no-store' } });
        }
      },
    }),
  );
  ctx.effect(
    () => () => {
      for (const dispose of disposers) void dispose();
    },
    'dsh-live-voice: remove browser ASR assets',
  );
}
