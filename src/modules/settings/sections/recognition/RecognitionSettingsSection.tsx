import React from 'react';
import { SettingsCard } from '../../../../shared/design-system/index.js';
import { RecognitionEngineSettings } from './RecognitionEngineSettings.js';
import { RecognitionFilterSettings } from './RecognitionFilterSettings.js';
import { SilenceDetectionSettings } from './SilenceDetectionSettings.js';
import { VoiceCommandSettings } from './VoiceCommandSettings.js';
import { RecognitionStatus } from './RecognitionStatus.js';
export function RecognitionSettingsSection(props: any) {
  return (
    <SettingsCard>
      <div className="dlv-settings-card-body">
        <RecognitionEngineSettings {...props} />
        <VoiceCommandSettings {...props} />
        <RecognitionFilterSettings {...props} />
        <SilenceDetectionSettings {...props} />
        <RecognitionStatus {...props} />
      </div>
    </SettingsCard>
  );
}
