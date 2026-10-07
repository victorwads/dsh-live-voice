import React from 'react';
import { useLanguage } from '../../../app/client/i18n/index.js';
import { IconButton, ToggleButton } from '../../../shared/design-system/index.js';
import { RecognitionBar } from './RecognitionBar.js';
export function MeetingToggle({ meeting, onToggle }: any) {
  const { scoped: copy } = useLanguage((ctx) => ctx.meeting);
  const state: any = React.useSyncExternalStore(meeting.subscribe, meeting.getSnapshot);
  return (
    <IconButton
      icon="meeting"
      label={(copy as any).shared()}
      className="dlv-mic"
      aria-pressed={Boolean(state.shared.listening || state.shared.starting)}
      onClick={onToggle}
    />
  );
}
export function MeetingBars({ meeting }: any) {
  const { scoped: copy } = useLanguage((ctx) => ctx.meeting);
  const state: any = React.useSyncExternalStore(meeting.subscribe, meeting.getSnapshot);
  const value = state.shared;
  if (!value.listening && !value.starting && !value.error) return null;
  const label = (copy as any).shared();
  const status =
    value.error ||
    (value.starting
      ? (copy as any).starting()
      : value.pending
        ? (copy as any).processing()
        : (copy as any).listening());
  return (
    <div className="dlv-bar-wrap dlv-meeting-bars">
      <RecognitionBar
        controller={{ meter: meeting.jobs.get('shared')?.meter }}
        listening={value.listening}
        label={label}
        status={status}
        leading={
          <IconButton
            icon="meeting"
            label={label}
            aria-pressed={Boolean(value.listening || value.starting)}
            onClick={() => {
              void meeting.stop('shared');
              meeting.patch('shared', { error: null });
            }}
          />
        }
      >
        <ToggleButton
          visibleLabel={(copy as any).timestampsBadge()}
          icon="clock"
          label={(copy as any).timestamps()}
          className="dlv-timestamp-toggle"
          pressed={Boolean(state.timestamps)}
          onClick={() => meeting.toggleTimestamps()}
        />
      </RecognitionBar>
    </div>
  );
}
