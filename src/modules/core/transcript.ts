// @ts-nocheck
/** Own only the current hypothesis; never restore an old snapshot over user edits. */
export class TranscriptDraft {
  constructor() {
    this.reset();
  }
  reset() {
    this.owned = null;
    this.edited = false;
  }
  update(current, hypothesis, final = false) {
    if (this.edited) {
      if (final) this.edited = false;
      return current;
    }
    let base = current;
    let at = current.length;
    if (this.owned) {
      const { start, text, before, after } = this.owned;
      // Only replace a hypothesis whose surrounding text has not changed.
      if (current === before + text + after) {
        base = before + after;
        at = start;
      } else if (
        text &&
        current.indexOf(text) >= 0 &&
        current.indexOf(text) === current.lastIndexOf(text)
      ) {
        // Edits outside our unchanged, uniquely identifiable hypothesis are safe.
        at = current.indexOf(text);
        base = current.slice(0, at) + current.slice(at + text.length);
      } else {
        // The user edited the draft: relinquish it. Do not duplicate a final
        // hypothesis after an edit; the edited text belongs to the user now.
        this.owned = null;
        this.edited = !final;
        return current;
      }
    }
    const before = base.slice(0, at);
    const after = base.slice(at);
    const separator = hypothesis && before && !/\s$/.test(before) ? ' ' : '';
    const text = separator + hypothesis;
    const result = before + text + after;
    this.owned = final ? null : { start: at, text, before, after };
    return result;
  }
}
