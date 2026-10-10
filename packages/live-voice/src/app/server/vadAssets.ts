import { lstat, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

declare const __DLV_VERSION__: string;

/** Exact filenames only: never turn a URL suffix into a host filesystem path. */
export const VAD_ASSET_TYPES = {
  'vad.worker.js': 'text/javascript; charset=utf-8',
  'vad.capture.js': 'text/javascript; charset=utf-8',
  'silero_vad_v5.onnx': 'application/octet-stream',
  'ort-wasm-simd-threaded.mjs': 'text/javascript; charset=utf-8',
  'ort-wasm-simd-threaded.wasm': 'application/wasm',
  'LICENSE.silero.txt': 'text/plain; charset=utf-8',
  'LICENSE.onnxruntime.txt': 'text/plain; charset=utf-8',
  'LICENSE.vad-web.txt': 'text/plain; charset=utf-8',
  'manifest.json': 'application/json; charset=utf-8',
} as const;
export const MAX_VAD_ASSET_BYTES = 32 * 1024 * 1024;

type AssetRoute = {
  path: string;
  methods: ['GET'];
  requestBody: 'buffered';
  fetch(request: Request): Promise<Response>;
};
type AssetContext = {
  connection: { fetch: { register(route: AssetRoute): () => unknown } };
  effect(callback: () => () => unknown, label: string): unknown;
};

/** Connection's real /api HTTP carrier authenticates before dispatching these routes.
 * Browser-native Worker, AudioWorklet and module imports retain same-origin cookies.
 * The packaged server bundle lives in lib/, beside vad/ (not beside source files).
 */
export function registerVadAssetRoutes(
  ctx: AssetContext,
  options: { version?: string; directory?: string } = {},
) {
  const version =
    options.version ?? (typeof __DLV_VERSION__ === 'string' ? __DLV_VERSION__ : 'test');
  if (!/^[a-zA-Z0-9][a-zA-Z0-9.+-]{0,127}$/.test(version))
    throw new Error('Invalid VAD asset version');
  const directory = options.directory ?? fileURLToPath(new URL('./vad/', import.meta.url));
  const base = '/api/dsh-live-voice/vad/' + encodeURIComponent(version) + '/';
  const disposers: (() => unknown)[] = [];
  const availabilityPath = base + 'availability';
  const required = [
    'vad.worker.js',
    'vad.capture.js',
    'silero_vad_v5.onnx',
    'ort-wasm-simd-threaded.mjs',
    'ort-wasm-simd-threaded.wasm',
  ];
  disposers.push(
    ctx.connection.fetch.register({
      path: availabilityPath,
      methods: ['GET'],
      requestBody: 'buffered',
      fetch: async (request) => {
        if (new URL(request.url).pathname !== availabilityPath)
          return new Response(null, { status: 404 });
        if (request.method !== 'GET') return new Response(null, { status: 405 });
        let available = false;
        try {
          const stats = await Promise.all(required.map((name) => lstat(join(directory, name))));
          available = stats.every(
            (stat) => stat.isFile() && stat.size > 0 && stat.size <= MAX_VAD_ASSET_BYTES,
          );
        } catch {
          /* Git installations intentionally omit the optional binaries. */
        }
        return Response.json({ available }, { headers: { 'cache-control': 'no-store' } });
      },
    }),
  );
  try {
    for (const [filename, mime] of Object.entries(VAD_ASSET_TYPES)) {
      const path = base + filename;
      disposers.push(
        ctx.connection.fetch.register({
          path,
          methods: ['GET'],
          requestBody: 'buffered',
          fetch: async (request) => {
            // Defense in depth for direct adapters; Connection itself matches exact paths/methods.
            if (new URL(request.url).pathname !== path)
              return new Response('not found', { status: 404 });
            if (request.method !== 'GET')
              return new Response('method not allowed', {
                status: 405,
                headers: { allow: 'GET' },
              });
            try {
              const target = join(directory, filename);
              const stat = await lstat(target);
              if (!stat.isFile() || stat.size > MAX_VAD_ASSET_BYTES)
                throw new Error('Invalid asset');
              const bytes = await readFile(target);
              if (bytes.byteLength > MAX_VAD_ASSET_BYTES) throw new Error('Invalid asset');
              return new Response(new Uint8Array(bytes), {
                headers: {
                  'content-type': mime,
                  'content-length': String(bytes.byteLength),
                  'cache-control': 'private, max-age=31536000, immutable',
                  'x-content-type-options': 'nosniff',
                  'cross-origin-resource-policy': 'same-origin',
                },
              });
            } catch {
              return new Response('VAD asset unavailable', {
                status: 404,
                headers: { 'cache-control': 'no-store' },
              });
            }
          },
        }),
      );
    }
  } catch (error) {
    for (const dispose of disposers) void dispose();
    throw error;
  }
  ctx.effect(
    () => () => {
      for (const dispose of disposers) void dispose();
    },
    'dsh-live-voice: remove VAD asset routes',
  );
}
