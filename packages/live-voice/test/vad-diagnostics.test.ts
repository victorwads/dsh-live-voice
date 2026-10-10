import test from 'node:test';
import assert from 'node:assert/strict';
import { readCoordinatorDiagnostics } from '../src/modules/core/diagnostics.ts';
test('Silero diagnostics use resampled rate and probability thresholds, never legacy RMS', () => {
  const d: any = readCoordinatorDiagnostics({
    getSnapshot: () => ({
      settings: { recognitionEngine: 'qwen-http', voiceDetectionEngine: 'silero' },
    }),
    meter: { context: { sampleRate: 48000 } },
    recognition: {
      session: {
        detector: 'silero',
        sampleRate: 16000,
        chunks: [],
        samples: 16000,
        silence: 8000,
        probability: 0.8,
        transcriptionQueue: [{ samples: new Float32Array(16000) }],
      },
    },
  });
  assert.equal(d.vad.threshold, null);
  assert.equal(d.vad.positiveSpeechThreshold, 0.5);
  assert.equal(d.vad.silenceMs, 500);
  assert.equal(d.recognition.queue[0].durationMs, 1000);
  assert.equal(d.vad.probability, 0.8);
  assert.equal(d.chunker.accountedPcmBytes, 64000);
});
