import React from 'react';
export function SettingsCard({
  children,
  className = '',
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className={['dlv-settings-card', className].filter(Boolean).join(' ')}>{children}</div>
  );
}
