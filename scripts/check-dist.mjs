import { spawnSync } from 'node:child_process';

const runtimeEntries = ['lib/client.js', 'lib/server.js'];

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: options.capture ? 'pipe' : 'inherit',
  });

  if (result.error) throw result.error;
  return result;
};

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const build = run(npm, ['run', 'build']);
if (build.status !== 0) process.exit(build.status ?? 1);

const tracked = run('git', ['ls-files', '--error-unmatch', ...runtimeEntries], { capture: true });
if (tracked.status !== 0) {
  console.error(
    `\nThe dsh.pub runtime entries must be committed:\n${runtimeEntries
      .map((entry) => `  - ${entry}`)
      .join('\n')}\n`,
  );
  process.exit(1);
}

const diff = run('git', ['diff', '--exit-code', '--', ...runtimeEntries]);
if (diff.status !== 0) {
  console.error(
    '\nGenerated runtime entries are stale. Review and stage the rebuilt lib files before pushing.\n',
  );
  process.exit(1);
}

console.log('Committed dsh.pub runtime entries match the current source.');
