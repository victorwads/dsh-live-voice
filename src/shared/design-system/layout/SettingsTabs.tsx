import React from 'react';

export type SettingsTab = { id: string; label: string };
export type SettingsTabsProps = {
  label: string;
  tabs: readonly SettingsTab[];
  active: string;
  idPrefix: string;
  onChange(id: string): void;
};

export function SettingsTabs({ label, tabs, active, idPrefix, onChange }: SettingsTabsProps) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const activate = (index: number) => {
    const tab = tabs[index];
    if (!tab) return;
    onChange(tab.id);
    refs.current[index]?.focus();
  };
  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    let next: number | undefined;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    activate(next);
  };
  return (
    <div className="dlv-settings-tabs" role="tablist" aria-label={label}>
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          ref={(node) => {
            refs.current[index] = node;
          }}
          id={idPrefix + '-tab-' + tab.id}
          type="button"
          role="tab"
          className="dlv-settings-tab"
          aria-selected={active === tab.id}
          aria-controls={idPrefix + '-panel-' + tab.id}
          data-active={active === tab.id ? 'true' : undefined}
          tabIndex={active === tab.id ? 0 : -1}
          onClick={() => onChange(tab.id)}
          onKeyDown={(event) => onKeyDown(event, index)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
