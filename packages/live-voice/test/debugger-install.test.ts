// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { createDebuggerInstall } from '../src/modules/settings/services/debuggerInstall.ts';
import { CURRENT_VERSION } from '../src/modules/settings/services/releases.ts';

const name = 'dsh-live-voice-debugger';
function fixture(
  reply = { application: 'restart-required', bundle: name, version: CURRENT_VERSION },
) {
  const calls = [];
  let bundles = [];
  const api = {
    listBundles: async () => ({ ok: true, value: bundles }),
    installBundle: async (...args) => {
      calls.push(args);
      return { ok: true, value: reply };
    },
  };
  return {
    api,
    calls,
    setBundles: (value) => {
      bundles = value;
    },
    installer: createDebuggerInstall({ manager: () => api }),
  };
}

test('absent debugger installs exact matching version only after explicit confirmation, once', async () => {
  const f = fixture();
  await f.installer.confirm();
  assert.equal(f.calls.length, 0);
  await f.installer.prepare();
  assert.equal(f.installer.getSnapshot().phase, 'confirm');
  assert.equal(f.calls.length, 0);
  f.installer.cancel();
  await f.installer.confirm();
  assert.equal(f.calls.length, 0);
  await f.installer.prepare();
  await Promise.all([f.installer.confirm(), f.installer.confirm()]);
  assert.deepEqual(f.calls, [[name + '@' + CURRENT_VERSION, { enabled: true, saveExact: true }]]);
  assert.equal(f.installer.getSnapshot().phase, 'restart');
  await f.installer.prepare();
  await f.installer.confirm();
  assert.equal(f.calls.length, 1);
});

test('manager-applied state is not called ready and never promises hot-load', async () => {
  const f = fixture({ application: 'applied', bundle: name, version: CURRENT_VERSION });
  await f.installer.prepare();
  await f.installer.confirm();
  assert.equal(f.installer.getSnapshot().phase, 'applied');
});

test('never replaces installed sources, including missing files and disabled registry installations', async () => {
  for (const source of [
    'link:/tmp/dev',
    'file:/tmp/dev',
    'git+https://example.com/dev',
    'https://example.com/a.tgz',
    'npm:other@1.0.0',
    name + '@^0.5.0',
    undefined,
  ]) {
    for (const availability of ['profile', 'missing', 'installation']) {
      const f = fixture();
      f.setBundles([{ name, installed: true, enabled: false, source, availability }]);
      await f.installer.prepare();
      await f.installer.confirm();
      assert.equal(f.calls.length, 0);
      assert.equal(
        f.installer.getSnapshot().problem,
        source === name + '@^0.5.0' ? 'installed' : 'local',
      );
    }
  }
});

test('rejects malformed, protected, shipped and error inventory rather than guessing missing', async () => {
  for (const bundles of [
    [{ name, installed: false, availability: 'installation' }],
    [{ name, installed: false, availability: 'missing', source: 'link:/dev' }],
    [{ name, installed: false, availability: 'missing', readOnlyReason: 'management-required' }],
    [{ name, installed: false, availability: 'missing', error: { code: 'not-bundle' } }],
    [{ name }],
    [{ name }, { name }],
  ]) {
    const f = fixture();
    f.setBundles(bundles);
    await f.installer.prepare();
    await f.installer.confirm();
    assert.equal(f.calls.length, 0);
    assert.equal(f.installer.getSnapshot().problem, 'unavailable');
  }
  for (const manager of [
    undefined,
    { listBundles: async () => [] },
    { listBundles: async () => ({ ok: false }), installBundle() {} },
  ]) {
    const installer = createDebuggerInstall({ manager: () => manager });
    await installer.prepare();
    assert.equal(installer.getSnapshot().problem, 'unavailable');
  }
});

test('rechecks source and voice activity after asynchronous inventory at confirmation', async () => {
  const f = fixture();
  await f.installer.prepare();
  f.setBundles([{ name, installed: true, source: 'link:/dev', availability: 'missing' }]);
  await f.installer.confirm();
  assert.equal(f.calls.length, 0);
  assert.equal(f.installer.getSnapshot().problem, 'local');
  let busy = false;
  const installer = createDebuggerInstall({ manager: () => f.api, isBusy: () => busy });
  f.setBundles([]);
  busy = true;
  await installer.prepare();
  assert.equal(installer.getSnapshot().problem, 'busy');
  busy = false;
  await installer.prepare();
  f.api.listBundles = async () => {
    busy = true;
    return { ok: true, value: [] };
  };
  await installer.confirm();
  assert.equal(installer.getSnapshot().problem, 'busy');
  assert.equal(f.calls.length, 0);
});

test('lost, malformed, mismatched and failed installation outcomes lock blind retries without approving scripts', async () => {
  for (const reply of [
    null,
    {},
    { application: 'applied', bundle: 'other', version: CURRENT_VERSION },
    { application: 'applied', bundle: name, version: '0.0.0' },
    { application: 'failed' },
    { application: 'cancelled' },
    { application: 'failed', pendingBuilds: ['untrusted'] },
  ]) {
    const f = fixture(reply);
    await f.installer.prepare();
    await f.installer.confirm();
    assert.equal(f.installer.getSnapshot().phase, 'uncertain');
    assert.equal(f.calls[0][1].approvedBuilds, undefined);
    await f.installer.prepare();
    await f.installer.confirm();
    assert.equal(f.calls.length, 1);
  }
  const f = fixture();
  f.api.installBundle = async () => {
    f.calls.push('submitted');
    throw new Error('lost connection');
  };
  await f.installer.prepare();
  await f.installer.confirm();
  assert.equal(f.installer.getSnapshot().phase, 'uncertain');
  await f.installer.prepare();
  assert.equal(f.calls.length, 1);
});

test('concurrent prepares and confirmation cancellation never duplicate or cancel submitted work', async () => {
  const f = fixture();
  let settle;
  f.api.installBundle = (...args) => {
    f.calls.push(args);
    return new Promise((resolve) => {
      settle = resolve;
    });
  };
  await Promise.all([f.installer.prepare(), f.installer.prepare()]);
  const pending = f.installer.confirm();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(f.installer.getSnapshot().phase, 'installing');
  f.installer.cancel();
  await f.installer.prepare();
  await f.installer.confirm();
  assert.equal(f.calls.length, 1);
  settle({
    ok: true,
    value: { application: 'restart-required', bundle: name, version: CURRENT_VERSION },
  });
  await pending;
  assert.equal(f.installer.getSnapshot().phase, 'restart');
});
