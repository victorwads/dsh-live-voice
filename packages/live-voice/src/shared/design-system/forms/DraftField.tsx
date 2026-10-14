import React from 'react';
import { Hint } from '../feedback/Hint.js';

type Element = HTMLInputElement | HTMLTextAreaElement;
export type DraftFieldProps = {
  label: string;
  hint?: string;
  value?: string | number | readonly string[];
  defaultValue?: string | number | readonly string[];
  onCommit?: (value: string) => void;
  multiline?: boolean;
} & Omit<
  React.InputHTMLAttributes<HTMLInputElement> & React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  'value' | 'defaultValue'
>;

/** Keep raw edits local; parent normalization and persistence run only on blur. */
export function DraftField({
  label,
  hint,
  value,
  defaultValue,
  onCommit,
  multiline,
  onInput,
  onChange,
  onFocus,
  onBlur,
  ...props
}: DraftFieldProps) {
  const generatedId = React.useId();
  const fieldId = props.id || generatedId;
  const saved = String(value ?? defaultValue ?? '');
  const [draft, setDraft] = React.useState(saved);
  const editing = React.useRef(false);
  const dirty = React.useRef(false);
  React.useEffect(() => {
    if (!editing.current) setDraft(saved);
  }, [saved]);
  const inputProps = {
    ...props,
    ...(hint ? { id: fieldId } : {}),
    value: draft,
    onFocus: (event: React.FocusEvent<Element>) => {
      editing.current = true;
      onFocus?.(event as never);
    },
    onInput: (event: React.FormEvent<Element>) => {
      editing.current = true;
      dirty.current = true;
      setDraft(event.currentTarget.value);
      onInput?.(event as never);
    },
    onChange: (event: React.ChangeEvent<Element>) => {
      editing.current = true;
      dirty.current = true;
      setDraft(event.currentTarget.value);
      onChange?.(event as never);
    },
    onBlur: (event: React.FocusEvent<Element>) => {
      editing.current = false;
      const raw = event.currentTarget.value;
      const changed = dirty.current;
      dirty.current = false;
      // Restore the canonical value until the committed value arrives from the parent.
      setDraft(saved);
      const valid =
        multiline ||
        props.type !== 'number' ||
        (raw.trim() !== '' && (event.currentTarget as HTMLInputElement).validity.valid);
      if (changed && valid) onCommit?.(raw);
      onBlur?.(event as never);
    },
  };
  if (hint)
    return (
      <div className="dlv-form-field">
        <div className="dlv-field-label">
          <label htmlFor={fieldId}>{label}</label>
          <Hint label={label}>{hint}</Hint>
        </div>
        {multiline ? (
          <textarea {...(inputProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>)} />
        ) : (
          <input {...(inputProps as React.InputHTMLAttributes<HTMLInputElement>)} />
        )}
      </div>
    );
  return (
    <label>
      {label}
      {multiline ? (
        <textarea {...(inputProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>)} />
      ) : (
        <input {...(inputProps as React.InputHTMLAttributes<HTMLInputElement>)} />
      )}
    </label>
  );
}
