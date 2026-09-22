import React from 'react';
import { useLanguage } from '../../../../app/client/i18n/index.js';
import {
  CheckboxField,
  SettingsSubcard,
  TextAreaField,
} from '../../../../shared/design-system/index.js';
const COMMANDS = [
  ['send', 'voiceCommandSend', 'send message, send it'],
  ['queue', 'voiceCommandQueue', 'queue message, queue it'],
  ['stopSpeech', 'voiceCommandEnd', 'end conversation, stop conversation'],
  ['mute', 'voiceCommandMute', 'mute microphone, stop listening'],
  ['resume', 'voiceCommandResume', 'resume listening, unmute microphone'],
  ['stopSpeech', 'voiceCommandStopSpeaking', 'stop talking, stop speaking, shut up'],
  ['clear', 'voiceCommandClear', 'clear all, clear message'],
] as const;
export function VoiceCommandSettings({ settings, updateSettings }: any) {
  const { scoped: recognition } = useLanguage((ctx) => ctx.recognition);
  const enabled = settings.voiceCommandsEnabled !== false;
  return (
    <SettingsSubcard title={(recognition as any).commands.title()}>
      <CheckboxField
        label={(recognition as any).commands.enabled()}
        checked={enabled}
        onChange={(event) => updateSettings({ voiceCommandsEnabled: event.target.checked })}
      />
      <p className="dlv-setting-description">{(recognition as any).voiceCommands.help()}</p>
      {COMMANDS.map(([label, key, fallback]) => (
        <TextAreaField
          key={key}
          rows={2}
          maxLength={1000}
          label={(recognition as any).commands[label]()}
          value={settings[key] || fallback}
          disabled={!enabled}
          onChange={(event) => updateSettings({ [key]: event.target.value })}
        />
      ))}
    </SettingsSubcard>
  );
}
