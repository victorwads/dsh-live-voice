import React from 'react';
import type { DebuggerTranslation } from './i18n/index.js';
import { Hint } from '../../live-voice/src/shared/design-system/feedback/Hint.js';
export function RuntimePanel({ data, copy }: { data: any; copy: DebuggerTranslation }) {
  const unknown = copy.runtimes.unavailable;
  const bytes = (n: any) =>
    typeof n === 'number' && Number.isFinite(n)
      ? (n / 1073741824).toFixed(3) + ' GiB (' + Math.round(n).toLocaleString() + ' B)'
      : unknown;
  const ms = (n: any) =>
    typeof n === 'number' && Number.isFinite(n) ? Math.round(n).toLocaleString() + ' ms' : unknown;
  const status = (v: string) =>
    ({
      loading: copy.recordings.loading,
      ready: copy.runtimes.ready,
      error: copy.recordings.error,
      downloaded: copy.runtimes.released,
      absent: copy.runtimes.released,
      started: copy.runtimes.started,
      success: copy.runtimes.success,
      released: copy.runtimes.released,
      cancelled: copy.runtimes.cancelled,
    })[v] ?? unknown;
  const row = (label: string, value: any) => (
    <React.Fragment key={label}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </React.Fragment>
  );
  return (
    <section className="dlvd-runtimes dlvd-scroll" tabIndex={0} aria-label={copy.runtimes.title}>
      <h3>
        {copy.runtimes.title} <Hint label={copy.runtimes.title}>{copy.runtimes.help}</Hint>
      </h3>
      <dl className="dlvd-recording-meta">
        {row(
          copy.runtimes.versions,
          (data.versions?.onnx ?? unknown) + ' / ' + (data.versions?.transformers ?? unknown),
        )}
        {row(copy.runtimes.id, data.runtimeId ?? unknown)}
        {row(
          copy.runtimes.gpu,
          data.gpu === 'available'
            ? copy.runtimes.yes
            : data.gpu === 'unavailable'
              ? copy.runtimes.no
              : unknown,
        )}
        {row(copy.runtimes.storage, bytes(data.storageAvailableBytes))}
        {row(copy.runtimes.heap, bytes(data.pageJsHeapBytes))}
        {row(copy.runtimes.ram, unknown)}
        {row(copy.runtimes.vram, unknown)}
      </dl>
      {(data.models ?? []).map((model: any) => (
        <article className="dlvd-runtime-card" key={model.key}>
          <h3>{model.name}</h3>
          <dl className="dlvd-recording-meta">
            {row(copy.runtimes.status, status(model.phase))}
            {row(
              copy.runtimes.device,
              model.device === 'webgpu'
                ? 'WebGPU'
                : model.device === 'wasm'
                  ? 'WebAssembly CPU'
                  : unknown,
            )}
            {row(copy.runtimes.worker, model.workerActive ? copy.runtimes.yes : copy.runtimes.no)}
            {row(copy.runtimes.revision, model.repository + ' @ ' + model.revision)}
            {row(copy.runtimes.quantization, model.encoderDtype + ' / ' + model.decoderDtype)}
            {row(copy.runtimes.modelBytes, bytes(model.modelBytes))}
            {row(copy.runtimes.cache, bytes(model.cachedBytes))}
            {row(copy.runtimes.pcm, bytes(model.pcmBytes))}
            {row(copy.runtimes.load, ms(model.loadMs) + ' / ' + ms(model.workerLoadMs))}
            {row(copy.runtimes.inference, ms(model.workerInferenceMs))}
            {row(copy.runtimes.audio, ms(model.audioMs))}
            {row(
              copy.runtimes.ratio,
              model.workerInferenceMs != null && model.audioMs > 0
                ? (model.workerInferenceMs / model.audioMs).toFixed(2) + '×'
                : unknown,
            )}
            {row(copy.runtimes.queue, model.queued)}
            {row(copy.runtimes.active, model.active)}
            {row(copy.runtimes.pending, model.pendingRequests)}
            {row(copy.runtimes.completed, model.completed)}
            {row(copy.runtimes.failed, model.failed)}
          </dl>
          {model.error && (
            <p role="alert">
              {copy.runtimes.error}: <code>{model.error}</code>
            </p>
          )}
        </article>
      ))}
      <h3>{copy.runtimes.events}</h3>
      <div className="dlvd-history">
        {!data.events?.length && <p>{copy.commons.empty}</p>}
        {[...(data.events ?? [])].reverse().map((event: any) => (
          <div key={event.sequence} data-level={event.status === 'error' ? 'error' : 'debug'}>
            <time>{new Date(event.timeMs).toLocaleTimeString()}</time> · {event.model} ·{' '}
            {event.operation === 'load'
              ? copy.runtimes.load
              : event.operation === 'worker'
                ? copy.runtimes.worker
                : copy.runtimes.inference}{' '}
            · {status(event.status)}
            {event.durationMs != null ? ' · ' + ms(event.durationMs) : ''}
            {event.code && (
              <>
                {' '}
                · <code>{event.code}</code>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
