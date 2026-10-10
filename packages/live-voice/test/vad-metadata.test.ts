import test from 'node:test';
import assert from 'node:assert/strict';
import { createVadAssetDiagnostics } from '../src/app/client/vadDiagnostics.ts';
test('diagnostic metadata fetch is lazy, bounded and never downloads model bytes', async () => {
  const urls: string[] = [];
  const read = createVadAssetDiagnostics('/vad/', async (url: any) => {
    urls.push(url);
    return Response.json({
      files: {
        'silero_vad_v5.onnx': { bytes: 200 },
        'ort-wasm-simd-threaded.wasm': { bytes: 1000 },
        worker: { bytes: 50 },
      },
    });
  });
  assert.deepEqual(urls, []);
  assert.equal(read().assets.modelBytes, null);
  await new Promise((r) => setImmediate(r));
  const snapshot = read();
  assert.equal(snapshot.assets.modelBytes, 200);
  assert.equal(snapshot.assets.wasmBytes, 1000);
  assert.equal(snapshot.assets.modelMiB, 200 / 1048576);
  assert.equal('pageHeap' in snapshot, false);
  assert.equal('transfer' in snapshot, false);
  assert.deepEqual(Object.keys(snapshot), ['assets']);
  assert.deepEqual(urls, ['/vad/manifest.json']);
});
