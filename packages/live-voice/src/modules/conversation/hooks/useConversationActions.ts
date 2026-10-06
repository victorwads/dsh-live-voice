import React from 'react';

export function useConversationActions(controller: Record<string, any>) {
  const [error, setError] = React.useState('');
  const alive = React.useRef(true);
  React.useEffect(
    () => () => {
      alive.current = false;
    },
    [],
  );
  const invoke = React.useCallback(
    (name: string, ...args: unknown[]) => {
      setError('');
      try {
        Promise.resolve(controller[name](...args)).catch((reason) => {
          if (alive.current) setError(reason instanceof Error ? reason.message : String(reason));
        });
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : String(reason));
      }
    },
    [controller],
  );
  const clearError = React.useCallback(() => setError(''), []);
  return { invoke, error, clearError };
}
