// @ts-nocheck
const CHANNEL = '/api';
const cancelled = () => Object.assign(new Error('Speech was cancelled.'), { name: 'AbortError' });

/** Browser transport for host-local macOS say; it never claims browser-local audio.
 * rpc is ctx.connection.rpc. The long-running speak request is intentionally
 * abortable, so a closed browser transport cancels the host process as well.
 */
export class SayClientEngine {
  constructor({ rpc }) {
    this.rpc = rpc;
    this.clientId = globalThis.crypto.randomUUID();
    this.current = null;
  }
  async request(endpoint, payload = {}, signal) {
    const result = await this.rpc.call(CHANNEL, `dsh-live-voice/${endpoint}`, payload, signal);
    if (!result?.ok) {
      if (signal?.aborted || result?.error?.code === 'cancelled') throw cancelled();
      throw Object.assign(new Error(result?.error?.message || 'Host speech is unavailable.'), {
        code: result?.error?.code,
      });
    }
    return result.value;
  }
  async capability() {
    try {
      return { ...(await this.request('capabilities')), local: true, location: 'host' };
    } catch (error) {
      return {
        supported: false,
        local: true,
        location: 'host',
        reason: `macOS say connection failed: ${error.message}`,
      };
    }
  }
  async speak(text, { voice, rate = 1, signal } = {}) {
    if (typeof text !== 'string') throw new TypeError('Speech text must be a string.');
    if (!Number.isFinite(rate) || rate < 0.1 || rate > 10)
      throw new RangeError('Speech rate must be between 0.1 and 10.');
    if (signal?.aborted) throw cancelled();
    const previous = this.current;
    previous?.abort.abort();
    const operation = { operationId: globalThis.crypto.randomUUID(), abort: new AbortController() };
    this.current = operation;
    const cancel = () => operation.abort.abort();
    signal?.addEventListener('abort', cancel, { once: true });
    if (signal?.aborted) cancel();
    try {
      if (!text.trim()) return;
      await this.request(
        'speak',
        {
          clientId: this.clientId,
          operationId: operation.operationId,
          text,
          ...(voice === undefined ? {} : { voice }),
          rate: Math.round(rate * 175),
        },
        operation.abort.signal,
      );
      if (operation.abort.signal.aborted) throw cancelled();
    } finally {
      signal?.removeEventListener('abort', cancel);
      if (this.current === operation) this.current = null;
    }
  }
  async stop() {
    const operation = this.current;
    if (!operation) return;
    this.current = null;
    // Send ownership-scoped stop as well as cancelling the open request. Either
    // arrival order is safe; an obsolete operation cannot stop its successor.
    const stopping = this.request('stop', {
      clientId: this.clientId,
      operationId: operation.operationId,
    });
    operation.abort.abort();
    await stopping;
  }
  async control(endpoint) {
    const operation = this.current;
    if (!operation) return false;
    const value = await this.request(endpoint, {
      clientId: this.clientId,
      operationId: operation.operationId,
    });
    return value.applied;
  }
  pause() {
    return this.control('pause');
  }
  resume() {
    return this.control('resume');
  }
}
