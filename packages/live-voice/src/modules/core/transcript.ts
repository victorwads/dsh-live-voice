// @ts-nocheck
/** Dictation is append-only: provisional hypotheses never own composer text. */
export class TranscriptDraft {
  reset() {}
  update(current, hypothesis, final = false, paragraphBefore = false) {
    if (!final || !hypothesis) return current;
    hypothesis = hypothesis.trim().replace(/\s*\r?\n\s*/g, ' ');
    const separator = current
      ? paragraphBefore
        ? /\n\n$/.test(current)
          ? ''
          : /\n$/.test(current)
            ? '\n'
            : '\n\n'
        : !/\s$/.test(current)
          ? ' '
          : ''
      : '';
    return current + separator + hypothesis;
  }
}
