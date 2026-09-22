import React from 'react';
import { SettingsCard } from '../../../../shared/design-system/index.js';
import { DeliverySettings } from './DeliverySettings.js';
import { HoldToTalkSettings } from './HoldToTalkSettings.js';
import { VoiceModeSettings } from './VoiceModeSettings.js';
import { ConversationDelaySettings } from './ConversationDelaySettings.js';
import { PlaybackPolicySettings } from '../speak/PlaybackPolicySettings.js';
export function ConversationSettingsSection(props: {
  settings: any;
  updateSettings(value: any): void;
}) {
  return (
    <SettingsCard>
      <div className="dlv-settings-card-body">
        <DeliverySettings {...props} />
        <HoldToTalkSettings {...props} />
        <VoiceModeSettings {...props} />
        <PlaybackPolicySettings {...props} />
        <ConversationDelaySettings {...props} />
      </div>
    </SettingsCard>
  );
}
