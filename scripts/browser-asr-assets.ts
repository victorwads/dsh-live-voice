import { build, context, type BuildOptions } from 'esbuild';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { mkdir, copyFile, writeFile, readdir } from 'node:fs/promises';
const require = createRequire(new URL('../packages/live-voice/package.json', import.meta.url));
export async function buildBrowserAsrAssets(root: string, version: string, watch = false) {
  const directory = join(root, 'packages/live-voice/lib/asr');
  await mkdir(directory, { recursive: true });
  const options: BuildOptions = {
    entryPoints: [join(root, 'packages/live-voice/src/modules/recognition/local/local.worker.ts')],
    outfile: join(directory, 'asr.worker.js'),
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2022',
    define: { __DLV_VERSION__: JSON.stringify(version) },
    logLevel: 'warning',
  };
  if (watch) await (await context(options)).watch();
  else await build(options);
  const ortDirectory = dirname(require.resolve('@dlv/ort-local'));
  for (const file of await readdir(ortDirectory))
    if (/^ort-wasm.*[.](wasm|mjs)$/.test(file))
      await copyFile(join(ortDirectory, file), join(directory, file));
  const assets = await readdir(directory);
  await writeFile(join(directory, 'manifest.json'), JSON.stringify({ version, assets }, null, 2));
}
