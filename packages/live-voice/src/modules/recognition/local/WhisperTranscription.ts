import { BrowserAsrError } from './modelCache.js';
export interface WhisperLanguageConfig {
  is_multilingual?: boolean;
  decoder_start_token_id: number;
  lang_to_id: Record<string, number>;
  task_to_id: Record<string, number>;
}
/** Restrict the first decoder prediction to the model's language tokens only. */
export function whisperLanguageMask(config: WhisperLanguageConfig) {
  const allowed = new Set(Object.values(config.lang_to_id));
  return (_ids: bigint[][], logits: { data: ArrayLike<number>; dims: readonly number[] }) => {
    const data = logits.data as Float32Array;
    const vocab = logits.dims.at(-1)!;
    for (let offset = 0; offset < data.length; offset += vocab)
      for (let token = 0; token < vocab; token++)
        if (!allowed.has(token)) data[offset + token] = -Infinity;
    return logits;
  };
}
/** Transformers.js 4.3.1 defaults missing Whisper language to English (TODO upstream).
 * Probe one constrained language token, then explicitly transcribe in that language.
 * Do not use the interface locale or silently substitute English for auto/unknown. */
export async function transcribeWhisper(
  pcm: Float32Array,
  language: string,
  deps: {
    config: WhisperLanguageConfig;
    extract(audio: Float32Array): Promise<{ input_features: unknown }>;
    generate(options: any): Promise<{ tolist(): unknown }>;
    processors(mask: ReturnType<typeof whisperLanguageMask>): unknown;
    transcribe(audio: Float32Array, options: any): Promise<{ text: string } | { text: string }[]>;
  },
): Promise<string> {
  const config = deps.config;
  if (!config.is_multilingual || !config.lang_to_id || !config.task_to_id?.transcribe)
    throw new BrowserAsrError('inference-failed');
  let code = language?.toLowerCase().split(/[-_]/)[0];
  if (!code || code === 'auto') {
    const features = await deps.extract(pcm.subarray(0, 16000 * 30));
    try {
      const result = await deps.generate({
        inputs: features.input_features,
        decoder_input_ids: [config.decoder_start_token_id],
        max_new_tokens: 1,
        do_sample: false,
        return_timestamps: false,
        return_dict_in_generate: false,
        begin_suppress_tokens: [],
        suppress_tokens: [],
        forced_decoder_ids: null,
        logits_processor: deps.processors(whisperLanguageMask(config)),
      });
      let rows: (number | bigint)[][];
      try {
        rows = result.tolist() as (number | bigint)[][];
      } finally {
        (result as any).dispose?.();
      }
      const detected = Number(rows[0]?.at(-1));
      const token = Object.entries(config.lang_to_id).find(([, id]) => id === detected)?.[0];
      if (!token) throw new BrowserAsrError('inference-failed');
      code = token.slice(2, -2);
    } finally {
      (features.input_features as any)?.dispose?.();
    }
  }
  if (!Object.hasOwn(config.lang_to_id, '<|' + code + '|>'))
    throw new BrowserAsrError('inference-failed');
  const result = await deps.transcribe(pcm, {
    task: 'transcribe',
    language: code,
    is_multilingual: true,
    forced_decoder_ids: null,
    chunk_length_s: 30,
    stride_length_s: 5,
    max_new_tokens: 256,
    return_timestamps: false,
  });
  return (Array.isArray(result) ? result.map((item) => item.text).join(' ') : result.text).trim();
}
