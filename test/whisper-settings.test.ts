// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WhisperHttpHost,
  validateWhisperConfig,
  resolveWhisperUrl,
} from '../src/engines/recognition/whisper-http-host.ts';
import { whisperSettingsRequest } from '../src/client/whisper-settings.tsx';

test('Whisper settings validate loopback hosts and persist only a validated config', async () => {
  const writes = [];
  const store = { load: async () => null, save: async (value) => writes.push(value) };
  const host = new WhisperHttpHost({
    store,
    fetchImpl: async () => new Response('{"status":"ok"}'),
  });
  const config = validateWhisperConfig({
    url: 'http://[::1]:8080/inference',
    healthUrl: '/health',
    timeoutMs: 1234,
  });
  assert.ok(['::1', '[::1]'].includes(resolveWhisperUrl(config.url).hostname));
  await host.replaceConfig(config);
  assert.deepEqual(writes, [config]);
  assert.deepEqual(await host.getConfig(), config);
  assert.throws(
    () =>
      host.replaceConfig({
        url: 'http://example.invalid/inference',
        healthUrl: '/health',
        timeoutMs: 1234,
      }),
    /loopback/,
  );
});

test('Whisper Settings client keeps host configuration behind authenticated same-origin routes', async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return Response.json({
      ok: true,
      value: { url: 'http://127.0.0.1:8080/inference', healthUrl: '/health', timeoutMs: 30000 },
    });
  };
  const config = await whisperSettingsRequest(
    '/config',
    {
      method: 'PUT',
      config: { url: 'http://127.0.0.1:8080/inference', healthUrl: '/health', timeoutMs: 30000 },
    },
    fetchImpl,
  );
  assert.equal(calls[0].url, '/api/dsh-live-voice/whisper/config');
  assert.equal(calls[0].options.credentials, 'same-origin');
  assert.equal(JSON.parse(calls[0].options.body).url, config.url);
  await assert.rejects(
    () =>
      whisperSettingsRequest('/config', {}, async () => new Response('not found', { status: 404 })),
    /restart/,
  );
});
