import React from 'react';
import { IconButton } from '../../../shared/design-system/index.js';
export type MicrophoneButtonProps = { label: string; disabled?: boolean; onClick(): void };
export function MicrophoneButton(props: MicrophoneButtonProps) {
  return <IconButton {...props} className="dlv-mic" icon="mic" />;
}
