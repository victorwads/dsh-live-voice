import React from 'react';
import { LiveVoiceTranslationProvider, normalizeAppLocale, useLanguage } from './runtime.js';

const FALLBACK_DSH_LOCALE = Object.freeze({ active: 'en', revision: 0 });

export function DshLanguageBoundary({
  locale,
  children,
}: {
  locale: any;
  children: React.ReactNode;
}) {
  const { current, setLanguage } = useLanguage();
  const subscribe = React.useCallback(
    (listener: () => void) => locale?.subscribe?.(listener) ?? (() => {}),
    [locale],
  );
  const snapshot = React.useCallback(
    () => locale?.getSnapshot?.() ?? FALLBACK_DSH_LOCALE,
    [locale],
  );
  const dshLocale = React.useSyncExternalStore(subscribe, snapshot, snapshot);
  const expected = normalizeAppLocale(dshLocale.active);
  React.useEffect(() => {
    if (current.locale !== expected) setLanguage(expected, true);
  }, [current.locale, expected, setLanguage]);
  return current.locale === expected ? children : null;
}

export function withAppLanguage<P extends object>(Component: React.ComponentType<P>, locale: any) {
  function LocalizedComponent(props: P) {
    return (
      <LiveVoiceTranslationProvider>
        <DshLanguageBoundary locale={locale}>
          <Component {...props} />
        </DshLanguageBoundary>
      </LiveVoiceTranslationProvider>
    );
  }
  LocalizedComponent.displayName = `AppLanguage(${Component.displayName || Component.name || 'Component'})`;
  return LocalizedComponent;
}
