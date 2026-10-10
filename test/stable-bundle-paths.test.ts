import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeBundlePaths, stableBundlePaths } from '../scripts/stable-bundle-paths.mjs';
import { build } from 'esbuild';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('dependency comments are identical at normal and nested worktree depths', () => {
  const dependency = 'node_modules/.pnpm/marked@18.1.0/node_modules/marked/lib/marked.esm.js';
  const regular = '// ../../' + dependency + '\nconst value = "../../node_modules/path";\n';
  const nested =
    '// ../../../../../../' + dependency + '\nconst value = "../../node_modules/path";\n';
  assert.equal(normalizeBundlePaths(regular), normalizeBundlePaths(nested));
  assert.ok(normalizeBundlePaths(nested).includes('const value = "../../node_modules/path";'));
  assert.equal(normalizeBundlePaths('// src/app.ts\n'), '// src/app.ts\n');
  assert.equal(normalizeBundlePaths(normalizeBundlePaths(nested)), normalizeBundlePaths(nested));
});

test('esbuild output is written and normalized by the onEnd plugin', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dlv-stable-bundle-'));
  try {
    const outfile = join(dir, 'nested', 'client.js');
    await build({
      stdin: {
        contents: 'export const answer = 42;',
        sourcefile: '../../../../../node_modules/example/index.js',
      },
      bundle: true,
      format: 'esm',
      outfile,
      plugins: [stableBundlePaths],
    });
    const output = await readFile(outfile, 'utf8');
    assert.ok(output.includes('// node_modules/example/index.js'));
    assert.ok(output.includes('answer = 42'));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
