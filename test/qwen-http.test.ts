// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  QwenHttpHost,
  resolveQwenBaseUrl,
  validateQwenConfig,
} from '../src/engines/qwen-http-host.ts';
import { encodeMonoPcm16Wav } from '../src/engines/recognition/whisper-http.ts';
import { QwenHttpSpeakingEngine } from '../src/engines/speaking/qwen-http.ts';

test('Qwen host permits only loopback and maps pt-BR onto the unified API', async () => {
  assert.throws(() => resolveQwenBaseUrl('https://example.com'), /loopback/);
  assert.deepEqual(validateQwenConfig({ baseUrl: 'http://localhost:8080', timeoutMs: 300000 }), {
    baseUrl: 'http://localhost:8080/',
    timeoutMs: 300000,
  });
  const requests = [];
  const wav = encodeMonoPcm16Wav(new Float32Array(16000).fill(0.1), 16000);
  const host = new QwenHttpHost({
    fetchImpl: async (url, options = {}) => {
      requests.push({ url: String(url), options });
      if (String(url).endsWith('/health'))
        return Response.json({ status: 'ok', models: { asr: true, tts: true } });
      if (String(url).endsWith('/v1/audio/transcriptions'))
        return Response.json({ text: 'Olá do Qwen' });
      return new Response(new Uint8Array(44), { headers: { 'content-type': 'audio/wav' } });
    },
  });
  assert.equal((await host.capability()).supported, true);
  assert.deepEqual(await host.transcribe(wav, { lang: 'pt-BR' }), { text: 'Olá do Qwen' });
  const form = requests[2].options.body;
  assert.equal(form.get('language'), 'portuguese');
  const speech = await host.synthesize('Olá', { lang: 'pt-BR' });
  assert.equal(speech.byteLength, 44);
  assert.equal(JSON.parse(requests[3].options.body).language, 'portuguese');
  host.dispose();
});

test('Qwen host adapts OminiX model status and JSON/base64 transcription', async () => {
  const requests = [];
  const wav = encodeMonoPcm16Wav(new Float32Array(16000).fill(0.1), 16000);
  const host = new QwenHttpHost({
    fetchImpl: async (url, options = {}) => {
      requests.push({ url: String(url), options });
      if (String(url).endsWith('/health'))
        return Response.json({ status: 'healthy', service: 'ominix-api' });
      if (String(url).endsWith('/v1/models/status'))
        return Response.json({
          status: 'success',
          models: { asr: 'qwen3-asr', qwen3_tts: 'customvoice' },
        });
      return Response.json({ text: 'Teste OminiX' });
    },
  });
  assert.equal((await host.capability()).supported, true);
  assert.deepEqual(await host.transcribe(wav, { lang: 'pt-BR' }), { text: 'Teste OminiX' });
  const request = requests.at(-1).options;
  assert.equal(request.headers['content-type'], 'application/json');
  const body = JSON.parse(request.body);
  assert.equal(body.language, 'portuguese');
  assert.equal(Buffer.from(body.file, 'base64').byteLength, wav.byteLength);
  host.dispose();
});

test('Qwen browser speaking engine waits for WAV playback and supports pause', async () => {
  let audio;
  const revoked = [];
  class FakeAudio extends EventTarget {
    constructor(url) {
      super();
      this.url = url;
      this.paused = true;
      audio = this;
    }
    play() {
      this.paused = false;
      queueMicrotask(() => this.dispatchEvent(new Event('ended')));
      return Promise.resolve();
    }
    pause() {
      this.paused = true;
    }
  }
  const globals = {
    crypto,
    fetch: async () =>
      new Response(new Uint8Array(44), { headers: { 'content-type': 'audio/wav' } }),
    Audio: FakeAudio,
    URL: { createObjectURL: () => 'blob:qwen', revokeObjectURL: (value) => revoked.push(value) },
  };
  const engine = new QwenHttpSpeakingEngine({ globals, lang: 'pt-BR' });
  await engine.speak('Teste', { rate: 1.2 });
  assert.equal(audio.playbackRate, 1.2);
  assert.deepEqual(revoked, ['blob:qwen']);
});
