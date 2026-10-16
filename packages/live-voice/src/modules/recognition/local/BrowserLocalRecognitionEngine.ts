import { WhisperHttpRecognitionEngine } from '../engines/whisper/WhisperRecognitionEngine.js';
import { type LocalModelManager } from './LocalModelManager.js';
import { TRANSCRIPTION_BOUNDARY_MARGIN_MS } from '../../recording/RecordingRecognition.js';
import { findBrowserAsrModel, type BrowserAsrDevice } from './modelCatalog.js';
/** Same recorder/VAD/range audit as HTTP, but PCM is sent only to a local worker. */
export class BrowserLocalRecognitionEngine extends WhisperHttpRecognitionEngine {
  declare route: string;
  private manager: LocalModelManager;
  private modelKey: string;
  private device: BrowserAsrDevice;
  private message: (code: string) => string;
  private release?: () => void;
  constructor({ manager, modelKey, device = 'webgpu', message, ...options }: any) {
    const margins =
      (Math.max(TRANSCRIPTION_BOUNDARY_MARGIN_MS, options.recordingPreRollMs ?? 320) +
        Math.max(TRANSCRIPTION_BOUNDARY_MARGIN_MS, options.recordingPostRollMs ?? 320)) /
      1000;
    super({
      ...options,
      maxUtteranceSeconds: Math.max(
        1,
        Math.min(25, 29 - margins, options.maxUtteranceSeconds ?? 25),
      ),
    });
    this.manager = manager;
    this.modelKey = modelKey;
    const selected = findBrowserAsrModel(modelKey);
    this.device = selected?.devices.length === 1 ? selected.devices[0] : device;
    this.message = message;
    this.route = 'browser-local/' + modelKey;
  }
  async capability() {
    const snapshot = this.manager.getSnapshot();
    const selected = findBrowserAsrModel(this.modelKey);
    const code =
      selected && 'requiresF16' in selected && selected.requiresF16 && !snapshot.shaderF16
        ? 'f16-unavailable'
        : !snapshot.storage
          ? 'storage-unavailable'
          : this.device === 'webgpu' && snapshot.gpu !== 'available'
            ? 'gpu-unavailable'
            : !['downloaded', 'ready'].includes(snapshot.models[this.modelKey]?.phase)
              ? 'model-missing'
              : null;
    return {
      supported: !code,
      local: true,
      streaming: false,
      reason: code ? this.message(code) : undefined,
    };
  }
  async start(options: any) {
    // Keep startup reserved, but do not assign the new lease until the inherited
    // capture adapter finishes its initial this.stop() cleanup of the old session.
    const release = this.manager.acquire(this.modelKey);
    try {
      await this.manager.prepare(this.modelKey, this.device, options.signal);
      const capture = await super.start(options);
      this.release = release;
      return capture;
    } catch (error) {
      release();
      if (!(error as any)?.code && (error as any)?.name !== 'AbortError') throw error;
      const failure = new Error(this.message((error as any)?.code ?? 'inference-failed'));
      if ((error as any)?.code === 'cancelled' || (error as any)?.name === 'AbortError')
        failure.name = 'AbortError';
      throw failure;
    }
  }
  async transcribePcm(pcm: Float32Array, rate: number, language: string, signal?: AbortSignal) {
    if (rate !== 16000) {
      const output = new Float32Array(Math.floor((pcm.length * 16000) / rate));
      for (let i = 0; i < output.length; i++) {
        const a = Math.floor((i * rate) / 16000),
          b = Math.min(pcm.length, Math.max(a + 1, Math.floor(((i + 1) * rate) / 16000)));
        let sum = 0;
        for (let j = a; j < b; j++) sum += pcm[j];
        output[i] = sum / (b - a);
      }
      pcm = output;
    }
    try {
      return await this.manager.transcribe(this.modelKey, pcm, language, signal);
    } catch (error) {
      const failure = new Error(this.message((error as any)?.code ?? 'inference-failed'));
      if ((error as any)?.code === 'cancelled' || (error as any)?.name === 'AbortError')
        failure.name = 'AbortError';
      throw failure;
    }
  }
  async finish() {
    try {
      await super.finish();
    } finally {
      this.release?.();
      this.release = undefined;
    }
  }
  async stop() {
    try {
      await super.stop();
    } finally {
      this.release?.();
      this.release = undefined;
    }
  }
}
