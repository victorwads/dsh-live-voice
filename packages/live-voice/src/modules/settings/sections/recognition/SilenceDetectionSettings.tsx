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
  SettingsSection,
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
    <SettingsSection
      title={(recognition as any).silenceDetection.label()}
      ariaLabel={(recognition as any).silenceDetection.title()}
      icon="pause"
      defaultOpen={false}
    >
      <div className="dlv-field-pair">
        <SelectField
          label={(recognition as any).silenceDetection.detector.label()}
          hint={(recognition as any).silenceDetection.help()}
          value={
            settings.voiceDetectionEngine === 'energy'
              ? 'energy'
              : defaultSettings.voiceDetectionEngine
          }
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
          label={(recognition as any).silenceDetection.threshold.label()}
          hint={(recognition as any).silenceDetection.threshold.help()}
          min={0.05}
          max={0.95}
          step={0.01}
          value={settings.voiceDetectionThreshold ?? defaultSettings.voiceDetectionThreshold}
          onCommit={(raw) => {
            const value = Number(raw);
            if (Number.isFinite(value) && value >= 0.05 && value <= 0.95)
              updateSettings({ voiceDetectionThreshold: value });
          }}
        />
      </div>
      <div className="dlv-field-pair">
        <NumberField
          label={(recognition as any).silenceDetection.minimumSpeech.label()}
          hint={(recognition as any).silenceDetection.minimumSpeech.help()}
          min={50}
          max={2000}
          step={1}
          value={
            settings.voiceDetectionMinimumSpeechMs ?? defaultSettings.voiceDetectionMinimumSpeechMs
          }
          onCommit={(raw) => {
            const value = Number(raw);
            if (Number.isInteger(value) && value >= 50 && value <= 2000)
              updateSettings({ voiceDetectionMinimumSpeechMs: value });
          }}
        />
        <NumberField
          label={(recognition as any).maxUtterance.label()}
          hint={(recognition as any).maxUtterance.help()}
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
      </div>
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
            hint={(recognition as any).silenceDetection.customHelp()}
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
        </>
      )}
      <p className="dlv-vad-summary">
        {(recognition as any).silenceDetection.duration({
          milliseconds: voiceDetectionSilenceMs(settings),
        })}
      </p>
    </SettingsSection>
  );
}
