import { normalizeSettings } from '../../core/settings.js';
export const SETTINGS_STORAGE_KEY = 'dsh-live-voice.settings';
export function readSettings(storage: Pick<Storage, 'getItem'> = localStorage) {
  try {
    return normalizeSettings(JSON.parse(storage.getItem(SETTINGS_STORAGE_KEY) || '{}'));
  } catch {
    return normalizeSettings({});
  }
}
export function writeSettings(settings: unknown, storage: Pick<Storage, 'setItem'> = localStorage) {
  const normalized = normalizeSettings(settings);
  storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}
