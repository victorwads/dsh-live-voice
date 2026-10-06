// @ts-nocheck
import { spawn as nodeSpawn } from 'node:child_process';
import * as nodeFs from 'node:fs/promises';
import { constants } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function failure(message, code, cause) {
  return Object.assign(new Error(message, cause === undefined ? undefined : { cause }), { code });
}
function aborted(reason) {
  return Object.assign(
    new Error('Speech cancelled', reason === undefined ? undefined : { cause: reason }),
    {
      name: 'AbortError',
      code: 'ABORT_ERR',
    },
  );
}

/** Local macOS adapter. No transcript is placed in argv or diagnostic messages.
 * fs is the node:fs/promises interface; spawn returns a Node ChildProcess.
 * A replacement cancels all earlier requests, and waits for their cleanup.
 */
export class SayEngine {
  #spawn;
  #fs;
  #platform;
  #tempRoot;
  #killAfterMs;
  #closeAfterMs;
  #tail = Promise.resolve();
  #requests = new Set();
  #active = null;
  #unclosed = null;
  #state = 'idle';
  #lastError = null;

  constructor({
    spawn = nodeSpawn,
    fs = nodeFs,
    platform = process.platform,
    tempRoot = tmpdir(),
    killAfterMs = 250,
    closeAfterMs = 1000,
  } = {}) {
    for (const value of [killAfterMs, closeAfterMs]) {
      if (!Number.isFinite(value) || value < 0 || value > 2147483647) {
        throw new TypeError('Cancellation deadlines must be finite nonnegative milliseconds');
      }
    }
    this.#spawn = spawn;
    this.#fs = fs;
    this.#platform = platform;
    this.#tempRoot = tempRoot;
    this.#killAfterMs = killAfterMs;
    this.#closeAfterMs = closeAfterMs;
  }

  get state() {
    return this.#state;
  }
  get lastError() {
    return this.#lastError;
  }

  /** Checks the host executable, not browser support or installed voices. */
  async getCapabilities() {
    if (this.#platform !== 'darwin') {
      return {
        supported: false,
        pause: false,
        resume: false,
        audioFormat: 'audio/wav',
        reason: 'unsupported-platform',
      };
    }
    try {
      await this.#fs.access('/usr/bin/say', constants.X_OK);
      return {
        supported: true,
        pause: false,
        resume: false,
        audioFormat: 'audio/wav',
        reason: null,
      };
    } catch {
      return {
        supported: false,
        pause: false,
        resume: false,
        audioFormat: 'audio/wav',
        reason: 'executable-unavailable',
      };
    }
  }

  speak(text, { voice, rate, signal } = {}) {
    if (typeof text !== 'string') return Promise.reject(new TypeError('text must be a string'));
    if (
      voice !== undefined &&
      (typeof voice !== 'string' || !voice.trim() || voice.includes('\0'))
    ) {
      return Promise.reject(new TypeError('voice must be a nonempty string without NUL'));
    }
    if (rate !== undefined && (!Number.isFinite(rate) || rate <= 0)) {
      return Promise.reject(new TypeError('rate must be a positive finite number'));
    }
    if (
      signal !== undefined &&
      (signal === null ||
        typeof signal.addEventListener !== 'function' ||
        typeof signal.removeEventListener !== 'function' ||
        typeof signal.aborted !== 'boolean')
    ) {
      return Promise.reject(new TypeError('signal must be an AbortSignal'));
    }
    for (const request of this.#requests) this.#cancel(request);
    const request = { cancelled: false, reason: undefined, cancelChild: null };
    const onAbort = () => this.#cancel(request, signal.reason);
    this.#requests.add(request);
    signal?.addEventListener('abort', onAbort, { once: true });
    if (signal?.aborted) onAbort();
    const result = this.#tail.then(() => this.#run(request, text, voice, rate));
    const settled = result.finally(() => {
      signal?.removeEventListener('abort', onAbort);
      this.#requests.delete(request);
    });
    this.#tail = settled.catch(() => {});
    return settled;
  }

  /** Resolves after queued requests and cleanup; rejects teardown failures. */
  async stop() {
    for (const request of this.#requests) this.#cancel(request);
    const pending = this.#tail;
    await pending;
    if (this.#unclosed || this.#state === 'error') throw this.#lastError;
  }

  pause() {
    return this.#control('speaking', 'paused', 'SIGSTOP');
  }
  resume() {
    return this.#control('paused', 'speaking', 'SIGCONT');
  }

  #control(from, to, signal) {
    if (
      this.#platform !== 'darwin' ||
      this.#state !== from ||
      !this.#active?.child ||
      this.#active.cancelled
    )
      return false;
    try {
      if (!this.#active.child.kill(signal))
        throw failure('Unable to signal speech process', 'SAY_SIGNAL_FAILED');
      this.#state = to;
      return true;
    } catch (error) {
      this.#lastError = error;
      return false;
    }
  }

  #cancel(request, reason) {
    if (request.cancelled) return;
    request.cancelled = true;
    request.reason = reason;
    request.cancelChild?.();
  }

  async #run(request, text, voice, rate) {
    let directory;
    let error;
    let result;
    const check = () => {
      if (request.cancelled) throw aborted(request.reason);
    };
    try {
      check();
      if (this.#unclosed)
        throw failure('Previous speech process has not closed', 'SAY_PROCESS_UNCLOSED');
      this.#active = request;
      this.#state = 'preparing';
      this.#lastError = null;
      const capability = await this.getCapabilities();
      check();
      if (!capability.supported) throw failure('macOS say is unavailable', 'SAY_UNAVAILABLE');
      directory = await this.#fs.mkdtemp(join(this.#tempRoot, 'dsh-live-voice-say-'));
      check();
      await this.#fs.chmod(directory, 0o700);
      const file = join(directory, 'speech.txt');
      const output = join(directory, 'speech.wav');
      await this.#fs.writeFile(file, text, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
      await this.#fs.chmod(file, 0o600);
      check();
      const args = ['-f', file, '-o', output, '--file-format=WAVE', '--data-format=LEI16@22050'];
      if (voice !== undefined) args.push('-v', voice);
      if (rate !== undefined) args.push('-r', String(rate));
      const child = this.#spawn('/usr/bin/say', args, { shell: false, stdio: 'ignore' });
      request.child = child;
      this.#state = 'speaking';
      await this.#waitForClose(request, child);
      check();
      result = await this.#fs.readFile(output);
    } catch (caught) {
      error = caught;
    } finally {
      request.cancelChild = null;
      if (directory) {
        try {
          await this.#fs.rm(directory, { recursive: true, force: true });
        } catch (cleanupError) {
          error = failure(
            'Speech temporary-file cleanup failed',
            'SAY_CLEANUP_FAILED',
            error ? new AggregateError([error, cleanupError]) : cleanupError,
          );
        }
      }
      if (!error && request.cancelled) error = aborted(request.reason);
      if (this.#active === request) this.#active = null;
      if (error && error.name !== 'AbortError') {
        this.#state = 'error';
        this.#lastError = error;
      } else if (!this.#unclosed && this.#state !== 'error') this.#state = 'idle';
    }
    if (error) throw error;
    return result;
  }

  #waitForClose(request, child) {
    return new Promise((resolve, reject) => {
      let closed = false;
      let processError;
      let killTimer;
      let closeTimer;
      const send = (signal) => {
        try {
          if (!child.kill(signal))
            processError ??= failure('Unable to signal speech process', 'SAY_SIGNAL_FAILED');
        } catch (error) {
          processError ??= error;
        }
      };
      const onError = (error) => {
        processError ??= error;
      };
      child.on('error', onError);
      child.once('close', (code, signal) => {
        closed = true;
        clearTimeout(killTimer);
        clearTimeout(closeTimer);
        child.removeListener('error', onError);
        if (this.#unclosed === child) this.#unclosed = null;
        if (request.cancelled) reject(aborted(request.reason));
        else if (processError) reject(processError);
        else if (code !== 0)
          reject(
            failure('Speech process exited unsuccessfully', 'SAY_EXIT_FAILED', { code, signal }),
          );
        else resolve();
      });
      request.cancelChild = () => {
        if (closed) return;
        const paused = this.#state === 'paused';
        this.#state = 'stopping';
        if (paused) send('SIGCONT');
        send('SIGTERM');
        if (closed) return;
        killTimer = setTimeout(() => {
          send('SIGKILL');
          if (closed) return;
          closeTimer = setTimeout(() => {
            if (closed) return;
            // Never start another child while the timed-out one might still speak.
            this.#unclosed = child;
            reject(
              failure(
                'Speech process did not close after cancellation',
                'SAY_STOP_TIMEOUT',
                processError,
              ),
            );
          }, this.#closeAfterMs);
        }, this.#killAfterMs);
      };
      if (request.cancelled) request.cancelChild();
    });
  }
}
