import React from 'react';
import { useLanguage } from '../../../app/client/i18n/index.js';
import { REPOSITORY_URL } from '../services/releases.js';
import { IconButton } from '../../../shared/design-system/index.js';
import { useReleaseStatus } from '../hooks/index.js';
import { VersionBadges } from './VersionBadges.js';
export function SettingsHeader({ onClose }: { onClose?(): void }) {
  const { scoped: commons } = useLanguage((ctx) => ctx.commons);
  const { scoped: settings } = useLanguage((ctx) => ctx.settings);
  const { latestRelease, updateAvailable } = useReleaseStatus();
  return (
    <div className="dlv-settings-heading">
      <h3>{(commons as any).pluginName()}</h3>
      <VersionBadges />
      <span className="dlv-heading-divider" aria-hidden />
      {updateAvailable && latestRelease ? (
        <>
          <a
            className="dlv-version-badge dlv-update-badge"
            href={latestRelease.url}
            target="_blank"
            rel="noreferrer"
            aria-label={(commons as any).update.link({ version: latestRelease.tag })}
            title={(commons as any).update.version({ version: latestRelease.tag })}
          >
            <span className="dlv-update-icon" aria-hidden>
              ↑
            </span>
            {(commons as any).update.label()}
          </a>
          <span className="dlv-heading-divider" aria-hidden />
        </>
      ) : null}
      <a
        className="dlv-version-badge dlv-star-badge"
        href={REPOSITORY_URL}
        target="_blank"
        rel="noreferrer"
        aria-label={`Star DSH Live Voice on GitHub`}
        title={(commons as any).repository.starLabel()}
      >
        ★ {(commons as any).repository.starLabel()}
      </a>
      {onClose ? (
        <IconButton icon="close" label={(settings as any).close()} onClick={onClose} />
      ) : null}
    </div>
  );
}
