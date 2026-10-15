// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { BrowserLocalRecognitionEngine } from '../src/modules/recognition/local/BrowserLocalRecognitionEngine.ts';
import { mockRecordingRepository } from './helpers/recording.ts';
for (const modelKey of ['whisper-tiny', 'qwen-0.6b'])
  test(
    modelKey +
      ' local recording pipeline sends PCM only to worker, preserves audit and releases leases',
    async (t) => {
      const recordings = mockRecordingRepository();
      let ingest,
        classify,
        leases = 0;
      const calls = [],
        results = [],
        errors = [];
      const manager = {
        getSnapshot: () => ({
          storage: true,
          gpu: 'available',
          models: { [modelKey]: { phase: 'downloaded' } },
        }),
        acquire: () => {
          leases++;
          return () => leases--;
        },
        prepare: async (...args) => calls.push(['prepare', ...args]),
        transcribe: async (key, pcm, lang, signal) => {
          calls.push(['transcribe', key, pcm.length, lang, !!signal]);
          return 'Local result';
        },
      };
      const engine = new BrowserLocalRecognitionEngine({
        manager,
        modelKey,
        device: 'webgpu',
        message: (code) => code,
        recordings,
        meter: { context: { sampleRate: 16000 }, source: {} },
        voiceDetectionEngine: 'silero',
        voiceDetectionPreset: 'short',
        voiceDetectionMinimumSpeechMs: 50,
        vadAvailable: async () => true,
        vadFactory: (options) => {
          classify = options.onProbability;
          return { release() {} };
        },
        vadCapture: async (_context, _source, _stream, callback) => {
          ingest = callback;
          return { finish: async () => {}, release() {} };
        },
        globals: {
          fetch: () => {
            throw Error('HTTP forbidden for browser-local recognition');
          },
        },
      });
      t.after(() => engine.stop());
      assert.equal((await engine.capability()).supported, true);
      await engine.start({
        lang: 'pt-BR',
        onResult: (result) => results.push(result),
        onError: (error) => errors.push(error),
      });
      assert.equal(leases, 1);
      const frame = (probability) => {
        const pcm = new Float32Array(512).fill(probability ? 0.1 : 0);
        ingest(pcm, 16000);
        classify({ probability, pcm });
      };
      for (let i = 0; i < 12; i++) frame(1);
      for (let i = 0; i < 18; i++) frame(0);
      await engine.finish();
      assert.equal(errors.length, 0);
      assert.ok(
        calls.some(
          (call) => call[0] === 'transcribe' && call[1] === modelKey && call[3] === 'pt-BR',
        ),
      );
      assert.equal(results[0].final, 'Local result');
      assert.equal(leases, 0);
      const session = (await recordings.list())[0];
      assert.equal(
        session.attempts[0].engine,
        modelKey === 'qwen-0.6b' ? 'qwen-browser' : 'whisper-browser',
      );
      assert.equal(session.attempts[0].status, 'success');
      assert.equal(session.attempts[0].text, 'Local result');
    },
  );
