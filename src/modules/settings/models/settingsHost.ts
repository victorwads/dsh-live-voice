import { readFile, mkdir, writeFile, rename, rm } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { normalizeSettings } from '../../core/settings.js';

/** Host-wide preferences, shared by every authenticated browser. */
export function createSettingsStore(
  path = join(homedir(), '.dsh', 'dsh-live-voice.settings.json'),
) {
  let queue = Promise.resolve();
  async function load() {
    try {
      return normalizeSettings(JSON.parse(await readFile(path, 'utf8')));
    } catch (error) {
      if (error.code === 'ENOENT') return normalizeSettings({});
      throw error;
    }
  }
  return {
    load: () => queue.then(load),
    save(patch: unknown) {
      const operation = queue.then(async () => {
        const settings = normalizeSettings({ ...(await load()), ...(patch as object) });
        await mkdir(dirname(path), { recursive: true, mode: 0o700 });
        const temporary = path + '.' + randomUUID() + '.tmp';
        try {
          await writeFile(temporary, JSON.stringify(settings, null, 2) + '\n', {
            mode: 0o600,
            flag: 'wx',
          });
          await rename(temporary, path);
        } finally {
          await rm(temporary, { force: true });
        }
        return settings;
      });
      queue = operation.then(
        () => {},
        () => {},
      );
      return operation;
    },
  };
}
