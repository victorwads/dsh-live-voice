import { normalizeSettings } from '../../core/settings.js';
import { defaultSpeakingEngine } from '../../core/engineSelection.js';
import { settingsDocument, type SettingsDocument } from './settingsDocument.js';
export const SETTINGS_STORAGE_KEY = 'dsh-live-voice.settings';
export const SETTINGS_PATH = '/api/dsh-live-voice/settings';
type ClientSettings = SettingsDocument & ReturnType<typeof normalizeSettings>;

/** Transport is schema-independent; only this client interprets its known preferences. */
export function createSettingsClient(fetchImpl = globalThis.fetch) {
  let settings = { ...normalizeSettings({}) } as ClientSettings;
  let stored: SettingsDocument = {};
  let hostPlatform: string | undefined;
  let queue = Promise.resolve();
  const pendingPatches: SettingsDocument[] = [];
  const listeners = new Set<(settings: ClientSettings) => void>();
  const publish = () => {
    // Pending patches are individually safe snapshots, but their optimistic union
    // may exceed the on-disk budget until the host rejects the later save.
    const document = structuredClone(Object.assign({}, stored, ...pendingPatches));
    settings = {
      ...document,
      ...normalizeSettings({ engine: defaultSpeakingEngine(hostPlatform), ...document }),
    };
    for (const listener of listeners) {
      try {
        listener(settings);
      } catch {
        /* An observer cannot fail a committed save. */
      }
    }
    return settings;
  };
  async function request(method: string, patch?: SettingsDocument) {
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
    const document = settingsDocument(body.value);
    hostPlatform = typeof body.hostPlatform === 'string' ? body.hostPlatform : undefined;
    stored = document;
  }
  const ready = request('GET').then(publish);
  // Consumers report failures in their translated controller UI.
  void ready.catch(() => {});
  return {
    ready,
    getSnapshot: () => settings,
    getHostPlatform: () => hostPlatform,
    subscribe(listener: (settings: ClientSettings) => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    save(patch: unknown) {
      let snapshot: SettingsDocument;
      try {
        snapshot = settingsDocument(patch);
      } catch (error) {
        return Promise.reject(error);
      }
      pendingPatches.push(snapshot);
      const operation = queue.then(async () => {
        try {
          await ready;
          await request('PUT', snapshot);
        } catch (error) {
          pendingPatches.splice(pendingPatches.indexOf(snapshot), 1);
          publish();
          throw error;
        }
        pendingPatches.splice(pendingPatches.indexOf(snapshot), 1);
        return publish();
      });
      queue = operation.then(
        () => {},
        () => {},
      );
      return operation;
    },
  };
}
