import React from 'react';
import { useLanguage } from '../../../app/client/i18n/index.js';
import { IconButton } from '../../../shared/design-system/index.js';

type Mode = 'manual' | 'queue' | 'steer';
export function nextDeliveryMode(mode: Mode | undefined): Mode {
  return mode === 'queue' ? 'steer' : mode === 'steer' ? 'manual' : 'queue';
}
export function DeliveryModeButton({
  mode = 'manual',
  onChange,
}: {
  mode?: Mode;
  onChange(mode: Mode): void;
}) {
  const { scoped: commons } = useLanguage((ctx) => ctx.commons);
  const { scoped: settings } = useLanguage((ctx) => ctx.settings);
  const description =
    mode === 'steer'
      ? (settings as any).delivery.steerDescription()
      : mode === 'queue'
        ? (commons as any).queue()
        : (commons as any).manual();
  const status = (settings as any).delivery.status({ mode: description });
  const visible =
    mode === 'steer'
      ? (commons as any).send()
      : mode === 'queue'
        ? (commons as any).delivery.queueBadge()
        : (commons as any).toggle.offBadge();
  return (
    <IconButton
      className="dlv-live-toggle"
      label={status}
      title={status}
      icon={mode === 'queue' ? 'queue' : 'send'}
      visibleLabel={visible}
      aria-pressed={mode !== 'manual'}
      data-mode={mode}
      onClick={() => onChange(nextDeliveryMode(mode))}
    />
  );
}
