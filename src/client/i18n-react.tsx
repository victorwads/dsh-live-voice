// @ts-nocheck
import React from 'react';
import { createTranslationRuntime } from '@wads.dev/i18n-react';
import type { AvailableLangs, Translation } from '@wads.dev/i18n-ts';
import { LIVE_VOICE_LANGUAGES, liveVoiceDictionaries, type LiveVoiceLocale } from './locale.js';

type TranslationLeaf = (params?: Record<string, unknown>) => string;
export type LiveVoiceLanguage = Translation & {
  commons: Record<string, unknown>;
  recognition: Record<string, unknown>;
  settings: Record<string, unknown>;
  speak: Record<string, unknown>;
};

function interpolate(template: string, params: Record<string, unknown> = {}) {
  return template.replace(/\{([A-Za-z0-9_]+)\}/g, (_, name) =>
    String(params[name] ?? '{' + name + '}'),
  );
}

function toLanguage(dictionary: Record<string, string>): LiveVoiceLanguage {
  const root: Record<string, unknown> = {};
  for (const [identifier, template] of Object.entries(dictionary)) {
    const path = identifier.replace(/^dsh-live-voice\./, '').split('.');
    let parent = root;
    for (const segment of path.slice(0, -1)) {
      parent = (parent[segment] ??= {}) as Record<string, unknown>;
    }
    parent[path.at(-1)!] = ((params?: Record<string, unknown>) =>
      interpolate(template, params)) satisfies TranslationLeaf;
  }
  return root as LiveVoiceLanguage;
}

const languageLabels = new Map(LIVE_VOICE_LANGUAGES.map(({ id, label }) => [id, label]));

const availableLangs = Object.fromEntries(
  Object.entries(liveVoiceDictionaries).map(([id, dictionary]) => [
    id,
    {
      name: languageLabels.get(id) ?? id,
      short: id,
      locale: id,
      lang: async () => ({ default: toLanguage(dictionary) }),
    },
  ]),
) as AvailableLangs<LiveVoiceLocale, LiveVoiceLanguage>;

export const { TranslationProvider: LiveVoiceTranslationProvider, useTranslation: useLanguage } =
  createTranslationRuntime<LiveVoiceLocale, LiveVoiceLanguage>({
    availableLangs,
    defaultLang: 'en',
  });

function normalizeLocale(locale: string | undefined): LiveVoiceLocale {
  if (locale && locale in availableLangs) return locale as LiveVoiceLocale;
  const base = locale?.split('-')[0];
  if (base && base in availableLangs) return base as LiveVoiceLocale;
  return 'en';
}

const FALLBACK_DSH_LOCALE = Object.freeze({ active: 'en', revision: 0 });

function DshLanguageBoundary({ locale, children }: { locale: any; children: React.ReactNode }) {
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
  const expected = normalizeLocale(dshLocale.active);
  React.useEffect(() => {
    if (current.locale !== expected) setLanguage(expected, true);
  }, [current.locale, expected, setLanguage]);
  return current.locale === expected ? children : null;
}

export function withLiveVoiceLanguage<P extends object>(
  Component: React.ComponentType<P>,
  locale: any,
) {
  function LocalizedSlot(props: P) {
    return (
      <LiveVoiceTranslationProvider>
        <DshLanguageBoundary locale={locale}>
          <Component {...props} />
        </DshLanguageBoundary>
      </LiveVoiceTranslationProvider>
    );
  }
  LocalizedSlot.displayName = `LiveVoiceLanguage(${Component.displayName || Component.name || 'Slot'})`;
  return LocalizedSlot;
}
