import { SileroFrameResampler } from './StreamingResampler.js';

export interface VadRequest {
  type: 'open' | 'pcm' | 'reset' | 'release';
  source: number;
  generation: number;
  request?: number;
  pcm?: Float32Array;
  sampleRate?: number;
}
export interface VadResponse {
  type: 'probability' | 'done' | 'reset' | 'error';
  source: number;
  generation: number;
  request?: number;
  probability?: number;
  pcm?: Float32Array;
  message?: string;
}
interface OrtTensor {
  data: ArrayLike<number | bigint>;
}
export interface VadOrt {
  env: { wasm: { wasmPaths: string; numThreads: number; proxy?: boolean } };
  Tensor: new (type: string, data: Float32Array | BigInt64Array, dims: number[]) => OrtTensor;
  InferenceSession: {
    create(
      url: string,
      options: object,
    ): Promise<{
      run(feeds: Record<string, OrtTensor>): Promise<Record<string, OrtTensor>>;
      release(): Promise<void> | void;
    }>;
  };
}
interface Frame {
  pcm: Float32Array;
  request: number;
  last: boolean;
}
interface Source {
  generation: number;
  resampler: SileroFrameResampler;
  state: Float32Array;
  context: Float32Array;
  queue: Frame[];
}
/** One session, one run in flight. Round-robin service preserves each source's FIFO. */
export class SileroWorkerRuntime {
  private sources = new Map<number, Source>();
  private session: Awaited<ReturnType<VadOrt['InferenceSession']['create']>> | undefined;
  private loading: Promise<NonNullable<SileroWorkerRuntime['session']>> | undefined;
  private running = false;
  private disposed = false;
  private lastSource = -1;
  constructor(
    private ort: VadOrt,
    private base: string,
    private emit: (message: VadResponse) => void,
    private maxFrames = 64,
  ) {
    ort.env.wasm.wasmPaths = base;
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.proxy = false;
  }
  private source(generation: number): Source {
    return {
      generation,
      resampler: new SileroFrameResampler(),
      state: new Float32Array(256),
      context: new Float32Array(64),
      queue: [],
    };
  }
  receive(message: VadRequest) {
    if (this.disposed) return;
    const { source: id, generation } = message;
    if (message.type === 'open') {
      this.sources.set(id, this.source(generation));
      // Acquire is lazy relative to product selection, but reports model failure before audio arrives.
      void this.load().catch((error) => this.failAll(error));
      return;
    }
    const source = this.sources.get(id);
    if (!source || generation < source.generation) return;
    if (message.type === 'release') {
      this.sources.delete(id);
      return;
    }
    if (message.type === 'reset') {
      this.sources.set(id, this.source(generation));
      return;
    }
    if (generation !== source.generation) return;
    try {
      if (!(message.pcm instanceof Float32Array) || !Number.isInteger(message.request))
        throw new Error('Invalid VAD PCM request.');
      if (message.pcm.length > (message.sampleRate || 0) / 4)
        throw new Error('VAD PCM request exceeds capture bound.');
      const frames = source.resampler.process(message.pcm, message.sampleRate!);
      if (source.queue.length + frames.length > this.maxFrames) {
        const next = generation + 1;
        this.sources.set(id, this.source(next));
        this.emit({
          type: 'reset',
          source: id,
          generation: next,
          message: 'VAD inference queue overloaded.',
        });
        return;
      }
      if (!frames.length)
        this.emit({ type: 'done', source: id, generation, request: message.request });
      frames.forEach((pcm, i) =>
        source.queue.push({ pcm, request: message.request!, last: i === frames.length - 1 }),
      );
      void this.drain();
    } catch (error) {
      this.sources.set(id, this.source(generation));
      this.emit({
        type: 'error',
        source: id,
        generation,
        message: error instanceof Error ? error.message : 'VAD inference failed.',
      });
    }
  }
  private load() {
    if (!this.loading)
      this.loading = this.ort.InferenceSession.create(this.base + 'silero_vad_v5.onnx', {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
      }).then(async (session) => {
        if (this.disposed) {
          await session.release();
          throw new Error('VAD runtime released during model load.');
        }
        this.session = session;
        return session;
      });
    return this.loading;
  }
  private failAll(error: unknown) {
    if (this.disposed) return;
    for (const [id, source] of this.sources) {
      source.queue = [];
      this.emit({
        type: 'error',
        source: id,
        generation: source.generation,
        message: error instanceof Error ? error.message : 'VAD model initialization failed.',
      });
    }
  }
  private next() {
    const ids = [...this.sources.keys()];
    const after = ids.indexOf(this.lastSource) + 1;
    for (let i = 0; i < ids.length; i++) {
      const id = ids[(after + i) % ids.length];
      const source = this.sources.get(id)!;
      if (source.queue.length) {
        this.lastSource = id;
        return { id, source };
      }
    }
  }
  private async drain() {
    if (this.running || this.disposed) return;
    this.running = true;
    try {
      const session = await this.load();
      while (!this.disposed) {
        const next = this.next();
        if (!next) break;
        const { id, source } = next;
        const frame = source.queue.shift()!;
        const input = new Float32Array(576);
        input.set(source.context);
        input.set(frame.pcm, 64);
        try {
          const output = await session.run({
            input: new this.ort.Tensor('float32', input, [1, 576]),
            state: new this.ort.Tensor('float32', source.state, [2, 1, 128]),
            sr: new this.ort.Tensor('int64', BigInt64Array.from([16000n]), [1]),
          });
          if (this.disposed || this.sources.get(id) !== source) continue;
          const probability = Number(output.output?.data[0]);
          const state = output.stateN?.data;
          if (
            !Number.isFinite(probability) ||
            probability < 0 ||
            probability > 1 ||
            state?.length !== 256
          )
            throw new Error('Invalid Silero model output.');
          source.state = Float32Array.from(state as ArrayLike<number>);
          source.context.set(frame.pcm.subarray(448));
          this.emit({
            type: 'probability',
            source: id,
            generation: source.generation,
            request: frame.request,
            probability,
            pcm: frame.pcm,
          });
          if (frame.last)
            this.emit({
              type: 'done',
              source: id,
              generation: source.generation,
              request: frame.request,
            });
        } catch (error) {
          if (this.sources.get(id) !== source || this.disposed) continue;
          this.sources.set(id, this.source(source.generation));
          this.emit({
            type: 'error',
            source: id,
            generation: source.generation,
            message: error instanceof Error ? error.message : 'VAD inference failed.',
          });
        }
      }
    } catch (error) {
      this.failAll(error);
    } finally {
      this.running = false;
      if (this.disposed && this.session) {
        const session = this.session;
        this.session = undefined;
        await session.release();
      }
    }
  }
  async dispose() {
    this.disposed = true;
    this.sources.clear();
    // A loading session releases itself; a running session is owned until its run completes.
    if (this.session && !this.running) {
      const session = this.session;
      this.session = undefined;
      await session.release();
    }
  }
}
