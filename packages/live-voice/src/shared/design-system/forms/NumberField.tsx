import React from 'react';
import { DraftField, type DraftFieldProps } from './DraftField.js';
export type NumberFieldProps = Omit<DraftFieldProps, 'type' | 'multiline'>;
export function NumberField(props: NumberFieldProps) {
  return <DraftField {...props} type="number" />;
}
