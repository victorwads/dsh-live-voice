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
/** Notification history is independent from the 100ms UI sampling interval. */
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
    for (const [sessionId, session] of Object.entries(next?.sessions ?? {})) {
      for (const [module, value] of Object.entries(session as Record<string, DiagnosticValue>)) {
        // Meter samples are observed live, not logged as transitions.
        const normalized = module === 'capture' ? { ...(value as object), level: null } : value;
        const old = previous?.sessions?.[sessionId]?.[module];
        const before = module === 'capture' && old ? { ...old, level: null } : old;
        if (previous && JSON.stringify(before) !== JSON.stringify(normalized)) {
          entries.push({
            sequence: ++sequence,
            timeMs: now(),
            sessionId,
            module,
            level: module === 'error' && (value as any)?.present ? 'error' : 'debug',
            before: before ?? null,
            after: normalized as DiagnosticValue,
          });
        }
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
