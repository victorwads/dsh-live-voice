import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

/** Normalize only esbuild's standalone dependency-path comments, not executable code. */
export function normalizeBundlePaths(source) {
  return source.replace(/^\/\/ (?:\.\.\/)+node_modules\//gm, '// node_modules/');
}

/** @type {import('esbuild').Plugin} */
export const stableBundlePaths = {
  name: 'stable-bundle-paths',
  setup(build) {
    build.initialOptions.write = false;
    build.onEnd(async (result) => {
      if (result.errors.length) return;
      for (const file of result.outputFiles ?? []) {
        await mkdir(dirname(file.path), { recursive: true });
        await writeFile(file.path, normalizeBundlePaths(file.text));
      }
    });
  },
};
