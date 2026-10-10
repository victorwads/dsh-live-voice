import * as ort from 'onnxruntime-web/wasm';
import { sileroVadAssetBase } from './assets.js';
import { SileroWorkerRuntime, type VadOrt, type VadRequest } from './SileroWorkerRuntime.js';
const scope = globalThis as unknown as {
  onmessage: (event: MessageEvent<VadRequest>) => void;
  postMessage(message: unknown, transfer?: Transferable[]): void;
};
const runtime = new SileroWorkerRuntime(
  ort as unknown as VadOrt,
  sileroVadAssetBase(),
  (message) => {
    scope.postMessage(message, message.pcm ? [message.pcm.buffer] : []);
  },
);
scope.onmessage = (event) => runtime.receive(event.data);
