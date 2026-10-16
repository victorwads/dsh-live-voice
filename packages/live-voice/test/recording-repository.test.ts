import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createRecordingRepository,
  RecordingRepositoryError,
} from '../src/modules/recording/repository.js';
import { createMemoryStore } from '../src/modules/recording/storage.js';
import type { AudioPage } from '../src/modules/recording/codec.js';

// Fake codecs exercise repository ownership/persistence boundaries, not Opus fidelity.
function fakeCodecs() {
  const keys = ['AudioEncoder', 'AudioDecoder', 'AudioData', 'EncodedAudioChunk'] as const;
  const descriptors = keys.map((key) => Object.getOwnPropertyDescriptor(globalThis, key));
  const counts = { encoded: 0, decoded: 0 };
  class Frame {
    sampleRate: number;
    numberOfFrames: number;
    timestamp: number;
    numberOfChannels = 1;
    data: Float32Array;
    constructor(options: any) {
      Object.assign(this, options);
      this.data = new Float32Array(options.data);
    }
    copyTo(output: Float32Array) {
      output.set(this.data);
    }
    close() {}
  }
  class Encoder {
    config: any;
    constructor(public options: any) {}
    static async isConfigSupported() {
      return { supported: true };
    }
    configure(config: any) {
      this.config = config;
    }
    encode(frame: Frame) {
      counts.encoded++;
      const bytes = new Uint8Array(frame.data.buffer);
      this.options.output(
        {
          type: 'key',
          timestamp: frame.timestamp,
          duration: (frame.numberOfFrames * 1e6) / frame.sampleRate,
          byteLength: bytes.length,
          copyTo: (out: Uint8Array) => out.set(bytes),
        },
        { decoderConfig: { codec: 'opus', sampleRate: frame.sampleRate, numberOfChannels: 1 } },
      );
    }
    async flush() {}
    close() {}
  }
  class Decoder {
    config: any;
    constructor(public options: any) {}
    static async isConfigSupported() {
      return { supported: true };
    }
    configure(config: any) {
      this.config = config;
    }
    decode(chunk: any) {
      counts.decoded++;
      this.options.output(
        new Frame({
          sampleRate: this.config.sampleRate,
          numberOfFrames: chunk.data.length / 4,
          timestamp: chunk.timestamp,
          data: new Float32Array(
            chunk.data.buffer.slice(
              chunk.data.byteOffset,
              chunk.data.byteOffset + chunk.data.byteLength,
            ),
          ),
        }),
      );
    }
    async flush() {}
    close() {}
  }
  class Chunk {
    constructor(options: any) {
      Object.assign(this, options);
    }
  }
  [Encoder, Decoder, Frame, Chunk].forEach((value, i) =>
    Object.defineProperty(globalThis, keys[i], { value, configurable: true }),
  );
  return {
    counts,
    restore: () =>
      keys.forEach((key, i) => {
        if (descriptors[i]) Object.defineProperty(globalThis, key, descriptors[i]!);
        else delete (globalThis as any)[key];
      }),
  };
}
const input = (sourceId = 'microphone') => ({
  sourceId,
  kind: (sourceId === 'microphone' ? 'microphone' : 'shared') as 'microphone' | 'shared',
  label: 'Test source',
  sampleRate: 16000,
  policy: { enabled: false, keepPrevious: 0, bitrate: 24000, preRollMs: 100, postRollMs: 100 },
});

test('starred names survive audio writes and timeline events survive capture gating', async () => {
  const codecs = fakeCodecs();
  const repository = createRecordingRepository();
  try {
    const writer = await repository.begin(input());
    const shared = await repository.begin(input('shared'));
    const id = writer.session.id;
    await assert.rejects(repository.setName!(id, 'Needs a star'), { code: 'invalid-range' });
    await repository.setStarred(id, true);
    await Promise.all([
      writer.append(new Float32Array(16000)),
      repository.setName!(id, '  Cut X / Y / Z  '),
    ]);
    assert.equal(writer.session.name, 'Cut X / Y / Z');
    for (const value of ['a\nb', 'x'.repeat(121), 'a\u0000b'])
      await assert.rejects(repository.setName!(id, value), { code: 'invalid-range' });
    const timeline = repository.timeline();
    await timeline('capture-gated');
    await writer.finish();
    await timeline('assistant-start');
    await timeline('assistant-pause');
    await timeline('assistant-resume');
    await timeline('assistant-end');
    const saved = await repository.get(id);
    assert.equal(saved?.name, 'Cut X / Y / Z');
    assert.deepEqual(
      saved?.events?.map((e) => e.kind),
      [
        'capture-start',
        'capture-gated',
        'capture-end',
        'assistant-start',
        'assistant-pause',
        'assistant-resume',
        'assistant-end',
      ],
    );
    assert.ok(
      saved?.events?.every((e) => Number.isFinite(Date.parse(e.occurredAt)) && e.atSample <= 16000),
    );
    assert.equal(saved?.events?.at(-1)?.atSample, 16000);
    const exported = JSON.parse(await (await repository.export(id)).text());
    assert.equal(exported.recording.name, saved?.name);
    assert.deepEqual(exported.recording.events, saved?.events);
    await repository.setName!(id, 'Renamed after capture');
    await repository.setName!(id, '');
    assert.equal((await repository.get(id))?.name, '');
    await shared.finish();
  } finally {
    await repository.dispose();
    codecs.restore();
  }
});

test('repository serializes append, pins, reads and attempt upserts; exports encoded JSON', async () => {
  const codecs = fakeCodecs();
  const repository = createRecordingRepository();
  try {
    let changed = 0;
    const unsubscribe = repository.subscribe(() => changed++);
    const writer = await repository.begin(input());
    const pcm = Float32Array.from({ length: 16000 * 3 + 57 }, (_, index) => (index % 13) / 20);
    const append = writer.append(pcm);
    pcm.fill(-1); // append must own its input, even while queued.
    const pin = writer.pin('speech-start', 10, 500);
    await assert.rejects(
      repository.remove(writer.session.id),
      (error) => error instanceof RecordingRepositoryError && error.code === 'active-recording',
    );
    await append;
    const marker = await pin;
    assert.equal(marker.delaySamples, 490);
    const read = await writer.read(16001, 16101);
    assert.equal(read.length, 100);
    assert.equal(read[0], Math.fround((16001 % 13) / 20));
    assert.ok(
      codecs.counts.decoded < codecs.counts.encoded,
      'range read decodes only intersecting pages',
    );
    assert.equal(writer.session.savedSamples, writer.session.capturedSamples);
    const attempt = {
      id: 'attempt',
      segmentId: marker.id,
      startSample: 10,
      endSample: 500,
      engine: 'fake',
      createdAt: new Date().toISOString(),
      status: 'pending' as const,
    };
    await writer.attempt(attempt);
    await writer.finish();
    await writer.attempt({ ...attempt, status: 'success', text: 'Test result' });
    await assert.rejects(writer.append(new Float32Array(1)), { code: 'sealed' });
    await assert.rejects(writer.pin('silence-start', 500, 500), { code: 'sealed' });
    const saved = await repository.get(writer.session.id);
    assert.equal(saved?.state, 'completed');
    assert.equal(saved?.attempts.length, 1);
    assert.equal(saved?.attempts[0].status, 'success');
    const exported = JSON.parse(await (await repository.export(writer.session.id)).text());
    assert.equal(exported.version, 1);
    assert.equal(exported.format, 'dsh-live-voice-recording');
    const bytes = exported.pages.reduce(
      (sum, page) =>
        sum +
        (page.decoderConfig?.description
          ? Buffer.from(page.decoderConfig.description, 'base64').byteLength
          : 0) +
        page.packets.reduce((n, packet) => n + Buffer.from(packet.data, 'base64').byteLength, 0),
      0,
    );
    assert.ok(bytes > 0);
    assert.equal(saved.audioBytes, bytes);
    assert.equal((await repository.list())[0].audioBytes, bytes);
    assert.equal(exported.recording.audioBytes, bytes);
    assert.equal(
      exported.pages.reduce((n: number, page: any) => n + page.sampleCount, 0),
      48057,
    );
    assert.equal(typeof exported.pages[0].packets[0].data, 'string');
    const wav = await repository.audio(writer.session.id, 0, 50);
    assert.equal(wav.type, 'audio/wav');
    assert.equal(wav.size, 144);
    unsubscribe();
    assert.ok(changed > 0);
    await repository.remove(writer.session.id);
    assert.equal(await repository.get(writer.session.id), null);
  } finally {
    await repository.dispose();
    codecs.restore();
  }
});

test('digital zero pages keep exact timeline; retention keeps one finished run per type and all active sources', async () => {
  const codecs = fakeCodecs();
  const repository = createRecordingRepository();
  try {
    const first = await repository.begin(input());
    await first.append(new Float32Array(16057));
    await first.finish();
    const second = await repository.begin(input());
    await second.finish();
    const third = await repository.begin(input());
    const other = await repository.begin(input('shared'));
    assert.equal((await repository.list()).length, 3);
    assert.equal(await repository.get(first.session.id), null);
    await third.append(new Float32Array(105));
    assert.deepEqual(await third.read(0, 105), new Float32Array(105));
    assert.equal(codecs.counts.encoded, 0);
    assert.equal(codecs.counts.decoded, 0);
    await third.finish();
    await other.finish();
    assert.equal(await repository.get(second.session.id), null);
    assert.ok(await repository.get(third.session.id));
    assert.ok(await repository.get(other.session.id));
  } finally {
    await repository.dispose();
    codecs.restore();
  }
});

test('protected recordings do not consume retention and shared source IDs share one quota', async () => {
  const codecs = fakeCodecs();
  const repository = createRecordingRepository();
  try {
    const create = async (sourceId = 'microphone') => {
      const value = input(sourceId === 'microphone' ? 'microphone' : 'shared');
      value.sourceId = sourceId;
      value.policy.keepPrevious = 2;
      return repository.begin(value);
    };
    const first = await create();
    await first.append(new Float32Array(105));
    await repository.setStarred(first.session.id, true); // active writer mutation cannot deadlock
    await first.finish();
    const second = await create();
    await second.finish();
    await repository.setStarred(second.session.id, true);
    for (let i = 0; i < 4; i++) {
      const writer = await create();
      await writer.finish();
    }
    const mic = (await repository.list()).filter((s) => s.kind === 'microphone');
    assert.equal(mic.length, 4);
    assert.equal(mic.filter((s) => s.starred).length, 2);
    assert.equal(
      JSON.parse(await (await repository.export(first.session.id)).text()).recording.starred,
      true,
    );
    for (let i = 0; i < 4; i++) {
      const writer = await create('participant-' + i);
      await writer.finish();
    }
    assert.equal((await repository.list()).filter((s) => s.kind === 'shared').length, 2);
    assert.equal((await repository.list()).filter((s) => s.kind === 'microphone').length, 4);
    await repository.setStarred(first.session.id, false);
    assert.equal(await repository.get(first.session.id), null);
    await repository.remove(second.session.id); // stars never prevent explicit deletion
    assert.equal(await repository.get(second.session.id), null);
  } finally {
    await repository.dispose();
    codecs.restore();
  }
});

test('pending transcript sessions do not consume slots and clean up after settlement', async () => {
  const codecs = fakeCodecs();
  const repository = createRecordingRepository();
  try {
    const old = await repository.begin(input());
    await old.attempt({
      id: 'pending',
      segmentId: 'speech',
      startSample: 0,
      endSample: 0,
      engine: 'test',
      createdAt: new Date().toISOString(),
      status: 'pending',
    });
    await old.finish();
    const fresh = await repository.begin(input());
    await fresh.finish();
    assert.ok(await repository.get(old.session.id));
    assert.ok(await repository.get(fresh.session.id));
    await old.attempt({
      id: 'pending',
      segmentId: 'speech',
      startSample: 0,
      endSample: 0,
      engine: 'test',
      createdAt: new Date().toISOString(),
      status: 'success',
      text: 'done',
    });
    assert.equal(await repository.get(old.session.id), null);
    assert.ok(await repository.get(fresh.session.id));
  } finally {
    await repository.dispose();
    codecs.restore();
  }
});

test('memory page commit failure is atomic and does not drop metadata', async () => {
  const store = createMemoryStore(1);
  const session = {
    ...input(),
    id: 'memory',
    startedAt: new Date().toISOString(),
    state: 'recording' as const,
    capturedSamples: 0,
    savedSamples: 0,
    persistent: false,
    codec: 'opus',
    pins: [],
    attempts: [],
    keepPrevious: 1,
  };
  await store.create(session);
  const page: AudioPage = {
    recordingId: 'memory',
    index: 0,
    startSample: 0,
    sampleCount: 100,
    sampleRate: 16000,
    zero: true,
    preSkipSamples: 0,
    packets: [],
  };
  await assert.rejects(
    store.update('memory', (value) => ({ ...value, savedSamples: 100 }), page),
    { code: 'memory-limit' },
  );
  assert.equal((await store.get('memory'))?.savedSamples, 0);
  assert.equal(await store.nextPage('memory', 0, 100), null);
  store.close();
});

test('stored audio bytes count packets and decoder data, not metadata or database overhead', async () => {
  const store = createMemoryStore();
  const session = {
    ...input(),
    id: 'bytes',
    startedAt: '',
    state: 'completed' as const,
    capturedSamples: 100,
    savedSamples: 0,
    persistent: false,
    codec: 'opus',
    pins: [],
    attempts: [],
    keepPrevious: 1,
  };
  await store.create(session);
  const page: AudioPage = {
    recordingId: 'bytes',
    index: 0,
    startSample: 0,
    sampleCount: 100,
    sampleRate: 16000,
    zero: false,
    preSkipSamples: 0,
    decoderConfig: {
      codec: 'opus',
      sampleRate: 16000,
      numberOfChannels: 1,
      description: new Uint8Array(17),
    },
    packets: [{ type: 'key', timestamp: 0, data: new Uint8Array(41) }],
  };
  await store.update('bytes', (current) => ({ ...current, savedSamples: 100 }), page);
  assert.equal(await store.audioBytes('bytes'), 58);
  await store.update('bytes', (current) => ({ ...current, name: 'Metadata does not count' }));
  assert.equal(await store.audioBytes('bytes'), 58);
  await store.remove('bytes');
  assert.equal(await store.audioBytes('bytes'), 0);
  store.close();
});

test('missing native codecs fail explicitly and a disposed repository rejects new work', async () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'AudioEncoder');
  Object.defineProperty(globalThis, 'AudioEncoder', { configurable: true, value: undefined });
  const repository = createRecordingRepository();
  try {
    await assert.rejects(repository.begin(input()), { code: 'codec-unsupported' });
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'AudioEncoder', descriptor);
    else delete (globalThis as any).AudioEncoder;
  }
  await repository.dispose();
  await assert.rejects(repository.begin(input()), { code: 'disposed' });
});
