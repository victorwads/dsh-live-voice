import React from 'react';
import { useLanguage } from '../../../app/client/i18n/index.js';
import type { PluginUpdate } from '../services/pluginUpdate.js';

export function PluginUpdateAction({ updater, tag }: { updater: PluginUpdate; tag: string }) {
  const { scoped: commons } = useLanguage((ctx) => ctx.commons);
  const text = (commons as any).update;
  const state = React.useSyncExternalStore(
    updater.subscribe,
    updater.getSnapshot,
    updater.getSnapshot,
  );
  const [open, setOpen] = React.useState(false);
  const panelId = React.useId();
  const trigger = React.useRef<HTMLButtonElement>(null);
  const confirmButton = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (state.phase === 'confirm') confirmButton.current?.focus();
  }, [state.phase]);
  const busy = state.phase === 'checking' || state.phase === 'installing';
  const settled = ['restart', 'done', 'uncertain'].includes(state.phase);
  const expanded = open || busy || settled || state.phase === 'confirm';
  return (
    <span className="dlv-plugin-update">
      <button
        type="button"
        className="dlv-version-badge dlv-update-badge"
        ref={trigger}
        aria-expanded={expanded}
        aria-controls={panelId}
        disabled={busy || settled}
        onClick={() => {
          setOpen(true);
          void updater.prepare(tag);
        }}
      >
        <span aria-hidden="true">↻ </span>
        {busy ? text.installing() : text.now()}
      </button>
      {expanded && (
        <span id={panelId} className="dlv-plugin-update-panel">
          {state.phase === 'confirm' ? (
            <>
              <span id={panelId + '-confirmation'}>{text.confirm({ version: state.version })}</span>
              <button
                ref={confirmButton}
                aria-describedby={panelId + '-confirmation'}
                type="button"
                onClick={() => void updater.confirm()}
              >
                {text.now()}
              </button>
              <button
                type="button"
                onClick={() => {
                  updater.cancel();
                  setOpen(false);
                  trigger.current?.focus();
                }}
              >
                {text.cancel()}
              </button>
            </>
          ) : (
            <span
              role={state.phase === 'failed' || state.phase === 'uncertain' ? 'alert' : 'status'}
            >
              {state.phase === 'restart'
                ? text.restart({ version: state.version })
                : state.phase === 'done'
                  ? text.done({ version: state.version })
                  : state.problem
                    ? text[state.problem]()
                    : busy
                      ? text.installing()
                      : null}
            </span>
          )}
          {state.phase === 'failed' && (
            <button type="button" onClick={() => setOpen(false)}>
              {text.cancel()}
            </button>
          )}
        </span>
      )}
    </span>
  );
}
