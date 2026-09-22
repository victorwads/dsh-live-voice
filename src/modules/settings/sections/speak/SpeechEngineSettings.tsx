import React from 'react';
import { useLanguage } from '../../../../app/client/i18n/index.js';
import { qwenVoices } from '../../../core/settings.js';
import { NumberField, SelectField } from '../../../../shared/design-system/index.js';
export function SpeechEngineSettings({ settings, capabilities, updateSettings }: any) {
  const { scoped: commons } = useLanguage((ctx) => ctx.commons);
  const { scoped: speak } = useLanguage((ctx) => ctx.speak);
  const engine = settings.engine || 'browser';
  const browserVoices = capabilities?.browser?.voices || [];
  return (
    <>
      <SelectField
        label={(speak as any).engine.label()}
        value={engine}
        options={[
          {
            value: 'qwen-http',
            label: (speak as any).qwen.label(),
            disabled: capabilities?.['qwen-http']?.supported === false,
          },
          {
            value: 'say',
            label: (speak as any).macos.label(),
            disabled: capabilities?.say?.supported === false,
          },
          {
            value: 'browser',
            label: (speak as any).browser.label(),
            disabled: capabilities?.browser?.supported === false,
          },
        ]}
        onChange={(event) => updateSettings({ engine: event.target.value })}
      />
      {engine === 'browser' && (
        <SelectField
          label={(speak as any).browser.voice()}
          value={settings.voice || ''}
          options={[
            { value: '', label: (commons as any).systemDefault() },
            ...browserVoices.map((voice: any) => ({
              value: voice.voiceURI || voice.name,
              label: voice.name,
            })),
          ]}
          onChange={(event) => updateSettings({ voice: event.target.value })}
        />
      )}
      {engine === 'qwen-http' && (
        <SelectField
          label={(speak as any).qwen.voice()}
          value={settings.voice || qwenVoices[0].value}
          options={qwenVoices}
          onChange={(event) => updateSettings({ voice: event.target.value })}
        />
      )}
      <NumberField
        label={(speak as any).rate.label()}
        min={0.1}
        max={3}
        step={0.1}
        value={settings.rate ?? 1}
        onChange={(event) => updateSettings({ rate: Number(event.target.value) })}
      />
      <NumberField
        label={(speak as any).segmentGap.label()}
        min={0}
        max={2000}
        step={50}
        value={settings.segmentGapMs ?? 400}
        onChange={(event) => updateSettings({ segmentGapMs: Number(event.target.value) })}
      />
      {capabilities?.[engine === 'qwen-http' ? 'qwen' : engine]?.supported === false && (
        <p role="status">
          {capabilities?.[engine === 'qwen-http' ? 'qwen' : engine]?.reason ||
            (commons as any).engine.failure()}
        </p>
      )}
    </>
  );
}
