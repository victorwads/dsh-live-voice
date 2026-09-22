import {
  appDictionaries,
  liveVoiceLanguageDefinitions,
  type LiveVoiceLocale,
} from './catalogs/index.js';

export const LIVE_VOICE_LOCALE_NAMESPACE = 'dsh-live-voice';
export const LIVE_VOICE_LANGUAGES = liveVoiceLanguageDefinitions;
export const liveVoiceDictionaries = appDictionaries;

export function createFallbackTranslator(locale: LiveVoiceLocale = 'en') {
  return (key: string, params: Record<string, unknown> = {}) => {
    const template = liveVoiceDictionaries[locale]?.[key] ?? liveVoiceDictionaries.en[key] ?? key;
    return String(template).replace(/\{([A-Za-z0-9_]+)\}/g, (_, name) =>
      String(params[name] ?? '{' + name + '}'),
    );
  };
}

export function registerDshLocales(ctx: any) {
  if (!ctx.locale) return createFallbackTranslator();
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

export const registerLiveVoiceLocales = registerDshLocales;
