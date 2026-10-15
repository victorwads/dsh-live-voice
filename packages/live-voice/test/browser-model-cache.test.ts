import test from 'node:test';
import assert from 'node:assert/strict';
import {
  browserAsrModels,
  findBrowserAsrModel,
  modelFileUrl,
} from '../src/modules/recognition/local/modelCatalog.js';
import {
  downloadBrowserModel,
  modelCacheName,
  modelDownloaded,
  readBrowserModelFile,
  removeBrowserModel,
} from '../src/modules/recognition/local/modelCache.js';

// Real streams exercise byte accounting; large pinned files use metadata-only fixtures.
// These fixtures test cache contracts, not model integrity, inference or GPU performance.
class MemoryCache {
  entries = new Map<string, Response>();
  writes: string[] = [];
  deleted: string[] = [];
  putError?: Error;
  async match(url: string) {
    return this.entries.get(url)?.clone();
  }
  async put(url: string, response: Response) {
    const bytes = await response.arrayBuffer();
    this.entries.set(url, new Response(bytes, { headers: response.headers }));
    this.writes.push(url);
    if (this.putError) throw this.putError;
  }
  async delete(url: string) {
    this.deleted.push(url);
    return this.entries.delete(url);
  }
}
class MemoryStorage {
  caches = new Map<string, MemoryCache>();
  deleted: string[] = [];
  async open(name: string) {
    let cache = this.caches.get(name);
    if (!cache) {
      cache = new MemoryCache();
      this.caches.set(name, cache);
    }
    return cache;
  }
  async delete(name: string) {
    this.deleted.push(name);
    return this.caches.delete(name);
  }
  asStorage() {
    return this as unknown as CacheStorage;
  }
}
const model = findBrowserAsrModel('whisper-tiny')!;
const first = model.files[0];
const firstUrl = modelFileUrl(model, first.path);
async function seeded(storage: MemoryStorage, omit = '') {
  const cache = await storage.open(modelCacheName(model));
  for (const file of model.files) {
    if (file.path !== omit)
      cache.entries.set(
        modelFileUrl(model, file.path),
        new Response(null, { headers: { 'content-length': String(file.bytes) } }),
      );
  }
  return cache;
}
function streamingResponse(size: number) {
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        const split = Math.floor(size / 2);
        controller.enqueue(new Uint8Array(split).fill(7));
        controller.enqueue(new Uint8Array(size - split).fill(9));
        controller.close();
      },
    }),
  );
}

test('browser model catalog pins allowed artifacts, exact byte totals and device constraints', () => {
  assert.equal(new Set(browserAsrModels.map((item) => item.key)).size, browserAsrModels.length);
  for (const item of browserAsrModels) {
    assert.match(item.revision, /^[a-f0-9]{40}$/);
    assert.equal(
      item.bytes,
      item.files.reduce((total, file) => total + file.bytes, 0),
    );
    assert.equal(new Set(item.files.map((file) => file.path)).size, item.files.length);
    for (const file of item.files) {
      assert.ok(Number.isSafeInteger(file.bytes) && file.bytes > 0);
      assert.equal(
        modelFileUrl(item, file.path),
        'https://huggingface.co/' + item.repository + '/resolve/' + item.revision + '/' + file.path,
      );
    }
    assert.throws(() => modelFileUrl(item, '../other-model.onnx'), /invalid-model-file/);
  }
  const small = findBrowserAsrModel('whisper-small')!;
  assert.equal(small.bytes, 302101039);
  assert.equal(small.encoderDtype, 'q4');
  assert.equal(small.decoderDtype, 'q4');
  assert.equal(small.requiresF16, false);
  const medium = findBrowserAsrModel('whisper-medium')!;
  assert.equal(medium.bytes, 683532511);
  assert.equal(medium.requiresF16, false);
  assert.equal(medium.name, 'Whisper medium (q4)');
  const turbo = findBrowserAsrModel('whisper-large-v3-turbo')!;
  assert.equal(turbo.bytes, 761859026);
  assert.deepEqual(turbo.devices, ['webgpu', 'wasm']);
  assert.equal(turbo.requiresF16, false);
  assert.equal(turbo.encoderDtype, 'q4');
  assert.equal(turbo.decoderDtype, 'q4');
  assert.deepEqual(findBrowserAsrModel('qwen-0.6b')!.devices, ['webgpu']);
  assert.equal(findBrowserAsrModel('unknown'), undefined);
});

test('old Turbo f16 cache does not satisfy the non-f16 download and Remove clears both variants', async () => {
  const storage = new MemoryStorage();
  const turbo = findBrowserAsrModel('whisper-large-v3-turbo')!;
  const cache = await storage.open(modelCacheName(turbo));
  for (const file of turbo.files.filter((file) => !file.path.endsWith('.onnx')))
    cache.entries.set(
      modelFileUrl(turbo, file.path),
      new Response(null, { headers: { 'content-length': String(file.bytes) } }),
    );
  const legacy =
    'https://huggingface.co/' +
    turbo.repository +
    '/resolve/' +
    turbo.revision +
    '/onnx/encoder_model_q4f16.onnx';
  cache.entries.set(legacy, new Response(null, { headers: { 'content-length': '369974078' } }));
  assert.equal(await modelDownloaded(turbo.key, storage.asStorage()), false);
  await removeBrowserModel(turbo.key, storage.asStorage());
  assert.equal(storage.caches.has(modelCacheName(turbo)), false);
});

test('cache discovery is passive and requires every pinned file with exact stored size', async () => {
  const storage = new MemoryStorage();
  assert.equal(await modelDownloaded(model.key, storage.asStorage()), false);
  const cache = await seeded(storage);
  assert.equal(await modelDownloaded(model.key, storage.asStorage()), true);
  cache.entries.set(
    firstUrl,
    new Response(null, { headers: { 'content-length': String(first.bytes - 1) } }),
  );
  assert.equal(await modelDownloaded(model.key, storage.asStorage()), false);
  cache.entries.set(firstUrl, new Response(null));
  assert.equal(await modelDownloaded(model.key, storage.asStorage()), false);
  assert.deepEqual(cache.writes, []);
  assert.deepEqual(cache.deleted, []);
});

test('explicit download streams a small pinned file, skips completed files and reads saved bytes', async () => {
  const storage = new MemoryStorage();
  const cache = await seeded(storage, first.path);
  const requests: { url: string; options?: RequestInit }[] = [];
  const progress: { loaded: number; total: number; file: string }[] = [];
  const fetchMock: typeof fetch = async (url, options) => {
    requests.push({ url: String(url), options });
    return streamingResponse(first.bytes);
  };
  await downloadBrowserModel(model.key, {
    storage: storage.asStorage(),
    fetch: fetchMock,
    progress: (value) => progress.push(value),
  });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, firstUrl);
  assert.equal(requests[0].options?.credentials, 'omit');
  assert.equal(requests[0].options?.cache, 'no-store');
  assert.deepEqual(cache.writes, [firstUrl]);
  assert.ok(
    progress.every(
      (value, index) =>
        value.total === model.bytes && (index === 0 || value.loaded >= progress[index - 1].loaded),
    ),
  );
  assert.deepEqual(progress.at(-1), {
    loaded: model.bytes,
    total: model.bytes,
    file: model.files.at(-1)!.path,
  });
  const bytes = await readBrowserModelFile(model.key, first.path, storage.asStorage());
  assert.equal(bytes.byteLength, first.bytes);
  assert.equal(bytes[0], 7);
  assert.equal(bytes.at(-1), 9);
  await downloadBrowserModel(model.key, {
    storage: storage.asStorage(),
    fetch: async () => {
      assert.fail('a completed cache must never fetch');
    },
  });
  assert.equal(requests.length, 1);
});

test('truncated or oversized streams and failed HTTP responses never complete the cache', async () => {
  for (const size of [first.bytes - 1, first.bytes + 1]) {
    const storage = new MemoryStorage();
    const cache = await seeded(storage, first.path);
    await assert.rejects(
      downloadBrowserModel(model.key, {
        storage: storage.asStorage(),
        fetch: async () => streamingResponse(size),
      }),
      { code: 'download-failed' },
    );
    assert.equal(await cache.match(firstUrl), undefined);
    assert.equal(await modelDownloaded(model.key, storage.asStorage()), false);
    assert.deepEqual(cache.deleted, [firstUrl]);
  }
  for (const response of [new Response('unavailable', { status: 503 }), new Response(null)]) {
    const storage = new MemoryStorage();
    const cache = await seeded(storage, first.path);
    await assert.rejects(
      downloadBrowserModel(model.key, {
        storage: storage.asStorage(),
        fetch: async () => response,
      }),
      { code: 'download-failed' },
    );
    assert.deepEqual(cache.writes, []);
  }
});

test('cancellation and quota failures delete only the partial file and preserve completed artifacts', async () => {
  const storage = new MemoryStorage();
  const cache = await seeded(storage, first.path);
  const abort = new AbortController();
  await assert.rejects(
    downloadBrowserModel(model.key, {
      storage: storage.asStorage(),
      signal: abort.signal,
      fetch: async () => streamingResponse(first.bytes),
      progress: () => abort.abort(),
    }),
    { code: 'cancelled' },
  );
  assert.equal(await cache.match(firstUrl), undefined);
  assert.ok(await cache.match(modelFileUrl(model, model.files[1].path)));
  const quota = new DOMException('fake quota', 'QuotaExceededError');
  cache.putError = quota;
  await assert.rejects(
    downloadBrowserModel(model.key, {
      storage: storage.asStorage(),
      fetch: async () => streamingResponse(first.bytes),
    }),
    (error) => error === quota,
  );
  assert.equal(await cache.match(firstUrl), undefined);
  assert.deepEqual(cache.deleted, [firstUrl, firstUrl]);
  const alreadyAborted = new AbortController();
  alreadyAborted.abort();
  await assert.rejects(
    downloadBrowserModel(model.key, {
      storage: storage.asStorage(),
      signal: alreadyAborted.signal,
      fetch: async () => assert.fail('pre-aborted download fetched'),
    }),
    { code: 'cancelled' },
  );
});

test('invalid/missing cache reads fail explicitly and removal only deletes the named plugin model cache', async () => {
  const storage = new MemoryStorage();
  await assert.rejects(modelDownloaded('unknown', storage.asStorage()), { code: 'invalid-model' });
  await assert.rejects(readBrowserModelFile(model.key, first.path, storage.asStorage()), {
    code: 'model-missing',
  });
  await assert.rejects(
    readBrowserModelFile(model.key, '../escape', storage.asStorage()),
    /invalid-model-file/,
  );
  const cache = await seeded(storage);
  const recording = await storage.open('dsh-live-voice.recordings');
  const unrelated = await storage.open('other-application.models');
  const otherModel = browserAsrModels[1];
  const otherCache = await storage.open(modelCacheName(otherModel));
  await removeBrowserModel(model.key, storage.asStorage());
  assert.deepEqual(storage.deleted, [modelCacheName(model)]);
  assert.ok(!storage.caches.has(modelCacheName(model)));
  assert.equal(storage.caches.get('dsh-live-voice.recordings'), recording);
  assert.equal(storage.caches.get('other-application.models'), unrelated);
  assert.equal(storage.caches.get(modelCacheName(otherModel)), otherCache);
  assert.ok(cache.entries.size > 0);
  await assert.rejects(removeBrowserModel('unknown', storage.asStorage()), {
    code: 'invalid-model',
  });
});
