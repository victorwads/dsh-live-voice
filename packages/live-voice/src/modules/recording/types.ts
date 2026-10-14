export type RecordingKind = 'microphone' | 'shared';
export interface RecordingPin {
  id: string;
  kind: 'speech-start' | 'silence-start';
  atSample: number;
  confirmedAtSample: number;
  delaySamples: number;
}
export interface RecordingAttempt {
  id: string;
  segmentId: string;
  startSample: number;
  endSample: number;
  engine: string;
  paragraphBefore?: boolean;
  speechStartSample?: number;
  createdAt: string;
  finishedAt?: string;
  status: 'pending' | 'success' | 'error';
  text?: string;
  error?: string;
}
export interface RecordingSession {
  id: string;
  sourceId: string;
  kind: RecordingKind;
  label: string;
  startedAt: string;
  endedAt?: string;
  state: 'recording' | 'completed' | 'interrupted' | 'failed';
  sampleRate: number;
  capturedSamples: number;
  savedSamples: number;
  storage?: 'indexeddb' | 'memory';
  persistent: boolean; // Browser eviction protection, independent of storage backend.
  codec: string;
  configuration?: {
    detector: string;
    threshold: number;
    minimumSpeechMs: number;
    silenceMs: number;
    paragraphMs?: number;
    maxUtteranceSeconds: number;
    preRollMs: number;
    postRollMs: number;
    bitrate: number;
  };
  pins: RecordingPin[];
  attempts: RecordingAttempt[];
  error?: string;
}
export interface RecordingSegment {
  id: string;
  kind: 'speech' | 'silence';
  startSample: number;
  endSample: number;
  open: boolean;
  attempts: RecordingAttempt[];
}
export interface RecordingPolicy {
  enabled: boolean;
  keepPrevious: number;
  bitrate: number;
  preRollMs: number;
  postRollMs: number;
}
export const RECORDING_KEY = Symbol.for('dsh-live-voice.recordings.v1');
export const RECORDING_CHANGED = 'dsh-live-voice:recordings-changed';
export interface RecordingService {
  version: 1;
  list(): Promise<RecordingSession[]>;
  get(id: string): Promise<RecordingSession | null>;
  segments(session: RecordingSession): RecordingSegment[];
  audio(id: string, startSample?: number, endSample?: number): Promise<Blob>;
  export(id: string): Promise<Blob>;
  remove(id: string): Promise<void>;
  subscribe(listener: () => void): () => void;
}
export interface RecordingWriter {
  readonly session: RecordingSession;
  append(pcm: Float32Array): Promise<void>;
  pin(
    kind: RecordingPin['kind'],
    atSample: number,
    confirmedAtSample: number,
  ): Promise<RecordingPin>;
  attempt(value: RecordingAttempt): Promise<void>;
  read(startSample: number, endSample: number): Promise<Float32Array>;
  finish(state?: 'completed' | 'interrupted' | 'failed', error?: string): Promise<void>;
}
export interface RecordingRepository extends RecordingService {
  begin(input: {
    sourceId: string;
    kind: RecordingKind;
    label: string;
    sampleRate: number;
    policy: RecordingPolicy;
    configuration?: RecordingSession['configuration'];
  }): Promise<RecordingWriter>;
  dispose(): Promise<void>;
}
export function recordingSegments(session: RecordingSession): RecordingSegment[] {
  const pins = [...session.pins].sort((a, b) => a.atSample - b.atSample);
  return pins
    .map((pin, i): RecordingSegment => ({
      id: pin.id,
      kind: pin.kind === 'speech-start' ? 'speech' : 'silence',
      startSample: pin.atSample,
      endSample: Math.min(pins[i + 1]?.atSample ?? session.savedSamples, session.savedSamples),
      open: i === pins.length - 1 && session.state === 'recording',
      attempts: session.attempts.filter((a) => a.segmentId === pin.id),
    }))
    .filter((s) => s.endSample >= s.startSample);
}
