import React from 'react';
import { useLanguage } from '../../../../app/client/i18n/index.js';
import { SettingsCard, SettingsSubcard } from '../../../../shared/design-system/index.js';
import { OutputFilterSettings } from './OutputFilterSettings.js';
import { SpeechEngineSettings } from './SpeechEngineSettings.js';
import { SpeechAdvancedSettings } from './SpeechAdvancedSettings.js';
export function SpeakSettingsSection(props: any) {
  const { scoped: settingsLanguage } = useLanguage((ctx) => ctx.settings);
  return (
    <SettingsCard>
      <div className="dlv-settings-card-body">
        <SettingsSubcard title={(settingsLanguage as any).general.title()} icon="speaker">
          <SpeechEngineSettings {...props} />
          <SpeechAdvancedSettings {...props} />
        </SettingsSubcard>
        <OutputFilterSettings {...props} />
      </div>
    </SettingsCard>
  );
}
