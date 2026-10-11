import React from 'react';

/** Phrase tokens retain their raw draft until an explicit delimiter or blur commit. */
export function PhraseField({
  label,
  value,
  disabled,
  onCommit,
  addLabel,
  removeLabel,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onCommit(value: string): void;
  addLabel: string;
  removeLabel: string;
}) {
  const id = React.useId();
  const [draft, setDraft] = React.useState('');
  const [phrases, setPhrases] = React.useState(() =>
    value
      .split(/[,\r\n]+/)
      .map((s) => s.trim())
      .filter(Boolean),
  );
  const editing = React.useRef(false);
  React.useEffect(() => {
    if (!editing.current)
      setPhrases(
        value
          .split(/[,\r\n]+/)
          .map((s) => s.trim())
          .filter(Boolean),
      );
  }, [value]);
  const commit = (raw = draft) => {
    const additions = raw
      .split(/[,\r\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!additions.length) {
      setDraft('');
      return;
    }
    const next = [...phrases, ...additions];
    if (next.join(', ').length > 1000) return;
    setPhrases(next);
    setDraft('');
    onCommit(next.join(', '));
  };
  return (
    <div className="dlv-phrase-field">
      <label id={id} htmlFor={id + '-input'}>
        {label}
      </label>
      <div className="dlv-phrase-box" aria-disabled={disabled}>
        {phrases.map((phrase, index) => (
          <span className="dlv-phrase" key={index}>
            <span>{phrase}</span>
            <button
              type="button"
              disabled={disabled}
              aria-label={removeLabel + ': ' + phrase}
              onClick={() => {
                const next = phrases.filter((_, i) => i !== index);
                setPhrases(next);
                onCommit(next.join(', '));
              }}
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={id + '-input'}
          aria-labelledby={id}
          placeholder={addLabel}
          value={draft}
          disabled={disabled}
          maxLength={1000}
          onFocus={() => {
            editing.current = true;
          }}
          onInput={(e) => setDraft(e.currentTarget.value)}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            editing.current = false;
            commit();
          }}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return;
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              commit();
            }
            if (e.key === 'Escape') {
              e.preventDefault();
              e.stopPropagation();
              setDraft('');
            }
          }}
        />
      </div>
    </div>
  );
}
