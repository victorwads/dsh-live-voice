import test from 'node:test';
import assert from 'node:assert/strict';
import { assertMatchingVersions, checkVersions } from '../scripts/check-versions.mjs';

test('main and debugger manifests use the same version', async () => {
  await checkVersions();
});
test('release check rejects mismatched and missing versions', () => {
  assert.throws(
    () => assertMatchingVersions({ version: '0.3.2' }, { version: '0.0.0' }),
    /must match/,
  );
  assert.throws(() => assertMatchingVersions({}, {}), /must match/);
  assert.doesNotThrow(() =>
    assertMatchingVersions({ version: '0.4.0-developing.1' }, { version: '0.4.0-developing.1' }),
  );
});
