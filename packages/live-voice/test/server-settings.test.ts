import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createSettingsStore } from '../src/modules/settings/models/settingsHost.ts';
import { createSettingsClient } from '../src/modules/settings/models/settingsStorage.ts';
import { registerSettingsRoute } from '../src/app/server/registerRoutes.ts';
import { normalizeSettings } from '../src/modules/core/settings.ts';

async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(), 'live-voice-settings-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const path = join(dir, 'settings.json');
  const store = createSettingsStore(path);
  let route,
    cleanup,
    removed = false;
  registerSettingsRoute(
    {
      connection: {
        fetch: {
          register(value) {
            route = value;
            return () => {
              removed = true;
            };
          },
        },
      },
      effect(fn) {
        cleanup = fn();
      },
    },
    store,
  );
  return {
    store,
    path,
    route,
    cleanup,
    removed: () => removed,
    fetch: (url, options) => route.fetch(new Request('http://localhost' + url, options)),
  };
}

test('all normalized preferences survive a host restart and another browser', async (t) => {
  const f = await fixture(t);
  const first = createSettingsClient(f.fetch);
  await first.ready;
  const expected = normalizeSettings({
    engine: 'say',
    recognitionEngine: 'whisper-http',
    mode: 'headphones',
    voiceCommandSend: 'submit now',
    voiceCommandClear: 'erase draft',
    agentVoiceContext: 'Keep answers short.',
    voiceDetectionPreset: 'custom',
    voiceDetectionCustomSilenceMs: 350,
    voiceDetectionCustomParagraphMs: 12000,
    voiceDetectionThreshold: 0.65,
    voiceDetectionMinimumSpeechMs: 400,
    recordingEnabled: true,
    recordingKeepPrevious: 1,
    recordingBitrate: 64000,
    recordingPreRollMs: 0,
    recordingPostRollMs: 2000,
    assistantSpeechDelaySeconds: 3,
    autoSendDelaySeconds: 6,
    microphoneSourceName: 'Alice',
    sharedSourceName: 'Team',
    inputDeviceId: 'mic',
    outputDeviceId: 'speaker',
    volume: 0.37,
  });
  await first.save(expected);
  assert.deepEqual(await createSettingsStore(f.path).load(), expected);
  const second = createSettingsClient(f.fetch);
  assert.deepEqual(await second.ready, expected);
  assert.deepEqual(JSON.parse(await readFile(f.path, 'utf8')), expected);
  assert.equal((await stat(f.path)).mode & 0o777, 0o600);
  f.cleanup();
  assert.equal(f.removed(), true);
});

test('host paragraph preferences normalize old files and malformed browser patches', async (t) => {
  const f = await fixture(t);
  await writeFile(
    f.path,
    JSON.stringify({ voiceDetectionPreset: 'custom', voiceDetectionCustomSilenceMs: 350 }),
  );
  const client = createSettingsClient(f.fetch);
  assert.equal((await client.ready).voiceDetectionCustomParagraphMs, 3000);
  for (const value of [100, 30000]) {
    await client.save({ voiceDetectionCustomParagraphMs: value });
    const saved = await createSettingsStore(f.path).load();
    assert.equal(saved.voiceDetectionCustomParagraphMs, value);
    assert.equal(saved.voiceDetectionCustomSilenceMs, 350);
  }
  for (const value of [null, '4000', 99, 30001, 3000.5]) {
    const response = await f.fetch('/api/dsh-live-voice/settings', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ voiceDetectionCustomParagraphMs: value }),
    });
    assert.equal(response.status, 200);
    assert.equal((await createSettingsStore(f.path).load()).voiceDetectionCustomParagraphMs, 3000);
  }
});

test('concurrent browser patches preserve unrelated preferences and rapid saves stay ordered', async (t) => {
  const f = await fixture(t);
  const a = createSettingsClient(f.fetch),
    b = createSettingsClient(f.fetch);
  await Promise.all([a.ready, b.ready]);
  await Promise.all([
    a.save({ voiceCommandSend: 'send it' }),
    b.save({ assistantSpeechDelaySeconds: 4 }),
    a.save({ voiceDetectionCustomSilenceMs: 400 }),
    a.save({ voiceDetectionCustomSilenceMs: 500 }),
  ]);
  const saved = await f.store.load();
  assert.equal(saved.voiceCommandSend, 'send it');
  assert.equal(saved.assistantSpeechDelaySeconds, 4);
  assert.equal(saved.voiceDetectionCustomSilenceMs, 500);
});

test('route rejects malformed requests and reports disk errors without claiming success', async (t) => {
  const f = await fixture(t);
  assert.deepEqual(f.route.methods, ['GET', 'PUT']);
  for (const body of ['null', '[]', '{', JSON.stringify('x'.repeat(64001))]) {
    assert.equal(
      (await f.fetch('/api/dsh-live-voice/settings', { method: 'PUT', body })).status,
      400,
    );
  }
  const response = await f.fetch('/api/dsh-live-voice/settings', { method: 'GET' });
  assert.equal(response.headers.get('cache-control'), 'no-store');
  await f.store.save({ rate: 999 });
  assert.equal((await f.store.load()).rate, normalizeSettings({ rate: 999 }).rate);
  await writeFile(f.path, '{broken');
  assert.equal((await f.fetch('/api/dsh-live-voice/settings', { method: 'GET' })).status, 500);
  assert.equal(
    (await f.fetch('/api/dsh-live-voice/settings', { method: 'PUT', body: '{}' })).status,
    500,
  );
  const failing = createSettingsClient(async () => Response.json({ ok: false }, { status: 500 }));
  await assert.rejects(failing.ready);
  await assert.rejects(failing.save({ mode: 'headphones' }));
});

test('host normalizes malformed recoverable recording and detector settings before persistence', async (t) => {
  const f = await fixture(t);
  const invalid = {
    recordingEnabled: 'true',
    recordingKeepPrevious: 0,
    recordingBitrate: 16000,
    recordingPreRollMs: -1,
    recordingPostRollMs: 2001,
    voiceDetectionThreshold: 1,
    voiceDetectionMinimumSpeechMs: 49,
  };
  const response = await f.fetch('/api/dsh-live-voice/settings', {
    method: 'PUT',
    body: JSON.stringify(invalid),
  });
  assert.equal(response.status, 200);
  const saved = await createSettingsStore(f.path).load();
  const defaults = normalizeSettings({});
  for (const key of Object.keys(invalid)) assert.equal(saved[key], defaults[key], key);
});
