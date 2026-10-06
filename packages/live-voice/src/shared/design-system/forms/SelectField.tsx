import React from 'react';
export type SelectOption = { value: string; label: string; disabled?: boolean };
export type SelectFieldProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> & {
  label: string;
  options: readonly SelectOption[];
};
export function SelectField({ label, options, ...props }: SelectFieldProps) {
  return (
    <label>
      {label}
      <select {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
