import en from './en.js';
import es from './es.js';
import fr from './fr.js';
import hi from './hi.js';
import ptBR from './pt-BR.js';
import zh from './zh.js';
import type { LiveVoiceLocale, LiveVoiceTranslation } from './base.js';

export const appDictionaries = Object.freeze({
  en,
  es,
  fr,
  hi,
  'pt-BR': ptBR,
  zh,
}) satisfies Record<LiveVoiceLocale, LiveVoiceTranslation>;

export * from './base.js';
