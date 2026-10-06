import React from 'react';
export function StatusBadge({
  children,
  className = '',
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <span className={['dlv-status-badge', className].filter(Boolean).join(' ')}>{children}</span>
  );
}
