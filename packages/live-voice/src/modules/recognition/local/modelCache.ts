import { findBrowserAsrModel, modelFileUrl, type BrowserAsrModel } from './modelCatalog.js';
export const modelCacheName = (model: BrowserAsrModel) =>
  'dsh-live-voice.asr.' + model.key + '.' + model.revision;
export class BrowserAsrError extends Error {
  constructor(public code: string) {
    super(code);
  }
}
const check = (signal?: AbortSignal) => {
  if (signal?.aborted) throw new BrowserAsrError('cancelled');
};
export async function cachedModelFiles(key: string, storage: CacheStorage = caches) {
  const model = findBrowserAsrModel(key);
  if (!model) throw new BrowserAsrError('invalid-model');
  const cache = await storage.open(modelCacheName(model));
  return { model, cache };
}
export async function modelDownloaded(
  key: string,
  storage: CacheStorage = caches,
): Promise<boolean> {
  const { model, cache } = await cachedModelFiles(key, storage);
  for (const file of model.files) {
    const response = await cache.match(modelFileUrl(model, file.path));
    if (!response || Number(response.headers.get('content-length')) !== file.bytes) return false;
  }
  return true;
}
export async function cachedModelBytes(
  key: string,
  storage: CacheStorage = caches,
): Promise<number> {
  const { model, cache } = await cachedModelFiles(key, storage);
  let bytes = 0;
  for (const file of model.files) {
    const response = await cache.match(modelFileUrl(model, file.path));
    if (response && Number(response.headers.get('content-length')) === file.bytes)
      bytes += file.bytes;
  }
  return bytes;
}
export async function downloadBrowserModel(
  key: string,
  options: {
    signal?: AbortSignal;
    storage?: CacheStorage;
    fetch?: typeof fetch;
    progress?(value: { loaded: number; total: number; file: string }): void;
  } = {},
) {
  const { model, cache } = await cachedModelFiles(key, options.storage);
  let completed = 0;
  for (const file of model.files) {
    check(options.signal);
    const url = modelFileUrl(model, file.path);
    const old = await cache.match(url);
    if (old && Number(old.headers.get('content-length')) === file.bytes) {
      completed += file.bytes;
      options.progress?.({ loaded: completed, total: model.bytes, file: file.path });
      continue;
    }
    const response = await (options.fetch ?? fetch)(url, {
      signal: options.signal,
      credentials: 'omit',
      cache: 'no-store',
    });
    if (!response.ok || !response.body) throw new BrowserAsrError('download-failed');
    let loaded = 0;
    const reader = response.body.getReader();
    const body = new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          check(options.signal);
          const next = await reader.read();
          check(options.signal);
          if (next.done) {
            if (loaded !== file.bytes) throw new BrowserAsrError('download-failed');
            controller.close();
            return;
          }
          loaded += next.value.byteLength;
          if (loaded > file.bytes) throw new BrowserAsrError('download-failed');
          options.progress?.({ loaded: completed + loaded, total: model.bytes, file: file.path });
          controller.enqueue(next.value);
        } catch (error) {
          await reader.cancel().catch(() => {});
          controller.error(error);
        }
      },
      cancel: (reason) => reader.cancel(reason),
    });
    try {
      await cache.put(
        url,
        new Response(body, {
          headers: {
            'content-length': String(file.bytes),
            'content-type': 'application/octet-stream',
          },
        }),
      );
    } catch (error) {
      await cache.delete(url);
      throw error;
    }
    check(options.signal);
    completed += file.bytes;
  }
  if (!(await modelDownloaded(key, options.storage))) throw new BrowserAsrError('download-failed');
}
export async function readBrowserModelFile(
  key: string,
  path: string,
  storage: CacheStorage = caches,
): Promise<Uint8Array> {
  const { model, cache } = await cachedModelFiles(key, storage);
  const response = await cache.match(modelFileUrl(model, path));
  if (!response) throw new BrowserAsrError('model-missing');
  return new Uint8Array(await response.arrayBuffer());
}
export async function removeBrowserModel(key: string, storage: CacheStorage = caches) {
  const model = findBrowserAsrModel(key);
  if (!model) throw new BrowserAsrError('invalid-model');
  // Delete only this plugin's model cache, never audio recordings or other apps' models.
  await storage.delete(modelCacheName(model));
}
