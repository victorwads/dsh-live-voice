import React from 'react';
import { useLanguage } from '../../../app/client/i18n/index.js';
import { ErrorMessage } from '../../../shared/design-system/index.js';
import { useConversationActions, useConversationController } from '../hooks/index.js';
import { MicrophoneButton } from './MicrophoneButton.js';

export type ConversationControlsProps = { controller: any };
export function ConversationControls({ controller }: ConversationControlsProps) {
  const { scoped: commons } = useLanguage((ctx) => ctx.commons);
  const { scoped: recognition } = useLanguage((ctx) => ctx.recognition);
  const state = useConversationController<any>(controller);
  const { invoke, error, clearError } = useConversationActions(controller);
  const busy = state.conversation || state.listening || state.starting || state.recognizing;
  if (busy) return null;
  const capability = state.capabilities?.recognition;
  const capture = state.capabilities?.capture;
  const pending = !capability || !capture;
  const unavailable = capability?.supported === false || capture?.supported === false;
  const reason = capture?.supported === false ? capture.reason : capability?.reason;
  const label = pending
    ? (recognition as any).microphone.checking()
    : unavailable
      ? reason || (recognition as any).status.unavailable()
      : (commons as any).conversation.start();
  return (
    <>
      <MicrophoneButton
        label={label}
        disabled={pending}
        onClick={() => invoke(unavailable ? 'explainRecognition' : 'startConversation')}
      />
      <ErrorMessage
        error={error}
        dismissLabel={(commons as any).dismissError()}
        dismissText={(commons as any).dismiss()}
        onDismiss={clearError}
      />
    </>
  );
}
