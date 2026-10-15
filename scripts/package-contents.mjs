export function assertPackageContents(metadata, files, vadManifest, asrManifest) {
  const required = [
    'package.json',
    'cordis.patch.yml',
    metadata.main,
    ...Object.values(metadata.exports),
  ];
  if (vadManifest) {
    if (vadManifest.pluginVersion !== metadata.version)
      throw new Error('VAD asset version mismatch');
    required.push(
      'lib/vad/manifest.json',
      ...Object.keys(vadManifest.files).map((name) => 'lib/vad/' + name),
    );
  }
  if (asrManifest) {
    if (asrManifest.version !== metadata.version) throw new Error('ASR asset version mismatch');
    if (
      !Array.isArray(asrManifest.assets) ||
      !asrManifest.assets.includes('asr.worker.js') ||
      !asrManifest.assets.includes('ort-wasm-simd-threaded.jsep.wasm') ||
      !asrManifest.assets.includes('ort-wasm-simd-threaded.asyncify.wasm')
    )
      throw new Error('ASR runtime manifest incomplete');
    required.push('lib/asr/manifest.json', ...asrManifest.assets.map((name) => 'lib/asr/' + name));
  }
  const packed = new Set(files.map((file) => file.path));
  for (const entry of required) {
    const path = entry.startsWith('./') ? entry.slice(2) : entry;
    if (!packed.has(path) || !files.some((file) => file.path === path && file.size > 0)) {
      throw new Error(metadata.name + ': missing or empty npm package entry: ' + path);
    }
  }
}
