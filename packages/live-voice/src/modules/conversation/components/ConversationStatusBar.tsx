import React from 'react';
import { useLanguage } from '../../../app/client/i18n/index.js';
import { ErrorMessage, IconButton } from '../../../shared/design-system/index.js';
import { useConversationActions, useConversationController } from '../hooks/index.js';
import { DeliveryModeButton } from './DeliveryModeButton.js';
import { PlaybackControls } from './PlaybackControls.js';
import { Waveform } from './Waveform.js';
import { resolveConversationStatus } from './conversationStatus.js';

export type ConversationStatusBarProps = {
  controller: any;
  questionOnly?: boolean;
  overlay?: boolean;
  overlayStyle?: React.CSSProperties;
};
export function ConversationStatusBar({
  controller,
  questionOnly = false,
  overlay = false,
  overlayStyle,
}: ConversationStatusBarProps) {
  const { scoped: commons } = useLanguage((ctx) => ctx.commons);
  const { scoped: recognition } = useLanguage((ctx) => ctx.recognition);
  const { scoped: settings } = useLanguage((ctx) => ctx.settings);
  const { scoped: speak } = useLanguage((ctx) => ctx.speak);
  const state = useConversationController<any>(controller);
  const { invoke, error, clearError } = useConversationActions(controller);
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    if (!state.autoSendAt) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(timer);
  }, [state.autoSendAt]);
  const capture = state.starting || state.listening || state.recognizing;
  if (questionOnly && !state.answeringQuestion) return null;
  if (!state.conversation && !capture && !state.speaking && !state.paused && !state.error && !error)
    return null;
  const remaining = state.autoSendAt
    ? Math.max(1, Math.ceil((state.autoSendAt - now) / 1000))
    : null;
  const status = resolveConversationStatus(state, remaining, {
    commons,
    recognition,
    settings,
    speak,
  });
  const autoPlayback = state.settings.announceAssistantMessages !== false;
  const playbackTitle =
    state.speechSegmentsRemaining > 0
      ? (speak as any).autoPlayback[
          state.speechSegmentsRemaining === 1 ? 'remainingOne' : 'remainingOther'
        ]({
          state: autoPlayback ? (commons as any).on() : (commons as any).off(),
          count: state.speechSegmentsRemaining,
        })
      : (speak as any).autoPlayback.status({
          state: autoPlayback ? (commons as any).on() : (commons as any).off(),
        });
  return (
    <div
      className={overlay ? 'dlv-bar-wrap dlv-question-overlay' : 'dlv-bar-wrap'}
      style={overlay ? overlayStyle : undefined}
    >
      <div className="dlv-pill" role="group" aria-label={(commons as any).controls.title()}>
        {capture && !state.conversation ? (
          <IconButton
            label={(recognition as any).dictation.cancel()}
            icon="close"
            onClick={() => invoke('cancelDictation')}
          />
        ) : null}
        {state.conversation ? (
          <IconButton
            label={(commons as any).conversation.end()}
            icon="close"
            onClick={() => invoke('endConversation')}
          />
        ) : null}
        <Waveform controller={controller} enabled={Boolean(state.listening)} />
        <span className="dlv-status" role="status" aria-live="polite">
          {status}
        </span>
        <DeliveryModeButton
          mode={state.settings.sendingMode || 'manual'}
          onChange={(sendingMode) => invoke('updateSettings', { sendingMode })}
        />
        <IconButton
          className={`dlv-live-toggle${state.speechSegmentsRemaining > 0 ? ' dlv-live-toggle-expanded' : ''}`}
          label={(speak as any).autoPlayback.label()}
          title={playbackTitle}
          icon={autoPlayback ? 'speaker' : 'speakerOff'}
          visibleLabel={
            !autoPlayback
              ? (commons as any).toggle.offBadge()
              : state.speechSegmentsRemaining > 0
                ? String(state.speechSegmentsRemaining)
                : (commons as any).on()
          }
          role="switch"
          aria-checked={autoPlayback}
          onClick={() => invoke('updateSettings', { announceAssistantMessages: !autoPlayback })}
        />
        {remaining ? (
          <IconButton
            label={(settings as any).autoSend.cancel()}
            icon="close"
            onClick={() => invoke('cancelAutoSend')}
          />
        ) : null}
        {state.conversation && !capture ? (
          <IconButton
            label={(recognition as any).microphone.takeControl()}
            icon="mic"
            onClick={() => invoke('startConversation')}
          />
        ) : null}
        {capture ? (
          <IconButton
            className="dlv-live-toggle dlv-mic-state"
            label={
              state.muted
                ? (recognition as any).microphone.resume()
                : (recognition as any).microphone.ignore()
            }
            title={(recognition as any).microphone.inputStatus({
              state: state.muted
                ? (commons as any).input.ignoring()
                : (commons as any).input.listening(),
            })}
            icon={state.muted ? 'micOff' : 'mic'}
            visibleLabel={
              state.muted
                ? (commons as any).input.ignoringBadge()
                : (commons as any).input.listeningBadge()
            }
            aria-pressed={Boolean(state.muted)}
            data-muted={state.muted ? 'true' : 'false'}
            onClick={() => invoke(state.muted ? 'resumeListeningInput' : 'muteListening')}
          />
        ) : null}
        <PlaybackControls state={state} invoke={invoke} />
      </div>
      <ErrorMessage
        error={error || state.error}
        dismissLabel={(commons as any).dismissError()}
        dismissText={(commons as any).dismiss()}
        onDismiss={() => {
          clearError();
          controller.clearError();
        }}
      />
    </div>
  );
}
