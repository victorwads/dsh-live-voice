import React from 'react';
import { useLanguage } from '../../../../app/client/i18n/index.js';
import { CheckboxField } from '../../../../shared/design-system/index.js';
export function PlaybackPolicySettings({ settings, updateSettings }: any) {
  const { scoped: speak } = useLanguage((ctx) => ctx.speak);
  return (
    <>
      <CheckboxField
        label={(speak as any).autoPlayback.label()}
        hint={(speak as any).autoPlayback.help()}
        checked={settings.announceAssistantMessages !== false}
        onChange={(event) => updateSettings({ announceAssistantMessages: event.target.checked })}
      />
      <CheckboxField
        label={(speak as any).interruption.enabled()}
        hint={
          settings.interruptSpeechOnUserMessage
            ? (speak as any).interruption.enabledHelp()
            : (speak as any).interruption.disabledHelp()
        }
        checked={Boolean(settings.interruptSpeechOnUserMessage)}
        onChange={(event) => updateSettings({ interruptSpeechOnUserMessage: event.target.checked })}
      />
    </>
  );
}
