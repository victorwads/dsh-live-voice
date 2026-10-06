import React from 'react';
import { LiveVoiceSettings } from './LiveVoiceSettings.js';

export function createLiveVoiceSettings(..._legacyArguments: unknown[]) {
  return function SettingsPanel({ controller, onClose }: { controller: any; onClose?(): void }) {
    return <LiveVoiceSettings controller={controller} onClose={onClose} />;
  };
}
