import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertPackageContents } from './package-contents.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));

function run(command, args, cwd = root, capture = false) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: capture ? 'pipe' : 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(result.stderr || command + ' failed with exit code ' + result.status);
  return result.stdout;
}

function checkDist() {
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  run(npm, ['run', 'build']);
  for (const name of ['live-voice', 'live-voice-debugger']) {
    const directory = resolve(root, 'packages', name);
    const metadata = JSON.parse(readFileSync(resolve(directory, 'package.json'), 'utf8'));
    const vadManifest =
      name === 'live-voice'
        ? JSON.parse(readFileSync(resolve(directory, 'lib/vad/manifest.json'), 'utf8'))
        : undefined;
    // The build above prepares both packages; inspect packing without rebuilding or publishing.
    const [packed] = JSON.parse(
      run(npm, ['pack', '--dry-run', '--json', '--ignore-scripts'], directory, true),
    );
    const asrManifest =
      name === 'live-voice'
        ? JSON.parse(readFileSync(resolve(directory, 'lib/asr/manifest.json'), 'utf8'))
        : undefined;
    assertPackageContents(metadata, packed.files, vadManifest, asrManifest);
    console.log(
      metadata.name + ': compiled runtime entries and assets are included in the npm package.',
    );
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) checkDist();
