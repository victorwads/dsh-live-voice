/** Independent implementation of the Apache-2.0 model's layout-v2 contracts.
 * https://huggingface.co/jiangzhuo9357/Qwen3-ASR-0.6B-ONNX/blob/4a01b95fafe2c9e3af77e33c18bbb7de349c62f6/README.md
 * No Sokuji (AGPL) implementation code is included. Worker-safe: no capture or DOM APIs.
 */
export const QWEN_MODEL_REVISION = '4a01b95fafe2c9e3af77e33c18bbb7de349c62f6';
export const QWEN_MODEL_FILES = [
  'prompt_config.json',
  'mel_filters.json',
  'tokenizer.json',
  'tokenizer_config.json',
  'embed_tokens.int8.bin',
  'embed_scales.f32.bin',
  'encoder.onnx',
  'decoder_init.int4.onnx',
  'decoder_step.int4.onnx',
  'decoder_weights.int4.data',
] as const;
export type QwenErrorCode = 'gpu-unavailable' | 'inference-failed' | 'cancelled';
export class QwenRuntimeError extends Error {
  readonly code: QwenErrorCode;
  constructor(code: QwenErrorCode) {
    super(code);
    this.name = 'QwenRuntimeError';
    this.code = code;
  }
}
export interface QwenTensor {
  readonly type: string;
  readonly dims: readonly number[];
  readonly data: Float32Array | BigInt64Array;
  dispose(): void;
}
export interface QwenSession {
  run(feeds: Record<string, QwenTensor>): Promise<Record<string, QwenTensor>>;
  release(): Promise<void> | void;
}
/** Structural seam for CPU contract tests; production uses the packaged ORT module. */
export interface QwenOrt {
  Tensor: new (
    type: 'float32' | 'int64',
    data: Float32Array | BigInt64Array,
    dims: number[],
  ) => QwenTensor;
  InferenceSession: {
    create(model: Uint8Array, options: Record<string, unknown>): Promise<QwenSession>;
  };
}
export interface QwenRuntimeOptions {
  files(path: string): Promise<Uint8Array>;
  device: 'webgpu' | 'wasm';
  progress?(progress: { stage: 'loading' | 'ready'; completed: number; total: number }): void;
  signal?: AbortSignal;
  /** Dependency injection only; does not relax the graph contracts. */
  ort?: QwenOrt;
  tokenizer?: {
    decode(
      ids: number[],
      options: { skip_special_tokens: boolean; clean_up_tokenization_spaces: boolean },
    ): string;
  };
}
export interface QwenRuntime {
  transcribe(pcm16k: Float32Array, language: string, signal?: AbortSignal): Promise<string>;
  dispose(): Promise<void>;
}
type PromptConfig = {
  layout_version: number;
  mel: {
    sample_rate: number;
    n_fft: number;
    hop_length: number;
    n_mels: number;
    drop_last_frame: boolean;
  };
  audio_tokens: { conv_window: number; tokens_per_window: number };
  prompt: {
    prefix_ids: number[];
    suffix_ids: number[];
    audio_pad_id: number;
    asr_text_id: number;
    eos_ids: number[];
    max_new_tokens: number;
  };
  language_prefix_ids: Record<string, number[]>;
  embedding: { dtype: string; shape: number[]; file: string; scales_file: string };
  decoder: {
    num_layers: number;
    num_key_value_heads: number;
    head_dim: number;
    hidden_size: number;
    vocab_size: number;
  };
  variants: {
    q4: {
      encoder: string;
      decoder_init: string;
      decoder_step: string;
      weights: string;
      required_features: string[];
    };
  };
};
const fail = (): never => {
  throw new QwenRuntimeError('inference-failed');
};
function check(signal?: AbortSignal): void {
  if (signal?.aborted) throw new QwenRuntimeError('cancelled');
}
function requireContract(ok: unknown): asserts ok {
  if (!ok) fail();
}
function sanitized(error: unknown): QwenRuntimeError {
  return error instanceof QwenRuntimeError ? error : new QwenRuntimeError('inference-failed');
}
function shape(
  t: QwenTensor | undefined,
  dims: number[],
  type = 'float32',
): asserts t is QwenTensor {
  requireContract(
    t && t.type === type && t.dims.length === dims.length && t.dims.every((d, i) => d === dims[i]),
  );
}
function validateConfig(c: PromptConfig): void {
  const m = c.mel,
    d = c.decoder,
    p = c.prompt,
    v = c.variants.q4;
  requireContract(
    c.layout_version === 2 &&
      m.sample_rate === 16000 &&
      m.n_fft === 400 &&
      m.hop_length === 160 &&
      m.n_mels === 128 &&
      m.drop_last_frame,
  );
  requireContract(c.audio_tokens.conv_window === 100 && c.audio_tokens.tokens_per_window === 13);
  requireContract(
    d.num_layers === 28 &&
      d.num_key_value_heads === 8 &&
      d.head_dim === 128 &&
      d.hidden_size === 1024 &&
      d.vocab_size === 151936,
  );
  requireContract(
    c.embedding.dtype === 'int8' &&
      c.embedding.shape.join(',') === '151936,1024' &&
      c.embedding.file === 'embed_tokens.int8.bin' &&
      c.embedding.scales_file === 'embed_scales.f32.bin',
  );
  requireContract(
    v.encoder === 'encoder.onnx' &&
      v.decoder_init === 'decoder_init.int4.onnx' &&
      v.decoder_step === 'decoder_step.int4.onnx' &&
      v.weights === 'decoder_weights.int4.data' &&
      v.required_features.length === 0,
  );
  const ids = [
    ...p.prefix_ids,
    ...p.suffix_ids,
    p.audio_pad_id,
    p.asr_text_id,
    ...p.eos_ids,
    ...Object.values(c.language_prefix_ids).flat(),
  ];
  requireContract(ids.every((id) => Number.isInteger(id) && id >= 0 && id < 151936));
  requireContract(
    p.prefix_ids.length > 0 &&
      p.suffix_ids.length > 0 &&
      p.asr_text_id === 151704 &&
      p.eos_ids.join(',') === '151643,151645' &&
      p.max_new_tokens === 256,
  );
}

// A reusable mixed-radix 400-point FFT plan (2,2,2,2,5,5). The forward
// transform is unnormalised, matching torch.stft; no padding to a power of two.
function fftPlan(n: number): {
  run(input: Float64Array, offset: number, stride: number): void;
  re: Float64Array;
  im: Float64Array;
} {
  const re = new Float64Array(n),
    im = new Float64Array(n);
  if (n === 1)
    return {
      re,
      im,
      run(input, offset) {
        re[0] = input[offset];
        im[0] = 0;
      },
    };
  const radix = n % 2 === 0 ? 2 : 5,
    size = n / radix;
  const children = Array.from({ length: radix }, () => fftPlan(size));
  const cos = new Float64Array(n * radix),
    sin = new Float64Array(n * radix);
  for (let k = 0; k < n; k++)
    for (let j = 0; j < radix; j++) {
      const angle = (-2 * Math.PI * k * j) / n;
      cos[k * radix + j] = Math.cos(angle);
      sin[k * radix + j] = Math.sin(angle);
    }
  return {
    re,
    im,
    run(input, offset, stride) {
      children.forEach((child, j) => child.run(input, offset + j * stride, stride * radix));
      for (let k = 0; k < n; k++) {
        let real = 0,
          imaginary = 0;
        for (let j = 0; j < radix; j++) {
          const child = children[j],
            q = k % size,
            index = k * radix + j;
          real += child.re[q] * cos[index] - child.im[q] * sin[index];
          imaginary += child.re[q] * sin[index] + child.im[q] * cos[index];
        }
        re[k] = real;
        im[k] = imaginary;
      }
    },
  };
}
/** Whisper-compatible variable-length log-mel, using the model's exact Slaney bank. */
export function qwenLogMel(
  pcm: Float32Array,
  filters: readonly (readonly number[])[],
): { data: Float32Array; frames: number } {
  requireContract(pcm.length > 200 && pcm.length <= 480000 && pcm.every(Number.isFinite));
  requireContract(
    filters.length === 128 &&
      filters.every((row) => row.length === 201 && row.every((x) => Number.isFinite(x) && x >= 0)),
  );
  const frames = Math.floor(pcm.length / 160),
    mel = new Float32Array(128 * frames);
  const plan = fftPlan(400),
    window = Float64Array.from(
      { length: 400 },
      (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / 400),
    );
  const input = new Float64Array(400),
    power = new Float64Array(201);
  let max = -Infinity;
  for (let frame = 0; frame < frames; frame++) {
    for (let i = 0; i < 400; i++) {
      let at = frame * 160 + i - 200;
      if (at < 0) at = -at;
      if (at >= pcm.length) at = 2 * pcm.length - 2 - at;
      input[i] = pcm[at] * window[i];
    }
    plan.run(input, 0, 1);
    for (let k = 0; k < 201; k++) power[k] = plan.re[k] ** 2 + plan.im[k] ** 2;
    for (let m = 0; m < 128; m++) {
      let sum = 0;
      for (let k = 0; k < 201; k++) sum += filters[m][k] * power[k];
      const value = Math.log10(Math.max(1e-10, sum));
      mel[m * frames + frame] = value;
      max = Math.max(max, value);
    }
  }
  for (let i = 0; i < mel.length; i++) mel[i] = (Math.max(mel[i], max - 8) + 4) / 4;
  return { data: mel, frames };
}
export function qwenAudioTokenCount(frames: number): number {
  let tail = frames % 100;
  for (let i = 0; i < 3; i++) tail = Math.floor((tail + 1) / 2);
  return 13 * Math.floor(frames / 100) + tail;
}

/** Caller owns pinned file cache and ORT's same-origin WASM asset configuration.
 * Exactly one utterance may run at a time; worker pool owns cross-source scheduling.
 * Abort does not release a session underneath an in-flight ORT operation: results
 * are discarded at the next boundary, with all GPU tensors then disposed.
 */
export async function createQwenRuntime(options: QwenRuntimeOptions): Promise<QwenRuntime> {
  const sessions: QwenSession[] = [];
  try {
    check(options.signal);
    if (options.device === 'webgpu' && !options.ort) {
      const gpu = (
        globalThis as unknown as { navigator?: { gpu?: { requestAdapter(): Promise<unknown> } } }
      ).navigator?.gpu;
      let adapter: unknown;
      try {
        adapter = await gpu?.requestAdapter();
      } catch {
        /* No provider diagnostics escape. */
      }
      check(options.signal);
      if (!adapter) throw new QwenRuntimeError('gpu-unavailable');
    }
    // ORT declares ambient modules using its original name, not npm aliases.
    // @ts-expect-error -- alias has the same runtime exports; checked structural surface above.
    const ort = options.ort ?? ((await import('@dlv/ort-local/webgpu')) as unknown as QwenOrt);
    check(options.signal);
    let completed = 0;
    const load = async (path: (typeof QWEN_MODEL_FILES)[number]) => {
      check(options.signal);
      const bytes = await options.files(path);
      check(options.signal);
      requireContract(bytes instanceof Uint8Array && bytes.byteLength > 0);
      options.progress?.({
        stage: 'loading',
        completed: ++completed,
        total: QWEN_MODEL_FILES.length,
      });
      return bytes;
    };
    const json = async (path: (typeof QWEN_MODEL_FILES)[number]) =>
      JSON.parse(new TextDecoder().decode(await load(path)));
    const config = (await json('prompt_config.json')) as PromptConfig;
    validateConfig(config);
    const filters = (await json('mel_filters.json')) as {
      n_mels: number;
      n_freqs: number;
      data: number[][];
    };
    requireContract(
      filters.n_mels === 128 &&
        filters.n_freqs === 201 &&
        filters.data.length === 128 &&
        filters.data.every(
          (row) => row.length === 201 && row.every((x) => Number.isFinite(x) && x >= 0),
        ),
    );
    const tokenizerJSON = await json('tokenizer.json'),
      tokenizerConfig = await json('tokenizer_config.json');
    const tokenizer =
      options.tokenizer ??
      new (await import('@huggingface/transformers')).PreTrainedTokenizer(
        tokenizerJSON,
        tokenizerConfig,
      );
    const embeddingBytes = await load('embed_tokens.int8.bin'),
      scaleBytes = await load('embed_scales.f32.bin');
    requireContract(
      embeddingBytes.byteLength === 151936 * 1024 && scaleBytes.byteLength === 151936 * 4,
    );
    const table = new Int8Array(
      embeddingBytes.buffer,
      embeddingBytes.byteOffset,
      embeddingBytes.byteLength,
    );
    // DataView works with unaligned cache slices and specifies the file's little-endian format.
    const view = new DataView(scaleBytes.buffer, scaleBytes.byteOffset, scaleBytes.byteLength);
    const scales = Float32Array.from({ length: 151936 }, (_, i) => view.getFloat32(i * 4, true));
    requireContract(scales.every((x) => Number.isFinite(x) && x >= 0));
    const weights = await load('decoder_weights.int4.data');
    const common = { executionProviders: [options.device], logSeverityLevel: 4 };
    const decoderOptions = {
      ...common,
      externalData: [{ path: 'decoder_weights.int4.data', data: weights }],
      ...(options.device === 'webgpu'
        ? { preferredOutputLocation: { present_keys: 'gpu-buffer', present_values: 'gpu-buffer' } }
        : {}),
    };
    for (const path of [
      'encoder.onnx',
      'decoder_init.int4.onnx',
      'decoder_step.int4.onnx',
    ] as const) {
      const model = await load(path);
      sessions.push(
        await ort.InferenceSession.create(model, path === 'encoder.onnx' ? common : decoderOptions),
      );
      check(options.signal);
    }
    options.progress?.({ stage: 'ready', completed, total: QWEN_MODEL_FILES.length });
    let disposed = false,
      active: Promise<string> | undefined,
      disposing: Promise<void> | undefined;
    const transcribe = async (
      pcm: Float32Array,
      language: string,
      signal?: AbortSignal,
    ): Promise<string> => {
      const tensors = new Set<QwenTensor>();
      const guard = () => {
        check(options.signal);
        check(signal);
        if (disposed) throw new QwenRuntimeError('cancelled');
      };
      const keep = (t: QwenTensor) => {
        tensors.add(t);
        return t;
      };
      const drop = (t: QwenTensor) => {
        if (tensors.delete(t)) t.dispose();
      };
      const run = async (session: QwenSession, feeds: Record<string, QwenTensor>) => {
        guard();
        const result = await session.run(feeds);
        Object.values(result).forEach(keep);
        guard();
        return result;
      };
      const embed = (ids: number[]) => {
        const data = new Float32Array(ids.length * 1024);
        for (let row = 0; row < ids.length; row++) {
          const id = ids[row];
          for (let h = 0; h < 1024; h++) data[row * 1024 + h] = table[id * 1024 + h] * scales[id];
        }
        return data;
      };
      const positions = (length: number, start = 0) =>
        keep(
          new ort.Tensor(
            'int64',
            BigInt64Array.from({ length }, (_, i) => BigInt(start + i)),
            [1, length],
          ),
        );
      try {
        guard();
        const mel = qwenLogMel(pcm, filters.data);
        guard();
        const melTensor = keep(new ort.Tensor('float32', mel.data, [1, 128, mel.frames]));
        const encoded = await run(sessions[0], { mel: melTensor });
        const audioCount = qwenAudioTokenCount(mel.frames);
        shape(encoded.audio_features, [1, audioCount, 1024]);
        requireContract(encoded.audio_features.data.length === audioCount * 1024);
        const iso = language.toLowerCase().split(/[-_]/)[0];
        const forced = config.language_prefix_ids[iso];
        // Explicit auto is allowed; an unsupported specified language is not silently ignored.
        requireContract(forced || iso === 'auto' || iso === '');
        const p = config.prompt;
        const ids = [
          ...p.prefix_ids,
          ...Array<number>(audioCount).fill(p.audio_pad_id),
          ...p.suffix_ids,
          ...(forced ?? []),
        ];
        const embeddings = embed(ids);
        embeddings.set(encoded.audio_features.data as Float32Array, p.prefix_ids.length * 1024);
        Object.values(encoded).forEach(drop);
        drop(melTensor);
        let input = keep(new ort.Tensor('float32', embeddings, [1, ids.length, 1024]));
        let pos = positions(ids.length);
        let outputs = await run(sessions[1], { input_embeds: input, position_ids: pos });
        drop(input);
        drop(pos);
        let length = ids.length;
        const generated: number[] = [];
        for (let step = 0; step < 256; step++) {
          guard();
          shape(outputs.logits, [1, 1, 151936]);
          shape(outputs.present_keys, [28, 1, 8, length, 128]);
          shape(outputs.present_values, [28, 1, 8, length, 128]);
          const logits = outputs.logits.data;
          requireContract(logits instanceof Float32Array && logits.length === 151936);
          let token = 0,
            score = -Infinity;
          for (let i = 0; i < logits.length; i++) {
            requireContract(Number.isFinite(logits[i]));
            if (logits[i] > score) {
              score = logits[i];
              token = i;
            }
          }
          drop(outputs.logits);
          if (p.eos_ids.includes(token)) break;
          generated.push(token);
          if (step === 255) break;
          input = keep(new ort.Tensor('float32', embed([token]), [1, 1, 1024]));
          pos = positions(1, length);
          const previous = outputs;
          outputs = await run(sessions[2], {
            input_embeds: input,
            position_ids: pos,
            past_keys: previous.present_keys,
            past_values: previous.present_values,
          });
          Object.values(previous).forEach(drop);
          drop(input);
          drop(pos);
          length++;
        }
        guard();
        const delimiter = generated.indexOf(p.asr_text_id);
        requireContract(forced || delimiter >= 0 || generated.length === 0);
        return tokenizer
          .decode(delimiter >= 0 ? generated.slice(delimiter + 1) : generated, {
            skip_special_tokens: true,
            clean_up_tokenization_spaces: false,
          })
          .trim();
      } catch (error) {
        guard();
        throw sanitized(error);
      } finally {
        for (const tensor of tensors) {
          try {
            tensor.dispose();
          } catch {
            /* Preserve the sanitized inference failure. */
          }
        }
      }
    };
    return {
      transcribe(pcm, language, signal) {
        if (disposed) return Promise.reject(new QwenRuntimeError('cancelled'));
        if (active) return Promise.reject(new QwenRuntimeError('inference-failed'));
        active = transcribe(pcm, language, signal).finally(() => {
          active = undefined;
        });
        return active;
      },
      dispose() {
        if (!disposing) {
          disposed = true;
          disposing = (async () => {
            await active?.catch(() => {});
            const results = await Promise.allSettled(sessions.map(async (s) => s.release()));
            if (results.some((r) => r.status === 'rejected')) fail();
          })();
        }
        return disposing;
      },
    };
  } catch (error) {
    await Promise.allSettled(sessions.map(async (session) => session.release()));
    check(options.signal);
    throw sanitized(error);
  }
}
