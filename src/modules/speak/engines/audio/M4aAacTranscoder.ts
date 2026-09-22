// @ts-nocheck
import { execFile as nodeExecFile } from 'node:child_process';
import * as nodeFs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execFile = promisify(nodeExecFile);
const aborted = (reason) =>
  Object.assign(new Error('Speech audio conversion was cancelled.'), {
    name: 'AbortError',
    cause: reason,
  });

/** Converts internal PCM WAV synthesis output to compact browser-playable AAC in M4A. */
export async function wavToM4aAac(
  input,
  { fs = nodeFs, run = execFile, tempRoot = tmpdir(), signal, bitrate = 64000 } = {},
) {
  if (!input || !Number.isSafeInteger(input.byteLength) || input.byteLength < 44)
    throw new TypeError('A valid WAV audio buffer is required.');
  if (!Number.isFinite(bitrate) || bitrate < 16000 || bitrate > 256000)
    throw new TypeError('AAC bitrate must be between 16000 and 256000 bps.');
  if (signal?.aborted) throw aborted(signal.reason);
  let directory, result, error;
  try {
    directory = await fs.mkdtemp(join(tempRoot, 'dsh-live-voice-aac-'));
    await fs.chmod(directory, 0o700);
    const source = join(directory, 'speech.wav'),
      target = join(directory, 'speech.m4a');
    await fs.writeFile(source, input, { mode: 0o600, flag: 'wx' });
    if (signal?.aborted) throw aborted(signal.reason);
    await run(
      '/usr/bin/afconvert',
      ['-f', 'm4af', '-d', 'aac', '-b', String(bitrate), source, target],
      {
        shell: false,
        signal,
      },
    );
    if (signal?.aborted) throw aborted(signal.reason);
    result = await fs.readFile(target);
    if (result.byteLength < 16 || Buffer.from(result).subarray(4, 8).toString('ascii') !== 'ftyp')
      throw new Error('Audio conversion produced invalid M4A output.');
  } catch (caught) {
    error = signal?.aborted && caught?.name !== 'AbortError' ? aborted(signal.reason) : caught;
  } finally {
    if (directory) {
      try {
        await fs.rm(directory, { recursive: true, force: true });
      } catch (cleanupError) {
        error ||= cleanupError;
      }
    }
  }
  if (error) throw error;
  return result;
}
