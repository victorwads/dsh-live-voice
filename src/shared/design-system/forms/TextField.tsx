import React from 'react';
export type TextFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
};
export function TextField({ label, ...props }: TextFieldProps) {
  return (
    <label>
      {label}
      <input {...props} type="text" />
    </label>
  );
}
