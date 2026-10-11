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
