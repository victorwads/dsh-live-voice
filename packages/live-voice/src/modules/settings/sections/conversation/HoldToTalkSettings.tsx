import React from 'react';
import { useLanguage } from '../../../../app/client/i18n/index.js';
import { CheckboxField } from '../../../../shared/design-system/index.js';
export function HoldToTalkSettings({
  settings,
  updateSettings,
}: {
  settings: any;
  updateSettings(value: any): void;
}) {
  const { scoped: recognition } = useLanguage((ctx) => ctx.recognition);
  return (
    <CheckboxField
      label={(recognition as any).holdToTalk.enabled()}
      description={(recognition as any).holdToTalk.help()}
      checked={settings.holdToTalkEnabled !== false}
      onChange={(event) => updateSettings({ holdToTalkEnabled: event.target.checked })}
    />
  );
}
