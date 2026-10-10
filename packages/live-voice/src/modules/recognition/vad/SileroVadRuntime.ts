import { sileroVadAssetBase } from './assets.js';
import type {
  VadRequest,
  VadResponse,
  SileroWorkerDiagnostics,
  SileroVadStatus,
} from './SileroWorkerRuntime.js';

export interface SileroVadDiagnostics extends SileroWorkerDiagnostics {
  workerActive: boolean;
  pendingRequests: number;
  pendingSources: number;
}
const emptyDiagnostics = (status: SileroVadStatus): SileroWorkerDiagnostics => ({
  status,
  modelLoadMs: null,
  processedFrames: 0,
  inferenceLastMs: null,
  inferenceAverageMs: null,
  queuedFrames: 0,
  accountedBufferBytes: 0,
  activeSources: 0,
  overloadCount: 0,
});

export interface SileroVadProbability {
  probability: number;
  pcm: Float32Array;
  sampleRate: 16000;
}
export interface SileroVadOptions {
  onProbability(result: SileroVadProbability): void;
  onError(error: Error): void;
  onReset?(): void;
}
export interface SileroVadStream {
  /** Copy PCM to the worker; input remains owned by the caller. */
  ingest(pcm: Float32Array, sampleRate: number): void;
  /** Resolves after this chunk's complete frames have been evaluated. */
  process(pcm: Float32Array, sampleRate: number): Promise<void>;
  reset(): void;
  /** Surface a capture failure through the same explicit runtime error channel. */
  reportError(error: Error): void;
  release(): void;
  readonly released: boolean;
}
interface WorkerPort {
  postMessage(message: VadRequest, transfer?: Transferable[]): void;
  terminate(): void;
  onmessage: ((event: { data: VadResponse }) => void) | null;
  onerror: ((event: { message?: string; preventDefault?: () => void }) => void) | null;
  onmessageerror?: (() => void) | null;
}
interface ClientSource {
  generation: number;
  options: SileroVadOptions;
  pending: Map<number, { resolve(): void; reject(error: Error): void }>;
  released: boolean;
  failure?: Error;
}
const cancelled = () =>
  Object.assign(new Error('VAD operation cancelled.'), { name: 'AbortError' });
/** Injectable factory for unit tests; production uses the one module-level pool below. */
export class SileroVadPool {
  private worker?: WorkerPort;
  private sources = new Map<number, ClientSource>();
  private sourceId = 0;
  private requestId = 0;
  private diagnostics = emptyDiagnostics('idle');
  private overloadCount = 0;
  /** No runtime creation, messages, network, PCM, transcripts, or mutable references. */
  readDiagnostics(): SileroVadDiagnostics {
    let pendingRequests = 0;
    let pendingSources = 0;
    for (const source of this.sources.values()) {
      pendingRequests += source.pending.size;
      if (source.pending.size) pendingSources++;
    }
    return {
      ...this.diagnostics,
      workerActive: !!this.worker,
      activeSources: this.sources.size,
      pendingRequests,
      pendingSources,
      overloadCount: this.overloadCount + this.diagnostics.overloadCount,
    };
  }
  constructor(
    private createWorker: (url: string) => WorkerPort = (url) =>
      new Worker(url, { type: 'module' }) as unknown as WorkerPort,
    private maxPending = 64,
  ) {}
  private send(message: VadRequest, transfer?: Transferable[]) {
    this.worker!.postMessage(message, transfer);
  }
  private settle(source: ClientSource, error: Error) {
    for (const pending of source.pending.values()) pending.reject(error);
    source.pending.clear();
  }
  private fatal(error: Error) {
    const worker = this.worker;
    this.worker = undefined;
    this.diagnostics = {
      ...this.diagnostics,
      status: 'error',
      activeSources: 0,
      queuedFrames: 0,
      accountedBufferBytes: 0,
    };
    worker?.terminate();
    for (const source of this.sources.values()) {
      source.failure = error;
      this.settle(source, error);
      source.options.onError(error);
    }
  }
  private receive(message: VadResponse) {
    if (message.type === 'telemetry') {
      this.diagnostics = { ...message.diagnostics };
      return;
    }
    const source = this.sources.get(message.source);
    if (!source || source.released || source.failure) return;
    if (message.type === 'reset' && message.generation > source.generation) {
      source.generation = message.generation;
      this.settle(source, new Error(message.message || 'VAD queue overloaded.'));
      source.options.onReset?.();
      source.options.onError(new Error(message.message || 'VAD queue overloaded.'));
      return;
    }
    if (message.generation !== source.generation) return;
    if (message.type === 'error') {
      this.diagnostics = { ...this.diagnostics, status: 'error' };
      const error = new Error(message.message || 'VAD inference failed.');
      source.failure = error;
      this.settle(source, error);
      source.options.onError(error);
    } else if (message.type === 'probability') {
      source.options.onProbability({
        probability: message.probability!,
        pcm: message.pcm!,
        sampleRate: 16000,
      });
    } else if (message.type === 'done') {
      source.pending.get(message.request!)?.resolve();
      source.pending.delete(message.request!);
    }
  }
  acquire(options: SileroVadOptions): SileroVadStream {
    if (!this.worker) {
      if (this.sources.size) throw new Error('Failed VAD streams must be released before retry.');
      const worker = this.createWorker(
        sileroVadAssetBase() + 'vad.worker.js?revision=telemetry-v1',
      );
      this.worker = worker;
      this.diagnostics = emptyDiagnostics('loading');
      this.overloadCount = 0;
      worker.onmessage = (event) => {
        if (this.worker === worker) this.receive(event.data);
      };
      worker.onerror = (event) => {
        event.preventDefault?.();
        if (this.worker === worker) this.fatal(new Error(event.message || 'VAD worker failed.'));
      };
      worker.onmessageerror = () => {
        if (this.worker === worker) this.fatal(new Error('VAD worker message failed.'));
      };
    }
    const id = ++this.sourceId;
    const source: ClientSource = { generation: 0, options, pending: new Map(), released: false };
    this.sources.set(id, source);
    const reset = () => {
      if (source.released || source.failure) return;
      source.generation++;
      this.settle(source, cancelled());
      this.send({ type: 'reset', source: id, generation: source.generation });
      options.onReset?.();
    };
    const process = (pcm: Float32Array, sampleRate: number) => {
      if (source.released) return Promise.reject(cancelled());
      if (source.failure) return Promise.reject(source.failure);
      if (
        !(pcm instanceof Float32Array) ||
        !Number.isFinite(sampleRate) ||
        sampleRate < 16000 ||
        sampleRate > 192000 ||
        pcm.length > sampleRate / 4
      )
        return Promise.reject(new Error('Invalid or oversized VAD PCM chunk.'));
      if (source.pending.size >= this.maxPending) {
        this.overloadCount++;
        reset();
        const error = new Error('VAD capture queue overloaded.');
        options.onError(error);
        return Promise.reject(error);
      }
      const request = ++this.requestId;
      const copy = pcm.slice();
      return new Promise<void>((resolve, reject) => {
        source.pending.set(request, { resolve, reject });
        try {
          this.send(
            {
              type: 'pcm',
              source: id,
              generation: source.generation,
              request,
              pcm: copy,
              sampleRate,
            },
            [copy.buffer],
          );
        } catch (error) {
          this.fatal(error instanceof Error ? error : new Error('VAD worker send failed.'));
        }
      });
    };
    try {
      this.send({ type: 'open', source: id, generation: 0 });
    } catch (error) {
      this.sources.delete(id);
      this.fatal(error instanceof Error ? error : new Error('VAD worker initialization failed.'));
      throw error;
    }
    return {
      get released() {
        return source.released;
      },
      process,
      ingest: (pcm, rate) => {
        void process(pcm, rate).catch((error) => {
          // Runtime failures and overload are already surfaced by receive/fatal/reset.
          if (
            !source.released &&
            !source.failure &&
            error.name !== 'AbortError' &&
            error.message !== 'VAD capture queue overloaded.' &&
            error.message !== 'VAD inference queue overloaded.'
          )
            options.onError(error);
        });
      },
      reset,
      reportError: (error) => {
        if (source.released || source.failure) return;
        source.failure = error;
        this.diagnostics = { ...this.diagnostics, status: 'error' };
        this.settle(source, error);
        options.onError(error);
      },
      release: () => {
        if (source.released) return;
        source.released = true;
        this.settle(source, cancelled());
        this.sources.delete(id);
        if (!this.sources.size) {
          this.diagnostics = {
            ...this.diagnostics,
            status: 'released',
            activeSources: 0,
            queuedFrames: 0,
            accountedBufferBytes: 0,
          };
        }
        if (this.worker) {
          try {
            this.send({ type: 'release', source: id, generation: source.generation });
          } finally {
            if (!this.sources.size) {
              this.worker.terminate();
              this.worker = undefined;
              this.diagnostics = {
                ...this.diagnostics,
                status: 'released',
                activeSources: 0,
                queuedFrames: 0,
                accountedBufferBytes: 0,
              };
            }
          }
        }
      },
    };
  }
}
const sharedPool = new SileroVadPool();
/** Passive read of the existing pool. Reading never starts a worker or loads assets. */
export const readSileroVadDiagnostics = (): SileroVadDiagnostics => sharedPool.readDiagnostics();
/** Energy detection never calls this function, so neither Worker nor ONNX loads in energy mode. */
export const acquireSileroVadStream = (options: SileroVadOptions) => sharedPool.acquire(options);

const captureLoads = new WeakMap<AudioContext, Promise<void>>();
/** Connects silent worklet PCM capture; does not own the context, source, or stream. */
export async function attachSileroVadCapture(
  context: AudioContext,
  source: AudioNode,
  stream: SileroVadStream,
): Promise<{ release(): void }> {
  if (!context.audioWorklet || typeof AudioWorkletNode !== 'function')
    throw new Error('AudioWorklet PCM capture is unavailable.');
  let loading = captureLoads.get(context);
  if (!loading) {
    loading = context.audioWorklet.addModule(sileroVadAssetBase() + 'vad.capture.js');
    captureLoads.set(context, loading);
    void loading.catch(() => {
      if (captureLoads.get(context) === loading) captureLoads.delete(context);
    });
  }
  await loading;
  if (stream.released) throw cancelled();
  const node = new AudioWorkletNode(context, 'dsh-silero-vad-capture', {
    numberOfInputs: 1,
    numberOfOutputs: 1,
    outputChannelCount: [1],
    channelCount: 1,
    channelCountMode: 'explicit',
  });
  let released = false;
  node.port.onmessage = (event) => {
    if (!released && !stream.released) stream.ingest(event.data.pcm, event.data.sampleRate);
  };
  node.onprocessorerror = () => {
    // Explicit failure rather than silently switching to energy/ScriptProcessor.
    if (!released) stream.reportError(new Error('VAD AudioWorklet capture failed.'));
  };
  try {
    source.connect(node);
    node.connect(context.destination);
  } catch (error) {
    try {
      source.disconnect(node);
    } catch {
      /* Connection may not have completed. */
    }
    node.port.close();
    node.disconnect();
    throw error;
  }
  return {
    release() {
      if (released) return;
      released = true;
      node.port.onmessage = null;
      node.onprocessorerror = null;
      node.port.postMessage({ type: 'stop' });
      node.port.close();
      try {
        source.disconnect(node);
      } finally {
        node.disconnect();
      }
    },
  };
}
