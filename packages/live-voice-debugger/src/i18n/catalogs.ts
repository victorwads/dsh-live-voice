import en from './en.js';
import es from './es.js';
import fr from './fr.js';
import hi from './hi.js';
import ptBR from './pt-BR.js';
import zh from './zh.js';
import type { AvailableLangs } from '@wads.dev/i18n-ts';
import type { DebuggerLocale, DebuggerTranslation } from './base.js';
export const dictionaries = Object.freeze({ en, es, fr, hi, 'pt-BR': ptBR, zh }) satisfies Record<
  DebuggerLocale,
  DebuggerTranslation
>;
export const Langs = {
  en: { name: 'English', short: 'en', locale: 'en', lang: () => import('./en.js') },
  es: { name: 'Español', short: 'es', locale: 'es', lang: () => import('./es.js') },
  fr: { name: 'Français', short: 'fr', locale: 'fr', lang: () => import('./fr.js') },
  hi: { name: 'हिन्दी', short: 'hi', locale: 'hi', lang: () => import('./hi.js') },
  'pt-BR': {
    name: 'Português (Brasil)',
    short: 'pt-BR',
    locale: 'pt-BR',
    lang: () => import('./pt-BR.js'),
  },
  zh: { name: '简体中文', short: 'zh', locale: 'zh', lang: () => import('./zh.js') },
} satisfies AvailableLangs<DebuggerLocale, DebuggerTranslation>;
export function normalizeDebuggerLocale(locale: string | undefined): DebuggerLocale {
  if (locale && Object.hasOwn(dictionaries, locale)) return locale as DebuggerLocale;
  const base = locale?.split('-')[0];
  return base && Object.hasOwn(dictionaries, base) ? (base as DebuggerLocale) : 'en';
}
export function copyFor(locale = 'en') {
  return dictionaries[normalizeDebuggerLocale(locale)];
}
