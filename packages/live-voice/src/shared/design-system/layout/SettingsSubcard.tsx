import React from 'react';
import { Icon, type IconName } from '../icons/index.js';

export function SettingsSubcard({
  title,
  children,
  open = false,
  ariaLabel,
  icon = 'settings',
}: React.PropsWithChildren<{
  title: string;
  open?: boolean;
  ariaLabel?: string;
  icon?: IconName;
}>) {
  return (
    <details className="dlv-settings-subcard" open={open}>
      <summary aria-label={ariaLabel}>
        <Icon name={icon} className="dlv-settings-subcard-icon" />
        <span>{title}</span>
        <Icon name="chevron" className="dlv-settings-subcard-chevron" />
      </summary>
      <div className="dlv-settings-subcard-body">{children}</div>
    </details>
  );
}
