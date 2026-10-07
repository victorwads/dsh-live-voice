import React from 'react';
import { useLanguage } from '../../../app/client/i18n/index.js';
import { ToggleButton } from '../../../shared/design-system/index.js';
export function AutoPlaybackToggle({ state, invoke, error }: any) {
  const { scoped: commons } = useLanguage((ctx) => ctx.commons);
  const { scoped: speak } = useLanguage((ctx) => ctx.speak);
  const active = state.settings.announceAssistantMessages !== false;
  const count = state.speechSegmentsRemaining || 0;
  const title =
    count > 0
      ? (speak as any).autoPlayback[count === 1 ? 'remainingOne' : 'remainingOther']({
          state: active ? (commons as any).on() : (commons as any).off(),
          count,
        })
      : (speak as any).autoPlayback.status({
          state: active ? (commons as any).on() : (commons as any).off(),
        });
  return (
    <ToggleButton
      pressed={active}
      label={(speak as any).autoPlayback.label()}
      title={error || title}
      icon={active ? 'speaker' : 'speakerOff'}
      visibleLabel={active ? (commons as any).on() : (commons as any).toggle.offBadge()}
      role="switch"
      aria-checked={active}
      onClick={() => invoke('updateSettings', { announceAssistantMessages: !active })}
    />
  );
}
