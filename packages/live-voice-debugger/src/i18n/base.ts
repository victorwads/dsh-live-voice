import type { CommonsTranslation } from './commons/base.js';
import type { RecordingsTranslation } from './recordings/base.js';
import type { RuntimesTranslation } from './runtimes/base.js';
export type DebuggerTranslation = {
  commons: CommonsTranslation;
  recordings: RecordingsTranslation;
  runtimes: RuntimesTranslation;
};
export type DebuggerLocale = 'en' | 'es' | 'fr' | 'hi' | 'pt-BR' | 'zh';
