import test from 'node:test';
import assert from 'node:assert/strict';
import { PinDetector } from '../src/modules/recording/PinDetector.js';
import { WhisperHttpRecognitionEngine } from '../src/modules/recognition/engines/whisper/WhisperRecognitionEngine.js';
import { recordingSegments } from '../src/modules/recording/types.js';
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
test('VAD retains transition pins only and backdates confirmed silence', () => {
  const pins: unknown[] = [];
  const detector = new PinDetector({
    sampleRate: 1000,
    threshold: 0.5,
    minimumSpeechMs: 100,
    silenceMs: 500,
    onPin: (...args) => pins.push(args),
    onActivity: () => {},
  });
  detector.frame(0.8, 100);
  detector.frame(0.8, 200);
  detector.frame(0.1, 499);
  assert.equal(pins.length, 1);
  detector.frame(0.1, 1);
  assert.deepEqual(pins, [
    ['speech-start', 0, 100],
    ['silence-start', 300, 800],
  ]);
});
test('recording engine saves continuous PCM before VAD and transcribes recording ranges with audit', async () => {
  let ingest: any;
  let probability: any;
  const pcm: number[] = [];
  const attempts: any[] = [];
  const session: any = {
    id: 'r',
    startedAt: new Date().toISOString(),
    sampleRate: 16000,
    savedSamples: 0,
    capturedSamples: 0,
    state: 'recording',
    pins: [],
    attempts,
  };
  const writer = {
    session,
    append: async (data: Float32Array) => {
      pcm.push(...data);
      session.capturedSamples = session.savedSamples = pcm.length;
    },
    pin: async (kind: string, atSample: number, confirmedAtSample: number) => {
      const pin = { id: 'p' + session.pins.length, kind, atSample, confirmedAtSample };
      session.pins.push(pin);
      return pin;
    },
    read: async (start: number, end: number) => Float32Array.from(pcm.slice(start, end)),
    attempt: async (a: any) => {
      const i = attempts.findIndex((x) => x.id === a.id);
      if (i < 0) attempts.push(a);
      else attempts[i] = a;
    },
    finish: async (state = 'completed') => {
      session.state = state;
    },
  };
  const results: any[] = [];
  const requests: any[] = [];
  const engine = new WhisperHttpRecognitionEngine({
    meter: { context: { sampleRate: 16000 }, source: {} },
    recordings: { begin: async () => writer },
    voiceDetectionEngine: 'silero',
    voiceDetectionPreset: 'custom',
    voiceDetectionCustomSilenceMs: 500,
    voiceDetectionMinimumSpeechMs: 50,
    recordingPreRollMs: 0,
    recordingPostRollMs: 0,
    globals: {
      fetch: async (_url: string, request: any) => {
        requests.push(request);
        return { ok: true, json: async () => ({ ok: true, value: { text: 'saved speech' } }) };
      },
    },
    vadAvailable: async () => true,
    vadFactory: ({ onProbability }: any) => {
      probability = onProbability;
      return { release() {} };
    },
    vadCapture: async (_context: any, _source: any, _vad: any, onPcm: any) => {
      ingest = onPcm;
      return { finish: async () => {}, release() {} };
    },
  });
  await engine.start({ onResult: (result: any) => results.push(result) });
  const frame = (value: number, count: number, p: number) => {
    const data = new Float32Array(count).fill(value);
    ingest(data, 16000);
    probability({ probability: p, pcm: data });
  };
  frame(0, 1600, 0);
  frame(0.1, 1600, 0.9);
  frame(0, 8000, 0);
  await engine.finish();
  for (let i = 0; i < 5; i++) await tick();
  assert.equal(pcm.length, 11200);
  assert.equal(requests.length, 1);
  assert.deepEqual(
    session.pins.map((p: any) => [p.kind, p.atSample]),
    [
      ['silence-start', 0],
      ['speech-start', 1600],
      ['silence-start', 3200],
    ],
  );
  assert.equal(attempts[0].status, 'success');
  assert.equal(attempts[0].text, 'saved speech');
  assert.equal(results[0].final, 'saved speech');
  assert.deepEqual(
    recordingSegments(session).map((s) => s.kind),
    ['silence', 'speech', 'silence'],
  );
  await engine.stop();
});
