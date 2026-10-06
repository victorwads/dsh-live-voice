// @ts-nocheck
import { chromium } from 'playwright-core';
const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--disable-background-networking', '--disable-component-update'],
});
try {
  const context = await browser.newContext();
  await context.route('**/*', (route) => {
    if (route.request().url() === 'http://127.0.0.1:3080/')
      return route.fulfill({
        contentType: 'text/html',
        body: '<html><body>Isolated capability probe, not the DSH application.</body></html>',
      });
    return route.abort();
  });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:3080/');
  const result = await page.evaluate(async () => {
    const C = window.SpeechRecognition || window.webkitSpeechRecognition;
    const result = {
      userAgent: navigator.userAgent,
      secureContext: isSecureContext,
      recognitionConstructor: !!C,
      processLocally: C ? 'processLocally' in new C() : false,
      availabilityAPI: typeof C?.available,
      localVoices: speechSynthesis.getVoices().filter((v) => v.localService).length,
    };
    if (typeof C?.available === 'function')
      for (const lang of ['pt-BR', 'en-US']) {
        try {
          result[lang] = await Promise.race([
            C.available({ langs: [lang], processLocally: true }),
            new Promise((r) => setTimeout(() => r('timeout'), 3000)),
          ]);
        } catch (error) {
          result[lang] = error.name + ': ' + error.message;
        }
      }
    return result;
  });
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
