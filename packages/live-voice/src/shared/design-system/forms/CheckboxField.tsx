import React from 'react';
import { Hint } from '../feedback/Hint.js';
export type CheckboxFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
  description?: string;
  hint?: string;
};
export function CheckboxField({
  label,
  description,
  hint,
  className = 'dlv-check',
  ...props
}: CheckboxFieldProps) {
  return (
    <div>
      <div className="dlv-field-label">
        <label className={className}>
          <input {...props} type="checkbox" /> {label}
        </label>
        {hint && <Hint label={label}>{hint}</Hint>}
      </div>
      {description ? <p className="dlv-setting-description">{description}</p> : null}
    </div>
  );
}
