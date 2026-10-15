import commons from './commons/fr.js';
import recordings from './recordings/fr.js';
import runtimes from './runtimes/fr.js';
import type { DebuggerTranslation } from './base.js';
const translation = { commons, recordings, runtimes } satisfies DebuggerTranslation;
export default Object.freeze(translation);
