import React from 'react';
import { checkLatestRelease, hasNewerRelease } from '../services/releases.js';
export function useReleaseStatus() {
  const [latestRelease, setLatestRelease] = React.useState<{ tag: string; url: string } | null>(
    null,
  );
  React.useEffect(() => {
    let active = true;
    void checkLatestRelease().then((result) => {
      if (active) setLatestRelease(result.release);
    });
    return () => {
      active = false;
    };
  }, []);
  return { latestRelease, updateAvailable: hasNewerRelease(latestRelease) };
}
