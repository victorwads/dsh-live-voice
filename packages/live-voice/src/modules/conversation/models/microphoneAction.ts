/** The composer button and keyboard shortcut must select the same input action. */
export function microphoneAction(state: any): string {
  const busy = state.conversation || state.listening || state.starting || state.recognizing;
  return busy
    ? state.conversation
      ? 'stopConversationInput'
      : 'cancelDictation'
    : 'startConversation';
}
