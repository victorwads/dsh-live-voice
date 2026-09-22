import React from 'react';
import { Icon, type IconName } from '../icons/index.js';

export type IconButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  icon: IconName;
  label: string;
  visibleLabel?: string;
};
export function IconButton({
  icon,
  label,
  visibleLabel,
  className = 'dlv-pill-button',
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={'dlv-icon-button ' + className}
      title={props.title ?? label}
      aria-label={label}
    >
      <Icon name={icon} />
      {visibleLabel ? (
        <span className="dlv-toggle-state" aria-hidden>
          {visibleLabel}
        </span>
      ) : null}
    </button>
  );
}
