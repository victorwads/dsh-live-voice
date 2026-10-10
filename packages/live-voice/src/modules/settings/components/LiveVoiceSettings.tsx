import React from 'react';
import { useLanguage } from '../../../app/client/i18n/index.js';
import { ErrorMessage, SettingsTabs } from '../../../shared/design-system/index.js';
import { useLiveVoiceSettings, useLiveVoiceSettingsActions } from '../hooks/index.js';
import {
  ConversationSettingsSection,
  RecognitionSettingsSection,
  SpeakSettingsSection,
} from '../sections/index.js';
import { SettingsHeader } from './SettingsHeader.js';
import {
  readDeveloperExtension,
  subscribeDeveloperExtension,
} from '../../core/developerExtension.js';

export function LiveVoiceSettings({
  controller,
  onClose,
  pluginUpdate,
}: {
  controller: any;
  onClose?(): void;
  pluginUpdate?: import('../services/pluginUpdate.js').PluginUpdate;
}) {
  const { scoped: commons } = useLanguage((ctx) => ctx.commons);
  const { scoped: settingsLanguage } = useLanguage((ctx) => ctx.settings);
  const state = useLiveVoiceSettings<any>(controller);
  const { invoke, error, clearError } = useLiveVoiceSettingsActions(controller);
  const [activeTab, setActiveTab] = React.useState('conversation');
  const tabsId = React.useId();
  const developer = React.useSyncExternalStore(
    subscribeDeveloperExtension,
    readDeveloperExtension,
    () => null,
  );
  const Developer = developer?.component;
  const selectedTab = activeTab === 'developer' && !developer ? 'conversation' : activeTab;
  const tabs = [
    { id: 'speech', label: (settingsLanguage as any).tabs.speak(), icon: 'speaker' as const },
    {
      id: 'recognition',
      label: (settingsLanguage as any).tabs.recognition(),
      icon: 'mic' as const,
    },
    {
      id: 'conversation',
      label: (settingsLanguage as any).tabs.conversation(),
      icon: 'send' as const,
    },
  ];
  if (developer) tabs.push({ id: 'developer', label: developer.label(), icon: 'send' });
  const sectionProps = {
    controller,
    settings: state.settings,
    capabilities: state.capabilities,
    speaking: state.speaking,
    invoke,

    updateSettings: (next: any) => invoke('updateSettings', next),
  };
  return (
    <section className="dlv-settings" aria-label={(settingsLanguage as any).title()}>
      <SettingsHeader onClose={onClose} pluginUpdate={pluginUpdate} />
      <SettingsTabs
        label={(settingsLanguage as any).title()}
        tabs={tabs}
        active={selectedTab}
        idPrefix={tabsId}
        onChange={setActiveTab}
      />
      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`${tabsId}-panel-${tab.id}`}
          className="dlv-settings-panel"
          role="tabpanel"
          aria-labelledby={`${tabsId}-tab-${tab.id}`}
          hidden={selectedTab !== tab.id}
        >
          {tab.id === 'developer' && Developer ? (
            <Developer />
          ) : tab.id === 'speech' ? (
            <SpeakSettingsSection {...sectionProps} />
          ) : tab.id === 'recognition' ? (
            <RecognitionSettingsSection {...sectionProps} />
          ) : (
            <ConversationSettingsSection {...sectionProps} />
          )}
        </div>
      ))}
      <ErrorMessage
        error={error || state.error}
        dismissLabel={(commons as any).dismissError()}
        dismissText={(commons as any).dismiss()}
        onDismiss={() => {
          clearError();
          controller.clearError();
        }}
      />
    </section>
  );
}
