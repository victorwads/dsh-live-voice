import commons from './commons/zh.js';
import recordings from './recordings/zh.js';
import runtimes from './runtimes/zh.js';
import type { DebuggerTranslation } from './base.js';
const translation = { commons, recordings, runtimes } satisfies DebuggerTranslation;
export default Object.freeze(translation);
