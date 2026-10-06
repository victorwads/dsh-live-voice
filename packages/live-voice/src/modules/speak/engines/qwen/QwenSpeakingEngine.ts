// @ts-nocheck
import { HostAudioSpeakingEngine } from '../audio/HostAudioEngine.js';

/** Qwen synthesizes PCM WAV on the host; playback and controls remain browser-owned. */
export class QwenHttpSpeakingEngine extends HostAudioSpeakingEngine {
  constructor({ globals = globalThis, lang = 'pt-BR' } = {}) {
    super({
      endpoint: '/api/dsh-live-voice/qwen/speech',
      capability: '/api/dsh-live-voice/qwen/capabilities?kind=tts',
      globals,
      lang,
    });
  }
}
