import React from 'react';
import { useLanguage } from '../../../../app/client/i18n/index.js';
import { SettingsCard, SettingsSection } from '../../../../shared/design-system/index.js';
import { OutputFilterSettings } from './OutputFilterSettings.js';
import { SpeechEngineSettings } from './SpeechEngineSettings.js';
import { SpeechAdvancedSettings } from './SpeechAdvancedSettings.js';
export function SpeakSettingsSection(props: any) {
  const { scoped: settingsLanguage } = useLanguage((ctx) => ctx.settings);
  return (
    <SettingsCard>
      <div className="dlv-settings-card-body">
        <SettingsSection title={(settingsLanguage as any).layout.voice()} icon="speaker">
          <SpeechEngineSettings {...props} />
        </SettingsSection>
        <SettingsSection title={(settingsLanguage as any).layout.playback()} icon="play">
          <SpeechAdvancedSettings {...props} />
        </SettingsSection>
        <OutputFilterSettings {...props} />
      </div>
    </SettingsCard>
  );
}
