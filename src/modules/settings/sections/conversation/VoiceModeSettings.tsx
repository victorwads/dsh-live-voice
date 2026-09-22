import React from 'react';
import { useLanguage } from '../../../../app/client/i18n/index.js';
import { SelectField } from '../../../../shared/design-system/index.js';
export function VoiceModeSettings({
  settings,
  updateSettings,
}: {
  settings: any;
  updateSettings(value: any): void;
}) {
  const { scoped: recognition } = useLanguage((ctx) => ctx.recognition);
  const mode = settings.mode || 'speaker';
  return (
    <>
      <SelectField
        label={(recognition as any).mode.label()}
        value={mode}
        options={[
          { value: 'speaker', label: (recognition as any).speakerMode.label() },
          { value: 'headphones', label: (recognition as any).headphoneMode.label() },
        ]}
        onChange={(event) => updateSettings({ mode: event.target.value })}
      />
      <p className="dlv-setting-description">
        {mode === 'headphones'
          ? (recognition as any).headphoneMode.help()
          : (recognition as any).speakerMode.help()}
      </p>
    </>
  );
}
