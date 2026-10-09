import React from 'react';
import { useLanguage } from '../../../app/client/i18n/index.js';
import { IconButton } from '../../../shared/design-system/index.js';
import { ConversationStatusBar } from './ConversationStatusBar.js';
export function MeetingToggle({ meeting, onToggle }: any) {
  const { scoped: copy } = useLanguage((ctx) => ctx.meeting);
  const state: any = React.useSyncExternalStore(meeting.subscribe, meeting.getSnapshot);
  const active = Boolean(state.shared.listening || state.shared.starting);
  return (
    <IconButton
      icon={active ? 'meeting' : 'meetingOff'}
      label={(copy as any).shared()}
      title={(copy as any)[
        state.shared.listening || state.shared.starting ? 'stopShared' : 'startShared'
      ]()}
      className="dlv-composer-toggle"
      data-toggle-active={String(active)}
      aria-pressed={active}
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
  const input = meeting.input('shared');
  return (
    <div className="dlv-meeting-bars">
      <ConversationStatusBar
        controller={input}
        includeSpeech={false}
        sourceIcon="meeting"
        sourceLabel={label}
      />
    </div>
  );
}
