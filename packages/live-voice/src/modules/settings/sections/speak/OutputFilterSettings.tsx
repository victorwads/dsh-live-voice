import React from 'react';
import { useLanguage } from '../../../../app/client/i18n/index.js';
import {
  CheckboxField,
  NumberField,
  SettingsSubcard,
  TextField,
} from '../../../../shared/design-system/index.js';
export function OutputFilterSettings({ settings, updateSettings }: any) {
  const { scoped: speak } = useLanguage((ctx) => ctx.speak);
  const enabled = settings.outputCodeFilterEnabled !== false;
  return (
    <SettingsSubcard title={(speak as any).filters.code.enabled()} icon="filter">
      <CheckboxField
        label={(speak as any).filters.code.enabled()}
        checked={enabled}
        onChange={(event) => updateSettings({ outputCodeFilterEnabled: event.target.checked })}
      />
      <NumberField
        label={(speak as any).filters.code.maxLines()}
        min={0}
        max={100}
        value={settings.outputCodeMaxLines ?? 5}
        disabled={!enabled}
        onCommit={(raw) => {
          const value = Number(raw);
          if (Number.isInteger(value) && value >= 0 && value <= 100)
            updateSettings({ outputCodeMaxLines: value });
        }}
      />
      <TextField
        label={(speak as any).filters.code.replacement()}
        value={settings.outputCodeNotice ?? (speak as any).filters.code.notice()}
        disabled={!enabled}
        onCommit={(value) => updateSettings({ outputCodeNotice: value })}
      />
    </SettingsSubcard>
  );
}
