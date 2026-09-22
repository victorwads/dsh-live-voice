import React from 'react';
import { useLanguage } from '../../../../app/client/i18n/index.js';
import { QwenSettings } from '../../../core/qwen/QwenSettings.js';
import { WhisperSettings } from '../../../recognition/engines/whisper/WhisperSettings.js';
import {
  CheckboxField,
  SelectField,
  SettingsSubcard,
} from '../../../../shared/design-system/index.js';
import { createDeviceOptions, useAudioDevices } from '../../hooks/useAudioDevices.js';
export function RecognitionEngineSettings({
  controller,
  settings,
  capabilities = {},
  updateSettings,
}: any) {
  const { scoped: commons } = useLanguage((ctx) => ctx.commons);
  const { scoped: recognition } = useLanguage((ctx) => ctx.recognition);
  const devices = useAudioDevices();
  const engine = settings.recognitionEngine || 'browser';
  const setEngine = (next: string) =>
    updateSettings(
      next === 'browser' && settings.recognitionLang === 'auto'
        ? { recognitionEngine: next, recognitionLang: 'pt-BR' }
        : { recognitionEngine: next },
    );
  return (
    <>
      <SelectField
        label={(recognition as any).engine.label()}
        value={engine}
        options={[
          {
            value: 'browser',
            label: (recognition as any).browser.label(),
            disabled: capabilities.recognition?.supported === false,
          },
          {
            value: 'qwen-http',
            label: (recognition as any).qwen.label(),
            disabled: capabilities['qwen-http-recognition']?.supported === false,
          },
          {
            value: 'whisper-http',
            label: (recognition as any).whisper.label(),
            disabled: capabilities['whisper-http']?.supported === false,
          },
        ]}
        onChange={(event) => setEngine(event.target.value)}
      />
      <SelectField
        label={(recognition as any).microphone.device()}
        value={settings.inputDeviceId || ''}
        options={createDeviceOptions(
          devices,
          'audioinput',
          (commons as any).systemDefault(),
          (commons as any).device.numberedLabel({ number: '' }),
        )}
        onChange={(event) => updateSettings({ inputDeviceId: event.target.value })}
      />
      <SelectField
        label={(recognition as any).language.label()}
        value={settings.recognitionLang || (engine === 'browser' ? 'pt-BR' : 'auto')}
        options={[
          ...(engine === 'browser'
            ? []
            : [{ value: 'auto', label: (recognition as any).language.automatic() }]),
          { value: 'pt-BR', label: 'Português (Brasil)' },
          { value: 'en-US', label: 'English (US)' },
        ]}
        onChange={(event) => updateSettings({ recognitionLang: event.target.value })}
      />
      {engine === 'browser' && (
        <>
          <p>{(recognition as any).browser.help()}</p>
          <CheckboxField
            label={(recognition as any).browser.localProcessing()}
            checked={settings.recognitionProcessLocally !== false}
            onChange={(event) =>
              updateSettings({ recognitionProcessLocally: event.target.checked })
            }
          />
          {settings.recognitionProcessLocally !== false ? (
            <CheckboxField
              label={(recognition as any).browser.autoInstallPack()}
              checked={settings.recognitionAutoInstall !== false}
              onChange={(event) => updateSettings({ recognitionAutoInstall: event.target.checked })}
            />
          ) : (
            <p role="status">{(recognition as any).browser.remoteServiceWarning()}</p>
          )}
        </>
      )}
      {engine === 'whisper-http' && (
        <SettingsSubcard title={(commons as any).connection.title()}>
          <p>{(recognition as any).whisper.captureHelp()}</p>
          <WhisperSettings controller={controller} />
        </SettingsSubcard>
      )}
      {engine === 'qwen-http' && (
        <SettingsSubcard title={(commons as any).connection.title()}>
          <p>{(recognition as any).qwen.captureHelp()}</p>
          {settings.engine !== 'qwen-http' && <QwenSettings controller={controller} />}
        </SettingsSubcard>
      )}
    </>
  );
}
