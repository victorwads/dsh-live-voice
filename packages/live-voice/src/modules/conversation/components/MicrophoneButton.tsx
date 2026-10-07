import React from 'react';
import { IconButton } from '../../../shared/design-system/index.js';
export type MicrophoneButtonProps = {
  label: string;
  disabled?: boolean;
  active?: boolean;
  onClick(): void;
};
export function MicrophoneButton(props: MicrophoneButtonProps) {
  const { active = false, ...buttonProps } = props;
  return (
    <IconButton
      {...buttonProps}
      aria-pressed={active}
      className={'dlv-mic' + (active ? ' dlv-mic-active' : '')}
      icon="mic"
    />
  );
}
