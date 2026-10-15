import React from 'react';
import { DebuggerTranslationProvider, useDebuggerLanguage } from './runtime.js';
import { normalizeDebuggerLocale } from './catalogs.js';
const fallback = Object.freeze({ active: 'en', revision: 0 });
function DshLanguageBoundary({ locale, children }: { locale: any; children: React.ReactNode }) {
  const { current, setLanguage } = useDebuggerLanguage();
  const subscribe = React.useCallback(
    (listener: () => void) => locale?.subscribe?.(listener) ?? (() => {}),
    [locale],
  );
  const snapshot = React.useCallback(() => locale?.getSnapshot?.() ?? fallback, [locale]);
  const state = React.useSyncExternalStore(subscribe, snapshot, snapshot);
  const expected = normalizeDebuggerLocale(state.active);
  React.useEffect(() => {
    if (current.locale !== expected) setLanguage(expected, true);
  }, [current.locale, expected, setLanguage]);
  // Gate initial loading only. Locale changes must not reset recording selection or inspector state.
  const initialized = React.useRef(false);
  if (current.locale === expected) initialized.current = true;
  return initialized.current ? children : null;
}
export function withDebuggerLanguage<P extends object>(
  Component: React.ComponentType<P>,
  locale: any,
) {
  function Localized(props: P) {
    return (
      <DebuggerTranslationProvider>
        <DshLanguageBoundary locale={locale}>
          <Component {...props} />
        </DshLanguageBoundary>
      </DebuggerTranslationProvider>
    );
  }
  Localized.displayName =
    'DebuggerLanguage(' + (Component.displayName || Component.name || 'Component') + ')';
  return Localized;
}
