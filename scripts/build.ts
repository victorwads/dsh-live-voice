import { build, context, type BuildOptions } from 'esbuild';
import { mkdir, readFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { checkVersions } from './check-versions.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
await checkVersions();
const metadata = JSON.parse(await readFile(join(root, 'packages/live-voice/package.json'), 'utf8'));
const define = {
  __DLV_VERSION__: JSON.stringify(metadata.version),
  __DLV_TESTED_DSH_VERSION__: JSON.stringify(metadata.dshTestedVersion),
};
const selected = process.argv[process.argv.indexOf('--package') + 1];
const names = process.argv.includes('--package')
  ? [selected]
  : ['live-voice', 'live-voice-debugger'];
if (names.some((name) => !['live-voice', 'live-voice-debugger'].includes(name)))
  throw new Error('Unknown package');
for (const name of names) {
  const dir = join(root, 'packages', name);
  const debugging = name === 'live-voice-debugger';
  const id = debugging ? 'dsh-live-voice-debugger' : 'dsh-live-voice';
  const common: BuildOptions = { absWorkingDir: dir, bundle: true, define, logLevel: 'info' };
  const options: BuildOptions[] = [
    {
      ...common,
      entryPoints: [debugging ? 'src/apply.tsx' : 'src/app/client/apply.tsx'],
      outfile: 'lib/client.js',
      format: 'cjs',
      platform: 'browser',
      target: ['es2022'],
      external: ['react', 'react-dom'],
      jsx: 'transform',
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment',
      tsconfigRaw: { compilerOptions: { jsx: 'react' } },
      banner: {
        js:
          'window.__ModuleLoader__.load({id:' +
          JSON.stringify(id) +
          ',factory:(require)=>{var module={exports:{}};var exports=module.exports;',
      },
      footer: { js: 'return module.exports;}});' },
    },
    {
      ...common,
      entryPoints: [debugging ? 'src/server.ts' : 'src/app/server/apply.ts'],
      outfile: 'lib/server.js',
      format: 'esm',
      platform: 'node',
      target: ['node22'],
      packages: 'external',
    },
  ];
  if (process.argv.includes('--watch')) {
    for (const option of options) await (await context(option)).watch();
  } else {
    await rm(join(dir, '.test-dist'), { recursive: true, force: true });
    await mkdir(join(dir, '.test-dist'), { recursive: true });
    await Promise.all([
      ...options.map((option) => build(option)),
      build({
        ...common,
        entryPoints: ['test/*.test.ts', 'test/*.test.tsx'],
        outdir: '.test-dist',
        outbase: 'test',
        format: 'esm',
        platform: 'node',
        target: ['node22'],
        packages: 'external',
        logLevel: 'silent',
        plugins: [
          {
            name: 'speech-parser-tests',
            setup(build) {
              build.onResolve({ filter: /^marked$/ }, () => ({
                path: createRequire(join(root, 'packages/live-voice/package.json')).resolve(
                  'marked',
                ),
                external: true,
              }));
            },
          },
        ],
      }),
    ]);
  }
}
if (!process.argv.includes('--watch') && !process.argv.includes('--package')) {
  await rm(join(root, '.test-dist'), { recursive: true, force: true });
  await mkdir(join(root, '.test-dist'), { recursive: true });
  await build({
    absWorkingDir: root,
    entryPoints: ['test/*.test.ts'],
    outdir: '.test-dist',
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: ['node22'],
    packages: 'external',
  });
}
