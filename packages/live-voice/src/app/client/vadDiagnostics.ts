export function createVadAssetDiagnostics(
  base: string,
  fetchImpl: typeof fetch = globalThis.fetch,
) {
  let requested = false;
  let assets = {
    modelBytes: null as number | null,
    wasmBytes: null as number | null,
  };
  return () => {
    if (!requested) {
      requested = true;
      void fetchImpl(base + 'manifest.json', { credentials: 'same-origin', cache: 'no-store' })
        .then(async (r) => {
          if (!r.ok) return;
          const v = await r.json();
          const bytes = (name: string) => {
            const n = v.files?.[name]?.bytes;
            return Number.isSafeInteger(n) && n >= 0 ? n : null;
          };
          assets = {
            modelBytes: bytes('silero_vad_v5.onnx'),
            wasmBytes: bytes('ort-wasm-simd-threaded.wasm'),
          };
        })
        .catch(() => {});
    }
    /* Asset file sizes are not measurements of RAM. */
    return {
      assets: {
        modelBytes: assets.modelBytes,
        wasmBytes: assets.wasmBytes,
        modelMiB: assets.modelBytes === null ? null : assets.modelBytes / 1048576,
        wasmMiB: assets.wasmBytes === null ? null : assets.wasmBytes / 1048576,
      },
    };
  };
}
