import React from 'react';
import { SettingsSectionBody } from './SettingsSectionBody.js';
import { Icon, type IconName } from '../icons/index.js';
import { Hint } from '../feedback/Hint.js';

export function SettingsSection({
  title,
  children,
  icon,
  description,
  hint,
  collapsible = true,
  defaultOpen = true,
  ariaLabel,
}: React.PropsWithChildren<{
  title: string;
  icon?: IconName;
  description?: string;
  hint?: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  ariaLabel?: string;
}>) {
  const heading = (
    <h4>
      {icon && <Icon name={icon} />}
      {title}
      {(hint || description) && <Hint label={title}>{hint || description}</Hint>}
    </h4>
  );
  const body = <SettingsSectionBody>{children}</SettingsSectionBody>;
  if (!collapsible)
    return (
      <section className="dlv-settings-section">
        <header className="dlv-section-heading">{heading}</header>
        {body}
      </section>
    );
  return (
    <details className="dlv-settings-section" open={defaultOpen}>
      <summary className="dlv-section-heading" aria-label={ariaLabel}>
        {heading}
        <Icon name="chevron" className="dlv-section-chevron" />
      </summary>
      {body}
    </details>
  );
}
