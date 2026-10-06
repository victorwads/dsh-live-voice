import React from 'react';
import { useLanguage } from '../../../../app/client/i18n/index.js';
import { SettingsCard, SettingsSubcard } from '../../../../shared/design-system/index.js';
import { DeliverySettings } from './DeliverySettings.js';
import { HoldToTalkSettings } from './HoldToTalkSettings.js';
import { VoiceModeSettings } from './VoiceModeSettings.js';
import { ConversationDelaySettings } from './ConversationDelaySettings.js';
import { PlaybackPolicySettings } from '../speak/PlaybackPolicySettings.js';
export function ConversationSettingsSection(props: {
  settings: any;
  updateSettings(value: any): void;
}) {
  const { scoped: settingsLanguage } = useLanguage((ctx) => ctx.settings);
  return (
    <SettingsCard>
      <div className="dlv-settings-card-body">
        <SettingsSubcard title={(settingsLanguage as any).general.title()} icon="send">
          <div className="dlv-conversation-fields">
            <DeliverySettings {...props} />
            <HoldToTalkSettings {...props} />
            <VoiceModeSettings {...props} />
            <PlaybackPolicySettings {...props} />
            <ConversationDelaySettings {...props} />
          </div>
        </SettingsSubcard>
      </div>
    </SettingsCard>
  );
}
