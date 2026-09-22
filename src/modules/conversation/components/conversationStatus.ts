export function resolveConversationStatus(
  state: any,
  remaining: number | null,
  language: any,
): string {
  const { commons, recognition, settings, speak } = language;
  if (state.answeringQuestion && state.recognizing) return recognition.status.answer();
  if (state.answeringQuestion && state.listening) return recognition.status.awaitingAnswer();
  if (remaining) return settings.autoSend.countdown({ remaining });
  if (state.starting) return recognition.microphone.starting();
  if (state.paused) return speak.status.paused();
  if (state.speaking) return speak.status.playing();
  if (state.recognizing) return recognition.status.processing();
  if (state.listening) return recognition.status.listening();
  if (state.conversation) return commons.conversation.idle();
  return commons.status.ready();
}
