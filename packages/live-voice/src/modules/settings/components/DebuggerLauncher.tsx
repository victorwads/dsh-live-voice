import React from 'react';
import { useLanguage } from '../../../app/client/i18n/index.js';
import { Icon } from '../../../shared/design-system/index.js';
import {
  readDeveloperExtension,
  subscribeDeveloperExtension,
} from '../../core/developerExtension.js';
import type { DebuggerInstall, DebuggerInstallSnapshot } from '../services/debuggerInstall.js';

const unavailable: DebuggerInstallSnapshot = {
  phase: 'failed',
  version: '',
  problem: 'unavailable',
};
const noSubscribe = () => () => {};
const unavailableSnapshot = () => unavailable;

export function DebuggerLauncher({ installer }: { installer?: DebuggerInstall }) {
  const { scoped } = useLanguage((ctx) => ctx.debugger);
  const text = scoped as any;
  const developer = React.useSyncExternalStore(
    subscribeDeveloperExtension,
    readDeveloperExtension,
    () => null,
  );
  const state = React.useSyncExternalStore(
    installer?.subscribe ?? noSubscribe,
    installer?.getSnapshot ?? unavailableSnapshot,
    installer?.getSnapshot ?? unavailableSnapshot,
  );
  const [open, setOpen] = React.useState(false);
  const dialog = React.useRef<HTMLDialogElement>(null);
  const launcher = React.useRef<HTMLDivElement>(null);
  const closeButton = React.useRef<HTMLButtonElement>(null);
  const titleId = React.useId();
  const descriptionId = React.useId();
  const confirmationId = React.useId();
  const busy = state.phase === 'checking' || state.phase === 'installing';
  const Developer = developer?.component;
  const close = () => {
    installer?.cancel(); // Only cancels an unsubmitted confirmation, never the operation.
    dialog.current?.close(); // Remove modal inertness before returning focus to the launcher.
    setOpen(false);
    launcher.current?.querySelector('button')?.focus();
  };
  React.useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    else if (!open && element.open) element.close();
    return () => {
      if (element.open) element.close();
    };
  }, [open]);
  React.useEffect(() => {
    if (open && Developer) closeButton.current?.focus();
  }, [open, Developer]);
  return (
    <div ref={launcher} className="dlv-diagnostics-launcher">
      {Developer ? (
        <Developer />
      ) : (
        <button
          type="button"
          className="dlv-diagnostics-button"
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
        >
          <Icon name="bug" />
          {text.label()}
        </button>
      )}
      <style>
        {
          '.dlv-debugger-dialog{box-sizing:border-box;max-width:min(520px,calc(100vw - 32px));max-height:calc(100vh - 32px);overflow:auto;padding:22px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit}.dlv-debugger-dialog::backdrop{background:#0007}.dlv-debugger-dialog h3{margin:0 0 14px}.dlv-debugger-dialog p{margin:12px 0;font-size:13px;line-height:1.6}.dlv-debugger-dialog .dlv-settings-actions{margin-top:18px}.dlv-debugger-dialog button:focus-visible{outline:2px solid currentColor;outline-offset:3px}'
        }
      </style>
      <dialog
        ref={dialog}
        className="dlv-debugger-dialog"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
      >
        <h3 id={titleId}>{text.title()}</h3>
        <p id={descriptionId}>{text.description()}</p>
        {Developer ? (
          <p role="status">{text.ready()}</p>
        ) : (
          <>
            {state.phase === 'confirm' && (
              <p id={confirmationId}>{text.confirm({ version: state.version })}</p>
            )}
            {open && (busy || state.problem || state.phase === 'restart' || state.phase === 'applied') && (
              <p role={state.problem ? 'alert' : 'status'}>
                {state.problem
                  ? text[state.problem]()
                  : busy
                    ? text.installing()
                    : state.phase === 'restart'
                      ? text.restart({ version: state.version })
                      : text.applied({ version: state.version })}
              </p>
            )}
          </>
        )}
        <div className="dlv-settings-actions">
          {!Developer && installer && state.phase === 'confirm' && (
            <button
              type="button"
              aria-describedby={confirmationId}
              onClick={() => void installer.confirm()}
            >
              {text.installNow()}
            </button>
          )}
          {!Developer && installer && ['idle', 'failed'].includes(state.phase) && (
            <button type="button" onClick={() => void installer.prepare()}>
              {text.installNow()}
            </button>
          )}
          <button ref={closeButton} type="button" onClick={close}>
            {text.close()}
          </button>
        </div>
      </dialog>
    </div>
  );
}
