import React from 'react';

export type ErrorMessageProps = {
  error?: unknown;
  dismissLabel: string;
  dismissText?: string;
  onDismiss?(): void;
};

export function ErrorMessage({
  error,
  dismissLabel,
  dismissText = '×',
  onDismiss,
}: ErrorMessageProps) {
  if (!error) return null;
  return (
    <div className="dlv-error" role="alert">
      {String(error)}
      {onDismiss ? (
        <button type="button" aria-label={dismissLabel} onClick={onDismiss}>
          {dismissText}
        </button>
      ) : null}
    </div>
  );
}
