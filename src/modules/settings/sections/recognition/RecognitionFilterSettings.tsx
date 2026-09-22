import React from 'react';
import { useLanguage } from '../../../../app/client/i18n/index.js';
import {
  CheckboxField,
  NumberField,
  SettingsSubcard,
} from '../../../../shared/design-system/index.js';
export function RecognitionFilterSettings({ settings, updateSettings }: any) {
  const { scoped: recognition } = useLanguage((ctx) => ctx.recognition);
  const enabled = settings.recognitionFilterEnabled !== false;
  return (
    <SettingsSubcard title={(recognition as any).minimumWords.label()}>
      <CheckboxField
        label={(recognition as any).minimumWords.enabled()}
        description={(recognition as any).minimumWords.help()}
        checked={enabled}
        onChange={(event) => updateSettings({ recognitionFilterEnabled: event.target.checked })}
      />
      <NumberField
        label={(recognition as any).minimumWords.label()}
        min={1}
        max={20}
        value={settings.recognitionMinimumWords ?? 2}
        disabled={!enabled}
        onChange={(event) => {
          const value = Number(event.target.value);
          if (Number.isInteger(value) && value >= 1 && value <= 20)
            updateSettings({ recognitionMinimumWords: value });
        }}
      />
    </SettingsSubcard>
  );
}
