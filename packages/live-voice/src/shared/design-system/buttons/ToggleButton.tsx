import React from 'react';
import { IconButton, type IconButtonProps } from './IconButton.js';
export type ToggleButtonProps = Omit<IconButtonProps, 'aria-pressed'> & { pressed: boolean };
export function ToggleButton({ pressed, ...props }: ToggleButtonProps) {
  return <IconButton {...props} aria-pressed={pressed} />;
}
