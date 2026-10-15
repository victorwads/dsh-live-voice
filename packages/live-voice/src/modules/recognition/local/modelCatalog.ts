/** Pinned upstream artifacts: downloads are explicit and browser-profile scoped. */
export const browserAsrModels = [
  {
    key: 'whisper-tiny',
    family: 'whisper',
    encoderDtype: 'fp32',
    decoderDtype: 'q4',
    requiresF16: false,
    name: 'Whisper tiny',
    repository: 'onnx-community/whisper-tiny',
    revision: 'ff4177021cc41f7db950912b73ea4fdf7d01d8e7',
    license: 'MIT',
    devices: ['webgpu', 'wasm'],
    files: [
      {
        path: 'config.json',
        bytes: 2243,
      },
      {
        path: 'generation_config.json',
        bytes: 3772,
      },
      {
        path: 'preprocessor_config.json',
        bytes: 339,
      },
      {
        path: 'tokenizer.json',
        bytes: 2480466,
      },
      {
        path: 'tokenizer_config.json',
        bytes: 282683,
      },
      {
        path: 'onnx/encoder_model.onnx',
        bytes: 32904992,
      },
      {
        path: 'onnx/decoder_model_merged_q4.onnx',
        bytes: 86713702,
      },
    ],
    bytes: 122388197,
  },
  {
    key: 'whisper-base',
    family: 'whisper',
    encoderDtype: 'fp32',
    decoderDtype: 'q4',
    requiresF16: false,
    name: 'Whisper base',
    repository: 'onnx-community/whisper-base',
    revision: '1846881b6b3a3024392c1eea3ad983695bc23925',
    license: 'MIT',
    devices: ['webgpu', 'wasm'],
    files: [
      {
        path: 'config.json',
        bytes: 2243,
      },
      {
        path: 'generation_config.json',
        bytes: 3832,
      },
      {
        path: 'preprocessor_config.json',
        bytes: 339,
      },
      {
        path: 'tokenizer.json',
        bytes: 2480466,
      },
      {
        path: 'tokenizer_config.json',
        bytes: 282682,
      },
      {
        path: 'onnx/encoder_model.onnx',
        bytes: 82468078,
      },
      {
        path: 'onnx/decoder_model_merged_q4.onnx',
        bytes: 123602419,
      },
    ],
    bytes: 208840059,
  },
  {
    key: 'whisper-small',
    family: 'whisper',
    encoderDtype: 'q4',
    decoderDtype: 'q4',
    requiresF16: false,
    name: 'Whisper small (q4)',
    repository: 'onnx-community/whisper-small',
    revision: '36050c46d777d46dc4b5f43f6d90574fc38f8732',
    license: 'MIT',
    devices: ['webgpu', 'wasm'],
    files: [
      {
        path: 'config.json',
        bytes: 2227,
      },
      {
        path: 'generation_config.json',
        bytes: 3893,
      },
      {
        path: 'preprocessor_config.json',
        bytes: 339,
      },
      {
        path: 'tokenizer.json',
        bytes: 2480466,
      },
      {
        path: 'tokenizer_config.json',
        bytes: 282683,
      },
      {
        path: 'onnx/encoder_model_q4.onnx',
        bytes: 66182104,
      },
      {
        path: 'onnx/decoder_model_merged_q4.onnx',
        bytes: 233149327,
      },
    ],
    bytes: 302101039,
  },
  {
    key: 'whisper-medium',
    family: 'whisper',
    name: 'Whisper medium (q4)',
    repository: 'onnx-community/whisper-medium_timestamped',
    revision: '9fe933aaa6b0244316eb961f36d33dfedf0c0b0c',
    license: 'MIT',
    encoderDtype: 'q4',
    decoderDtype: 'q4',
    requiresF16: false,
    devices: ['webgpu', 'wasm'],
    files: [
      { path: 'config.json', bytes: 1417 },
      { path: 'generation_config.json', bytes: 3779 },
      { path: 'preprocessor_config.json', bytes: 339 },
      { path: 'tokenizer.json', bytes: 3930494 },
      { path: 'tokenizer_config.json', bytes: 282713 },
      { path: 'onnx/encoder_model_q4.onnx', bytes: 209954580 },
      { path: 'onnx/decoder_model_merged_q4.onnx', bytes: 469359189 },
    ],
    bytes: 683532511,
  },
  {
    key: 'whisper-large-v3-turbo',
    family: 'whisper',
    name: 'Whisper large v3 turbo (q4)',
    repository: 'onnx-community/whisper-large-v3-turbo',
    revision: '360ebcde2559d60bb474678be3c1de9ef347d01a',
    license: 'MIT',
    encoderDtype: 'q4',
    decoderDtype: 'q4',
    requiresF16: false,
    devices: ['webgpu', 'wasm'],
    files: [
      { path: 'config.json', bytes: 1332 },
      { path: 'generation_config.json', bytes: 3897 },
      { path: 'preprocessor_config.json', bytes: 340 },
      { path: 'tokenizer.json', bytes: 2480617 },
      { path: 'tokenizer_config.json', bytes: 282843 },
      { path: 'onnx/encoder_model_q4.onnx', bytes: 424942775 },
      { path: 'onnx/decoder_model_merged_q4.onnx', bytes: 334147222 },
    ],
    bytes: 761859026,
  },
  {
    key: 'qwen-0.6b',
    family: 'qwen',
    name: 'Qwen3-ASR 0.6B',
    repository: 'jiangzhuo9357/Qwen3-ASR-0.6B-ONNX',
    revision: '4a01b95fafe2c9e3af77e33c18bbb7de349c62f6',
    license: 'Apache-2.0',
    devices: ['webgpu'],
    files: [
      {
        path: 'config.json',
        bytes: 1302,
      },
      {
        path: 'decoder_init.int4.onnx',
        bytes: 353078,
      },
      {
        path: 'decoder_step.int4.onnx',
        bytes: 354803,
      },
      {
        path: 'decoder_weights.int4.data',
        bytes: 382035968,
      },
      {
        path: 'embed_scales.f32.bin',
        bytes: 607744,
      },
      {
        path: 'embed_tokens.int8.bin',
        bytes: 155582464,
      },
      {
        path: 'encoder.onnx',
        bytes: 745766355,
      },
      {
        path: 'mel_filters.json',
        bytes: 132427,
      },
      {
        path: 'prompt_config.json',
        bytes: 2578,
      },
      {
        path: 'tokenizer.json',
        bytes: 11429377,
      },
      {
        path: 'tokenizer_config.json',
        bytes: 12488,
      },
    ],
    bytes: 1296278584,
  },
] as const;
export type BrowserAsrModel = (typeof browserAsrModels)[number];
export type BrowserAsrModelKey = BrowserAsrModel['key'];
export type BrowserAsrDevice = 'webgpu' | 'wasm';
export const findBrowserAsrModel = (key: string) =>
  browserAsrModels.find((model) => model.key === key);
export const modelFileUrl = (model: BrowserAsrModel, path: string) => {
  if (!model.files.some((file) => file.path === path)) throw new Error('invalid-model-file');
  return 'https://huggingface.co/' + model.repository + '/resolve/' + model.revision + '/' + path;
};
