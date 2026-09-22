import React from 'react';
import { SettingsCard } from '../../../../shared/design-system/index.js';
import { OutputFilterSettings } from './OutputFilterSettings.js';
import { SpeechEngineSettings } from './SpeechEngineSettings.js';
import { SpeechAdvancedSettings } from './SpeechAdvancedSettings.js';
export function SpeakSettingsSection(props: any) {
  return (
    <SettingsCard>
      <div className="dlv-settings-card-body">
        <SpeechEngineSettings {...props} />
        <SpeechAdvancedSettings {...props} />
        <OutputFilterSettings {...props} />
      </div>
    </SettingsCard>
  );
}
