import { createTranslationRuntime } from '@wads.dev/i18n-react';
import type { DebuggerLocale, DebuggerTranslation } from './base.js';
import { Langs } from './catalogs.js';
export const {
  TranslationProvider: DebuggerTranslationProvider,
  useTranslation: useDebuggerLanguage,
} = createTranslationRuntime<DebuggerLocale, DebuggerTranslation>({
  availableLangs: Langs,
  defaultLang: 'en',
});
