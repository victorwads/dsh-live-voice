import { CURRENT_VERSION, compareVersions } from './releases.js';

export type UpdatePhase =
  'idle' | 'checking' | 'confirm' | 'installing' | 'restart' | 'done' | 'failed' | 'uncertain';
export interface UpdateSnapshot {
  phase: UpdatePhase;
  version: string;
  problem?: string;
}
/** One application-owned operation; closing Settings never starts, repeats or cancels an install. */
export function createPluginUpdate({
  manager,
  isBusy = () => false,
}: {
  manager: () => any;
  isBusy?: () => boolean;
}) {
  let state: UpdateSnapshot = { phase: 'idle', version: '' };
  let enabled = true;
  const listeners = new Set<() => void>();
  const patch = (next: UpdateSnapshot) => {
    state = next;
    for (const listener of listeners) listener();
  };
  const fail = (problem: string) => patch({ ...state, phase: 'failed', problem });
  const locked = () =>
    ['checking', 'installing', 'restart', 'done', 'uncertain'].includes(state.phase);
  async function eligible(api: any) {
    if (!api || typeof api.listBundles !== 'function' || typeof api.installBundle !== 'function')
      return 'unavailable';
    const result = await api.listBundles();
    if (!result?.ok || !Array.isArray(result.value)) return 'unavailable';
    const bundle = result.value.find((item: any) => item.name === 'dsh-live-voice');
    // Never turn a development link, Git or tarball dependency into a registry install.
    if (!bundle?.installed || bundle.readOnlyReason || bundle.availability !== 'profile')
      return 'unavailable';
    if (
      typeof bundle.source !== 'string' ||
      !/^dsh-live-voice@(?:\^|~)?v?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(bundle.source)
    )
      return 'local';
    enabled = bundle.enabled;
    if (compareVersions(bundle.version || CURRENT_VERSION, state.version) >= 0) return 'current';
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
    async prepare(tag: string) {
      if (locked()) return;
      const version = tag.replace(/^v/, '');
      if (
        !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/.test(version) ||
        compareVersions(version, CURRENT_VERSION) <= 0
      )
        return;
      patch({ phase: 'checking', version });
      try {
        if (isBusy()) return fail('busy');
        const problem = await eligible(manager());
        if (problem) return fail(problem);
        patch({ phase: 'confirm', version });
      } catch {
        fail('unavailable');
      }
    },
    cancel() {
      if (state.phase === 'confirm') patch({ phase: 'idle', version: '' });
    },
    async confirm() {
      if (state.phase !== 'confirm') return;
      patch({ ...state, phase: 'checking' });
      try {
        if (isBusy()) return fail('busy');
        const api = manager();
        const problem = await eligible(api);
        if (problem) return fail(problem);
        if (isBusy()) return fail('busy');
        patch({ ...state, phase: 'installing' });
        // No script approvals, shell commands, automatic retries, restart or page reload.
        const result = await api.installBundle('dsh-live-voice@' + state.version, {
          enabled,
          saveExact: true,
        });
        if (!result?.ok) return patch({ ...state, phase: 'uncertain', problem: 'uncertain' });
        const value = result.value;
        if (value.application === 'failed' || value.application === 'cancelled')
          return fail(value.pendingBuilds?.length ? 'scripts' : 'failed');
        if (
          value.bundle !== 'dsh-live-voice' ||
          value.version !== state.version ||
          !['applied', 'restart-required'].includes(value.application)
        )
          return patch({ ...state, phase: 'uncertain', problem: 'uncertain' });
        patch({ ...state, phase: value.application === 'restart-required' ? 'restart' : 'done' });
      } catch {
        if ((state as UpdateSnapshot).phase === 'installing')
          patch({ ...state, phase: 'uncertain', problem: 'uncertain' });
        else fail('unavailable');
      }
    },
  };
}
export type PluginUpdate = ReturnType<typeof createPluginUpdate>;
