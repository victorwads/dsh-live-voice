import test from 'node:test';
import assert from 'node:assert/strict';
import {
  speakingEngineOrder,
  defaultSpeakingEngine,
  recognitionEngineOrder,
} from '../src/modules/core/engineSelection.ts';
import { createSettingsStore } from '../src/modules/settings/models/settingsHost.ts';
import { createSettingsClient } from '../src/modules/settings/models/settingsStorage.ts';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

for (const platform of ['darwin', 'linux', 'win32', undefined]) {
  test('selection order and fresh preferences use host platform ' + platform, async (t) => {
    const mac = platform === 'darwin';
    assert.deepEqual(
      speakingEngineOrder(platform),
      mac ? ['say', 'browser', 'qwen-http'] : ['browser', 'qwen-http', 'say'],
    );
    assert.equal(defaultSpeakingEngine(platform), mac ? 'say' : 'browser');
    assert.deepEqual(recognitionEngineOrder, ['browser', 'qwen-http', 'whisper-http']);
    const dir = await mkdtemp(join(tmpdir(), 'voice-engine-order-'));
    t.after(() => rm(dir, { recursive: true, force: true }));
    const path = join(dir, 'preferences.json');
    const store = createSettingsStore(path, { platform: platform || 'linux' });
    assert.equal((await store.load()).engine, mac ? 'say' : 'browser');
    for (const engine of ['browser', 'say', 'qwen-http']) {
      await writeFile(path, JSON.stringify({ engine }));
      assert.equal((await store.load()).engine, engine, 'explicit saved selection wins');
      await store.save({ rate: 1.2 });
      assert.equal((await store.load()).engine, engine);
    }
  });
}

test('host platform metadata does not change or persist the explicit engine selection', async () => {
  const requests = [];
  const client = createSettingsClient(async (_url, options) => {
    requests.push(options);
    return Response.json({ ok: true, value: { engine: 'qwen-http' }, hostPlatform: 'darwin' });
  });
  await client.ready;
  assert.equal(client.getHostPlatform(), 'darwin');
  assert.equal(client.getSnapshot().engine, 'qwen-http');
  await client.save({ rate: 1.1 });
  assert.deepEqual(JSON.parse(requests[1].body), { rate: 1.1 });
});
