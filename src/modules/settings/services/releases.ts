declare const __DLV_VERSION__: string;
declare const __DLV_TESTED_DSH_VERSION__: string;

// Both values are injected from package.json by scripts/build.ts.
export const CURRENT_VERSION = __DLV_VERSION__;
export const TESTED_DSH_VERSION = __DLV_TESTED_DSH_VERSION__;
export const REPOSITORY_URL = 'https://github.com/victorwads/dsh-live-voice';
export const RELEASES_URL = `${REPOSITORY_URL}/releases`;
export const LATEST_RELEASE_API_URL =
  'https://api.github.com/repos/victorwads/dsh-live-voice/releases/latest';
export const RELEASE_CHECK_STORAGE_KEY = 'dsh-live-voice.latest-release-check';
export const RELEASE_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

export const LIVE_VOICE_BADGE_URL = 'https://cdn.simpleicons.org/npm/white';
export const DSH_BADGE_URL = 'https://cdn.simpleicons.org/deepseek/white';
export const TESTED_DSH_RELEASE_URL = `https://github.com/deepseek-ai/deepseek-harness/releases/tag/v${TESTED_DSH_VERSION}`;

function versionParts(version) {
  const normalized = String(version || '')
    .trim()
    .replace(/^v/i, '')
    .split('+', 1)[0];
  const [core = '', prerelease = ''] = normalized.split('-', 2);
  const numbers = core.split('.').map((part) => {
    const match = part.match(/^\d+/);
    return match ? Number(match[0]) : 0;
  });
  while (numbers.length < 3) numbers.push(0);
  return { numbers, prerelease: prerelease ? prerelease.split('.') : [] };
}

function compareIdentifier(left, right) {
  const leftNumber = /^\d+$/.test(left) ? Number(left) : null;
  const rightNumber = /^\d+$/.test(right) ? Number(right) : null;
  if (leftNumber !== null && rightNumber !== null) return Math.sign(leftNumber - rightNumber);
  if (leftNumber !== null) return -1;
  if (rightNumber !== null) return 1;
  return left.localeCompare(right);
}

export function compareVersions(left, right) {
  const a = versionParts(left);
  const b = versionParts(right);
  for (let index = 0; index < Math.max(a.numbers.length, b.numbers.length); index++) {
    const difference = (a.numbers[index] || 0) - (b.numbers[index] || 0);
    if (difference) return Math.sign(difference);
  }
  if (!a.prerelease.length && !b.prerelease.length) return 0;
  if (!a.prerelease.length) return 1;
  if (!b.prerelease.length) return -1;
  for (let index = 0; index < Math.max(a.prerelease.length, b.prerelease.length); index++) {
    if (a.prerelease[index] === undefined) return -1;
    if (b.prerelease[index] === undefined) return 1;
    const difference = compareIdentifier(a.prerelease[index], b.prerelease[index]);
    if (difference) return difference;
  }
  return 0;
}

function readCached(storage, now) {
  try {
    const cached = JSON.parse(storage?.getItem(RELEASE_CHECK_STORAGE_KEY) || 'null');
    if (
      cached &&
      Number.isFinite(cached.checkedAt) &&
      now - cached.checkedAt >= 0 &&
      now - cached.checkedAt < RELEASE_CHECK_INTERVAL_MS
    )
      return cached;
  } catch {}
  return null;
}

function writeCached(storage, value) {
  try {
    storage?.setItem(RELEASE_CHECK_STORAGE_KEY, JSON.stringify(value));
  } catch {}
}

export async function checkLatestRelease({
  fetchImpl = globalThis.window?.fetch?.bind(globalThis.window),
  storage = globalThis.window?.localStorage,
  now = Date.now(),
} = {}) {
  const cached = readCached(storage, now);
  if (cached) return cached;

  // Record the attempt before requesting so a failing public endpoint is not retried on every mount.
  const attempted = { checkedAt: now, release: null };
  writeCached(storage, attempted);
  if (typeof fetchImpl !== 'function') return attempted;

  try {
    const response = await fetchImpl(LATEST_RELEASE_API_URL, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!response.ok) return attempted;
    const body = await response.json();
    if (typeof body?.tag_name !== 'string' || !body.tag_name.trim()) return attempted;
    const release = {
      tag: body.tag_name.trim(),
      url:
        typeof body.html_url === 'string' && body.html_url.startsWith('https://github.com/')
          ? body.html_url
          : RELEASES_URL,
    };
    const result = { checkedAt: now, release };
    writeCached(storage, result);
    return result;
  } catch {
    return attempted;
  }
}

export function hasNewerRelease(release, currentVersion = CURRENT_VERSION) {
  return Boolean(release?.tag && compareVersions(release.tag, currentVersion) > 0);
}
