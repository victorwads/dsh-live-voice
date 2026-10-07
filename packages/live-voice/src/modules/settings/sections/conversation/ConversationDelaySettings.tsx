import React from 'react';
import { useLanguage } from '../../../../app/client/i18n/index.js';
import { SelectField } from '../../../../shared/design-system/index.js';
const DELAYS = [0, 1, 2, 3, 4];
export function ConversationDelaySettings({ settings, updateSettings }: any) {
  const { scoped: commons } = useLanguage((ctx) => ctx.commons);
  const { scoped: speak } = useLanguage((ctx) => ctx.speak);
  return (
    <>
      <SelectField
        label={(speak as any).responseDelay.label()}
        value={String(settings.assistantSpeechDelaySeconds ?? 0)}
        options={DELAYS.map((seconds) => ({
          value: String(seconds),
          label:
            seconds === 0
              ? (speak as any).responseDelay.none()
              : seconds === 1
                ? (commons as any).second()
                : (commons as any).seconds({ seconds }),
        }))}
        onChange={(event) =>
          updateSettings({ assistantSpeechDelaySeconds: Number(event.target.value) })
        }
      />
      <p className="dlv-setting-description">{(speak as any).responseDelay.help()}</p>
    </>
  );
}
