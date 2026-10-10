declare const __DLV_VERSION__: string;
/** Build-defined plugin version; unbundled unit tests deliberately use a stable fallback. */
export const sileroVadAssetBase = () =>
  '/api/dsh-live-voice/vad/' +
  encodeURIComponent(typeof __DLV_VERSION__ === 'string' ? __DLV_VERSION__ : 'test') +
  '/';

/** A small capability response; never downloads the model or initializes ONNX. */
export async function sileroVadAvailable(
  fetchImpl: typeof fetch = globalThis.fetch,
): Promise<boolean> {
  try {
    const response = await fetchImpl(sileroVadAssetBase() + 'availability', {
      credentials: 'same-origin',
      cache: 'no-store',
    });
    return response.ok && (await response.json()).available === true;
  } catch {
    return false;
  }
}
