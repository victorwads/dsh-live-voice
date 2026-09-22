import React from 'react';
import { useLanguage } from '../../../../app/client/i18n/index.js';
import { defaultAgentVoiceContext } from '../../../core/settings.js';
import { QwenSettings } from '../../../core/qwen/QwenSettings.js';
import {
  CheckboxField,
  SelectField,
  SettingsSubcard,
  TextAreaField,
} from '../../../../shared/design-system/index.js';
import { createDeviceOptions, useAudioDevices } from '../../hooks/useAudioDevices.js';
export function SpeechAdvancedSettings({
  controller,
  settings,
  speaking,
  updateSettings,
  invoke,
}: any) {
  const { scoped: commons } = useLanguage((ctx) => ctx.commons);
  const { scoped: settingsLanguage } = useLanguage((ctx) => ctx.settings);
  const { scoped: speak } = useLanguage((ctx) => ctx.speak);
  const devices = useAudioDevices();
  const outputOptions = createDeviceOptions(
    devices,
    'audiooutput',
    (commons as any).systemDefault(),
    (speak as any).output.fallbackName(),
  );
  return (
    <>
      {settings.engine !== 'say' ? (
        <SelectField
          label={(speak as any).output.device()}
          value={settings.outputDeviceId || ''}
          options={outputOptions}
          onChange={(event) => updateSettings({ outputDeviceId: event.target.value })}
        />
      ) : (
        <p className="dlv-setting-description">{(speak as any).macos.outputHelp()}</p>
      )}
      {settings.engine === 'qwen-http' && (
        <SettingsSubcard title={(speak as any).qwen.connection()}>
          <QwenSettings controller={controller} />
        </SettingsSubcard>
      )}
      <SettingsSubcard title={(speak as any).agentContext.label()}>
        <CheckboxField
          label={(speak as any).agentContext.enabled()}
          checked={settings.agentVoiceContextEnabled !== false}
          onChange={(event) => updateSettings({ agentVoiceContextEnabled: event.target.checked })}
        />
        <TextAreaField
          label={(speak as any).agentContext.label()}
          value={settings.agentVoiceContext || defaultAgentVoiceContext}
          disabled={settings.agentVoiceContextEnabled === false}
          onChange={(event) => updateSettings({ agentVoiceContext: event.target.value })}
        />
        <button
          type="button"
          onClick={() => updateSettings({ agentVoiceContext: defaultAgentVoiceContext })}
        >
          {(speak as any).agentContext.restore()}
        </button>
      </SettingsSubcard>
      <p>{(speak as any).engine.playbackHelp()}</p>
      <div className="dlv-settings-actions">
        <button type="button" onClick={() => invoke('speak', (speak as any).output.testPhrase())}>
          {(speak as any).output.test()}
        </button>
        {speaking && (
          <button type="button" onClick={() => invoke('stopSpeech')}>
            {(speak as any).output.stopTest()}
          </button>
        )}
        <button type="button" onClick={() => invoke('refreshCapabilities')}>
          {(settingsLanguage as any).engine.refresh()}
        </button>
      </div>
    </>
  );
}
