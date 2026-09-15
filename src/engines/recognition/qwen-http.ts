// @ts-nocheck
import { WhisperHttpRecognitionEngine } from './whisper-http.ts';

/** Qwen shares the plugin-owned microphone/VAD pipeline with Whisper, but uses
 * its own authenticated DSH route and capability probe. */
export class QwenHttpRecognitionEngine extends WhisperHttpRecognitionEngine {
  constructor(options = {}) {
    super(options);
    this.route = '/api/dsh-live-voice/qwen';
  }
  async capability() {
    const capture = await this.meter?.capability?.();
    if (capture?.supported === false) return capture;
    try {
      const response = await this.g.fetch(this.route + '/capabilities?kind=asr', {
          credentials: 'same-origin',
        }),
        json = await response.json();
      return response.ok && json?.ok
        ? json.value
        : {
            supported: false,
            local: true,
            location: 'host',
            reason: json?.error?.message || 'Qwen capability check failed.',
          };
    } catch (error) {
      return {
        supported: false,
        local: true,
        location: 'host',
        reason: 'Qwen speech server check failed: ' + (error?.message || error),
      };
    }
  }
}
