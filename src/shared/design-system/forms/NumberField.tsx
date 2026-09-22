import React from 'react';
export type NumberFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
};
export function NumberField({ label, ...props }: NumberFieldProps) {
  return (
    <label>
      {label}
      <input {...props} type="number" />
    </label>
  );
}
