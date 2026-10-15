import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createQwenRuntime,
  qwenLogMel,
  qwenAudioTokenCount,
  QWEN_MODEL_FILES,
  QWEN_MODEL_REVISION,
} from '../packages/live-voice/src/modules/recognition/local/QwenBrowserRuntime.ts';

// These exercise real prompt/tensor/decode orchestration against fake ORT, NOT GPU inference.
const config = {
  layout_version: 2,
  mel: { sample_rate: 16000, n_fft: 400, hop_length: 160, n_mels: 128, drop_last_frame: true },
  audio_tokens: { conv_window: 100, tokens_per_window: 13 },
  prompt: {
    prefix_ids: [151644, 9125, 198, 151645, 198, 151644, 882, 198, 151669],
    suffix_ids: [151670, 151645, 198, 151644, 77091, 198],
    audio_pad_id: 151676,
    asr_text_id: 151704,
    eos_ids: [151643, 151645],
    max_new_tokens: 256,
  },
  language_prefix_ids: { en: [11528, 6364, 151704], pt: [11528, 42188, 151704] },
  embedding: {
    dtype: 'int8',
    shape: [151936, 1024],
    file: 'embed_tokens.int8.bin',
    scales_file: 'embed_scales.f32.bin',
  },
  decoder: {
    num_layers: 28,
    num_key_value_heads: 8,
    head_dim: 128,
    hidden_size: 1024,
    vocab_size: 151936,
  },
  variants: {
    q4: {
      encoder: 'encoder.onnx',
      decoder_init: 'decoder_init.int4.onnx',
      decoder_step: 'decoder_step.int4.onnx',
      weights: 'decoder_weights.int4.data',
      required_features: [],
    },
  },
};
const filters = Array.from({ length: 128 }, (_, m) =>
  Array.from({ length: 201 }, (_, k) => (k === m + 1 ? 0.01 : 0)),
);
const encode = (v: unknown) => new TextEncoder().encode(JSON.stringify(v));
const embeddings = new Uint8Array(151936 * 1024); // Zero pages; allocate once, shared read-only.
new Int8Array(embeddings.buffer).fill(-4, 42 * 1024, 43 * 1024);
const scales = new Uint8Array(new Float32Array(151936).fill(0.25).buffer);
const pcm = Float32Array.from({ length: 1600 }, (_, i) => Math.sin(i * 0.3) * 0.1);
function fake({
  tokens = [42, 151645],
  onRun = undefined,
  createFailure = -1,
  malformed = false,
} = {}) {
  const tensors = [],
    calls = [],
    loads = [],
    creates = [],
    released = [],
    decoded = [];
  const weights = new Uint8Array([7]);
  let next = 0;
  class Tensor {
    disposed = 0;
    constructor(type, data, dims) {
      Object.assign(this, { type, data, dims });
      tensors.push(this);
    }
    dispose() {
      this.disposed++;
    }
  }
  const ort = {
    Tensor,
    InferenceSession: {
      async create(model, options) {
        const index = creates.length;
        creates.push({ model, options });
        if (index === createFailure) throw new Error('PRIVATE GPU provider data');
        return {
          async run(feeds) {
            calls.push({ index, feeds });
            await onRun?.(index, feeds);
            if (index === 0) {
              const count = qwenAudioTokenCount(feeds.mel.dims[2]);
              return {
                audio_features: new Tensor('float32', new Float32Array(count * 1024).fill(0.75), [
                  1,
                  malformed ? count + 1 : count,
                  1024,
                ]),
              };
            }
            const token = tokens[Math.min(next++, tokens.length - 1)];
            const logits = new Float32Array(151936).fill(-10);
            logits[token] = 10;
            const length = index === 1 ? feeds.input_embeds.dims[1] : feeds.past_keys.dims[3] + 1;
            return {
              logits: new Tensor('float32', logits, [1, 1, 151936]),
              present_keys: new Tensor('float32', new Float32Array(0), [28, 1, 8, length, 128]),
              present_values: new Tensor('float32', new Float32Array(0), [28, 1, 8, length, 128]),
            };
          },
          async release() {
            released.push(index);
          },
        };
      },
    },
  };
  return {
    ort,
    tensors,
    calls,
    loads,
    creates,
    released,
    decoded,
    weights,
    tokenizer: {
      decode(ids, options) {
        decoded.push({ ids, options });
        return ' test output ';
      },
    },
    async files(path) {
      loads.push(path);
      switch (path) {
        case 'prompt_config.json':
          return encode(config);
        case 'mel_filters.json':
          return encode({ n_mels: 128, n_freqs: 201, data: filters });
        case 'tokenizer.json':
        case 'tokenizer_config.json':
          return encode({});
        case 'embed_tokens.int8.bin':
          return embeddings;
        case 'embed_scales.f32.bin':
          return scales;
        case 'decoder_weights.int4.data':
          return weights;
        default:
          return new Uint8Array([1]);
      }
    },
  };
}
const open = (f, extra = {}) =>
  createQwenRuntime({
    files: f.files,
    ort: f.ort,
    tokenizer: f.tokenizer,
    device: 'webgpu',
    ...extra,
  });
const code = (expected) => (error) =>
  error.code === expected && error.message === expected && !error.cause;
const cleaned = (f) =>
  assert.ok(
    f.tensors.every((t) => t.disposed === 1),
    'Every input, output and superseded KV tensor disposed once',
  );

test('pinned q4 files, graph contracts, prompt splice, greedy step and GPU KV disposal', async () => {
  const f = fake(),
    progress = [],
    runtime = await open(f, { progress: (p) => progress.push(p) });
  assert.equal(QWEN_MODEL_REVISION, '4a01b95fafe2c9e3af77e33c18bbb7de349c62f6');
  assert.deepEqual([...f.loads].sort(), [...QWEN_MODEL_FILES].sort());
  assert.equal(progress.at(-1).stage, 'ready');
  assert.equal(progress.at(-1).completed, 10);
  assert.equal(f.creates[1].options.externalData[0].data, f.weights);
  assert.equal(f.creates[2].options.externalData[0].data, f.weights);
  assert.deepEqual(f.creates[1].options.executionProviders, ['webgpu']);
  assert.deepEqual(f.creates[1].options.preferredOutputLocation, {
    present_keys: 'gpu-buffer',
    present_values: 'gpu-buffer',
  });
  assert.equal(await runtime.transcribe(pcm, 'pt-BR'), 'test output');
  const [enc, init, step] = f.calls;
  assert.deepEqual(enc.feeds.mel.dims, [1, 128, 10]);
  const audio = qwenAudioTokenCount(10),
    length = 9 + audio + 6 + 3;
  assert.deepEqual(init.feeds.input_embeds.dims, [1, length, 1024]);
  assert.equal(init.feeds.input_embeds.data[9 * 1024], 0.75);
  assert.equal(init.feeds.input_embeds.data[8 * 1024], 0);
  assert.deepEqual(
    [...init.feeds.position_ids.data],
    Array.from({ length }, (_, i) => BigInt(i)),
  );
  assert.deepEqual(step.feeds.input_embeds.dims, [1, 1, 1024]);
  assert.equal(step.feeds.input_embeds.data[0], -1); // Signed int8 times scale, no quantized row copying.
  assert.deepEqual([...step.feeds.position_ids.data], [BigInt(length)]);
  assert.deepEqual(step.feeds.past_keys.dims, [28, 1, 8, length, 128]);
  assert.deepEqual(f.decoded[0].ids, [42]);
  cleaned(f);
  await runtime.dispose();
  await runtime.dispose();
  assert.deepEqual(f.released.sort(), [0, 1, 2]);
});

test('WASM is explicit and does not request GPU output locations', async () => {
  const f = fake(),
    runtime = await open(f, { device: 'wasm' });
  assert.deepEqual(f.creates[1].options.executionProviders, ['wasm']);
  assert.equal(f.creates[1].options.preferredOutputLocation, undefined);
  await runtime.dispose();
});

test('auto language strips the generated language prefix at the exact ASR delimiter', async () => {
  const f = fake({ tokens: [11528, 6364, 151704, 42, 151643] }),
    runtime = await open(f);
  await runtime.transcribe(pcm, 'auto');
  assert.deepEqual(f.decoded[0].ids, [42]);
  cleaned(f);
  await runtime.dispose();
});

test('generation is bounded to 256 even when the graph never emits EOS', async () => {
  const f = fake({ tokens: [42] }),
    runtime = await open(f);
  await runtime.transcribe(pcm, 'en');
  assert.equal(f.decoded[0].ids.length, 256);
  assert.equal(f.calls.filter((c) => c.index === 2).length, 255);
  cleaned(f);
  await runtime.dispose();
});

test('cancel during GPU run drops all returned outputs and never publishes text', async () => {
  const abort = new AbortController();
  const f = fake({
      onRun: (index) => {
        if (index === 2) abort.abort();
      },
    }),
    runtime = await open(f);
  await assert.rejects(runtime.transcribe(pcm, 'en', abort.signal), code('cancelled'));
  assert.equal(f.decoded.length, 0);
  cleaned(f);
  await runtime.dispose();
});

test('pre-abort skips files; partial session creation failure is sanitized and released', async () => {
  const f = fake(),
    abort = new AbortController();
  abort.abort();
  await assert.rejects(open(f, { signal: abort.signal }), code('cancelled'));
  assert.equal(f.loads.length, 0);
  const partial = fake({ createFailure: 1 });
  await assert.rejects(open(partial), code('inference-failed'));
  assert.deepEqual(partial.released, [0]);
});

test('malformed encoder shape, unsupported language, nonfinite and overlong PCM fail closed', async () => {
  const bad = fake({ malformed: true }),
    malformed = await open(bad);
  await assert.rejects(malformed.transcribe(pcm, 'en'), code('inference-failed'));
  cleaned(bad);
  await malformed.dispose();
  const f = fake(),
    runtime = await open(f);
  await assert.rejects(runtime.transcribe(pcm, 'xx'), code('inference-failed'));
  cleaned(f);
  await assert.rejects(
    runtime.transcribe(new Float32Array(480001), 'en'),
    code('inference-failed'),
  );
  await assert.rejects(runtime.transcribe(new Float32Array(100), 'en'), code('inference-failed'));
  await assert.rejects(
    runtime.transcribe(new Float32Array(300).fill(NaN), 'en'),
    code('inference-failed'),
  );
  await runtime.dispose();
  await assert.rejects(runtime.transcribe(pcm, 'en'), code('cancelled'));
});

test('dispose waits for the current ORT operation, rejects overlap, and cancels its result', async () => {
  let release, started;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const running = new Promise((resolve) => {
    started = resolve;
  });
  const f = fake({
      onRun: async (index) => {
        if (index === 0) {
          started();
          await gate;
        }
      },
    }),
    runtime = await open(f);
  const task = runtime.transcribe(pcm, 'en');
  await running;
  await assert.rejects(runtime.transcribe(pcm, 'en'), code('inference-failed'));
  const disposing = runtime.dispose();
  assert.equal(f.released.length, 0);
  release();
  await assert.rejects(task, code('cancelled'));
  await disposing;
  cleaned(f);
  assert.deepEqual(f.released.sort(), [0, 1, 2]);
});

test('missing browser GPU fails before loading any model assets', async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { gpu: undefined } });
  try {
    let loads = 0;
    await assert.rejects(
      createQwenRuntime({
        files: async () => {
          loads++;
          return new Uint8Array([1]);
        },
        device: 'webgpu',
      }),
      code('gpu-unavailable'),
    );
    assert.equal(loads, 0);
  } finally {
    if (original) Object.defineProperty(globalThis, 'navigator', original);
    else delete globalThis.navigator;
  }
});

test('cancelled file fetch and provider failures do not leak raw details', async () => {
  const abort = new AbortController(),
    f = fake();
  await assert.rejects(
    open(f, {
      signal: abort.signal,
      files: async () => {
        abort.abort();
        throw new Error('PRIVATE URL or token');
      },
    }),
    code('cancelled'),
  );
  const failed = fake({
      onRun: (index) => {
        if (index === 2) throw new Error('PRIVATE GPU provider data');
      },
    }),
    runtime = await open(failed);
  await assert.rejects(runtime.transcribe(pcm, 'en'), code('inference-failed'));
  cleaned(failed);
  await runtime.dispose();
});

test('auto language without ASR delimiter fails closed rather than returning metadata', async () => {
  const f = fake({ tokens: [11528, 6364, 151645] }),
    runtime = await open(f);
  await assert.rejects(runtime.transcribe(pcm, 'auto'), code('inference-failed'));
  assert.equal(f.decoded.length, 0);
  cleaned(f);
  await runtime.dispose();
});

test('mixed-radix 400-point log-mel equals direct DFT with reflection, periodic Hann and global clamp', () => {
  const result = qwenLogMel(pcm, filters),
    expected = new Float32Array(128 * 10);
  let max = -Infinity;
  for (let frame = 0; frame < 10; frame++)
    for (let m = 0; m < 128; m++) {
      let real = 0,
        imaginary = 0;
      const k = m + 1;
      for (let i = 0; i < 400; i++) {
        let at = frame * 160 + i - 200;
        if (at < 0) at = -at;
        if (at >= pcm.length) at = 2 * pcm.length - 2 - at;
        const sample = pcm[at] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / 400));
        real += sample * Math.cos((2 * Math.PI * k * i) / 400);
        imaginary -= sample * Math.sin((2 * Math.PI * k * i) / 400);
      }
      const log = Math.log10(Math.max(1e-10, 0.01 * (real ** 2 + imaginary ** 2)));
      expected[m * 10 + frame] = log;
      max = Math.max(max, log);
    }
  for (let i = 0; i < expected.length; i++)
    assert.ok(Math.abs(result.data[i] - (Math.max(expected[i], max - 8) + 4) / 4) < 2e-6);
  assert.equal(result.frames, 10);
  assert.ok(qwenLogMel(new Float32Array(1600), filters).data.every((v) => v === -1.5));
  assert.deepEqual([1, 99, 100, 101, 199, 3000].map(qwenAudioTokenCount), [1, 13, 13, 14, 26, 390]);
});
