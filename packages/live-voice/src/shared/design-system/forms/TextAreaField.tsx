import React from 'react';
import { DraftField, type DraftFieldProps } from './DraftField.js';
export type TextAreaFieldProps = Omit<DraftFieldProps, 'type' | 'multiline'>;
export function TextAreaField(props: TextAreaFieldProps) {
  return <DraftField {...props} multiline />;
}
