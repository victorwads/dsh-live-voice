/** Saved audio duration, not wall-clock time; hours deliberately do not wrap at 24. */
export function recordingDuration(savedSamples: number, sampleRate: number): string {
  const seconds =
    Number.isFinite(savedSamples) &&
    savedSamples >= 0 &&
    Number.isFinite(sampleRate) &&
    sampleRate > 0
      ? Math.floor(savedSamples / sampleRate)
      : 0;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds / 60) % 60;
  const tail = seconds % 60;
  if (hours > 0) return hours + 'h ' + minutes + 'm ' + tail + 's';
  if (seconds >= 60) return minutes + 'm ' + tail + 's';
  return tail + 's';
}
