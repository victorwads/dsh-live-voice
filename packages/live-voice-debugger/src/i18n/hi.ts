import commons from './commons/hi.js';
import recordings from './recordings/hi.js';
import runtimes from './runtimes/hi.js';
import type { DebuggerTranslation } from './base.js';
const translation = { commons, recordings, runtimes } satisfies DebuggerTranslation;
export default Object.freeze(translation);
