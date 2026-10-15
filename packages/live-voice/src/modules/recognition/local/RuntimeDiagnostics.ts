export type RuntimeEvent = {
  sequence: number;
  timeMs: number;
  model: string;
  operation: string;
  status: string;
  durationMs: number | null;
  code: string | null;
};
export type RuntimeMetrics = {
  loadAttempted: boolean;
  loadMs: number | null;
  workerLoadMs: number | null;
  lastMs: number | null;
  workerInferenceMs: number | null;
  audioMs: number | null;
  completed: number;
  failed: number;
  queued: number;
  active: number;
  pcmBytes: number;
  error: string | null;
};
const empty = (): RuntimeMetrics => ({
  loadAttempted: false,
  loadMs: null,
  workerLoadMs: null,
  lastMs: null,
  workerInferenceMs: null,
  audioMs: null,
  completed: 0,
  failed: 0,
  queued: 0,
  active: 0,
  pcmBytes: 0,
  error: null,
});
const codes = new Set([
  'cancelled',
  'gpu-unavailable',
  'f16-unavailable',
  'storage-unavailable',
  'storage-full',
  'model-missing',
  'model-busy',
  'invalid-model',
  'invalid-audio',
  'runtime-outdated',
  'runtime-unavailable',
  'inference-failed',
]);
const safeCode = (value: unknown) =>
  typeof value === 'string' && codes.has(value) ? value : 'inference-failed';
/** Only bounded operational metadata. Never retain audio, transcripts or free-form exceptions. */
export class RuntimeDiagnostics {
  private metrics = new Map<string, RuntimeMetrics>();
  private events: RuntimeEvent[] = [];
  private sequence = 0;
  constructor(
    private now = () => performance.now(),
    private wall = () => Date.now(),
  ) {}
  get(key: string) {
    let result = this.metrics.get(key);
    if (!result) {
      result = empty();
      this.metrics.set(key, result);
    }
    return result;
  }
  event(
    key: string,
    operation: string,
    status: string,
    durationMs: number | null = null,
    code: unknown = null,
  ) {
    this.events.push({
      sequence: ++this.sequence,
      timeMs: this.wall(),
      model: key,
      operation,
      status,
      durationMs,
      code: code == null ? null : safeCode(code),
    });
    if (this.events.length > 100) this.events.shift();
  }
  clock() {
    return this.now();
  }
  read() {
    return {
      models: Object.fromEntries([...this.metrics].map(([key, value]) => [key, { ...value }])),
      events: this.events.map((value) => ({ ...value })),
    };
  }
  code(error: unknown) {
    return safeCode((error as any)?.code);
  }
  duration(value: unknown) {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
  }
}
