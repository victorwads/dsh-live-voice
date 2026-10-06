// @ts-nocheck
/** Dictation is append-only: provisional hypotheses never own composer text. */
export class TranscriptDraft {
  reset() {}
  update(current, hypothesis, final = false) {
    if (!final || !hypothesis) return current;
    const separator = current && !/\s$/.test(current) ? ' ' : '';
    return current + separator + hypothesis;
  }
}
