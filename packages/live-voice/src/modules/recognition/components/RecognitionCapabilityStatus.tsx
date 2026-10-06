import React from 'react';
import { useLanguage } from '../../../app/client/i18n/index.js';
import { StatusMessage } from '../../../shared/design-system/index.js';
export function RecognitionCapabilityStatus({
  capability,
}: {
  capability?: { supported?: boolean; reason?: string };
}) {
  const { scoped: recognition } = useLanguage((ctx) => ctx.recognition);
  if (!capability)
    return <StatusMessage>{(recognition as any).microphone.checking()}</StatusMessage>;
  if (capability.supported === false)
    return (
      <StatusMessage>
        {capability.reason || (recognition as any).status.unavailable()}
      </StatusMessage>
    );
  return null;
}
