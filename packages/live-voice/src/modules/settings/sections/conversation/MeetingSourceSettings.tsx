import React from 'react';
import { useLanguage } from '../../../../app/client/i18n/index.js';
import { SettingsSection } from '../../../../shared/design-system/index.js';
import { DraftField } from '../../../../shared/design-system/forms/DraftField.js';

export function MeetingSourceSettings({
  settings,
  updateSettings,
}: {
  settings: any;
  updateSettings(value: any): void;
}) {
  const { scoped: language } = useLanguage((ctx) => ctx.settings);
  const { scoped: meeting } = useLanguage((ctx) => ctx.meeting);
  const names = (language as any).sourceNames;
  return (
    <SettingsSection title={(meeting as any).title()} icon="meeting" defaultOpen={false}>
      <p>{names.help()}</p>
      <DraftField
        label={names.microphone()}
        value={settings.microphoneSourceName}
        maxLength={80}
        onCommit={(microphoneSourceName) => updateSettings({ microphoneSourceName })}
      />
      <DraftField
        label={names.shared()}
        value={settings.sharedSourceName}
        maxLength={80}
        onCommit={(sharedSourceName) => updateSettings({ sharedSourceName })}
      />
    </SettingsSection>
  );
}
