import React from 'react';
export type CheckboxFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
  description?: string;
};
export function CheckboxField({
  label,
  description,
  className = 'dlv-check',
  ...props
}: CheckboxFieldProps) {
  return (
    <div>
      <label className={className}>
        <input {...props} type="checkbox" /> {label}
      </label>
      {description ? <p className="dlv-setting-description">{description}</p> : null}
    </div>
  );
}
