import React from 'react';
import { PhraseField } from '../../../../shared/design-system/forms/PhraseField.js';
import { useLanguage } from '../../../../app/client/i18n/index.js';
import { CheckboxField, SettingsSection } from '../../../../shared/design-system/index.js';
const COMMANDS = [
  ['send', 'voiceCommandSend', 'send message, send it'],
  ['queue', 'voiceCommandQueue', 'queue message, queue it'],
  ['end', 'voiceCommandEnd', 'end conversation, stop conversation'],
  ['mute', 'voiceCommandMute', 'mute microphone, stop listening'],
  ['resume', 'voiceCommandResume', 'resume listening, unmute microphone'],
  ['stopSpeech', 'voiceCommandStopSpeaking', 'stop talking, stop speaking, shut up'],
  ['clear', 'voiceCommandClear', 'clear all, clear message'],
] as const;
export function VoiceCommandSettings({ settings, updateSettings }: any) {
  const { scoped: recognition } = useLanguage((ctx) => ctx.recognition);
  const enabled = settings.voiceCommandsEnabled !== false;
  return (
    <SettingsSection
      title={(recognition as any).commands.title()}
      icon="commands"
      defaultOpen={false}
    >
      <CheckboxField
        label={(recognition as any).commands.enabled()}
        hint={(recognition as any).voiceCommands.help()}
        checked={enabled}
        onChange={(event) => updateSettings({ voiceCommandsEnabled: event.target.checked })}
      />
      {COMMANDS.map(([label, key, fallback]) => (
        <PhraseField
          key={key}
          addLabel={(recognition as any).commands.addPhrase()}
          removeLabel={(recognition as any).commands.removePhrase()}
          label={(recognition as any).commands[label]()}
          value={settings[key] ?? fallback}
          disabled={!enabled}
          onCommit={(value) => updateSettings({ [key]: value })}
        />
      ))}
    </SettingsSection>
  );
}
