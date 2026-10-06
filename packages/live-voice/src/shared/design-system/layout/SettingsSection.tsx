import React from 'react';
export function SettingsSection({ title, children }: React.PropsWithChildren<{ title: string }>) {
  return (
    <section className="dlv-settings-section">
      <h4>{title}</h4>
      {children}
    </section>
  );
}
