import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import type { BuildOptions, Plugin } from 'esbuild';

// Upstream npm archives omit license files. Vendor exact license notices here so
// packaging is deterministic and never downloads code/models from a CDN.
// Sources: https://raw.githubusercontent.com/snakers4/silero-vad/v5.1/LICENSE
// https://raw.githubusercontent.com/microsoft/onnxruntime/v1.22.0/LICENSE
// https://raw.githubusercontent.com/ricky0123/vad/master/LICENSE
const licenses: Record<string, string> = {
  'LICENSE.silero.txt':
    'MIT License\n\nCopyright (c) 2020-present Silero Team\n\nPermission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the "Software"), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the Software is\nfurnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\nSOFTWARE.',
  'LICENSE.onnxruntime.txt':
    'MIT License\n\nCopyright (c) Microsoft Corporation\n\nPermission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the "Software"), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the Software is\nfurnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\nSOFTWARE.\n',
  'LICENSE.vad-web.txt':
    'ISC License\n\nCopyright (c) 2022-present ricky0123\n\nPermission to use, copy, modify, and/or distribute this software for any\npurpose with or without fee is hereby granted, provided that the above\ncopyright notice and this permission notice appear in all copies.\n\nTHE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES\nWITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF\nMERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR\nANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES\nWHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN\nACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF\nOR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.\n\n---\n\nThe file silero_vad.onnx falls under the following license:\n\n---\n\nMIT License\n\nCopyright (c) 2020-present Silero Team\n\nPermission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the "Software"), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the Software is\nfurnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\nSOFTWARE.\n',
};
const copied = ['silero_vad_v5.onnx', 'ort-wasm-simd-threaded.mjs', 'ort-wasm-simd-threaded.wasm'];
const generated = ['vad.worker.js', 'vad.capture.js'];

export async function prepareVadAssets(directory: string, version: string) {
  const require = createRequire(join(directory, 'package.json'));
  const vadRoot = dirname(require.resolve('@ricky0123/vad-web/package.json'));
  // Resolve entry then walk to package root: ORT intentionally hides package.json via exports.
  const ortRoot = dirname(dirname(require.resolve('onnxruntime-web/wasm')));
  for (const [root, expected] of [
    [vadRoot, '0.0.31'],
    [ortRoot, '1.22.0'],
  ]) {
    const metadata = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
    if (metadata.version !== expected)
      throw new Error('Unexpected VAD dependency version: ' + metadata.version);
  }
  const destination = join(directory, 'lib/vad');
  await mkdir(destination, { recursive: true });
  // Remove obsolete outputs from this dedicated generated directory, including GPU EPs.
  const allowed = new Set([...copied, ...generated, ...Object.keys(licenses), 'manifest.json']);
  for (const filename of await readdir(destination)) {
    if (!allowed.has(filename))
      await rm(join(destination, filename), { recursive: true, force: true });
  }
  await copyFile(join(vadRoot, 'dist/silero_vad_v5.onnx'), join(destination, copied[0]));
  for (const filename of copied.slice(1))
    await copyFile(join(ortRoot, 'dist', filename), join(destination, filename));
  for (const [filename, text] of Object.entries(licenses))
    await writeFile(join(destination, filename), text);

  async function manifest() {
    const files: Record<string, { bytes: number; sha256: string }> = {};
    for (const filename of [...generated, ...copied, ...Object.keys(licenses)].sort()) {
      const bytes = await readFile(join(destination, filename));
      files[filename] = {
        bytes: bytes.length,
        sha256: createHash('sha256').update(bytes).digest('hex'),
      };
    }
    await writeFile(
      join(destination, 'manifest.json'),
      JSON.stringify(
        {
          schemaVersion: 1,
          pluginVersion: version,
          dependencies: { '@ricky0123/vad-web': '0.0.31', 'onnxruntime-web': '1.22.0' },
          model: {
            name: 'Silero VAD v5',
            source: '@ricky0123/vad-web/dist/silero_vad_v5.onnx',
            license: 'MIT',
          },
          files,
        },
        null,
        2,
      ) + '\n',
    );
  }
  const manifestPlugin: Plugin = {
    name: 'vad-asset-manifest',
    setup(builder) {
      builder.onEnd(async (result) => {
        if (!result.errors.length) await manifest();
      });
    },
  };
  const options: BuildOptions = {
    absWorkingDir: directory,
    entryPoints: {
      'vad.worker': 'src/modules/recognition/vad/vad.worker.ts',
      'vad.capture': 'src/modules/recognition/vad/vad.capture.ts',
    },
    outdir: 'lib/vad',
    bundle: true,
    format: 'esm',
    platform: 'browser',
    define: { __DLV_VERSION__: JSON.stringify(version) },
    target: ['es2022'],
    logLevel: 'info',
    plugins: [manifestPlugin],
  };
  return options;
}
