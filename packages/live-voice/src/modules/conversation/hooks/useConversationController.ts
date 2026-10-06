import React from 'react';

export interface ConversationController<State = any> {
  getSnapshot(): State;
  subscribe(listener: () => void): () => void;
}

export function useConversationController<State>(controller: ConversationController<State>): State {
  const subscribe = React.useCallback(
    (listener: () => void) => controller.subscribe(listener),
    [controller],
  );
  const read = React.useCallback(() => controller.getSnapshot(), [controller]);
  return React.useSyncExternalStore(subscribe, read, read);
}
