// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkLatestRelease,
  compareVersions,
  hasNewerRelease,
  LATEST_RELEASE_API_URL,
  RELEASE_CHECK_INTERVAL_MS,
  RELEASE_CHECK_STORAGE_KEY,
} from '../src/modules/settings/services/releases.ts';

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  };
}

test('compares release tags including prereleases', () => {
  assert.equal(compareVersions('v0.2.3', '0.2.2'), 1);
  assert.equal(compareVersions('0.2.2', 'v0.2.2'), 0);
  assert.equal(compareVersions('0.2.2-alpha.2', '0.2.2-alpha.1'), 1);
  assert.equal(compareVersions('0.2.2-alpha.2', '0.2.2'), -1);
  assert.equal(compareVersions('1.0.0', '0.99.99'), 1);
  assert.equal(hasNewerRelease({ tag: 'v0.2.3' }, '0.2.2'), true);
  assert.equal(hasNewerRelease({ tag: 'v0.2.2' }, '0.2.2'), false);
});

test('checks GitHub at most once in 24 hours and refreshes after expiry', async () => {
  const storage = memoryStorage();
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push([url, options]);
    return Response.json({
      tag_name: 'v0.3.0',
      html_url: 'https://github.com/victorwads/dsh-live-voice/releases/tag/v0.3.0',
    });
  };
  const first = await checkLatestRelease({ fetchImpl, storage, now: 1_000 });
  const cached = await checkLatestRelease({ fetchImpl, storage, now: 2_000 });
  const refreshed = await checkLatestRelease({
    fetchImpl,
    storage,
    now: 1_000 + RELEASE_CHECK_INTERVAL_MS,
  });

  assert.equal(calls.length, 2);
  assert.equal(calls[0][0], LATEST_RELEASE_API_URL);
  assert.equal(calls[0][1].headers.Accept, 'application/vnd.github+json');
  assert.deepEqual(cached, first);
  assert.equal(refreshed.release.tag, 'v0.3.0');
  assert.equal(
    JSON.parse(storage.getItem(RELEASE_CHECK_STORAGE_KEY)).checkedAt,
    1_000 + RELEASE_CHECK_INTERVAL_MS,
  );
});

test('caches a failed attempt for the day and does not expose unsafe release URLs', async () => {
  const failedStorage = memoryStorage();
  let failures = 0;
  const failingFetch = async () => {
    failures++;
    throw new Error('offline');
  };
  await checkLatestRelease({ fetchImpl: failingFetch, storage: failedStorage, now: 5_000 });
  await checkLatestRelease({ fetchImpl: failingFetch, storage: failedStorage, now: 6_000 });
  assert.equal(failures, 1);

  const storage = memoryStorage();
  const result = await checkLatestRelease({
    fetchImpl: async () => Response.json({ tag_name: 'v9.0.0', html_url: 'javascript:alert(1)' }),
    storage,
    now: 10_000,
  });
  assert.equal(result.release.url, 'https://github.com/victorwads/dsh-live-voice/releases');
});
