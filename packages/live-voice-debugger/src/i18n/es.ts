import commons from './commons/es.js';
import recordings from './recordings/es.js';
import runtimes from './runtimes/es.js';
import type { DebuggerTranslation } from './base.js';
const translation = { commons, recordings, runtimes } satisfies DebuggerTranslation;
export default Object.freeze(translation);
