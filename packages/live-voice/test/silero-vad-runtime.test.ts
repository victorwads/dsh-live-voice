import test from 'node:test';
import assert from 'node:assert/strict';
import { SileroWorkerRuntime } from '../src/modules/recognition/vad/SileroWorkerRuntime.js';
import {
  SileroVadPool,
  attachSileroVadCapture,
} from '../src/modules/recognition/vad/SileroVadRuntime.js';
import { sileroVadAssetBase } from '../src/modules/recognition/vad/assets.js';
const tick = () => new Promise((resolve) => setImmediate(resolve));
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
};
function fakeOrt({ load = undefined, run = undefined } = {}) {
  const calls = [];
  let creates = 0;
  let releases = 0;
  let active = 0;
  let peak = 0;
  class Tensor {
    constructor(type, data, dims) {
      Object.assign(this, { type, data, dims });
    }
  }
  const session = {
    async run(feeds) {
      active++;
      peak = Math.max(peak, active);
      calls.push(feeds);
      try {
        await run?.(feeds);
        return {
          output: new Tensor('float32', Float32Array.from([0.8]), [1, 1]),
          stateN: new Tensor(
            'float32',
            new Float32Array(256).fill(Number(feeds.input.data[64])),
            [2, 1, 128],
          ),
        };
      } finally {
        active--;
      }
    },
    release() {
      releases++;
    },
  };
  return {
    ort: {
      env: { wasm: {} },
      Tensor,
      InferenceSession: {
        async create() {
          creates++;
          await load;
          return session;
        },
      },
    },
    calls,
    get creates() {
      return creates;
    },
    get releases() {
      return releases;
    },
    get peak() {
      return peak;
    },
  };
}
const open = (runtime, source, generation = 0) =>
  runtime.receive({ type: 'open', source, generation });
const pcm = (runtime, source, value, request, generation = 0, frames = 1) =>
  runtime.receive({
    type: 'pcm',
    source,
    generation,
    request,
    pcm: new Float32Array(512 * frames).fill(value),
    sampleRate: 16000,
  });

test('Silero shares one session, fair FIFO, isolated recurrent state and 64 sample context', async () => {
  const gate = deferred();
  let first = true;
  const fake = fakeOrt({
    run: async () => {
      if (first) {
        first = false;
        await gate.promise;
      }
    },
  });
  const output = [];
  const runtime = new SileroWorkerRuntime(fake.ort, '/assets/', (m) => output.push(m));
  open(runtime, 1);
  open(runtime, 2);
  pcm(runtime, 1, 1, 1);
  await tick();
  pcm(runtime, 1, 2, 2);
  pcm(runtime, 1, 3, 3);
  pcm(runtime, 2, 4, 4);
  pcm(runtime, 2, 5, 5);
  gate.resolve();
  await tick();
  assert.equal(fake.creates, 1);
  assert.equal(fake.peak, 1);
  assert.deepEqual(
    fake.calls.map((f) => f.input.data[64]),
    [1, 4, 2, 5, 3],
  );
  assert.deepEqual(
    fake.calls.map((f) => f.state.data[0]),
    [0, 0, 1, 4, 2],
  );
  assert.deepEqual(
    fake.calls.map((f) => f.input.data[0]),
    [0, 0, 1, 4, 2],
  );
  assert.deepEqual(fake.calls[0].input.dims, [1, 576]);
  assert.deepEqual(fake.calls[0].state.dims, [2, 1, 128]);
  assert.deepEqual(fake.calls[0].sr.data, BigInt64Array.from([16000n]));
  assert.equal(output.filter((m) => m.type === 'probability').length, 5);
  assert.equal(fake.ort.env.wasm.wasmPaths, '/assets/');
  assert.equal(fake.ort.env.wasm.numThreads, 1);
  await runtime.dispose();
  assert.equal(fake.releases, 1);
});

test('reset and release discard inference already in flight', async () => {
  const gate = deferred();
  let first = true;
  const fake = fakeOrt({
    run: async () => {
      if (first) {
        first = false;
        await gate.promise;
      }
    },
  });
  const output = [];
  const runtime = new SileroWorkerRuntime(fake.ort, '/', (m) => output.push(m));
  open(runtime, 1);
  pcm(runtime, 1, 1, 1);
  await tick();
  runtime.receive({ type: 'reset', source: 1, generation: 1 });
  pcm(runtime, 1, 2, 2, 1);
  gate.resolve();
  await tick();
  assert.deepEqual(
    output.filter((m) => m.type === 'probability').map((m) => m.request),
    [2],
  );
  assert.equal(fake.calls[1].state.data[0], 0);
  assert.equal(fake.calls[1].input.data[0], 0);
  runtime.receive({ type: 'release', source: 1, generation: 1 });
  await runtime.dispose();
});

test('bounded overload resets source generation and rejects stale queued/in-flight audio', async () => {
  const gate = deferred();
  let first = true;
  const fake = fakeOrt({
    run: async () => {
      if (first) {
        first = false;
        await gate.promise;
      }
    },
  });
  const output = [];
  const runtime = new SileroWorkerRuntime(fake.ort, '/', (m) => output.push(m), 2);
  open(runtime, 1);
  pcm(runtime, 1, 1, 1);
  await tick();
  pcm(runtime, 1, 2, 2, 0, 3);
  assert.equal(output[0].type, 'reset');
  assert.equal(output[0].generation, 1);
  pcm(runtime, 1, 3, 3, 0);
  pcm(runtime, 1, 4, 4, 1);
  gate.resolve();
  await tick();
  assert.deepEqual(
    output.filter((m) => m.type === 'probability').map((m) => m.request),
    [4],
  );
  assert.equal(fake.calls[1].state.data[0], 0);
  await runtime.dispose();
});

test('dispose during model loading releases late session without output', async () => {
  const gate = deferred();
  const fake = fakeOrt({ load: gate.promise });
  const output = [];
  const runtime = new SileroWorkerRuntime(fake.ort, '/', (m) => output.push(m));
  open(runtime, 1);
  pcm(runtime, 1, 1, 1);
  await runtime.dispose();
  gate.resolve();
  await tick();
  assert.equal(fake.releases, 1);
  assert.equal(fake.calls.length, 0);
  assert.deepEqual(output, []);
});

test('dispose during run waits until inference finishes to release session', async () => {
  const gate = deferred();
  const fake = fakeOrt({ run: () => gate.promise });
  const output = [];
  const runtime = new SileroWorkerRuntime(fake.ort, '/', (m) => output.push(m));
  open(runtime, 1);
  pcm(runtime, 1, 1, 1);
  await tick();
  await runtime.dispose();
  assert.equal(fake.releases, 0);
  gate.resolve();
  await tick();
  assert.equal(fake.releases, 1);
  assert.deepEqual(output, []);
});

test('model failure is explicit and never switches detector', async () => {
  const fake = fakeOrt();
  fake.ort.InferenceSession.create = async () => {
    throw new Error('model unavailable');
  };
  const output = [];
  const runtime = new SileroWorkerRuntime(fake.ort, '/', (m) => output.push(m));
  open(runtime, 1);
  await tick();
  assert.equal(output[0].type, 'error');
  assert.equal(output[0].message, 'model unavailable');
  await runtime.dispose();
});

class FakeWorker {
  onmessage = null;
  onerror = null;
  onmessageerror = null;
  messages = [];
  terminated = 0;
  postMessage(m) {
    this.messages.push(m);
  }
  terminate() {
    this.terminated++;
  }
  emit(m) {
    this.onmessage?.({ data: m });
  }
}

test('pool is lazy, shares worker, releases independently and suppresses stale results', async () => {
  const workers = [];
  const urls = [];
  const pool = new SileroVadPool((url) => {
    urls.push(url);
    const w = new FakeWorker();
    workers.push(w);
    return w;
  });
  assert.equal(workers.length, 0);
  const probabilities = [];
  const errors = [];
  const a = pool.acquire({
    onProbability: (p) => probabilities.push(p),
    onError: (e) => errors.push(e),
  });
  const b = pool.acquire({
    onProbability: (p) => probabilities.push(p),
    onError: (e) => errors.push(e),
  });
  assert.equal(workers.length, 1);
  assert.equal(urls[0], sileroVadAssetBase() + 'vad.worker.js');
  const pending = a.process(new Float32Array(512), 16000);
  const request = workers[0].messages.at(-1);
  const rejected = assert.rejects(pending, { name: 'AbortError' });
  a.reset();
  await rejected;
  workers[0].emit({
    type: 'probability',
    source: request.source,
    generation: 0,
    probability: 0.9,
    pcm: new Float32Array(512),
  });
  assert.equal(probabilities.length, 0);
  a.release();
  a.release();
  assert.equal(workers[0].terminated, 0);
  b.release();
  assert.equal(workers[0].terminated, 1);
  const c = pool.acquire({ onProbability: () => {}, onError: () => {} });
  assert.equal(workers.length, 2);
  workers[0].emit({ type: 'error', source: 1, generation: 1, message: 'stale' });
  assert.equal(errors.length, 0);
  c.release();
});

test('pool pending bound resets, rejects old process and reports overload', async () => {
  const w = new FakeWorker();
  const errors = [];
  let resets = 0;
  const pool = new SileroVadPool(() => w, 1);
  const stream = pool.acquire({
    onProbability: () => {},
    onError: (e) => errors.push(e),
    onReset: () => resets++,
  });
  const pending = stream.process(new Float32Array(512), 16000);
  const rejected = assert.rejects(pending, { name: 'AbortError' });
  await assert.rejects(stream.process(new Float32Array(512), 16000), /overloaded/);
  await rejected;
  assert.equal(resets, 1);
  assert.equal(errors.length, 1);
  stream.release();
});

test('worker errors fail all streams, settle pending requests, permit retry after release', async () => {
  const workers = [];
  const errors = [];
  const pool = new SileroVadPool(() => {
    const w = new FakeWorker();
    workers.push(w);
    return w;
  });
  const a = pool.acquire({ onProbability: () => {}, onError: (e) => errors.push(e) });
  const b = pool.acquire({ onProbability: () => {}, onError: (e) => errors.push(e) });
  const pending = a.process(new Float32Array(512), 16000);
  const rejected = assert.rejects(pending, /worker broke/);
  workers[0].onerror({ message: 'worker broke' });
  await rejected;
  assert.equal(errors.length, 2);
  assert.equal(workers[0].terminated, 1);
  assert.throws(() => pool.acquire({ onProbability: () => {}, onError: () => {} }), /released/);
  a.release();
  b.release();
  const c = pool.acquire({ onProbability: () => {}, onError: () => {} });
  assert.equal(workers.length, 2);
  c.release();
});

test('worklet module load is shared, released load races never attach, and capture cleans up', async () => {
  const original = globalThis.AudioWorkletNode;
  const nodes = [];
  const gate = deferred();
  let loads = 0;
  let connections = 0;
  let disconnections = 0;
  class FakeNode {
    port = {
      onmessage: null,
      postMessage() {},
      close() {
        this.closed = true;
      },
      closed: false,
    };
    onprocessorerror = null;
    disconnected = false;
    constructor() {
      nodes.push(this);
    }
    connect() {}
    disconnect() {
      this.disconnected = true;
    }
  }
  globalThis.AudioWorkletNode = FakeNode;
  const context = {
    audioWorklet: {
      addModule(url) {
        loads++;
        assert.equal(url, sileroVadAssetBase() + 'vad.capture.js');
        return gate.promise;
      },
    },
    destination: {},
  };
  const source = {
    connect() {
      connections++;
    },
    disconnect() {
      disconnections++;
    },
  };
  const errors = [];
  const pool = new SileroVadPool(() => new FakeWorker());
  const a = pool.acquire({ onProbability: () => {}, onError: (e) => errors.push(e) });
  const b = pool.acquire({ onProbability: () => {}, onError: (e) => errors.push(e) });
  try {
    const pendingA = attachSileroVadCapture(context, source, a);
    const rejected = assert.rejects(pendingA, { name: 'AbortError' });
    const pendingB = attachSileroVadCapture(context, source, b);
    a.release();
    gate.resolve();
    await rejected;
    const capture = await pendingB;
    assert.equal(loads, 1);
    assert.equal(nodes.length, 1);
    assert.equal(connections, 1);
    nodes[0].onprocessorerror();
    assert.equal(errors.length, 1);
    assert.match(errors[0].message, /AudioWorklet/);
    capture.release();
    capture.release();
    assert.equal(disconnections, 1);
    assert.ok(nodes[0].port.closed);
    assert.ok(nodes[0].disconnected);
  } finally {
    a.release();
    b.release();
    globalThis.AudioWorkletNode = original;
  }
});

test('worklet module failures propagate explicitly and a later attempt retries', async () => {
  const original = globalThis.AudioWorkletNode;
  globalThis.AudioWorkletNode = class {};
  let loads = 0;
  const context = {
    audioWorklet: {
      async addModule() {
        loads++;
        throw new Error('worklet unavailable');
      },
    },
  };
  const pool = new SileroVadPool(() => new FakeWorker());
  const stream = pool.acquire({ onProbability: () => {}, onError: () => {} });
  try {
    await assert.rejects(attachSileroVadCapture(context, {}, stream), /worklet unavailable/);
    await assert.rejects(attachSileroVadCapture(context, {}, stream), /worklet unavailable/);
    assert.equal(loads, 2);
  } finally {
    stream.release();
    globalThis.AudioWorkletNode = original;
  }
});
