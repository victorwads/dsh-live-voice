import React from 'react';
export function SettingsSubcard({
  title,
  children,
  open = false,
  ariaLabel,
}: React.PropsWithChildren<{ title: string; open?: boolean; ariaLabel?: string }>) {
  return (
    <details className="dlv-settings-subcard" open={open} aria-label={ariaLabel}>
      <summary>{title}</summary>
      <div className="dlv-settings-subcard-body">{children}</div>
    </details>
  );
}
