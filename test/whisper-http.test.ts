// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  encodeMonoPcm16Wav,
  WhisperHttpRecognitionEngine,
} from '../src/engines/recognition/whisper-http.ts';
import {
  resolveWhisperUrl,
  validateMonoPcm16Wav,
  WhisperHttpHost,
} from '../src/engines/recognition/whisper-http-host.ts';

test('Whisper host accepts only loopback and canonical mono PCM16 WAV', () => {
  assert.equal(resolveWhisperUrl('http://127.0.0.1:8080/inference').pathname, '/inference');
  for (const url of [
    'https://127.0.0.1/inference',
    'http://example.com/inference',
    'http://user:pass@localhost/inference',
  ])
    assert.throws(() => resolveWhisperUrl(url), /loopback/);
  const wav = encodeMonoPcm16Wav(new Float32Array(48000).fill(0.25), 48000);
  assert.equal(validateMonoPcm16Wav(wav).byteLength, 32044);
  const broken = wav.slice(0);
  new DataView(broken).setUint32(24, 44100, true);
  assert.throws(() => validateMonoPcm16Wav(broken), /16 kHz/);
});

test('Whisper host posts complete WAV multipart and parses final JSON', async () => {
  const wav = encodeMonoPcm16Wav(new Float32Array(16000).fill(0.1), 16000),
    seen = [];
  const host = new WhisperHttpHost({
    fetchImpl: async (url, options) => {
      seen.push({ url: String(url), options });
      if (String(url).endsWith('/health'))
        return new Response('{"status":"ok"}', { headers: { 'content-type': 'application/json' } });
      return Response.json({ text: ' teste final\n' });
    },
  });
  assert.equal((await host.capability()).streaming, false);
  assert.deepEqual(await host.transcribe(wav, { lang: 'pt-BR' }), { text: 'teste final' });
  assert.equal(seen[1].options.method, 'POST');
  assert.equal(seen[1].options.redirect, 'error');
  assert.equal(seen[1].options.body.get('language'), 'pt');
  assert.equal(seen[1].options.body.get('response_format'), 'json');
  assert.deepEqual(await host.transcribe(wav, { lang: 'auto' }), { text: 'teste final' });
  assert.equal(seen[2].options.body.get('language'), 'auto');
});

test('Whisper browser engine segments speech and sends authenticated complete utterance', async () => {
  const requests = [],
    source = {
      connect(node) {
        this.node = node;
      },
      disconnect() {},
    },
    processor = { connect() {}, disconnect() {}, onaudioprocess: null },
    context = {
      sampleRate: 16000,
      destination: {},
      createScriptProcessor() {
        return processor;
      },
      createGain() {
        return { gain: { value: 1 }, connect() {}, disconnect() {} };
      },
    };
  const globals = {
    crypto,
    fetch: async (url, options = {}) => {
      requests.push({ url, options });
      if (String(url).endsWith('capabilities'))
        return Response.json({
          ok: true,
          value: { supported: true, local: true, streaming: false },
        });
      return Response.json({ ok: true, value: { text: 'Olá do Whisper' } });
    },
  };
  const results = [],
    engine = new WhisperHttpRecognitionEngine({ globals, meter: { context, source } });
  assert.equal((await engine.capability()).supported, true);
  await engine.start({ lang: 'pt-BR', onResult: (value) => results.push(value) });
  const emit = (value) =>
    processor.onaudioprocess({
      inputBuffer: { getChannelData: () => new Float32Array(4096).fill(value) },
    });
  emit(0.1);
  emit(0.1);
  emit(0.1);
  emit(0.1);
  emit(0);
  emit(0);
  emit(0);
  emit(0);
  emit(0);
  emit(0);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(requests.at(-1).url, '/api/dsh-live-voice/whisper/transcribe');
  assert.equal(requests.at(-1).options.credentials, 'same-origin');
  assert.doesNotThrow(() => validateMonoPcm16Wav(requests.at(-1).options.body));
  assert.deepEqual(results, [{ final: 'Olá do Whisper', interim: '' }]);
  await engine.stop();
});

test('Whisper voice detection defaults to natural pauses and external presets change segmentation', async () => {
  const run = async (preset) => {
    const requests = [],
      source = { connect() {}, disconnect() {} },
      processor = { connect() {}, disconnect() {}, onaudioprocess: null };
    const context = {
      sampleRate: 16000,
      destination: {},
      createScriptProcessor() {
        return processor;
      },
      createGain() {
        return { gain: { value: 1 }, connect() {}, disconnect() {} };
      },
    };
    const engine = new WhisperHttpRecognitionEngine({
      voiceDetectionPreset: preset,
      globals: {
        crypto,
        fetch: async (url, options = {}) => {
          requests.push({ url, options });
          return Response.json({ ok: true, value: { text: 'done' } });
        },
      },
      meter: { context, source },
    });
    await engine.start({});
    const emit = (value) =>
      processor.onaudioprocess({
        inputBuffer: { getChannelData: () => new Float32Array(4096).fill(value) },
      });
    emit(0.1);
    for (let i = 0; i < 5; i++) emit(0);
    await new Promise((resolve) => setImmediate(resolve));
    const sent = requests.length;
    await engine.stop();
    return sent;
  };
  assert.equal(await run('natural'), 0, '1.28 seconds of silence remains in the same utterance');
  assert.equal(await run('short'), 1, 'short profile sends the utterance sooner');
});
