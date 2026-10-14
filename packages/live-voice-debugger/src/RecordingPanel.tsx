import React from 'react';
import {
  RECORDING_CHANGED,
  type RecordingSession,
  type RecordingService,
  type RecordingSegment,
} from '../../live-voice/src/modules/recording/types.js';
import type { DebuggerCopy } from './locales.js';
import { createRecordingInspector, type RecordingView } from './recordingInspector.js';

function duration(samples: number, rate: number) {
  const milliseconds = Math.max(0, Math.round((samples / Math.max(1, rate)) * 1000));
  const seconds = Math.floor(milliseconds / 1000);
  return (
    [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60]
      .map((n) => String(n).padStart(2, '0'))
      .join(':') +
    '.' +
    String(milliseconds % 1000).padStart(3, '0')
  );
}
const sourceKey = (session: RecordingSession) => JSON.stringify([session.kind, session.sourceId]);
const sourceName = (session: RecordingSession, copy: DebuggerCopy) =>
  (session.kind === 'microphone' ? copy.recordingMicrophone : copy.recordingShared) +
  ' · ' +
  (session.label || session.sourceId) +
  ' · ' +
  session.sourceId;
function stateName(session: RecordingSession, copy: DebuggerCopy) {
  return {
    recording: copy.recordingActive,
    completed: copy.recordingCompleted,
    interrupted: copy.recordingInterrupted,
    failed: copy.recordingFailed,
  }[session.state];
}

export function RecordingPanel({ copy, target }: { copy: DebuggerCopy; target: any }) {
  const [view, setView] = React.useState<RecordingView>({
    service: null,
    sessions: [],
    selected: null,
    segments: [],
    loading: true,
    failed: false,
  });
  const inspector = React.useRef<ReturnType<typeof createRecordingInspector> | null>(null);
  const [filter, setFilter] = React.useState('');
  React.useEffect(() => {
    const current = createRecordingInspector(target, setView);
    inspector.current = current;
    current.discover();
    // Poll only service identity; recording data is refreshed by its subscription.
    const timer = setInterval(current.discover, 1000);
    target.addEventListener(RECORDING_CHANGED, current.discover);
    return () => {
      clearInterval(timer);
      target.removeEventListener(RECORDING_CHANGED, current.discover);
      current.dispose();
      inspector.current = null;
    };
  }, [target]);
  const sources = [
    ...new Map(view.sessions.map((session) => [sourceKey(session), session])).values(),
  ];
  const visible = view.sessions
    .filter((session) => !filter || sourceKey(session) === filter)
    .slice()
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  React.useEffect(() => {
    if (
      !view.loading &&
      filter &&
      visible.length &&
      !visible.some((s) => s.id === view.selected?.id)
    )
      inspector.current?.select(visible[0].id);
  }, [filter, view.selected?.id, view.loading, visible[0]?.id]);
  const selected =
    view.selected && visible.some((s) => s.id === view.selected?.id) ? view.selected : null;
  return (
    <section className="dlvd-recordings" aria-label={copy.recordingTitle}>
      <p>{copy.recordingHelp}</p>
      <div className="dlvd-toolbar">
        <label>
          {copy.recordingSourceFilter}{' '}
          <select value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="">{copy.recordingAllSources}</option>
            {sources.map((session) => (
              <option key={sourceKey(session)} value={sourceKey(session)}>
                {sourceName(session, copy)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => {
            inspector.current?.discover();
            inspector.current?.refresh();
          }}
        >
          {copy.recordingRefresh}
        </button>
      </div>
      {view.failed && <p role="alert">{copy.recordingLoadError}</p>}
      {!view.service ? (
        <p role="status">{copy.recordingUnavailable}</p>
      ) : (
        <>
          {view.loading && <p role="status">{copy.recordingLoading}</p>}
          <div className="dlvd-recording-columns">
            <div
              className="dlvd-session-list dlvd-scroll"
              tabIndex={0}
              aria-label={copy.recordingTitle}
            >
              {!visible.length && !view.loading && <p>{copy.recordingEmpty}</p>}
              {sources
                .filter((source) => !filter || sourceKey(source) === filter)
                .map((source) => (
                  <section key={sourceKey(source)} aria-label={sourceName(source, copy)}>
                    <h3>{sourceName(source, copy)}</h3>
                    <table>
                      <thead>
                        <tr>
                          <th scope="col">{copy.recordingDate}</th>
                          <th scope="col">{copy.recordingState}</th>
                          <th scope="col">{copy.recordingDuration}</th>
                          <th scope="col">{copy.recordingSaved}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visible
                          .filter((session) => sourceKey(session) === sourceKey(source))
                          .map((session) => (
                            <tr key={session.id} data-selected={session.id === selected?.id}>
                              <td>
                                <button
                                  type="button"
                                  aria-pressed={session.id === selected?.id}
                                  onClick={() => inspector.current?.select(session.id)}
                                >
                                  <time dateTime={session.startedAt}>
                                    {new Date(session.startedAt).toLocaleString()}
                                  </time>
                                </button>
                              </td>
                              <td>{stateName(session, copy)}</td>
                              <td>{duration(session.capturedSamples, session.sampleRate)}</td>
                              <td>
                                {duration(session.savedSamples, session.sampleRate)}
                                <br />
                                {session.persistent
                                  ? copy.recordingPersistent
                                  : copy.recordingMemory}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </section>
                ))}
            </div>
            <div className="dlvd-recording-detail dlvd-scroll" tabIndex={0}>
              {selected ? (
                <RecordingDetail
                  key={selected.id}
                  copy={copy}
                  session={selected}
                  service={view.service}
                  segments={view.segments}
                  refresh={() => inspector.current?.refresh()}
                />
              ) : (
                <p>{copy.recordingSelectSession}</p>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function RecordingDetail({
  copy,
  session,
  service,
  segments,
  refresh,
}: {
  copy: DebuggerCopy;
  session: RecordingSession;
  service: RecordingService;
  segments: RecordingSegment[];
  refresh(): void;
}) {
  const container = React.useRef<HTMLElement | null>(null);
  const audio = React.useRef<HTMLAudioElement | null>(null);
  const playback = React.useRef<{ url: string; api: typeof URL } | null>(null);
  const download = React.useRef<{ url: string; api: typeof URL } | null>(null);
  const generation = React.useRef(0);
  const playGeneration = React.useRef(0);
  const [error, setError] = React.useState<keyof DebuggerCopy | null>(null);
  const [playing, setPlaying] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [selectedSegment, setSelectedSegment] = React.useState('');
  const clearPlayback = (player = audio.current) => {
    ++playGeneration.current;
    if (player?.hasAttribute('src')) {
      player.pause();
      player.removeAttribute('src');
      player.load();
    }
    if (playback.current) playback.current.api.revokeObjectURL(playback.current.url);
    playback.current = null;
  };
  const clearDownload = () => {
    if (download.current) download.current.api.revokeObjectURL(download.current.url);
    download.current = null;
  };
  React.useEffect(() => {
    const owner = container.current?.ownerDocument.defaultView;
    const player = audio.current;
    const release = () => {
      ++generation.current;
      clearPlayback(player);
      clearDownload();
    };
    owner?.addEventListener('pagehide', release);
    return () => {
      owner?.removeEventListener('pagehide', release);
      release();
    };
  }, [service, session.id]);
  const play = async (segment?: RecordingSegment) => {
    clearPlayback();
    const token = generation.current;
    const request = playGeneration.current;
    setPlaying(true);
    setError(null);
    setSelectedSegment(segment?.id ?? '');
    try {
      const blob = await service.audio(session.id, segment?.startSample, segment?.endSample);
      if (token !== generation.current || request !== playGeneration.current) return;
      const player = audio.current;
      const api = player?.ownerDocument.defaultView?.URL;
      if (!player || !api) return;
      const url = api.createObjectURL(blob);
      playback.current = { url, api };
      player.src = url;
      await player.play();
    } catch {
      if (token === generation.current && request === playGeneration.current) {
        clearPlayback();
        setError('recordingAudioError');
        setPlaying(false);
      }
    } finally {
      if (token === generation.current && request === playGeneration.current) setPlaying(false);
    }
  };
  const exportSession = async () => {
    const token = generation.current;
    setExporting(true);
    setError(null);
    clearDownload();
    try {
      const blob = await service.export(session.id);
      if (token !== generation.current) return;
      const doc = container.current?.ownerDocument;
      const api = doc?.defaultView?.URL;
      if (!doc || !api) return;
      const url = api.createObjectURL(blob);
      download.current = { url, api };
      const link = doc.createElement('a');
      link.href = url;
      link.download = 'recording-' + session.id.replace(/[^a-zA-Z0-9_-]/g, '_') + '.json';
      doc.body.appendChild(link);
      try {
        link.click();
      } finally {
        link.remove();
      }
    } catch {
      if (token === generation.current) {
        clearDownload();
        setError('recordingExportError');
      }
    } finally {
      if (token === generation.current) setExporting(false);
    }
  };
  const removeSession = async () => {
    const token = ++generation.current;
    setExporting(false);
    setPlaying(false);
    setDeleting(true);
    setError(null);
    clearPlayback();
    clearDownload();
    try {
      await service.remove(session.id);
      if (token === generation.current) {
        setConfirmDelete(false);
        refresh();
      }
    } catch {
      if (token === generation.current) setError('recordingDeleteError');
    } finally {
      if (token === generation.current) setDeleting(false);
    }
  };
  const length = Math.max(1, session.savedSamples);
  const segmentName = (segment: RecordingSegment) =>
    (segment.kind === 'speech' ? copy.recordingSpeech : copy.recordingSilence) +
    ' · ' +
    duration(segment.startSample, session.sampleRate) +
    ' — ' +
    duration(segment.endSample, session.sampleRate);
  return (
    <section ref={container} aria-label={sourceName(session, copy)}>
      <h3>{sourceName(session, copy)}</h3>
      <dl className="dlvd-recording-meta">
        <dt>{copy.recordingDate}</dt>
        <dd>{new Date(session.startedAt).toLocaleString()}</dd>
        <dt>{copy.recordingState}</dt>
        <dd>{stateName(session, copy)}</dd>
        <dt>{copy.recordingCaptured}</dt>
        <dd>{duration(session.capturedSamples, session.sampleRate)}</dd>
        <dt>{copy.recordingSaved}</dt>
        <dd>
          {duration(session.savedSamples, session.sampleRate)} ·
          {session.storage === 'indexeddb' || session.persistent
            ? copy.recordingPersistent
            : copy.recordingMemory}
        </dd>
        {session.endedAt && (
          <>
            <dt>{copy.recordingEnd}</dt>
            <dd>{new Date(session.endedAt).toLocaleString()}</dd>
          </>
        )}
      </dl>
      {session.error && (
        <p role="alert">
          {copy.recordingError}: {session.error}
        </p>
      )}
      <div className="dlvd-toolbar">
        <button
          type="button"
          disabled={playing || deleting || !session.savedSamples}
          onClick={() => void play()}
        >
          {copy.recordingPlaySession}
        </button>
        <button type="button" disabled={exporting || deleting} onClick={() => void exportSession()}>
          {copy.recordingExport}
        </button>
        <button type="button" disabled={deleting} onClick={() => setConfirmDelete(true)}>
          {copy.recordingDelete}
        </button>
      </div>
      {confirmDelete && (
        <div className="dlvd-delete-confirm" role="group" aria-label={copy.recordingConfirmDelete}>
          <p>{copy.recordingConfirmDelete}</p>
          <button type="button" disabled={deleting} onClick={() => void removeSession()}>
            {copy.recordingDelete}
          </button>{' '}
          <button type="button" disabled={deleting} onClick={() => setConfirmDelete(false)}>
            {copy.recordingCancel}
          </button>
        </div>
      )}
      {error && <p role="alert">{copy[error]}</p>}
      <audio
        ref={audio}
        controls
        preload="none"
        aria-label={copy.recordingAudio}
        onError={() => {
          clearPlayback();
          setError('recordingAudioError');
        }}
      />
      <h4>{copy.recordingTimeline}</h4>
      <div className="dlvd-timeline" role="group" aria-label={copy.recordingTimeline}>
        {segments.map((segment) => (
          <button
            key={segment.id}
            type="button"
            data-kind={segment.kind}
            aria-label={segmentName(segment)}
            title={segmentName(segment)}
            aria-pressed={selectedSegment === segment.id}
            style={{
              left: (segment.startSample / length) * 100 + '%',
              width: (Math.max(0, segment.endSample - segment.startSample) / length) * 100 + '%',
            }}
            onClick={() => {
              clearPlayback();
              setPlaying(false);
              setSelectedSegment(segment.id);
            }}
          />
        ))}
        {session.pins.map((pin) => (
          <span
            key={pin.id}
            className="dlvd-pin"
            aria-hidden="true"
            style={{ left: (Math.min(length, pin.atSample) / length) * 100 + '%' }}
            title={
              (pin.kind === 'speech-start' ? copy.recordingSpeech : copy.recordingSilence) +
              ' · ' +
              duration(pin.atSample, session.sampleRate)
            }
          />
        ))}
      </div>
      <div className="dlvd-timeline-legend">
        <span data-kind="speech">{copy.recordingSpeech}</span>
        {' · '}
        <span data-kind="silence">{copy.recordingSilence}</span>
        {' · '}
        {duration(session.savedSamples, session.sampleRate)}
      </div>
      <h4>{copy.recordingSegments}</h4>
      <table className="dlvd-segments">
        <thead>
          <tr>
            <th scope="col">{copy.recordingState}</th>
            <th scope="col">{copy.recordingStart}</th>
            <th scope="col">{copy.recordingEnd}</th>
            <th scope="col">{copy.recordingDuration}</th>
            <th scope="col">{copy.recordingAudio}</th>
          </tr>
        </thead>
        <tbody>
          {segments.map((segment) => (
            <React.Fragment key={segment.id}>
              <tr data-selected={selectedSegment === segment.id}>
                <td>
                  {segment.kind === 'speech' ? copy.recordingSpeech : copy.recordingSilence}
                  {segment.open && <small>{copy.recordingOpen}</small>}
                </td>
                <td>{duration(segment.startSample, session.sampleRate)}</td>
                <td>{duration(segment.endSample, session.sampleRate)}</td>
                <td>{duration(segment.endSample - segment.startSample, session.sampleRate)}</td>
                <td>
                  <button
                    type="button"
                    disabled={deleting || segment.endSample <= segment.startSample}
                    aria-label={copy.recordingPlay + ' · ' + segmentName(segment)}
                    onClick={() => void play(segment)}
                  >
                    {copy.recordingPlay}
                  </button>
                </td>
              </tr>
              {segment.kind === 'speech' && (
                <tr>
                  <td colSpan={5}>
                    <details open={selectedSegment === segment.id || undefined}>
                      <summary>
                        {copy.recordingAttempts} · {segment.attempts.length}
                      </summary>
                      {!segment.attempts.length && <p>{copy.recordingNoAttempts}</p>}
                      {segment.attempts.map((attempt) => (
                        <article className="dlvd-attempt" key={attempt.id}>
                          <div>
                            {copy.recordingEngine}: {attempt.engine} ·
                            {
                              {
                                pending: copy.recordingPending,
                                success: copy.recordingSuccess,
                                error: copy.recordingError,
                              }[attempt.status]
                            }
                          </div>
                          <time dateTime={attempt.createdAt}>
                            {new Date(attempt.createdAt).toLocaleString()}
                          </time>
                          {attempt.finishedAt && (
                            <>
                              {' '}
                              —{' '}
                              <time dateTime={attempt.finishedAt}>
                                {new Date(attempt.finishedAt).toLocaleString()}
                              </time>
                            </>
                          )}
                          <div>
                            {duration(attempt.startSample, session.sampleRate)} —{' '}
                            {duration(attempt.endSample, session.sampleRate)}
                          </div>
                          {attempt.text != null && (
                            <p className="dlvd-transcript">{attempt.text}</p>
                          )}
                          {attempt.error && (
                            <p className="dlvd-attempt-error">
                              {copy.recordingError}: {attempt.error}
                            </p>
                          )}
                        </article>
                      ))}
                    </details>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      <details>
        <summary>
          {copy.recordingPins} · {session.pins.length}
        </summary>
        <table>
          <thead>
            <tr>
              <th scope="col">{copy.recordingState}</th>
              <th scope="col">{copy.recordingStart}</th>
              <th scope="col">{copy.recordingPinConfirmed}</th>
              <th scope="col">{copy.recordingPinDelay}</th>
            </tr>
          </thead>
          <tbody>
            {session.pins.map((pin) => (
              <tr key={pin.id}>
                <td>
                  {pin.kind === 'speech-start' ? copy.recordingSpeech : copy.recordingSilence}
                </td>
                <td>{duration(pin.atSample, session.sampleRate)}</td>
                <td>{duration(pin.confirmedAtSample, session.sampleRate)}</td>
                <td>{duration(pin.delaySamples, session.sampleRate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}
