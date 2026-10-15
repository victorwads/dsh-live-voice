import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { assertPackageContents } from '../scripts/package-contents.mjs';

test('npm package-content checks run only for publication, not regular CI or pushes', () => {
  const ci = readFileSync('.github/workflows/ci.yml', 'utf8');
  const publish = readFileSync('.github/workflows/publish.yml', 'utf8');
  const hook = readFileSync('.githooks/pre-push', 'utf8');
  assert.ok(ci.includes('run: npm test'));
  assert.ok(!ci.includes('check:dist'));
  assert.ok(publish.includes('run: npm run check:dist'));
  assert.ok(
    publish.indexOf('run: npm run check:dist') < publish.indexOf('- name: Create version tag'),
  );
  assert.ok(!/^npm run check:dist$/m.test(hook));
  assert.ok(hook.includes('npm run typecheck'));
});

test('frozen CI installs explicitly decline the unused native ONNX postinstall', () => {
  const policy = readFileSync('pnpm-workspace.yaml', 'utf8');
  assert.match(policy, /^  onnxruntime-node: false$/m);
  assert.match(policy, /^  protobufjs: false$/m);
  assert.match(policy, /^  esbuild@0[.]28[.]2: true$/m);
});

test('generated library directories are ignored and have no tracked files', () => {
  const tracked = spawnSync('git', ['ls-files', '--', 'packages/*/lib/**', 'packages/*/libs/**'], {
    encoding: 'utf8',
  });
  assert.equal(tracked.status, 0, tracked.stderr);
  assert.equal(tracked.stdout, '');
  const ignored = spawnSync(
    'git',
    [
      'check-ignore',
      'packages/live-voice/lib/client.js',
      'packages/live-voice-debugger/lib/server.js',
      'packages/future-plugin/libs/output.js',
    ],
    { encoding: 'utf8' },
  );
  assert.equal(ignored.status, 0, ignored.stderr);
  assert.equal(ignored.stdout.trim().split('\n').length, 3);
});

test('ASR publication validates worker and matching runtime assets', () => {
  const metadata = JSON.parse(readFileSync('packages/live-voice/package.json', 'utf8'));
  const base = ['package.json', 'cordis.patch.yml', 'lib/server.js', 'lib/client.js'].map(
    (path) => ({ path, size: 1 }),
  );
  const asr = {
    version: metadata.version,
    assets: [
      'asr.worker.js',
      'ort-wasm-simd-threaded.jsep.wasm',
      'ort-wasm-simd-threaded.asyncify.wasm',
    ],
  };
  const files = [
    ...base,
    { path: 'lib/asr/manifest.json', size: 1 },
    ...asr.assets.map((name) => ({ path: 'lib/asr/' + name, size: 1 })),
  ];
  assert.doesNotThrow(() => assertPackageContents(metadata, files, undefined, asr));
  for (const file of files.filter((f) => f.path.startsWith('lib/asr/')))
    assert.throws(
      () =>
        assertPackageContents(
          metadata,
          files.filter((f) => f !== file),
          undefined,
          asr,
        ),
      /missing or empty/,
    );
  assert.throws(
    () => assertPackageContents(metadata, files, undefined, { ...asr, version: '0.0.0' }),
    /ASR asset version mismatch/,
  );
  assert.throws(
    () => assertPackageContents(metadata, files, undefined, { ...asr, assets: ['asr.worker.js'] }),
    /manifest incomplete/,
  );
});

test('both npm packages build before packing and include compiled runtime entries', () => {
  for (const name of ['live-voice', 'live-voice-debugger']) {
    const metadata = JSON.parse(readFileSync('packages/' + name + '/package.json', 'utf8'));
    assert.equal(metadata.scripts.prepack, 'npm run build');
    assert.ok(metadata.files.includes('lib/'));
    assert.equal(metadata.main, './lib/server.js');
    assert.equal(metadata.exports['./client'], './lib/client.js');
    const files = ['package.json', 'cordis.patch.yml', 'lib/server.js', 'lib/client.js'].map(
      (path) => ({ path, size: 1 }),
    );
    assert.doesNotThrow(() => assertPackageContents(metadata, files));
    assert.throws(
      () =>
        assertPackageContents(
          metadata,
          files.filter((file) => file.path !== 'lib/client.js'),
        ),
      /missing or empty.*client/,
    );
    assert.throws(
      () =>
        assertPackageContents(
          metadata,
          files.map((file) => ({ ...file, size: 0 })),
        ),
      /missing or empty/,
    );
    const vad = { pluginVersion: metadata.version, files: { 'model.onnx': {} } };
    assert.throws(() => assertPackageContents(metadata, files, vad), /manifest[.]json/);
    const withManifest = [...files, { path: 'lib/vad/manifest.json', size: 1 }];
    assert.throws(() => assertPackageContents(metadata, withManifest, vad), /model[.]onnx/);
    assert.doesNotThrow(() =>
      assertPackageContents(
        metadata,
        [...withManifest, { path: 'lib/vad/model.onnx', size: 1 }],
        vad,
      ),
    );
    assert.throws(
      () => assertPackageContents(metadata, files, { ...vad, pluginVersion: '0.0.0' }),
      /version mismatch/,
    );
  }
});
