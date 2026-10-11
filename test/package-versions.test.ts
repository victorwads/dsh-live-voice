import test from 'node:test';
import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { assertMatchingVersions, checkVersions } from '../scripts/check-versions.mjs';

test('main and debugger manifests use the same version', async () => {
  await checkVersions();
});
test('release check rejects mismatched and missing versions', () => {
  assert.throws(
    () => assertMatchingVersions({ version: '0.3.2' }, { version: '0.0.0' }),
    /must match/,
  );
  assert.throws(() => assertMatchingVersions({}, {}), /must match/);
  assert.doesNotThrow(() =>
    assertMatchingVersions({ version: '0.4.0-developing.1' }, { version: '0.4.0-developing.1' }),
  );
});

test('publication metadata validates against the current GitHub repository after transfer', async () => {
  const workflow = await readFile('.github/workflows/publish.yml', 'utf8');
  const validation = workflow.match(/node <<'NODE'\n([\s\S]*?)\n\s*NODE/)[1];
  const manifests = Object.fromEntries(
    await Promise.all(
      ['live-voice', 'live-voice-debugger'].map(async (name) => {
        const path = 'packages/' + name + '/package.json';
        return [path, JSON.parse(await readFile(path, 'utf8'))];
      }),
    ),
  );
  let output = '';
  const context = {
    process: { env: { GITHUB_REPOSITORY: 'wads-dev/dsh-live-voice', GITHUB_OUTPUT: 'outputs' } },
    require: (name) => {
      assert.equal(name, 'node:fs');
      return {
        readFileSync: (path) => JSON.stringify(manifests[path]),
        appendFileSync: (path, text) => {
          assert.equal(path, 'outputs');
          output += text;
        },
      };
    },
  };
  assert.doesNotThrow(() => runInNewContext(validation, { ...context }));
  assert.ok(
    output.includes('version=' + manifests['packages/live-voice/package.json'].version + '\n'),
  );
  manifests['packages/live-voice/package.json'].repository.url =
    'git+https://github.com/victorwads/dsh-live-voice.git';
  assert.throws(() => runInNewContext(validation, { ...context }), /Invalid publication metadata/);
});

test('release history has a single root source and package links rather than duplicates', async () => {
  const root = process.cwd();
  await access(resolve(root, 'CHANGELOG.md'));
  await assert.rejects(access(resolve(root, 'packages/live-voice/CHANGELOG.md')), {
    code: 'ENOENT',
  });
  const manifest = JSON.parse(
    await readFile(resolve(root, 'packages/live-voice/package.json'), 'utf8'),
  );
  assert.ok(!manifest.files.includes('CHANGELOG.md'));
  const readme = await readFile(resolve(root, 'packages/live-voice/README.md'), 'utf8');
  assert.ok(readme.includes('https://github.com/victorwads/dsh-live-voice/blob/main/CHANGELOG.md'));
});
