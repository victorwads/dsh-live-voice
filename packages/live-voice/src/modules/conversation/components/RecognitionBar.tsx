import React from 'react';
import { RecordingProgress } from './RecordingProgress.js';
import { Waveform } from './Waveform.js';
export function RecognitionBar({ controller, listening, label, status, leading, children }: any) {
  return (
    <div className="dlv-pill" role="group" aria-label={label}>
      {leading}
      <RecordingProgress controller={controller} />
      <Waveform controller={controller} enabled={Boolean(listening)} />
      <span className="dlv-status" role="status" aria-live="polite">
        {status}
      </span>
      {children}
    </div>
  );
}
