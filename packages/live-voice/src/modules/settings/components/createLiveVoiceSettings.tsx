import React from 'react';
import { LiveVoiceSettings } from './LiveVoiceSettings.js';

export function createLiveVoiceSettings(..._legacyArguments: unknown[]) {
  return function SettingsPanel({
    controller,
    onClose,
    pluginUpdate,
    debuggerInstall,
  }: {
    controller: any;
    onClose?(): void;
    pluginUpdate?: import('../services/pluginUpdate.js').PluginUpdate;
    debuggerInstall?: import('../services/debuggerInstall.js').DebuggerInstall;
  }) {
    return (
      <LiveVoiceSettings
        controller={controller}
        onClose={onClose}
        pluginUpdate={pluginUpdate}
        debuggerInstall={debuggerInstall}
      />
    );
  };
}
