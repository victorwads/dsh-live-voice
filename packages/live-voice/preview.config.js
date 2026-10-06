import { createRequire } from 'node:module';
import { defineConfig } from '@previewjs/config';

const require = createRequire(import.meta.url);
const packageMetadata = require('./package.json');

export default defineConfig({
  wrapper: {
    path: '__previewjs__/Wrapper.tsx',
    componentName: 'Wrapper',
  },
  vite: {
    define: {
      __DLV_VERSION__: JSON.stringify(packageMetadata.version),
      __DLV_TESTED_DSH_VERSION__: JSON.stringify(packageMetadata.dshTestedVersion),
    },
  },
});
