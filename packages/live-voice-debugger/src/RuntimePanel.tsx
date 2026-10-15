import React from 'react';
import type { DebuggerCopy } from './locales.js';
import { Hint } from '../../live-voice/src/shared/design-system/feedback/Hint.js';
export function RuntimePanel({ data, copy }: { data: any; copy: DebuggerCopy }) {
  const unknown = copy.runtimeUnavailable;
  const bytes = (n: any) =>
    typeof n === 'number' && Number.isFinite(n)
      ? (n / 1073741824).toFixed(3) + ' GiB (' + Math.round(n).toLocaleString() + ' B)'
      : unknown;
  const ms = (n: any) =>
    typeof n === 'number' && Number.isFinite(n) ? Math.round(n).toLocaleString() + ' ms' : unknown;
  const status = (v: string) =>
    ({
      loading: copy.recordingLoading,
      ready: copy.runtimeReady,
      error: copy.recordingError,
      downloaded: copy.runtimeReleased,
      absent: copy.runtimeReleased,
      started: copy.runtimeStarted,
      success: copy.runtimeSuccess,
      released: copy.runtimeReleased,
      cancelled: copy.runtimeCancelled,
    })[v] ?? unknown;
  const row = (label: string, value: any) => (
    <React.Fragment key={label}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </React.Fragment>
  );
  return (
    <section className="dlvd-runtimes dlvd-scroll" tabIndex={0} aria-label={copy.runtimeTitle}>
      <h3>
        {copy.runtimeTitle} <Hint label={copy.runtimeTitle}>{copy.runtimeHelp}</Hint>
      </h3>
      <dl className="dlvd-recording-meta">
        {row(
          copy.runtimeVersions,
          (data.versions?.onnx ?? unknown) + ' / ' + (data.versions?.transformers ?? unknown),
        )}
        {row(copy.runtimeId, data.runtimeId ?? unknown)}
        {row(
          copy.runtimeGpu,
          data.gpu === 'available'
            ? copy.runtimeYes
            : data.gpu === 'unavailable'
              ? copy.runtimeNo
              : unknown,
        )}
        {row(copy.runtimeStorage, bytes(data.storageAvailableBytes))}
        {row(copy.runtimeHeap, bytes(data.pageJsHeapBytes))}
        {row(copy.runtimeRam, unknown)}
        {row(copy.runtimeVram, unknown)}
      </dl>
      {(data.models ?? []).map((model: any) => (
        <article className="dlvd-runtime-card" key={model.key}>
          <h3>{model.name}</h3>
          <dl className="dlvd-recording-meta">
            {row(copy.runtimeStatus, status(model.phase))}
            {row(
              copy.runtimeDevice,
              model.device === 'webgpu'
                ? 'WebGPU'
                : model.device === 'wasm'
                  ? 'WebAssembly CPU'
                  : unknown,
            )}
            {row(copy.runtimeWorker, model.workerActive ? copy.runtimeYes : copy.runtimeNo)}
            {row(copy.runtimeRevision, model.repository + ' @ ' + model.revision)}
            {row(copy.runtimeQuantization, model.encoderDtype + ' / ' + model.decoderDtype)}
            {row(copy.runtimeModelBytes, bytes(model.modelBytes))}
            {row(copy.runtimeCache, bytes(model.cachedBytes))}
            {row(copy.runtimePcm, bytes(model.pcmBytes))}
            {row(copy.runtimeLoad, ms(model.loadMs) + ' / ' + ms(model.workerLoadMs))}
            {row(copy.runtimeInference, ms(model.workerInferenceMs))}
            {row(copy.runtimeAudio, ms(model.audioMs))}
            {row(
              copy.runtimeRatio,
              model.workerInferenceMs != null && model.audioMs > 0
                ? (model.workerInferenceMs / model.audioMs).toFixed(2) + '×'
                : unknown,
            )}
            {row(copy.runtimeQueue, model.queued)}
            {row(copy.runtimeActive, model.active)}
            {row(copy.runtimePending, model.pendingRequests)}
            {row(copy.runtimeCompleted, model.completed)}
            {row(copy.runtimeFailed, model.failed)}
          </dl>
          {model.error && (
            <p role="alert">
              {copy.runtimeError}: <code>{model.error}</code>
            </p>
          )}
        </article>
      ))}
      <h3>{copy.runtimeEvents}</h3>
      <div className="dlvd-history">
        {!data.events?.length && <p>{copy.empty}</p>}
        {[...(data.events ?? [])].reverse().map((event: any) => (
          <div key={event.sequence} data-level={event.status === 'error' ? 'error' : 'debug'}>
            <time>{new Date(event.timeMs).toLocaleTimeString()}</time> · {event.model} ·{' '}
            {event.operation === 'load'
              ? copy.runtimeLoad
              : event.operation === 'worker'
                ? copy.runtimeWorker
                : copy.runtimeInference}{' '}
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
