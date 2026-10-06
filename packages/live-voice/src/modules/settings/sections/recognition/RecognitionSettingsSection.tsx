import React from 'react';
import { useLanguage } from '../../../../app/client/i18n/index.js';
import { SettingsCard, SettingsSubcard } from '../../../../shared/design-system/index.js';
import { RecognitionEngineSettings } from './RecognitionEngineSettings.js';
import { RecognitionFilterSettings } from './RecognitionFilterSettings.js';
import { SilenceDetectionSettings } from './SilenceDetectionSettings.js';
import { VoiceCommandSettings } from './VoiceCommandSettings.js';
import { RecognitionStatus } from './RecognitionStatus.js';
export function RecognitionSettingsSection(props: any) {
  const { scoped: settingsLanguage } = useLanguage((ctx) => ctx.settings);
  return (
    <SettingsCard>
      <div className="dlv-settings-card-body">
        <RecognitionStatus {...props} />
        <SettingsSubcard title={(settingsLanguage as any).general.title()} icon="mic">
          <RecognitionEngineSettings {...props} />
        </SettingsSubcard>
        <VoiceCommandSettings {...props} />
        <RecognitionFilterSettings {...props} />
        <SilenceDetectionSettings {...props} />
      </div>
    </SettingsCard>
  );
}
