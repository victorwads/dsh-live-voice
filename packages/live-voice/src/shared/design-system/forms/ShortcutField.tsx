import React from 'react';
import { formatShortcut, shortcutFromEvent } from './keyboardShortcut.js';

export type ShortcutFieldProps = {
  label: string;
  value: string;
  onChange(value: string): void;
  recordLabel: string;
  editLabel: string;
  recordingLabel: string;
  clearLabel: string;
  checked?: boolean;
  onCheckedChange?(checked: boolean): void;
  validate?(value: string): string | undefined;
};

/** Records one chord on release, including modifier-only chords. Persistence belongs to the caller. */
export function ShortcutField({
  label,
  value,
  onChange,
  recordLabel,
  editLabel,
  recordingLabel,
  clearLabel,
  checked,
  onCheckedChange,
  validate,
}: ShortcutFieldProps) {
  const id = React.useId();
  const [recording, setRecording] = React.useState(false);
  const [draft, setDraft] = React.useState('');
  const [error, setError] = React.useState('');
  const pending = React.useRef('');
  React.useEffect(() => {
    if (!recording) return;
    const cancel = () => {
      pending.current = '';
      setDraft('');
      setError('');
      setRecording(false);
    };
    window.addEventListener('blur', cancel);
    return () => window.removeEventListener('blur', cancel);
  }, [recording]);
  const reset = () => {
    pending.current = '';
    setDraft('');
    setError('');
    setRecording(false);
  };
  return (
    <div className="dlv-shortcut-field">
      <div className="dlv-field-label">
        <label
          htmlFor={onCheckedChange ? id + '-enabled' : id}
          className={onCheckedChange ? 'dlv-check' : undefined}
        >
          {onCheckedChange && (
            <input
              id={id + '-enabled'}
              type="checkbox"
              checked={checked}
              onChange={(event) => onCheckedChange(event.target.checked)}
            />
          )}
          {label}
        </label>
      </div>
      <div className="dlv-shortcut-controls">
        <button
          id={id}
          type="button"
          className="dlv-shortcut-record"
          data-recording={recording}
          aria-label={
            label +
            ' — ' +
            (recording
              ? recordingLabel
              : value
                ? formatShortcut(value) + ' — ' + editLabel
                : recordLabel)
          }
          aria-describedby={error ? id + '-status' : undefined}
          onClick={(event) => {
            // Safari on macOS does not focus buttons on pointer activation.
            event.currentTarget.focus();
            reset();
            setRecording(true);
          }}
          onBlur={reset}
          onKeyDown={(event) => {
            if (!recording) return;
            event.stopPropagation();
            if (event.key === 'Tab') {
              reset();
              return;
            }
            event.preventDefault();
            if (event.key === 'Escape') {
              reset();
              return;
            }
            if (event.repeat || event.nativeEvent.isComposing) return;
            const next = shortcutFromEvent(event.nativeEvent);
            if (next) {
              pending.current = next;
              setDraft(next);
              setError('');
            }
          }}
          onKeyUp={(event) => {
            if (!recording) return;
            event.preventDefault();
            event.stopPropagation();
            const next = pending.current;
            if (!next) return;
            const reason = validate?.(next);
            if (reason) {
              pending.current = '';
              setDraft('');
              setError(reason);
              return;
            }
            reset();
            onChange(next);
          }}
        >
          {recording ? (
            draft ? (
              <kbd>{formatShortcut(draft)}</kbd>
            ) : (
              recordingLabel
            )
          ) : value ? (
            <kbd>{formatShortcut(value)}</kbd>
          ) : (
            recordLabel
          )}
        </button>
        <button
          type="button"
          className="dlv-shortcut-clear"
          disabled={!value || recording}
          aria-label={label + ' — ' + clearLabel}
          onClick={() => onChange('')}
        >
          {clearLabel}
        </button>
      </div>
      {error && (
        <small id={id + '-status'} role="status">
          {error}
        </small>
      )}
    </div>
  );
}
