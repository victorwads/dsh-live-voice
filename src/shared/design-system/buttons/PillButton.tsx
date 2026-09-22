import React from 'react';
export type PillButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;
export function PillButton({ className = '', type = 'button', ...props }: PillButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={['dlv-pill-button', className].filter(Boolean).join(' ')}
    />
  );
}
