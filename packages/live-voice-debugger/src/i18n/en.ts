import commons from './commons/en.js';
import recordings from './recordings/en.js';
import runtimes from './runtimes/en.js';
import type { DebuggerTranslation } from './base.js';
const translation = { commons, recordings, runtimes } satisfies DebuggerTranslation;
export default Object.freeze(translation);
