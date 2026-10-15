declare const __DLV_VERSION__: string;
export const browserAsrAssetBase = () =>
  '/api/dsh-live-voice/asr/' +
  encodeURIComponent(typeof __DLV_VERSION__ === 'string' ? __DLV_VERSION__ : 'test') +
  '/';
