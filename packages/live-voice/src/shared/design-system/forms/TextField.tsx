import React from 'react';
import { DraftField, type DraftFieldProps } from './DraftField.js';
export type TextFieldProps = Omit<DraftFieldProps, 'type' | 'multiline'>;
export function TextField(props: TextFieldProps) {
  return <DraftField {...props} type="text" />;
}
