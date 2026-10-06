import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export function assertMatchingVersions(main, debuggerPackage) {
  if (
    typeof main.version !== 'string' ||
    !main.version ||
    main.version !== debuggerPackage.version
  ) {
    throw new Error(
      'Live Voice and debugger package versions must match: ' +
        main.version +
        ' !== ' +
        debuggerPackage.version,
    );
  }
}
export async function checkVersions() {
  const main = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  const debuggerPackage = JSON.parse(
    await readFile(new URL('../src_debugger/package.json', import.meta.url), 'utf8'),
  );
  assertMatchingVersions(main, debuggerPackage);
  console.log('Live Voice and debugger versions match: ' + main.version);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await checkVersions();
