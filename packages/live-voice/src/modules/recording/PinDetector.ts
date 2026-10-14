import type { RecordingPin } from './types.js';
export interface PinDetectorOptions {
  sampleRate: number;
  threshold: number;
  minimumSpeechMs: number;
  silenceMs: number;
  onPin(kind: RecordingPin['kind'], atSample: number, confirmedAtSample: number): void;
  onActivity(active: boolean): void;
}
/** Only confirmed transition pins are retained; probabilities remain transient. */
export class PinDetector {
  private at = 0;
  private candidate = 0;
  private candidateStart = 0;
  private quiet = 0;
  private quietStart = 0;
  private speaking = false;
  constructor(private options: PinDetectorOptions) {}
  get position() {
    return this.at;
  }
  get active() {
    return this.speaking;
  }
  frame(probability: number, samples: number) {
    const start = this.at;
    this.at += samples;
    const floor = this.speaking ? this.options.threshold * 0.7 : this.options.threshold;
    const voiced = probability >= floor;
    if (voiced) {
      this.quiet = 0;
      if (!this.speaking) {
        if (!this.candidate) this.candidateStart = start;
        this.candidate += samples;
        if (this.candidate >= (this.options.sampleRate * this.options.minimumSpeechMs) / 1000) {
          this.speaking = true;
          this.options.onPin('speech-start', this.candidateStart, this.at);
          this.options.onActivity(true);
        }
      }
    } else if (this.speaking) {
      if (!this.quiet) this.quietStart = start;
      this.quiet += samples;
      if (this.quiet >= (this.options.sampleRate * this.options.silenceMs) / 1000) {
        this.speaking = false;
        this.candidate = 0;
        this.options.onPin('silence-start', this.quietStart, this.at);
        this.options.onActivity(false);
      }
    } else this.candidate = 0;
  }
  finish() {
    if (this.speaking) {
      this.speaking = false;
      this.options.onPin('silence-start', this.quiet ? this.quietStart : this.at, this.at);
      this.options.onActivity(false);
    }
  }
}
