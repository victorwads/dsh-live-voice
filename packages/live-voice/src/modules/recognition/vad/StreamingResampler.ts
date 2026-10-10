/** Stateful area-average downsampler. Chunk boundaries never restart its phase. */
export class StreamingResampler {
  private rate = 0;
  private weight = 0;
  private sum = 0;
  reset() {
    this.rate = 0;
    this.weight = 0;
    this.sum = 0;
  }
  process(input: Float32Array, sampleRate: number): Float32Array {
    if (!Number.isFinite(sampleRate) || sampleRate < 16000 || sampleRate > 192000)
      throw new Error('Unsupported VAD PCM sample rate.');
    if (this.rate && this.rate !== sampleRate)
      throw new Error('VAD PCM sample rate changed without reset.');
    this.rate = sampleRate;
    const width = sampleRate / 16000;
    const output: number[] = [];
    for (const raw of input) {
      if (!Number.isFinite(raw)) throw new Error('Invalid VAD PCM sample.');
      let remaining = 1;
      while (remaining > 1e-10) {
        const take = Math.min(remaining, width - this.weight);
        this.sum += raw * take;
        this.weight += take;
        remaining -= take;
        if (this.weight >= width - 1e-10) {
          output.push(this.sum / width);
          this.sum = 0;
          this.weight = 0;
        }
      }
    }
    return Float32Array.from(output);
  }
}

export class SileroFrameResampler {
  private resampler = new StreamingResampler();
  private tail = new Float32Array(0);
  reset() {
    this.resampler.reset();
    this.tail = new Float32Array(0);
  }
  process(input: Float32Array, sampleRate: number): Float32Array[] {
    const chunk = this.resampler.process(input, sampleRate);
    const joined = new Float32Array(this.tail.length + chunk.length);
    joined.set(this.tail);
    joined.set(chunk, this.tail.length);
    const frames: Float32Array[] = [];
    let at = 0;
    for (; at + 512 <= joined.length; at += 512) frames.push(joined.slice(at, at + 512));
    this.tail = joined.slice(at);
    return frames;
  }
}
