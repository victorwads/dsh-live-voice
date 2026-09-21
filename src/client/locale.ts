import en from './i18n/en.js';
import zh from './i18n/zh.js';
import ptBR from './i18n/pt-BR.js';
import fr from './i18n/fr.js';
import es from './i18n/es.js';
import hi from './i18n/hi.js';
import { liveVoiceLanguageDefinitions, type LiveVoiceLocale } from './i18n/base.js';
import type { LiveVoiceTranslation } from './i18n/base.js';

export const LIVE_VOICE_LOCALE_NAMESPACE = 'dsh-live-voice';
export const LIVE_VOICE_LANGUAGES = liveVoiceLanguageDefinitions;

export const liveVoiceDictionaries = Object.freeze({
  en,
  zh,
  'pt-BR': ptBR,
  fr,
  es,
  hi,
}) satisfies Record<LiveVoiceLocale, LiveVoiceTranslation>;

export function createFallbackTranslator(locale: LiveVoiceLocale = 'en') {
  return (key: string, params: Record<string, unknown> = {}) => {
    const template = liveVoiceDictionaries[locale]?.[key] ?? en[key] ?? key;
    return String(template).replace(/\{([A-Za-z0-9_]+)\}/g, (_, name) =>
      String(params[name] ?? '{' + name + '}'),
    );
  };
}

export function registerLiveVoiceLocales(ctx: any) {
  // The manifest requires DSH locale. This only keeps isolated tests and non-DSH
  // embeddings from creating a second preference or throwing before mount.
  if (!ctx.locale) return createFallbackTranslator();
  // Language definitions belong to the shared DSH catalog. Another plugin may
  // already contribute the same language, so only add definitions that are absent.
  const registeredLanguages = new Set(
    (ctx.locale.getSnapshot?.().locales || []).map((language: { id: string }) =>
      language.id.toLowerCase(),
    ),
  );
  for (const language of LIVE_VOICE_LANGUAGES) {
    if (registeredLanguages.has(language.id.toLowerCase())) continue;
    ctx.effect(
      () => ctx.locale.addLanguage(language),
      'dsh-live-voice: ' + language.id + ' language',
    );
    registeredLanguages.add(language.id.toLowerCase());
  }
  for (const [locale, dictionary] of Object.entries(liveVoiceDictionaries))
    ctx.effect(
      () => ctx.locale.register(LIVE_VOICE_LOCALE_NAMESPACE, locale, dictionary),
      'dsh-live-voice: ' + locale + ' dictionary',
    );
  return ctx.locale.bind(LIVE_VOICE_LOCALE_NAMESPACE);
}
