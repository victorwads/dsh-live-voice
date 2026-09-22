// @ts-nocheck
import { build, context, type BuildOptions } from 'esbuild';
import { rm, mkdir, readFile } from 'node:fs/promises';

const packageMetadata = JSON.parse(await readFile('package.json', 'utf8'));
const versionDefine = {
  __DLV_VERSION__: JSON.stringify(packageMetadata.version),
  __DLV_TESTED_DSH_VERSION__: JSON.stringify(packageMetadata.dshTestedVersion),
};

const client: BuildOptions = {
  entryPoints: ['src/app/client/apply.tsx'],
  outfile: 'lib/client.js',
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: ['es2022'],
  external: ['react', 'react-dom'],
  jsx: 'transform',
  jsxFactory: 'React.createElement',
  jsxFragment: 'React.Fragment',
  tsconfigRaw: { compilerOptions: { jsx: 'react' } },
  define: versionDefine,
  banner: {
    js: 'window.__ModuleLoader__.load({id:"dsh-live-voice",factory:(require)=>{var module={exports:{}};var exports=module.exports;',
  },
  footer: { js: 'return module.exports;}});' },
  logLevel: 'info',
};
const host: BuildOptions = {
  entryPoints: ['src/app/server/apply.ts'],
  outfile: 'lib/server.js',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: ['node22'],
  packages: 'external',
  logLevel: 'info',
};
const tests: BuildOptions = {
  entryPoints: ['test/*.test.ts', 'test/*.test.tsx'],
  outdir: '.test-dist',
  outbase: 'test',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: ['node22'],
  packages: 'external',
  define: versionDefine,
  logLevel: 'silent',
};
const watch = process.argv.includes('--watch');
if (watch) {
  const clientContext = await context(client);
  await clientContext.watch();
  const hostContext = await context(host);
  await hostContext.watch();
} else {
  await rm('.test-dist', { recursive: true, force: true });
  await mkdir('.test-dist', { recursive: true });
  await Promise.all([build(client), build(host), build(tests)]);
}
