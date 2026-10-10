import React from 'react';
import { LiveVoiceSettings } from './LiveVoiceSettings.js';

export function createLiveVoiceSettings(..._legacyArguments: unknown[]) {
  return function SettingsPanel({
    controller,
    onClose,
    pluginUpdate,
  }: {
    controller: any;
    onClose?(): void;
    pluginUpdate?: import('../services/pluginUpdate.js').PluginUpdate;
  }) {
    return (
      <LiveVoiceSettings controller={controller} onClose={onClose} pluginUpdate={pluginUpdate} />
    );
  };
}
