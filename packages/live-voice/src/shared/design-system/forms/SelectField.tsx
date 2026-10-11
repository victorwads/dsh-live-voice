import React from 'react';
import { Hint } from '../feedback/Hint.js';
export type SelectOption = { value: string; label: string; disabled?: boolean };
export type SelectFieldProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> & {
  label: string;
  hint?: string;
  options: readonly SelectOption[];
};
export function SelectField({ label, options, hint, ...props }: SelectFieldProps) {
  const generatedId = React.useId();
  const id = props.id || generatedId;
  return (
    <div className="dlv-form-field">
      <div className="dlv-field-label">
        <label htmlFor={id}>{label}</label>
        {hint && (
          <Hint label={label} id={props['aria-describedby']}>
            {hint}
          </Hint>
        )}
      </div>
      <select {...props} id={id}>
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
