import test from 'node:test';
import { browserAsrRuntimeId } from '../src/modules/recognition/local/runtimeIdentity.js';
import assert from 'node:assert/strict';
import { LocalModelManager } from '../src/modules/recognition/local/LocalModelManager.js';
import {
  browserAsrModels,
  findBrowserAsrModel,
  modelFileUrl,
} from '../src/modules/recognition/local/modelCatalog.js';
import { modelCacheName } from '../src/modules/recognition/local/modelCache.js';
import { browserAsrAssetBase } from '../src/modules/recognition/local/assets.js';

const tick = () => new Promise<void>((resolve) => setImmediate(resolve));
function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
class MemoryCache {
  entries = new Map<string, Response>();
  putError?: Error;
  async match(url: string) {
    return this.entries.get(url)?.clone();
  }
  async put(url: string, response: Response) {
    const bytes = await response.arrayBuffer();
    this.entries.set(url, new Response(bytes, { headers: response.headers }));
    if (this.putError) throw this.putError;
  }
  async delete(url: string) {
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
}
const model = findBrowserAsrModel('whisper-tiny')!;
async function seed(storage: MemoryStorage, omit = '') {
  const cache = await storage.open(modelCacheName(model));
  for (const file of model.files)
    if (file.path !== omit) {
      cache.entries.set(
        modelFileUrl(model, file.path),
        new Response(null, { headers: { 'content-length': String(file.bytes) } }),
      );
    }
  return cache;
}
function harness() {
  const storage = new MemoryStorage();
  const workers: FakeWorker[] = [];
  const requests: string[] = [];
  // No real worker, GPU device, inference, model allocation or network request is made.
  class FakeWorker {
    messages: any[] = [];
    transfers: Transferable[][] = [];
    terminated = 0;
    onmessage?: (event: { data: any }) => void;
    onerror?: () => void;
    constructor(
      public url: string,
      public options: WorkerOptions,
    ) {
      workers.push(this);
    }
    postMessage(message: any, transfer: Transferable[] = []) {
      this.messages.push(message);
      this.transfers.push(transfer);
    }
    terminate() {
      this.terminated++;
    }
    emit(data: any) {
      this.onmessage?.({ data: { runtimeId: browserAsrRuntimeId, ...data } });
    }
    reply(index: number, data: any = {}) {
      this.emit({ id: this.messages[index].id, ok: true, ...data });
    }
  }
  const globals: any = {
    caches: storage,
    navigator: {
      gpu: { requestAdapter: async () => ({}) },
      storage: { estimate: async () => ({ quota: 10_000_000_000, usage: 20 }) },
    },
    Worker: FakeWorker,
    fetch: async (url: string) => {
      requests.push(String(url));
      throw new Error('unexpected model fetch');
    },
  };
  const manager = new LocalModelManager(globals);
  return { storage, workers, requests, globals, manager };
}

test('local model discovery checks injected capabilities and stored metadata without downloads or workers', async () => {
  const h = harness();
  await seed(h.storage);
  let updates = 0;
  const unsubscribe = h.manager.subscribe(() => updates++);
  try {
    await h.manager.refresh();
    const state = h.manager.getSnapshot();
    assert.equal(state.gpu, 'available');
    assert.equal(state.storage, true);
    assert.equal(state.availableBytes, 9_999_999_980);
    assert.equal(state.busy, false);
    assert.equal(state.models[model.key].phase, 'downloaded');
    for (const other of browserAsrModels.filter((item) => item.key !== model.key)) {
      assert.equal(state.models[other.key].phase, 'absent');
    }
    assert.deepEqual(h.requests, []);
    assert.deepEqual(h.workers, []);
    assert.ok(updates > 0);
    unsubscribe();
    const count = updates;
    await h.manager.refresh();
    assert.equal(updates, count);
  } finally {
    unsubscribe();
    h.manager.dispose();
  }
});

test('superseded capability discovery and discovery completing after disposal cannot publish', async () => {
  const h = harness();
  const adapter = deferred<any>();
  h.globals.navigator.gpu.requestAdapter = () => adapter.promise;
  const old = h.manager.refresh();
  h.globals.navigator.gpu.requestAdapter = async () => null;
  await h.manager.refresh();
  adapter.resolve({});
  await old;
  assert.equal(h.manager.getSnapshot().gpu, 'unavailable');
  const lateAdapter = deferred<any>();
  h.globals.navigator.gpu.requestAdapter = () => lateAdapter.promise;
  let updates = 0;
  h.manager.subscribe(() => updates++);
  const pending = h.manager.refresh();
  const state = h.manager.getSnapshot();
  h.manager.dispose();
  lateAdapter.resolve({});
  await pending;
  assert.equal(h.manager.getSnapshot(), state);
  assert.equal(updates, 0);
  assert.deepEqual(h.workers, []);
  assert.deepEqual(h.requests, []);
});

test('prepare requires cached model and supported device; explicit load and serialized transcription use worker messages', async () => {
  const h = harness();
  try {
    await h.manager.refresh();
    await assert.rejects(h.manager.prepare(model.key, 'wasm'), { code: 'model-missing' });
    await assert.rejects(h.manager.prepare('qwen-0.6b', 'wasm'), { code: 'gpu-unavailable' });
    assert.equal(h.workers.length, 0);
    await seed(h.storage);
    const loading = h.manager.prepare(model.key, 'wasm');
    await tick();
    const worker = h.workers[0];
    assert.equal(
      worker.url,
      browserAsrAssetBase() + 'asr.worker.js?runtime=' + encodeURIComponent(browserAsrRuntimeId),
    );
    assert.deepEqual(worker.options, { type: 'module' });
    assert.equal(h.manager.getSnapshot().models[model.key].phase, 'loading');
    assert.deepEqual(worker.messages[0], {
      id: worker.messages[0].id,
      type: 'load',
      key: model.key,
      device: 'wasm',
    });
    worker.reply(0);
    await loading;
    assert.equal(h.manager.getSnapshot().models[model.key].phase, 'ready');
    assert.equal(h.manager.getSnapshot().models[model.key].device, 'wasm');
    await h.manager.prepare(model.key, 'wasm');
    assert.equal(worker.messages.length, 1);
    const pcm = Float32Array.from([0.1, 0.2]);
    const first = h.manager.transcribe(model.key, pcm, 'pt');
    const second = h.manager.transcribe(model.key, new Float32Array(2), 'en');
    await tick();
    assert.equal(worker.messages.length, 2);
    assert.equal(worker.messages[1].type, 'transcribe');
    assert.equal(worker.messages[1].language, 'pt');
    assert.equal(worker.messages[1].pcm, pcm);
    assert.deepEqual(worker.transfers[1], [pcm.buffer]);
    worker.reply(1, { text: 'First simulated result' });
    assert.equal(await first, 'First simulated result');
    await tick();
    assert.equal(worker.messages.length, 3);
    worker.reply(2, { text: 'Second simulated result' });
    assert.equal(await second, 'Second simulated result');
    assert.deepEqual(h.requests, []);
  } finally {
    h.manager.dispose();
  }
});

test('abort rejects pending inference, retires its worker and ignores stale replies after a fresh load', async () => {
  const h = harness();
  await seed(h.storage);
  try {
    await h.manager.refresh();
    const loading = h.manager.prepare(model.key, 'wasm');
    await tick();
    const oldWorker = h.workers[0];
    oldWorker.reply(0);
    await loading;
    const abort = new AbortController();
    const inference = h.manager.transcribe(model.key, new Float32Array(2), 'en', abort.signal);
    const rejected = assert.rejects(inference, { code: 'cancelled' });
    await tick();
    abort.abort();
    await rejected;
    assert.equal(oldWorker.terminated, 1);
    const retry = h.manager.prepare(model.key, 'wasm');
    await tick();
    assert.equal(h.workers.length, 2);
    oldWorker.reply(1, { text: 'Stale simulated result' });
    oldWorker.reply(0);
    assert.equal(h.manager.getSnapshot().models[model.key].phase, 'loading');
    h.workers[1].reply(0);
    await retry;
    assert.equal(h.manager.getSnapshot().models[model.key].phase, 'ready');
    assert.deepEqual(h.requests, []);
  } finally {
    h.manager.dispose();
  }
});

test('cancelling model initialization retires worker without deleting cached files; old worker errors cannot kill replacement', async () => {
  const h = harness();
  await seed(h.storage);
  await h.manager.refresh();
  try {
    const first = h.manager.prepare(model.key, 'wasm');
    const rejected = assert.rejects(first, { code: 'cancelled' });
    await tick();
    h.manager.cancel(model.key);
    await rejected;
    assert.equal(h.manager.getSnapshot().models[model.key].phase, 'downloaded');
    const second = h.manager.prepare(model.key, 'wasm');
    await tick();
    h.workers[0].onerror!();
    assert.equal(h.workers[1].terminated, 0);
    h.workers[1].reply(0);
    await second;
    assert.equal(h.manager.getSnapshot().models[model.key].phase, 'ready');
  } finally {
    h.manager.dispose();
  }
});

test('leases are reference counted and idempotent; busy removal is rejected, idle removal retires only the model', async () => {
  const h = harness();
  await seed(h.storage);
  const unrelated = await h.storage.open('another-app');
  try {
    await h.manager.refresh();
    const loading = h.manager.prepare(model.key, 'wasm');
    await tick();
    h.workers[0].reply(0);
    await loading;
    const releaseA = h.manager.acquire(model.key);
    const releaseB = h.manager.acquire(model.key);
    assert.equal(h.manager.getSnapshot().busy, true);
    await assert.rejects(h.manager.remove(model.key), { code: 'model-busy' });
    releaseA();
    releaseA();
    assert.equal(h.manager.getSnapshot().busy, true);
    releaseB();
    assert.equal(h.manager.getSnapshot().busy, false);
    await h.manager.remove(model.key);
    assert.equal(h.workers[0].terminated, 1);
    assert.equal(h.manager.getSnapshot().models[model.key].phase, 'absent');
    assert.equal(h.manager.getSnapshot().models[model.key].loaded, 0);
    assert.deepEqual(h.storage.deleted, [modelCacheName(model)]);
    assert.equal(h.storage.caches.get('another-app'), unrelated);
  } finally {
    h.manager.dispose();
  }
});

test('old cached worker rejects with runtime-outdated rather than model incompatibility', async () => {
  const h = harness();
  await seed(h.storage);
  await h.manager.refresh();
  try {
    const loading = h.manager.prepare(model.key, 'wasm');
    const rejected = assert.rejects(loading, { code: 'runtime-outdated' });
    await tick();
    const worker = h.workers[0];
    assert.ok(
      worker.url.includes('asr.worker.js?runtime=' + encodeURIComponent(browserAsrRuntimeId)),
    );
    worker.emit({
      id: worker.messages[0].id,
      ok: false,
      code: 'invalid-model',
      runtimeId: undefined,
    });
    await rejected;
    assert.equal(worker.terminated, 1);
    assert.equal(h.manager.getSnapshot().models[model.key].error, 'runtime-outdated');
  } finally {
    h.manager.dispose();
  }
});

test('medium and Turbo q4 accept WebGPU without shader-f16 and explicit WASM', async () => {
  const h = harness();
  try {
    await h.manager.refresh();
    assert.equal(h.manager.getSnapshot().shaderF16, false);
    for (const key of ['whisper-medium', 'whisper-large-v3-turbo']) {
      const selected = findBrowserAsrModel(key)!;
      const cache = await h.storage.open(modelCacheName(selected));
      for (const file of selected.files)
        cache.entries.set(
          modelFileUrl(selected, file.path),
          new Response(null, { headers: { 'content-length': String(file.bytes) } }),
        );
      for (const device of ['webgpu', 'wasm'] as const) {
        const load = h.manager.prepare(key, device);
        await tick();
        const worker = h.workers.at(-1)!;
        worker.reply(worker.messages.length - 1);
        await load;
        assert.equal(h.manager.getSnapshot().models[key].phase, 'ready');
      }
    }
  } finally {
    h.manager.dispose();
  }
});

test('explicit download maps quota, cancellation and HTTP failures without initializing a worker', async () => {
  const h = harness();
  const file = model.files[0];
  const url = modelFileUrl(model, file.path);
  const cache = await seed(h.storage, file.path);
  try {
    await h.manager.refresh();
    h.globals.navigator.storage.estimate = async () => ({ quota: 1, usage: 0 });
    await h.manager.refresh();
    await h.manager.download(model.key);
    assert.equal(h.manager.getSnapshot().models[model.key].error, 'storage-full');
    assert.deepEqual(h.requests, []);
    h.globals.navigator.storage.estimate = async () => ({ quota: 10_000_000_000 });
    await h.manager.refresh();
    const started = deferred();
    h.globals.fetch = async (_url: string, options: RequestInit) => {
      started.resolve();
      return new Promise<Response>((_resolve, reject) => {
        options.signal!.addEventListener(
          'abort',
          () => reject(new DOMException('cancelled', 'AbortError')),
          { once: true },
        );
      });
    };
    const pending = h.manager.download(model.key);
    await started.promise;
    assert.equal(h.manager.getSnapshot().models[model.key].phase, 'downloading');
    await assert.rejects(h.manager.remove(model.key), { code: 'model-busy' });
    await h.manager.download(model.key); // duplicate request does not start another fetch
    h.manager.cancel(model.key);
    await pending;
    assert.equal(h.manager.getSnapshot().models[model.key].phase, 'absent');
    assert.equal(h.manager.getSnapshot().models[model.key].error, undefined);
    h.globals.fetch = async () => new Response('unavailable', { status: 503 });
    await h.manager.download(model.key);
    assert.equal(h.manager.getSnapshot().models[model.key].error, 'download-failed');
    cache.putError = new DOMException('fake quota', 'QuotaExceededError');
    h.globals.fetch = async () => new Response(new Uint8Array(file.bytes));
    await h.manager.download(model.key);
    assert.equal(h.manager.getSnapshot().models[model.key].error, 'storage-full');
    assert.equal(await cache.match(url), undefined);
    cache.putError = undefined;
    await h.manager.download(model.key);
    assert.equal(h.manager.getSnapshot().models[model.key].phase, 'downloaded');
    assert.equal(h.manager.getSnapshot().models[model.key].loaded, model.bytes);
    assert.deepEqual(h.workers, []);
  } finally {
    h.manager.dispose();
  }
});

test('worker response failures, crashes and disposal reject pending requests; stale responses never revive state', async () => {
  const h = harness();
  await seed(h.storage);
  try {
    await h.manager.refresh();
    const failing = h.manager.prepare(model.key, 'wasm');
    const failed = assert.rejects(failing, { code: 'runtime-unavailable' });
    await tick();
    h.workers[0].reply(0, { ok: false, code: 'runtime-unavailable' });
    await failed;
    assert.equal(h.manager.getSnapshot().models[model.key].error, 'runtime-unavailable');
    assert.equal(h.workers[0].terminated, 1);
    const loading = h.manager.prepare(model.key, 'wasm');
    await tick();
    h.workers[1].reply(0);
    await loading;
    const crashing = h.manager.transcribe(model.key, new Float32Array(2), 'en');
    const crashRejected = assert.rejects(crashing, { code: 'runtime-unavailable' });
    await tick();
    h.workers[1].onerror!();
    await crashRejected;
    assert.equal(h.manager.getSnapshot().models[model.key].error, 'runtime-unavailable');
    const reloading = h.manager.prepare(model.key, 'wasm');
    await tick();
    h.workers[2].reply(0);
    await reloading;
    const pending = h.manager.transcribe(model.key, new Float32Array(2), 'en');
    const rejected = assert.rejects(pending, { code: 'cancelled' });
    await tick();
    const snapshot = h.manager.getSnapshot();
    h.manager.dispose();
    h.manager.dispose();
    await rejected;
    assert.equal(h.workers[2].terminated, 1);
    h.workers[2].reply(1, { text: 'Late simulated result' });
    assert.equal(h.manager.getSnapshot(), snapshot);
    await assert.rejects(h.manager.transcribe(model.key, new Float32Array(1), 'en'), {
      code: 'cancelled',
    });
    assert.deepEqual(h.requests, []);
  } finally {
    h.manager.dispose();
  }
});
