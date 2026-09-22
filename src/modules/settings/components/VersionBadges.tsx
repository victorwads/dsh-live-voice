import React from 'react';
import { useLanguage } from '../../../app/client/i18n/index.js';
import {
  CURRENT_VERSION,
  DSH_BADGE_URL,
  LIVE_VOICE_BADGE_URL,
  RELEASES_URL,
  TESTED_DSH_RELEASE_URL,
  TESTED_DSH_VERSION,
} from '../services/releases.js';
export function VersionBadges() {
  const { scoped: commons } = useLanguage((ctx) => ctx.commons);
  return (
    <div className="dlv-version-badges" aria-label={(commons as any).version.title()}>
      <a
        className="dlv-shields-badge"
        href={RELEASES_URL}
        target="_blank"
        rel="noreferrer"
        aria-label={(commons as any).version.link({ version: CURRENT_VERSION })}
        title={(commons as any).version.label({ version: CURRENT_VERSION })}
      >
        <img src={LIVE_VOICE_BADGE_URL} alt="" />
        <span>{`v${CURRENT_VERSION}`}</span>
      </a>
      <a
        className="dlv-shields-badge"
        href={TESTED_DSH_RELEASE_URL}
        target="_blank"
        rel="noreferrer"
        aria-label={(commons as any).version.compatibilityLink({ version: TESTED_DSH_VERSION })}
        title={(commons as any).version.compatibility({ version: TESTED_DSH_VERSION })}
      >
        <img src={DSH_BADGE_URL} alt="" />
        <span>{`v${TESTED_DSH_VERSION}`}</span>
      </a>
    </div>
  );
}
