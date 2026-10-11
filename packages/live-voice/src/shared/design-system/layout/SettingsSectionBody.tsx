import React from 'react';

/** Shared content inset keeps fields subordinate to their section heading. */
export function SettingsSectionBody({ children }: React.PropsWithChildren) {
  return <div className="dlv-section-content">{children}</div>;
}
