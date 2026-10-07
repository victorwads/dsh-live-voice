import React from 'react';
import { IconButton, type IconButtonProps } from './IconButton.js';
export type ToggleButtonProps = Omit<IconButtonProps, 'aria-pressed'> & { pressed: boolean };
export function ToggleButton({ pressed, ...props }: ToggleButtonProps) {
  return (
    <IconButton
      {...props}
      className={'dlv-live-toggle ' + (props.className ?? '')}
      aria-pressed={pressed}
      data-toggle-active={String(pressed)}
    />
  );
}
