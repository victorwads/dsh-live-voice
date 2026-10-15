/// <reference lib="webworker" />
// @ts-expect-error -- npm alias uses the original package's ambient declarations.
import * as localOrt from '@dlv/ort-local/webgpu';
import {
  WhisperForConditionalGeneration,
  WhisperTokenizer,
  WhisperFeatureExtractor,
  WhisperProcessor,
  AutomaticSpeechRecognitionPipeline,
  env,
  LogitsProcessorList,
} from '@huggingface/transformers';
import { createQwenRuntime } from './QwenBrowserRuntime.js';
import { browserAsrAssetBase } from './assets.js';
import { browserAsrRuntimeId } from './runtimeIdentity.js';
import {
  cachedModelFiles,
  readBrowserModelFile,
  BrowserAsrError,
  modelDownloaded,
} from './modelCache.js';
import { transcribeWhisper } from './WhisperTranscription.js';
import { findBrowserAsrModel } from './modelCatalog.js';
const scope = self as unknown as DedicatedWorkerGlobalScope;
let runtime: {
  transcribe(audio: Float32Array, language: string, signal?: AbortSignal): Promise<string>;
  dispose(): Promise<void>;
} | null = null;
let loadedKey = '';
// Transformers validates both flags before inspecting customCache. Enable local
// lookup but make accidental local probes return 404; remote models stay forbidden.
env.allowLocalModels = true;
env.allowRemoteModels = false;
const assetFetch = self.fetch.bind(self);
self.fetch = ((input: any, init?: RequestInit) => {
  const url = new URL(
    typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
    self.location.href,
  );
  if (url.origin !== self.location.origin || !url.pathname.startsWith(browserAsrAssetBase()))
    return Promise.resolve(new Response('', { status: 404 }));
  return assetFetch(input, init);
}) as typeof fetch;
env.useBrowserCache = false;
env.useFSCache = false;
env.useCustomCache = true;
env.backends.onnx.wasm.wasmPaths = browserAsrAssetBase();
env.backends.onnx.wasm.numThreads = 1;
env.backends.onnx.wasm.proxy = false;
env.logLevel = 50;
localOrt.env.wasm.wasmPaths = browserAsrAssetBase();
localOrt.env.wasm.numThreads = 1;
localOrt.env.wasm.proxy = false;
async function load(key: string, device: 'webgpu' | 'wasm') {
  if (runtime && loadedKey === key + device) return;
  await runtime?.dispose();
  runtime = null;
  loadedKey = '';
  const model = findBrowserAsrModel(key);
  if (!model) throw new BrowserAsrError('invalid-model');
  if ('requiresF16' in model && model.requiresF16) {
    const adapter = await (self.navigator as any).gpu?.requestAdapter();
    if (!adapter?.features?.has('shader-f16')) throw new BrowserAsrError('f16-unavailable');
  }
  if (!(await modelDownloaded(key))) throw new BrowserAsrError('model-missing');
  if (model.family === 'qwen') {
    runtime = await createQwenRuntime({ device, files: (path) => readBrowserModelFile(key, path) });
  } else {
    const { cache } = await cachedModelFiles(key);
    env.customCache = {
      match: async (request) => cache.match(String(request)),
      put: async () => {
        throw new BrowserAsrError('model-missing');
      },
    };
    const config = JSON.parse(
      new TextDecoder().decode(await readBrowserModelFile(key, 'config.json')),
    );
    // pipeline() in 4.3.1 discovers files with an unpinned main config; construct
    // the supported Whisper components directly so every lookup retains the SHA.
    const generationConfig = JSON.parse(
      new TextDecoder().decode(await readBrowserModelFile(key, 'generation_config.json')),
    );
    const options = {
      revision: model.revision,
      device,
      config,
      dtype: {
        model: model.encoderDtype,
        encoder_model: model.encoderDtype,
        decoder_model_merged: model.decoderDtype,
      },
      local_files_only: true,
    };
    const whisper = await WhisperForConditionalGeneration.from_pretrained(
      model.repository,
      options,
    );
    let transcriber: AutomaticSpeechRecognitionPipeline;
    try {
      const json = async (path: string) =>
        JSON.parse(new TextDecoder().decode(await readBrowserModelFile(key, path)));
      const tokenizer = new WhisperTokenizer(
        await json('tokenizer.json'),
        await json('tokenizer_config.json'),
      );
      const extractor = new WhisperFeatureExtractor(await json('preprocessor_config.json'));
      const processor = new WhisperProcessor({}, { feature_extractor: extractor, tokenizer }, null);
      transcriber = new AutomaticSpeechRecognitionPipeline({
        task: 'automatic-speech-recognition',
        model: whisper,
        tokenizer,
        processor,
      });
    } catch (error) {
      await whisper.dispose();
      throw error;
    }
    runtime = {
      async transcribe(pcm, language) {
        return transcribeWhisper(pcm, language, {
          config: generationConfig,
          extract: (audio) => transcriber.processor(audio),
          generate: (options) => whisper.generate(options) as any,
          processors: (mask) => {
            const list = new LogitsProcessorList();
            list.push(mask as any);
            return list;
          },
          transcribe: (audio, options) => transcriber(audio, options),
        });
      },
      async dispose() {
        await transcriber.dispose();
      },
    };
  }
  loadedKey = key + device;
}
let queue = Promise.resolve();
scope.onmessage = (event) => {
  const { id, type, key, device, pcm, language } = event.data;
  queue = queue.then(async () => {
    const started = performance.now();
    try {
      if (type === 'load') await load(key, device);
      else if (type === 'transcribe') {
        if (!runtime) throw new BrowserAsrError('model-missing');
        if (!(pcm instanceof Float32Array) || pcm.length > 16000 * 30)
          throw new BrowserAsrError('invalid-audio');
        const text = await runtime.transcribe(pcm, language);
        scope.postMessage({
          id,
          runtimeId: browserAsrRuntimeId,
          elapsedMs: performance.now() - started,
          ok: true,
          text,
        });
        return;
      } else if (type === 'dispose') {
        await runtime?.dispose();
        runtime = null;
        loadedKey = '';
      } else throw new BrowserAsrError('invalid-command');
      scope.postMessage({
        id,
        runtimeId: browserAsrRuntimeId,
        elapsedMs: performance.now() - started,
        ok: true,
      });
    } catch (error) {
      scope.postMessage({
        id,
        runtimeId: browserAsrRuntimeId,
        ok: false,
        code:
          error instanceof BrowserAsrError
            ? error.code
            : (error as any)?.code === 'gpu-unavailable'
              ? 'gpu-unavailable'
              : 'inference-failed',
      });
    }
  });
};
