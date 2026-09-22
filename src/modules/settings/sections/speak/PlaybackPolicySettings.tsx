import React from 'react';
import { useLanguage } from '../../../../app/client/i18n/index.js';
import { CheckboxField } from '../../../../shared/design-system/index.js';
export function PlaybackPolicySettings({ settings, updateSettings }: any) {
  const { scoped: speak } = useLanguage((ctx) => ctx.speak);
  return (
    <>
      <CheckboxField
        label={(speak as any).autoPlayback.label()}
        checked={settings.announceAssistantMessages !== false}
        onChange={(event) => updateSettings({ announceAssistantMessages: event.target.checked })}
      />
      <p>{(speak as any).autoPlayback.help()}</p>
      <CheckboxField
        label={(speak as any).interruption.enabled()}
        checked={Boolean(settings.interruptSpeechOnUserMessage)}
        onChange={(event) => updateSettings({ interruptSpeechOnUserMessage: event.target.checked })}
      />
      <p>
        {settings.interruptSpeechOnUserMessage
          ? (speak as any).interruption.enabledHelp()
          : (speak as any).interruption.disabledHelp()}
      </p>
    </>
  );
}
