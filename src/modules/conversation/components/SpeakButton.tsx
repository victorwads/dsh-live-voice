import React from 'react';
import { useLanguage } from '../../../app/client/i18n/index.js';
import { IconButton } from '../../../shared/design-system/index.js';

export type SpeakButtonProps = {
  active?: boolean;
  disabled?: boolean;
  label?: string;
  onClick?(): void;
};
export function SpeakButton({
  active = false,
  disabled = false,
  label,
  onClick,
}: SpeakButtonProps) {
  const { scoped: speak } = useLanguage((ctx) => ctx.speak);
  const resolvedLabel =
    label ?? (active ? (speak as any).playback.stop() : (speak as any).playback.message());
  return (
    <IconButton
      className="dlv-speaker"
      label={resolvedLabel}
      icon={active ? 'stop' : 'speaker'}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
    />
  );
}
