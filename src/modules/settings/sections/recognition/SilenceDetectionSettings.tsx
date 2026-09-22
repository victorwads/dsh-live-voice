import React from 'react';
import { useLanguage } from '../../../../app/client/i18n/index.js';
import { usesPluginVoiceDetection, voiceDetectionPresets } from '../../../core/settings.js';
import { NumberField, SettingsSubcard } from '../../../../shared/design-system/index.js';
export function SilenceDetectionSettings({ settings, updateSettings }: any) {
  const { scoped: recognition } = useLanguage((ctx) => ctx.recognition);
  if (!usesPluginVoiceDetection(settings.recognitionEngine)) return null;
  const selected = settings.voiceDetectionPreset || 'natural';
  return (
    <SettingsSubcard
      title={(recognition as any).silenceDetection.label()}
      ariaLabel={(recognition as any).silenceDetection.title()}
      open
    >
      <p>{(recognition as any).silenceDetection.help()}</p>
      <NumberField
        label={(recognition as any).maxUtterance.label()}
        min={10}
        max={300}
        step={1}
        value={settings.recognitionMaxUtteranceSeconds ?? 60}
        onChange={(event) => {
          const value = Number(event.target.value);
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
        {Object.entries(voiceDetectionPresets).map(([value, preset]: [string, any]) => (
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
      <p className="dlv-vad-summary">
        {(recognition as any).silenceDetection.duration({
          milliseconds:
            voiceDetectionPresets[selected]?.silenceMs || voiceDetectionPresets.natural.silenceMs,
        })}
      </p>
    </SettingsSubcard>
  );
}
