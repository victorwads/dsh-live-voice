import test from 'node:test';
import assert from 'node:assert/strict';
import {
  transcribeWhisper,
  whisperLanguageMask,
} from '../src/modules/recognition/local/WhisperTranscription.js';
const config = {
  is_multilingual: true,
  decoder_start_token_id: 50258,
  lang_to_id: { '<|en|>': 50259, '<|pt|>': 50267, '<|fr|>': 50265 },
  task_to_id: { transcribe: 50359, translate: 50358 },
};
for (const [language, expected] of [
  ['auto', 'pt'],
  ['pt-BR', 'pt'],
  ['fr-FR', 'fr'],
  ['en-US', 'en'],
])
  test(
    'Whisper ' +
      language +
      ' explicitly transcribes original language, never English default/translation',
    async () => {
      let probes = 0,
        disposed = 0;
      const pcm = new Float32Array(16000);
      const text = await transcribeWhisper(pcm, language, {
        config,
        extract: async () => ({
          input_features: {
            dispose() {
              disposed++;
            },
          },
        }),
        processors: (mask) => mask,
        generate: async (options) => {
          probes++;
          assert.equal(options.max_new_tokens, 1);
          assert.deepEqual(options.decoder_input_ids, [50258]);
          assert.equal(typeof options.logits_processor, 'function');
          return { tolist: () => [[50258n, 50267n]] };
        },
        transcribe: async (audio, options) => {
          assert.equal(audio, pcm);
          assert.equal(options.language, expected);
          assert.equal(options.task, 'transcribe');
          assert.equal(options.forced_decoder_ids, null);
          return { text: ' Bom dia, tudo bem? ' };
        },
      });
      assert.equal(text, 'Bom dia, tudo bem?');
      assert.equal(probes, language === 'auto' ? 1 : 0);
      assert.equal(disposed, probes);
    },
  );
test('language detection masks all nonlanguage tokens even when translation token has highest score', () => {
  const logits = { data: new Float32Array(51866).fill(10), dims: [1, 51866] };
  whisperLanguageMask(config)([[50258n]], logits);
  assert.equal(logits.data[50358], -Infinity);
  assert.equal(logits.data[50267], 10);
  assert.equal(logits.data[50259], 10);
  assert.equal(logits.data[42], -Infinity);
});
test('invalid language detection or English-only config fails instead of defaulting to English', async () => {
  for (const configOverride of [config, { ...config, is_multilingual: false }])
    await assert.rejects(
      transcribeWhisper(new Float32Array(160), 'auto', {
        config: configOverride,
        extract: async () => ({ input_features: {} }),
        processors: (m) => m,
        generate: async () => ({ tolist: () => [[50258n, 42n]] }),
        transcribe: async () => {
          throw Error('must not transcribe');
        },
      }),
      { code: 'inference-failed' },
    );
});
