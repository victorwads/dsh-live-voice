type TranscriptionState = {
  starting?: boolean;
  listening?: boolean;
  recognizing?: boolean;
  pendingTranscriptions?: number;
  pending?: number;
};
/** Attach only while work is at risk; beforeunload never stops or mutates capture. */
export function createTranscriptionLeaveGuard(target: Window) {
  const sources = new Set<() => TranscriptionState[]>();
  const releases = new Set<() => void>();
  let attached = false;
  let disposed = false;
  const active = () =>
    [...sources].some((read) =>
      read().some(
        (state) =>
          state.starting ||
          state.listening ||
          state.recognizing ||
          (state.pendingTranscriptions ?? 0) > 0 ||
          (state.pending ?? 0) > 0,
      ),
    );
  const beforeUnload = (event: BeforeUnloadEvent) => {
    if (disposed || !active()) return;
    event.preventDefault();
    // Browser-controlled wording and sticky activation apply; legacy engines need returnValue.
    event.returnValue = true as unknown as string;
  };
  const refresh = () => {
    const next = !disposed && active();
    if (next === attached) return;
    attached = next;
    if (attached) target.addEventListener('beforeunload', beforeUnload);
    else target.removeEventListener('beforeunload', beforeUnload);
  };
  return {
    watch(read: () => TranscriptionState[], subscribe: (listener: () => void) => () => void) {
      if (disposed) return () => {};
      sources.add(read);
      const unsubscribe = subscribe(refresh);
      let released = false;
      const release = () => {
        if (released) return;
        released = true;
        unsubscribe();
        sources.delete(read);
        releases.delete(release);
        refresh();
      };
      releases.add(release);
      refresh();
      return release;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const release of [...releases]) release();
      refresh();
    },
  };
}
