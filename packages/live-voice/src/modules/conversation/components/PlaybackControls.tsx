import React from 'react';
import { useLanguage } from '../../../app/client/i18n/index.js';
import { IconButton } from '../../../shared/design-system/index.js';

export function PlaybackControls({ state, invoke }: { state: any; invoke(name: string): void }) {
  const { scoped: speak } = useLanguage((ctx) => ctx.speak);
  const capabilities = state.capabilities?.[state.settings?.engine] ?? {};
  return (
    <>
      {state.speechSegmentsRemaining > 1 ? (
        <IconButton
          label={(speak as any).playback.next()}
          icon="skipNext"
          onClick={() => invoke('skipSpeechSegment')}
        />
      ) : null}
      {state.speechSegmentsRemaining > 0 && capabilities.pause ? (
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
      {state.speechSegmentsRemaining > 0 ? (
        <IconButton
          label={(speak as any).playback.stopAll()}
          icon="stop"
          onClick={() => invoke('stopSpeech')}
        />
      ) : null}
    </>
  );
}
