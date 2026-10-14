import React from 'react';
import { useLanguage } from '../../../../app/client/i18n/index.js';
import { defaultSettings, recordingBitrateOptions } from '../../../core/settings.js';
import {
  CheckboxField,
  NumberField,
  SelectField,
  SettingsSection,
  StatusMessage,
} from '../../../../shared/design-system/index.js';

type RecordingSettingsProps = {
  settings: ReturnType<typeof import('../../../core/settings.js').normalizeSettings>;
  updateSettings: (patch: Partial<RecordingSettingsProps['settings']>) => void;
};

export function RecordingSettings({ settings, updateSettings }: RecordingSettingsProps) {
  const { scoped } = useLanguage((ctx) => ctx.recording);
  const recording = scoped as any;
  const unsupported = settings.recognitionEngine === 'browser';
  const disabled = unsupported || !settings.recordingEnabled;
  const paddingFields = [
    ['recordingPreRollMs', recording.preRoll.label()],
    ['recordingPostRollMs', recording.postRoll.label()],
  ] as const;
  return (
    <>
      {unsupported && <StatusMessage>{recording.browserUnsupported()}</StatusMessage>}
      <SettingsSection title={recording.title()} icon="mic" defaultOpen={false}>
        <CheckboxField
          label={recording.enabled.label()}
          hint={[
            recording.enabled.help(),
            recording.privacyWarning(),
            recording.durabilityWarning(),
          ].join('\n\n')}
          checked={settings.recordingEnabled === true}
          disabled={unsupported}
          onChange={(event) => updateSettings({ recordingEnabled: event.target.checked })}
        />
        <div className="dlv-field-pair">
          <NumberField
            label={recording.keepPrevious.label()}
            hint={recording.keepPrevious.help()}
            min={1}
            max={100}
            step={1}
            value={settings.recordingKeepPrevious ?? defaultSettings.recordingKeepPrevious}
            disabled={disabled}
            onCommit={(raw) => {
              const value = Number(raw);
              if (Number.isInteger(value) && value >= 1 && value <= 100)
                updateSettings({ recordingKeepPrevious: value });
            }}
          />
          <SelectField
            label={recording.bitrate.label()}
            hint={recording.bitrate.help()}
            value={String(settings.recordingBitrate ?? defaultSettings.recordingBitrate)}
            disabled={disabled}
            options={recordingBitrateOptions.map((value) => ({
              value: String(value),
              label: recording.bitrate.option({ bitrate: value / 1000 }),
            }))}
            onChange={(event) => updateSettings({ recordingBitrate: Number(event.target.value) })}
          />
        </div>
        <div className="dlv-field-pair">
          {paddingFields.map(([key, label]) => (
            <NumberField
              key={key}
              label={label}
              hint={recording.paddingHelp()}
              min={0}
              max={2000}
              step={1}
              value={settings[key] ?? defaultSettings[key]}
              disabled={disabled}
              onCommit={(raw) => {
                const value = Number(raw);
                if (Number.isInteger(value) && value >= 0 && value <= 2000)
                  updateSettings({ [key]: value });
              }}
            />
          ))}
        </div>
      </SettingsSection>
    </>
  );
}
