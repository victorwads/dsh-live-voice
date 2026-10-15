import { browserAsrModels } from './modelCatalog.js';
// Bump when worker protocol or inference implementation changes without a package release.
const workerProtocol = 'asr-worker-v3-ort-1.31.0-dev.20260914-8d85527a0';
// Pinned runtime versions match the immutable dependencies in the package manifest.
export const browserAsrVersions = { onnx: '1.31.0-dev.20260914-8d85527a0', transformers: '4.3.1' };
export const browserAsrRuntimeId = (() => {
  const source = workerProtocol + JSON.stringify(browserAsrModels);
  let hash = 2166136261;
  for (let i = 0; i < source.length; i++) hash = Math.imul(hash ^ source.charCodeAt(i), 16777619);
  return workerProtocol + '-' + (hash >>> 0).toString(16);
})();
