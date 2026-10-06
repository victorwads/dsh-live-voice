import React from 'react';
import { useLanguage } from '../../../../app/client/i18n/index.js';
export function RecognitionStatus({ capabilities = {} }: any) {
  const { scoped: recognition } = useLanguage((ctx) => ctx.recognition);
  return (
    <>
      {capabilities.capture?.supported === false ? (
        <p role="status">
          {(recognition as any).microphone.failure({ reason: capabilities.capture.reason || '' })}
        </p>
      ) : capabilities.capture?.permission === 'prompt' ? (
        <p role="status">{(recognition as any).microphone.permissionHelp()}</p>
      ) : null}
      {capabilities.recognition?.supported === false && (
        <p role="status">{capabilities.recognition.reason}</p>
      )}
    </>
  );
}
