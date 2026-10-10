import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('committed bundle checks run only for publication, not regular CI or pushes', () => {
  const ci = readFileSync('.github/workflows/ci.yml', 'utf8');
  const publish = readFileSync('.github/workflows/publish.yml', 'utf8');
  const hook = readFileSync('.githooks/pre-push', 'utf8');
  assert.ok(ci.includes('run: npm test'));
  assert.ok(!ci.includes('check:dist'));
  assert.ok(publish.includes('run: npm run check:dist'));
  assert.ok(publish.indexOf('run: npm run check:dist') < publish.indexOf('- name: Create version tag'));
  assert.ok(!/^npm run check:dist$/m.test(hook));
  assert.ok(hook.includes('npm run typecheck'));
});
