import { CURRENT_VERSION } from './releases.js';

const BUNDLE = 'dsh-live-voice-debugger';
export type DebuggerInstallPhase =
  'idle' | 'checking' | 'confirm' | 'installing' | 'restart' | 'applied' | 'failed' | 'uncertain';
export interface DebuggerInstallSnapshot {
  phase: DebuggerInstallPhase;
  version: string;
  problem?: 'busy' | 'installed' | 'local' | 'scripts' | 'failed' | 'unavailable' | 'uncertain';
}

/** Application-owned: closing Settings never cancels, repeats or forgets a submitted install. */
export function createDebuggerInstall({
  manager,
  isBusy = () => false,
}: {
  manager: () => any;
  isBusy?: () => boolean;
}) {
  let state: DebuggerInstallSnapshot = { phase: 'idle', version: CURRENT_VERSION };
  const listeners = new Set<() => void>();
  const patch = (next: DebuggerInstallSnapshot) => {
    state = next;
    for (const listener of listeners) listener();
  };
  const fail = (problem: DebuggerInstallSnapshot['problem']) =>
    patch({ ...state, phase: 'failed', problem });
  async function eligible(api: any): Promise<DebuggerInstallSnapshot['problem'] | null> {
    if (!api || typeof api.listBundles !== 'function' || typeof api.installBundle !== 'function')
      return 'unavailable';
    const result = await api.listBundles();
    if (result?.ok !== true || !Array.isArray(result.value)) return 'unavailable';
    const matches = result.value.filter((item: any) => item?.name === BUNDLE);
    if (matches.length > 1) return 'unavailable';
    const bundle = matches[0];
    if (!bundle) return null; // Third-party packages are absent from the offline official catalog.
    // Never replace ANY existing dependency, including broken/missing custom-source files.
    if (bundle.installed === true) {
      if (
        typeof bundle.source !== 'string' ||
        !/^dsh-live-voice-debugger@(?:\^|~)?v?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(
          bundle.source,
        )
      )
        return 'local';
      return 'installed';
    }
    if (
      bundle.installed !== false ||
      bundle.availability !== 'missing' ||
      bundle.readOnlyReason ||
      bundle.source ||
      bundle.error
    )
      return 'unavailable';
    return null;
  }
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    async prepare() {
      if (!['idle', 'failed'].includes(state.phase)) return;
      patch({ ...state, phase: 'checking', problem: undefined });
      try {
        if (isBusy()) return fail('busy');
        const problem = await eligible(manager());
        if (problem) return fail(problem);
        patch({ ...state, phase: 'confirm' });
      } catch {
        fail('unavailable');
      }
    },
    cancel() {
      if (state.phase === 'confirm') patch({ ...state, phase: 'idle' });
    },
    async confirm() {
      if (state.phase !== 'confirm') return;
      patch({ ...state, phase: 'checking' });
      let submitted = false;
      try {
        if (isBusy()) return fail('busy');
        const api = manager();
        const problem = await eligible(api);
        if (problem) return fail(problem);
        if (isBusy()) return fail('busy');
        patch({ ...state, phase: 'installing' });
        submitted = true;
        // Only the explicit confirmation reaches DSH's official manager; no script approvals.
        const result = await api.installBundle(BUNDLE + '@' + state.version, {
          enabled: true,
          saveExact: true,
        });
        const value = result?.ok === true ? result.value : null;
        if (!value || typeof value !== 'object')
          return patch({ ...state, phase: 'uncertain', problem: 'uncertain' });
        // Even known installation failures require manager review, not blind retries here.
        if (value.application === 'failed' || value.application === 'cancelled')
          return patch({
            ...state,
            phase: 'uncertain',
            problem: value.pendingBuilds?.length ? 'scripts' : 'failed',
          });
        if (
          value.bundle !== BUNDLE ||
          value.version !== state.version ||
          !['applied', 'restart-required'].includes(value.application)
        )
          return patch({ ...state, phase: 'uncertain', problem: 'uncertain' });
        // Applied is not proof the browser's debugger extension has registered. The launcher
        // independently observes the versioned developer-extension registration before claiming ready.
        patch({
          ...state,
          phase: value.application === 'restart-required' ? 'restart' : 'applied',
        });
      } catch {
        if (submitted) patch({ ...state, phase: 'uncertain', problem: 'uncertain' });
        else fail('unavailable');
      }
    },
  };
}
export type DebuggerInstall = ReturnType<typeof createDebuggerInstall>;
