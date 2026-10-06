import React from 'react';
import {
  DIAGNOSTIC_CHANGED,
  DIAGNOSTIC_KEY,
  type DiagnosticSource,
} from '../src/modules/core/diagnostics.js';
import { createInspector } from './inspector.js';
import type { DebuggerCopy } from './locales.js';
import { StateTree } from './StateTree.js';
export function DebuggerPanel({
  copy,
  onClose,
  target = window,
}: {
  copy: DebuggerCopy;
  onClose(): void;
  target?: any;
}) {
  const [frozen, setFrozen] = React.useState(false);
  const [refreshHz, setRefreshHz] = React.useState(10);
  const updateRef = React.useRef<(() => void) | null>(null);
  const [content, setContent] = React.useState(false);
  const [module, setModule] = React.useState('');
  const [view, setView] = React.useState<ReturnType<
    ReturnType<typeof createInspector>['read']
  > | null>(null);
  const [failed, setFailed] = React.useState(false);
  const [eventsPaused, setEventsPaused] = React.useState(false);
  const pausedRef = React.useRef(false);
  const inspectorRef = React.useRef<ReturnType<typeof createInspector> | null>(null);
  React.useEffect(() => {
    if (frozen) return;
    let inspector: ReturnType<typeof createInspector> | null = null;
    let source: DiagnosticSource | null = null;
    const update = () => {
      try {
        const next = target[DIAGNOSTIC_KEY];
        if (next !== source) {
          inspector?.dispose();
          inspector = null;
          source = next?.version === 1 ? next : null;
          if (source) {
            inspector = createInspector(source);
            inspector.setPaused(pausedRef.current);
          }
          inspectorRef.current = inspector;
        }
        setView(inspector?.read(content) ?? null);
        setFailed(false);
      } catch {
        setFailed(true);
      }
    };
    update();
    updateRef.current = update;
    target.addEventListener(DIAGNOSTIC_CHANGED, update);
    return () => {
      updateRef.current = null;
      target.removeEventListener(DIAGNOSTIC_CHANGED, update);
      inspector?.dispose();
      inspectorRef.current = null;
    };
  }, [frozen, content, target]);
  React.useEffect(() => {
    if (frozen) return;
    const timer = setInterval(() => updateRef.current?.(), 1000 / refreshHz);
    return () => clearInterval(timer);
  }, [frozen, refreshHz]);
  const modules = [...new Set(view?.transitions.map((entry) => entry.module) ?? [])].sort();
  return (
    <aside className="dlvd-panel" aria-label={copy.title}>
      <header>
        <strong>{copy.title}</strong>
        <span>{refreshHz} Hz</span>
        <button type="button" onClick={onClose} aria-label={copy.close}>
          ×
        </button>
      </header>
      <p>{copy.help}</p>
      <div className="dlvd-toolbar">
        <label>
          {copy.refreshRate}
          <select value={refreshHz} onChange={(event) => setRefreshHz(Number(event.target.value))}>
            {[1, 2, 5, 10, 20].map((hz) => (
              <option key={hz} value={hz}>
                {hz} Hz
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={() => setFrozen(!frozen)}>
          {frozen ? copy.resume : copy.freeze}
        </button>
        <label>
          <input
            type="checkbox"
            checked={content}
            onChange={(event) => {
              setView(null);
              setFrozen(false);
              setContent(event.target.checked);
            }}
          />
          {copy.content}
        </label>
      </div>
      {failed ? (
        <p role="alert">{copy.error}</p>
      ) : !view ? (
        <p role="status">{copy.waiting}</p>
      ) : (
        <div className="dlvd-columns">
          <section className="dlvd-state-pane" aria-label={copy.states}>
            <h3>{copy.states}</h3>
            <div className="dlvd-scroll" tabIndex={0}>
              <StateTree name="context" value={view.state} omitted={copy.omitted} />
            </div>
          </section>
          <section className="dlvd-event-pane" aria-label={copy.transitions}>
            <h3>{copy.transitions}</h3>
            <div className="dlvd-toolbar">
              <button
                type="button"
                aria-pressed={eventsPaused}
                onClick={() => {
                  const paused = !eventsPaused;
                  inspectorRef.current?.setPaused(paused);
                  pausedRef.current = paused;
                  setEventsPaused(paused);
                }}
              >
                {eventsPaused ? copy.eventsResume : copy.eventsPause}
              </button>
              <button
                type="button"
                onClick={() => {
                  inspectorRef.current?.clear();
                  setView((current) => (current ? { ...current, transitions: [] } : current));
                }}
              >
                {copy.eventsClear}
              </button>
            </div>
            <label>
              {copy.filter}
              <select value={module} onChange={(event) => setModule(event.target.value)}>
                <option value="">{copy.all}</option>
                {modules.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </label>
            <div className="dlvd-history dlvd-scroll" tabIndex={0}>
              {view.transitions
                .filter((entry) => !module || entry.module === module)
                .slice()
                .reverse()
                .map((entry) => (
                  <details key={entry.sequence} data-level={entry.level}>
                    <summary>
                      <small>{new Date(entry.timeMs).toLocaleTimeString()}</small>{' '}
                      <code>
                        {entry.sessionId} / {entry.module}
                      </code>
                    </summary>
                    <StateTree name="before" value={entry.before} omitted={copy.omitted} />
                    <StateTree name="after" value={entry.after} omitted={copy.omitted} />
                  </details>
                ))}
              {!view.transitions.length && <p>{copy.empty}</p>}
            </div>
          </section>
        </div>
      )}
    </aside>
  );
}
