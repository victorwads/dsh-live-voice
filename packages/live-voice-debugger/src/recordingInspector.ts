import {
  RECORDING_KEY,
  type RecordingService,
  type RecordingSession,
  type RecordingSegment,
} from '../../live-voice/src/modules/recording/types.js';

export interface RecordingView {
  service: RecordingService | null;
  sessions: RecordingSession[];
  selected: RecordingSession | null;
  segments: RecordingSegment[];
  loading: boolean;
  failed: boolean;
}

/** Inspect only. Mutations are deliberately reserved for explicit UI actions. */
export function createRecordingInspector(target: any, changed: (view: RecordingView) => void) {
  let disposed = false;
  let generation = 0;
  let selectedId = '';
  let service: RecordingService | null = null;
  let unsubscribe: (() => void) | null = null;
  let runningGeneration: number | null = null;
  let dirty = false;
  let view: RecordingView = {
    service: null,
    sessions: [],
    selected: null,
    segments: [],
    loading: false,
    failed: false,
  };
  const emit = (next: RecordingView) => {
    if (disposed) return;
    view = next;
    changed(view);
  };
  const release = () => {
    const previous = unsubscribe;
    unsubscribe = null;
    try {
      previous?.();
    } catch {
      /* A removed service must not retain this inspector. */
    }
  };
  async function drain() {
    if (runningGeneration === generation || disposed) return;
    const worker = generation;
    runningGeneration = worker;
    try {
      while (dirty && !disposed && worker === generation) {
        dirty = false;
        const current = service;
        const token = generation;
        if (!current) continue;
        try {
          const sessions = await current.list();
          if (disposed || token !== generation) continue;
          const id = sessions.some((s) => s.id === selectedId)
            ? selectedId
            : (sessions[0]?.id ?? '');
          const selected = id ? await current.get(id) : null;
          if (disposed || token !== generation) continue;
          const segments = selected ? current.segments(selected) : [];
          selectedId = selected?.id ?? '';
          emit({ service: current, sessions, selected, segments, loading: false, failed: false });
        } catch {
          if (!disposed && token === generation) emit({ ...view, loading: false, failed: true });
        }
      }
    } finally {
      if (runningGeneration === worker) runningGeneration = null;
    }
  }
  const refresh = () => {
    if (disposed || !service) return;
    dirty = true;
    void drain();
  };
  const discover = () => {
    if (disposed) return;
    try {
      const candidate = target[RECORDING_KEY];
      const next =
        candidate?.version === 1 &&
        ['list', 'get', 'segments', 'audio', 'export', 'remove', 'subscribe'].every(
          (k) => typeof candidate[k] === 'function',
        )
          ? (candidate as RecordingService)
          : null;
      if (next === service) return;
      ++generation;
      release();
      service = next;
      selectedId = '';
      emit({
        service,
        sessions: [],
        selected: null,
        segments: [],
        loading: !!service,
        failed: false,
      });
      if (service) {
        unsubscribe = service.subscribe(refresh);
        refresh();
      }
    } catch {
      ++generation;
      release();
      service = null;
      emit({
        service: null,
        sessions: [],
        selected: null,
        segments: [],
        loading: false,
        failed: true,
      });
    }
  };
  return {
    discover,
    refresh,
    select(id: string) {
      if (disposed || id === selectedId) return;
      selectedId = id;
      ++generation;
      emit({ ...view, selected: null, segments: [], loading: true });
      refresh();
    },
    dispose() {
      disposed = true;
      ++generation;
      release();
    },
  };
}
