import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { syncDebuggerTheme } from '../src/theme.js';

test('debugger copies host theme tokens and follows subsequent theme changes', () => {
  const host = new JSDOM('<body></body>');
  const popup = new JSDOM('<body></body>');
  try {
    host.window.document.body.style.setProperty('--dsw-alias-bg-base', '#151517');
    host.window.document.body.style.colorScheme = 'dark';
    syncDebuggerTheme(host.window as unknown as Window, popup.window.document);
    assert.equal(
      popup.window.document.documentElement.style.getPropertyValue('--dsw-alias-bg-base'),
      '#151517',
    );
    assert.equal(
      popup.window.document.documentElement.style.getPropertyValue('--dlvd-color-scheme'),
      'dark',
    );
    host.window.document.body.style.setProperty('--dsw-alias-bg-base', '#ffffff');
    host.window.document.body.style.colorScheme = 'light';
    syncDebuggerTheme(host.window as unknown as Window, popup.window.document);
    assert.equal(
      popup.window.document.documentElement.style.getPropertyValue('--dsw-alias-bg-base'),
      '#ffffff',
    );
    assert.equal(
      popup.window.document.documentElement.style.getPropertyValue('--dlvd-color-scheme'),
      'light',
    );
  } finally {
    host.window.close();
    popup.window.close();
  }
});
