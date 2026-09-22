import React from 'react';
export type TextAreaFieldProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
};
export function TextAreaField({ label, ...props }: TextAreaFieldProps) {
  return (
    <label>
      {label}
      <textarea {...props} />
    </label>
  );
}
