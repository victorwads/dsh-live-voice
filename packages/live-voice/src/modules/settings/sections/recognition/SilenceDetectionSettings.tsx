import React from 'react';
import { sileroVadAvailable } from '../../../recognition/vad/assets.js';
import { useLanguage } from '../../../../app/client/i18n/index.js';
import {
  defaultSettings,
  customSilenceMinMs,
  customSilenceMaxMs,
  usesPluginVoiceDetection,
  voiceDetectionPresets,
  voiceDetectionSilenceMs,
  normalizeCustomSilenceMs,
} from '../../../core/settings.js';
import {
  NumberField,
  SelectField,
  SettingsSubcard,
} from '../../../../shared/design-system/index.js';
export function SilenceDetectionSettings({ settings, updateSettings }: any) {
  const { scoped: recognition } = useLanguage((ctx) => ctx.recognition);
  const [sileroAvailable, setSileroAvailable] = React.useState(false);
  React.useEffect(() => {
    let current = true;
    void sileroVadAvailable().then((available) => {
      if (current) setSileroAvailable(available);
    });
    return () => {
      current = false;
    };
  }, []);
  const savedCustomMs = normalizeCustomSilenceMs(settings.voiceDetectionCustomSilenceMs);
  if (!usesPluginVoiceDetection(settings.recognitionEngine)) return null;
  const selected = settings.voiceDetectionPreset || defaultSettings.voiceDetectionPreset;
  return (
    <SettingsSubcard
      title={(recognition as any).silenceDetection.label()}
      ariaLabel={(recognition as any).silenceDetection.title()}
      icon="pause"
    >
      <p>{(recognition as any).silenceDetection.help()}</p>
      <SelectField
        label={(recognition as any).silenceDetection.detector.label()}
        value={settings.voiceDetectionEngine === 'silero' ? 'silero' : 'energy'}
        options={[
          { value: 'energy', label: (recognition as any).silenceDetection.detector.energy() },
          {
            value: 'silero',
            label: (recognition as any).silenceDetection.detector.silero(),
            disabled: !sileroAvailable,
          },
        ]}
        onChange={(event) => updateSettings({ voiceDetectionEngine: event.target.value })}
      />
      <NumberField
        label={(recognition as any).maxUtterance.label()}
        min={10}
        max={300}
        step={1}
        value={settings.recognitionMaxUtteranceSeconds ?? 60}
        onCommit={(raw) => {
          const value = Number(raw);
          if (Number.isInteger(value) && value >= 10 && value <= 300)
            updateSettings({ recognitionMaxUtteranceSeconds: value });
        }}
      />
      <small>{(recognition as any).maxUtterance.help()}</small>
      <div
        className="dlv-preset-group"
        role="radiogroup"
        aria-label={(recognition as any).silenceDetection.pauseLabel()}
      >
        {[...Object.keys(voiceDetectionPresets), 'custom'].map((value) => (
          <label key={value} className="dlv-preset">
            <input
              type="radio"
              name="dlv-vad-preset"
              value={value}
              checked={selected === value}
              onChange={() => updateSettings({ voiceDetectionPreset: value })}
            />
            <span>
              <strong>{(recognition as any).presets[value].label()}</strong>
              <small>{(recognition as any).presets[value].description()}</small>
            </span>
          </label>
        ))}
      </div>
      {selected === 'custom' && (
        <>
          <NumberField
            label={(recognition as any).silenceDetection.customLabel()}
            min={customSilenceMinMs}
            max={customSilenceMaxMs}
            step={1}
            value={savedCustomMs}
            onCommit={(draft) => {
              const value = Number(draft);
              if (
                draft.trim() &&
                Number.isInteger(value) &&
                value >= customSilenceMinMs &&
                value <= customSilenceMaxMs
              )
                updateSettings({ voiceDetectionCustomSilenceMs: value });
            }}
          />
          <small>{(recognition as any).silenceDetection.customHelp()}</small>
        </>
      )}
      <p className="dlv-vad-summary">
        {(recognition as any).silenceDetection.duration({
          milliseconds: voiceDetectionSilenceMs(settings),
        })}
      </p>
    </SettingsSubcard>
  );
}
