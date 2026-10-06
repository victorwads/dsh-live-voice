import { normalizeSettings } from '../../core/settings.js';
export const SETTINGS_STORAGE_KEY = 'dsh-live-voice.settings';
export const SETTINGS_PATH = '/api/dsh-live-voice/settings';

/** No browser persistence or migration from legacy browser preferences. */
export function createSettingsClient(fetchImpl = globalThis.fetch) {
  let settings = normalizeSettings({});
  let queue = Promise.resolve();
  const listeners = new Set<(settings: ReturnType<typeof normalizeSettings>) => void>();
  async function request(method: string, patch?: unknown) {
    const response = await fetchImpl(SETTINGS_PATH, {
      method,
      credentials: 'same-origin',
      cache: 'no-store',
      ...(patch === undefined
        ? {}
        : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(patch) }),
    });
    const body = await response.json();
    if (!response.ok || body?.ok !== true) throw new Error('settings-request-failed');
    settings = normalizeSettings(body.value);
    for (const listener of listeners) listener(settings);
    return settings;
  }
  const ready = request('GET');
  // Consumers report failures in their translated controller UI.
  void ready.catch(() => {});
  return {
    ready,
    getSnapshot: () => settings,
    subscribe(listener: (settings: ReturnType<typeof normalizeSettings>) => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    save(patch: unknown) {
      const operation = queue.then(async () => {
        await ready;
        return request('PUT', patch);
      });
      queue = operation.then(
        () => {},
        () => {},
      );
      return operation;
    },
  };
}
