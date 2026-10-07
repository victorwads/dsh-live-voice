import React from 'react';
import { useLanguage } from '../../../app/client/i18n/index.js';
import { IconButton } from '../../../shared/design-system/index.js';

export function PlaybackControls({
  state,
  invoke,
  navigation = true,
}: {
  state: any;
  invoke(name: string): void;
  navigation?: boolean;
}) {
  const { scoped: speak } = useLanguage((ctx) => ctx.speak);
  const capabilities = state.capabilities?.[state.speechEngine || state.settings?.engine] ?? {};
  return (
    <>
      {navigation && state.speechHasPrevious ? (
        <IconButton
          label={(speak as any).playback.previous()}
          icon="skipPrevious"
          onClick={() => invoke('previousSpeechSegment')}
        />
      ) : null}
      {navigation && state.speechSegmentsRemaining > 1 ? (
        <IconButton
          label={(speak as any).playback.next()}
          icon="skipNext"
          onClick={() => invoke('skipSpeechSegment')}
        />
      ) : null}
      {state.speechSegmentsRemaining > 0 && capabilities.pause && !state.paused ? (
        <IconButton
          label={(speak as any).playback.pause()}
          icon="pause"
          disabled={!state.speaking || state.paused}
          onClick={() => invoke('pauseSpeech')}
        />
      ) : null}
      {state.paused && capabilities.resume ? (
        <IconButton
          label={(speak as any).playback.resume()}
          icon="play"
          onClick={() => invoke('resumeSpeech')}
        />
      ) : null}
      {state.speechSegmentsRemaining > 0 || state.speechRunActive ? (
        <IconButton
          label={(speak as any).playback.stopAll()}
          icon="stop"
          onClick={() => invoke('stopSpeech')}
        />
      ) : null}
    </>
  );
}
