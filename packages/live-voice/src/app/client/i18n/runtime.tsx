import { createTranslationRuntime } from '@wads.dev/i18n-react';
import type { AvailableLangs, Translation } from '@wads.dev/i18n-ts';
import { LIVE_VOICE_LANGUAGES, liveVoiceDictionaries } from './registerDshLocales.js';
import type { LiveVoiceLocale } from './catalogs/index.js';

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

function toLanguage(dictionary: Record<string, unknown>): LiveVoiceLanguage {
  const root: Record<string, unknown> = {};
  for (const [identifier, template] of Object.entries(dictionary)) {
    const path = identifier.replace(/^dsh-live-voice\./, '').split('.');
    let parent = root;
    for (const segment of path.slice(0, -1))
      parent = (parent[segment] ??= {}) as Record<string, unknown>;
    const message = String(template);
    parent[path.at(-1)!] = ((params?: Record<string, unknown>) =>
      interpolate(message, params)) satisfies TranslationLeaf;
  }
  return root as LiveVoiceLanguage;
}

const labels = new Map(LIVE_VOICE_LANGUAGES.map(({ id, label }) => [id, label]));
const availableLangs = Object.fromEntries(
  Object.entries(liveVoiceDictionaries).map(([id, dictionary]) => [
    id,
    {
      name: labels.get(id) ?? id,
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

export function normalizeAppLocale(locale: string | undefined): LiveVoiceLocale {
  if (locale && locale in availableLangs) return locale as LiveVoiceLocale;
  const base = locale?.split('-')[0];
  if (base && base in availableLangs) return base as LiveVoiceLocale;
  return 'en';
}
