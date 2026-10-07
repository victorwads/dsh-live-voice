import React from 'react';
import { useLanguage } from '../../../app/client/i18n/index.js';
import { ErrorMessage, IconButton, ToggleButton } from '../../../shared/design-system/index.js';
import { useConversationActions, useConversationController } from '../hooks/index.js';
import { DeliveryModeButton } from './DeliveryModeButton.js';
import { SpeechStatusBar } from './SpeechStatusBar.js';
import { RecognitionBar } from './RecognitionBar.js';
import { resolveConversationStatus } from './conversationStatus.js';

export type ConversationStatusBarProps = {
  controller: any;
  questionOnly?: boolean;
  includeSpeech?: boolean;
  overlay?: boolean;
  overlayStyle?: React.CSSProperties;
};
export function ConversationStatusBar({
  controller,
  questionOnly = false,
  includeSpeech = true,
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
  if (
    !state.conversation &&
    !capture &&
    !state.speaking &&
    !state.paused &&
    !state.speechRunActive &&
    !(state.speechSegmentsRemaining > 0) &&
    !state.error &&
    !error
  )
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
  return (
    <div
      className={
        overlay ? 'dlv-bar-wrap dlv-bar-stack dlv-question-overlay' : 'dlv-bar-wrap dlv-bar-stack'
      }
      style={overlay ? overlayStyle : undefined}
    >
      {includeSpeech && <SpeechStatusBar controller={controller} />}
      {(state.conversation || capture || state.error || error) && (
        <RecognitionBar
          controller={controller}
          listening={state.listening}
          label={(commons as any).controls.title()}
          status={status}
          leading={
            <>
              {state.conversation && !capture ? (
                <IconButton
                  label={(recognition as any).microphone.takeControl()}
                  icon="mic"
                  onClick={() => invoke('startConversation')}
                />
              ) : null}
              {capture ? (
                <ToggleButton
                  className="dlv-mic-state"
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
                  pressed={!state.muted}
                  data-muted={state.muted ? 'true' : 'false'}
                  onClick={() => invoke(state.muted ? 'resumeListeningInput' : 'muteListening')}
                />
              ) : null}
            </>
          }
        >
          <DeliveryModeButton
            mode={state.settings.sendingMode || 'manual'}
            onChange={(sendingMode) => invoke('updateSettings', { sendingMode })}
          />
          {remaining ? (
            <IconButton
              label={(settings as any).autoSend.cancel()}
              icon="close"
              onClick={() => invoke('cancelAutoSend')}
            />
          ) : null}
        </RecognitionBar>
      )}
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
