export type MeetingSource = 'microphone' | 'shared';

/** One composer writer; independent recognizers deliver final chunks in arrival order. */
export class MeetingTranscript {
  private active = new Set<MeetingSource>();
  private last: MeetingSource | null = null;
  private expected: string | null = null;
  private timestamps = false;
  setTimestamps(enabled: boolean) {
    this.timestamps = enabled;
    this.last = null;
  }
  constructor(private composer: { getDraft(): string; setDraft(text: string): void }) {}
  setActive(source: MeetingSource, enabled: boolean) {
    if (enabled) this.active.add(source);
    else this.active.delete(source);
    this.last = null;
  }
  append(source: MeetingSource, text: string, startedAt?: number) {
    const chunk = text.trim();
    if (!chunk || !this.active.has(source)) return;
    const draft = this.composer.getDraft();
    if (draft !== this.expected) this.last = null;
    const labelled = this.active.size > 1;
    const changed = labelled && this.last !== source;
    const date = new Date(Number.isFinite(startedAt) ? startedAt! : Date.now());
    const pad = (value: number) => String(value).padStart(2, '0');
    const stamp =
      this.timestamps && changed
        ? '[' +
          date.getFullYear() +
          '/' +
          pad(date.getMonth() + 1) +
          '/' +
          pad(date.getDate()) +
          ' ' +
          pad(date.getHours()) +
          ':' +
          pad(date.getMinutes()) +
          ':' +
          pad(date.getSeconds()) +
          '] '
        : '';
    const prefix = changed ? stamp + (source === 'microphone' ? 'Me: ' : 'Them: ') : '';
    const separator = draft ? (changed ? '\n\n' : '\n') : '';
    const next = draft + separator + prefix + chunk;
    this.composer.setDraft(next);
    this.expected = next;
    this.last = labelled ? source : null;
  }
  reset() {
    this.active.clear();
    this.last = null;
    this.expected = null;
  }
}
