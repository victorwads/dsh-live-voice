import React from 'react';
import { useLanguage } from '../../../../app/client/i18n/index.js';
import { ShortcutField } from '../../../../shared/design-system/index.js';

export function ShortcutSettings({
  settings,
  updateSettings,
}: {
  settings: any;
  updateSettings(value: any): void;
}) {
  const { scoped: recognition } = useLanguage((ctx) => ctx.recognition);
  const { scoped: language } = useLanguage((ctx) => ctx.settings);
  const copy = (language as any).shortcuts;
  const rows = [
    ['holdToTalkShortcut', (recognition as any).holdToTalk.enabled()],
    ['microphoneShortcut', copy.microphone()],
    ['meetingShortcut', copy.meeting()],
    ['assistantSpeechShortcut', copy.assistantSpeech()],
  ];
  return (
    <>
      {rows.map(([key, label]) => (
        <ShortcutField
          key={key}
          label={label}
          value={settings[key] || ''}
          {...(key === 'holdToTalkShortcut'
            ? {
                checked: settings.holdToTalkEnabled === true,
                onCheckedChange: (holdToTalkEnabled: boolean) =>
                  updateSettings({ holdToTalkEnabled }),
              }
            : {})}
          recordLabel={copy.record()}
          editLabel={copy.edit()}
          recordingLabel={copy.recording()}
          clearLabel={copy.clear()}
          validate={(value) =>
            rows.some(([other]) => other !== key && settings[other] === value)
              ? copy.conflict()
              : undefined
          }
          onChange={(value) => updateSettings({ [key]: value })}
        />
      ))}
    </>
  );
}
