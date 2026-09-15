// @ts-nocheck
import { build } from 'esbuild';
import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';
const entry = `import React from 'react'; import {createRoot} from 'react-dom/client'; import {createComponents} from './src/client/components.ts'; import {styles} from './src/client/styles.ts'; const style=document.createElement('style');style.textContent=styles;document.head.appendChild(style); const state={conversation:true,listening:true,recognizing:true,speaking:false,paused:false,settings:{},capabilities:{}}; const c={subscribe:()=>()=>{},getSnapshot:()=>state,meter:{level:()=>0.4}};const {RecordingBar}=createComponents(React);createRoot(document.getElementById('root')).render(React.createElement(RecordingBar,{controller:c}));`;
const output = await build({
  stdin: { contents: entry, resolveDir: process.cwd() },
  bundle: true,
  write: false,
  format: 'iife',
  define: { 'process.env.NODE_ENV': '"production"' },
});
const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--disable-background-networking', '--disable-component-update'],
});
try {
  const page = await browser.newPage({ viewport: { width: 980, height: 220 } });
  await page.route('**/*', (r) => r.abort());
  await page.setContent(
    '<style>:root{--dsw-alias-label-primary:#eee;--dsw-alias-label-secondary:#aaa;--dsw-alias-border-l1:#444;--dsw-alias-border-l2:#555;--dsw-alias-bg-layer-1:#292929}body{background:#171717;color:#eee;font:14px system-ui;padding:20px}textarea{margin-top:12px;box-sizing:border-box;width:100%;height:80px;background:#292929;color:#aaa;border:1px solid #444;border-radius:22px;padding:18px}</style><div id="root"></div><textarea placeholder="Isolated preview — not the authenticated DSH page"></textarea>',
  );
  await page.addScriptTag({ content: output.outputFiles[0].text });
  await page.locator('[aria-label="Voice controls"]').waitFor();
  await mkdir('artifacts', { recursive: true });
  await page.screenshot({ path: 'artifacts/voice-ui-preview.png' });
  console.log('Saved isolated UI preview; meter value is synthetic, no audio capture.');
} finally {
  await browser.close();
}
