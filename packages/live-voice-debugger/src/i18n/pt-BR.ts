import commons from './commons/pt-BR.js';
import recordings from './recordings/pt-BR.js';
import runtimes from './runtimes/pt-BR.js';
import type { DebuggerTranslation } from './base.js';
const translation = { commons, recordings, runtimes } satisfies DebuggerTranslation;
export default Object.freeze(translation);
