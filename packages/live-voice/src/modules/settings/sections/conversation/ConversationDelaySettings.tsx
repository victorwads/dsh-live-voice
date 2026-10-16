import React from 'react';
import { useLanguage } from '../../../../app/client/i18n/index.js';
import { SelectField } from '../../../../shared/design-system/index.js';
import { assistantSpeechDelayOptions, defaultSettings } from '../../../core/settings.js';
export function ConversationDelaySettings({ settings, updateSettings }: any) {
  const { scoped: commons } = useLanguage((ctx) => ctx.commons);
  const { scoped: speak } = useLanguage((ctx) => ctx.speak);
  return (
    <>
      <SelectField
        label={(speak as any).responseDelay.label()}
        hint={(speak as any).responseDelay.help()}
        value={String(
          settings.assistantSpeechDelaySeconds ?? defaultSettings.assistantSpeechDelaySeconds,
        )}
        options={assistantSpeechDelayOptions.map((seconds) => ({
          value: String(seconds),
          label:
            seconds < 1
              ? (commons as any).milliseconds({ milliseconds: seconds * 1000 })
              : seconds === 1.5
                ? (speak as any).responseDelay.oneAndHalf()
                : (commons as any).seconds({ seconds }),
        }))}
        onChange={(event) =>
          updateSettings({ assistantSpeechDelaySeconds: Number(event.target.value) })
        }
      />
    </>
  );
}
