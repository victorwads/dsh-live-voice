// @ts-nocheck
/** Application-lifetime cursors, never persisted audio or provider resources. */
export class SessionSpeechMemory {
  constructor() {
    this.sessions = new Map();
  }
  session(key, startedAt = Date.now()) {
    if (!this.sessions.has(key))
      this.sessions.set(key, {
        startedAt,
        observed: new Set(),
        textById: new Map(),
        frontier: null,
        baselined: false,
        checkpoint: null,
      });
    return this.sessions.get(key);
  }
  baseline(state, message, initial = false) {
    const known = state.observed.has(message.id);
    const previous = state.frontier;
    const position = [message.turn, message.step];
    if (!position.every(Number.isFinite)) return true;
    const newer =
      !previous ||
      position[0] > previous[0] ||
      (position[0] === previous[0] && position[1] > previous[1]);
    state.observed.add(message.id);
    if (newer) state.frontier = position;
    if (known) return false;
    if (Number.isFinite(message.time)) return message.time < state.startedAt;
    return initial || !state.baselined || !newer;
  }
  reset(startedAt = Date.now()) {
    for (const state of this.sessions.values()) {
      const old = state.checkpoint;
      const suppressed = new Set([
        ...(old?.suppressed || []),
        ...(old?.unfinished || []),
        ...(old?.pending || []).map((item) => item.id),
      ]);
      state.startedAt = startedAt;
      state.checkpoint = {
        consumed: old?.consumed || [],
        unfinished: [],
        suppressed: [...suppressed],
        pending: [],
        paused: false,
      };
    }
  }
  clear() {
    this.sessions.clear();
  }
}
