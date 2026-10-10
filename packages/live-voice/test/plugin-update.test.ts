// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { createPluginUpdate } from '../src/modules/settings/services/pluginUpdate.ts';
const bundle = {
  name: 'dsh-live-voice',
  installed: true,
  availability: 'profile',
  enabled: true,
  source: 'dsh-live-voice@^0.4.1',
  version: '0.4.1',
};
function fixture(
  overrides = {},
  reply = { application: 'restart-required', bundle: 'dsh-live-voice', version: '9.0.0' },
) {
  const calls = [];
  const api = {
    listBundles: async () => ({ ok: true, value: [{ ...bundle, ...overrides }] }),
    installBundle: async (...args) => {
      calls.push(args);
      return { ok: true, value: reply };
    },
  };
  return { api, calls, updater: createPluginUpdate({ manager: () => api }) };
}
test('requires explicit confirmation, installs exact release and preserves enablement', async () => {
  const f = fixture({ enabled: false });
  await f.updater.confirm();
  assert.equal(f.calls.length, 0);
  await f.updater.prepare('v9.0.0');
  assert.equal(f.updater.getSnapshot().phase, 'confirm');
  assert.equal(f.calls.length, 0);
  await Promise.all([f.updater.confirm(), f.updater.confirm()]);
  assert.deepEqual(f.calls, [['dsh-live-voice@9.0.0', { enabled: false, saveExact: true }]]);
  assert.equal(f.updater.getSnapshot().phase, 'restart');
  await f.updater.prepare('v9.1.0');
  assert.equal(f.calls.length, 1);
});
test('cancel and invalid or old releases never install', async () => {
  const f = fixture();
  for (const tag of ['--help', '9.0.0;echo bad', 'https://example.com', 'v0.0.1'])
    await f.updater.prepare(tag);
  assert.equal(f.updater.getSnapshot().phase, 'idle');
  await f.updater.prepare('v9.0.0');
  f.updater.cancel();
  await f.updater.confirm();
  assert.equal(f.calls.length, 0);
});
test('refuses local/custom dependencies and unavailable profiles', async () => {
  for (const source of [
    'link:/tmp/plugin',
    'file:../plugin',
    'git+https://example.com',
    'latest',
    'https://example.com/archive.tgz',
  ]) {
    const f = fixture({ source });
    await f.updater.prepare('v9.0.0');
    await f.updater.confirm();
    assert.equal(f.updater.getSnapshot().problem, 'local');
    assert.equal(f.calls.length, 0);
  }
  const u = createPluginUpdate({ manager: () => undefined });
  await u.prepare('v9.0.0');
  assert.equal(u.getSnapshot().problem, 'unavailable');
});
test('rechecks source and voice activity at confirmation', async () => {
  const f = fixture();
  let busy = false;
  const u = createPluginUpdate({ manager: () => f.api, isBusy: () => busy });
  await u.prepare('v9.0.0');
  busy = true;
  await u.confirm();
  assert.equal(u.getSnapshot().problem, 'busy');
  assert.equal(f.calls.length, 0);
  busy = false;
  await u.prepare('v9.0.0');
  f.api.listBundles = async () => ({ ok: true, value: [{ ...bundle, source: 'link:/tmp/dev' }] });
  await u.confirm();
  assert.equal(u.getSnapshot().problem, 'local');
  assert.equal(f.calls.length, 0);
});
test('failed installs never approve scripts or report success', async () => {
  const f = fixture({}, { application: 'failed', pendingBuilds: ['untrusted'] });
  await f.updater.prepare('v9.0.0');
  await f.updater.confirm();
  assert.equal(f.updater.getSnapshot().problem, 'scripts');
  assert.equal(f.calls[0][1].approvedBuilds, undefined);
});
test('lost replies and mismatched results stay uncertain without retry', async () => {
  for (const reply of [
    { application: 'applied', bundle: 'other', version: '9.0.0' },
    { application: 'applied', bundle: 'dsh-live-voice', version: '8.0.0' },
  ]) {
    const f = fixture({}, reply);
    await f.updater.prepare('v9.0.0');
    await f.updater.confirm();
    assert.equal(f.updater.getSnapshot().phase, 'uncertain');
  }
  const f = fixture();
  f.api.installBundle = async () => {
    f.calls.push('attempt');
    throw new Error('connection lost');
  };
  await f.updater.prepare('v9.0.0');
  await f.updater.confirm();
  await f.updater.prepare('v9.0.0');
  await f.updater.confirm();
  assert.equal(f.updater.getSnapshot().phase, 'uncertain');
  assert.equal(f.calls.length, 1);
});
