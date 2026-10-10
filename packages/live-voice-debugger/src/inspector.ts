import type {
  DiagnosticSource,
  DiagnosticValue,
} from '../../live-voice/src/modules/core/diagnostics.js';
export interface TransitionEntry {
  sequence: number;
  timeMs: number;
  sessionId: string | null;
  module: string;
  level: 'debug' | 'error';
  before: DiagnosticValue;
  after: DiagnosticValue;
}
/** High-frequency measurements remain visible in state, never in event history. */
function semantic(module: string, value: any): DiagnosticValue {
  if (value == null) return null;
  if (module === 'vadRuntime')
    return {
      status: value.status ?? null,
      workerActive: value.workerActive ?? null,
      activeSources: value.activeSources ?? null,
      assets: value.assets ?? null,
    };
  const omitted: Record<string, string[]> = {
    capture: ['level'],
    vad: ['probability', 'silenceMs'],
    chunker: ['bufferedSamples', 'bufferedChunks', 'silenceSamples', 'durationMs'],
  };
  if (!omitted[module]) return value;
  const result = { ...value };
  for (const key of omitted[module]) delete result[key];
  return result;
}
/** Notification history is independent from the UI sampling interval. */
export function createInspector(source: DiagnosticSource, now = Date.now, limit = 200) {
  let previous: any = null;
  let sequence = 0;
  let paused = false;
  let entries: TransitionEntry[] = [];
  function record() {
    const next: any = source.read();
    if (paused) {
      previous = next;
      return;
    }
    const append = (
      sessionId: string | null,
      module: string,
      before: DiagnosticValue,
      after: DiagnosticValue,
    ) => {
      if (!previous || JSON.stringify(before) === JSON.stringify(after)) return;
      entries.push({
        sequence: ++sequence,
        timeMs: now(),
        sessionId,
        module,
        level: module.endsWith('error') && (after as any)?.present ? 'error' : 'debug',
        before,
        after,
      });
    };
    append(
      null,
      'vadRuntime',
      semantic('vadRuntime', previous?.vadRuntime),
      semantic('vadRuntime', next?.vadRuntime),
    );
    for (const sourceId of new Set([
      ...Object.keys(previous?.audioSources ?? {}),
      ...Object.keys(next?.audioSources ?? {}),
    ])) {
      const old = previous?.audioSources?.[sourceId];
      const current = next?.audioSources?.[sourceId];
      if (sourceId === 'vad') {
        append(
          null,
          'audioSources.vad',
          semantic('vadRuntime', old),
          semantic('vadRuntime', current),
        );
        continue;
      }
      for (const module of new Set([...Object.keys(old ?? {}), ...Object.keys(current ?? {})])) {
        append(
          null,
          'audioSources.' + sourceId + '.' + module,
          semantic(module, old?.[module]),
          semantic(module, current?.[module]),
        );
      }
    }
    for (const [sessionId, session] of Object.entries(next?.sessions ?? {})) {
      for (const [module, value] of Object.entries(session as Record<string, DiagnosticValue>)) {
        append(
          sessionId,
          module,
          semantic(module, previous?.sessions?.[sessionId]?.[module]),
          semantic(module, value),
        );
      }
    }
    entries = entries.slice(-Math.max(1, limit));
    previous = next;
  }
  record();
  const unsubscribe = source.subscribe(() => {
    try {
      record();
    } catch {
      /* Sampling reports source failures without affecting runtime. */
    }
  });
  return {
    read(includeContent = false) {
      record();
      return { state: source.read({ includeContent }), transitions: [...entries] };
    },
    setPaused(value: boolean) {
      previous = source.read();
      paused = value;
    },
    clear() {
      previous = source.read();
      entries = [];
    },
    dispose() {
      unsubscribe();
      previous = null;
      entries = [];
    },
  };
}
