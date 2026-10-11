export function assertPackageContents(metadata, files, vadManifest) {
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
  const packed = new Set(files.map((file) => file.path));
  for (const entry of required) {
    const path = entry.startsWith('./') ? entry.slice(2) : entry;
    if (!packed.has(path) || !files.some((file) => file.path === path && file.size > 0)) {
      throw new Error(metadata.name + ': missing or empty npm package entry: ' + path);
    }
  }
}
