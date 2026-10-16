import type { RecordingSegment } from '../../live-voice/src/modules/recording/types.js';
const normalize = (text: string) =>
  text
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
function distance(a: string, b: string) {
  let row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 0; i < a.length; i++) {
    const next = [i + 1];
    for (let j = 0; j < b.length; j++)
      next.push(Math.min(next[j] + 1, row[j + 1] + 1, row[j] + (a[i] === b[j] ? 0 : 1)));
    row = next;
  }
  return row[b.length];
}
/** Literal phrase, all whole words, all partial words, then bounded typo matching. */
export function searchSegments(segments: RecordingSegment[], query: string): RecordingSegment[] {
  if (!query.trim()) return segments;
  const needle = normalize(query.slice(0, 160));
  if (!needle) return [];
  const words = needle.split(' ');
  return segments
    .map((segment, index) => {
      const transcripts = segment.attempts
        .filter((a) => a.status === 'success' && a.text?.trim())
        .map((a) => normalize(a.text!));
      let score = Infinity;
      for (const text of transcripts) {
        const tokens = text.split(' ');
        if (text === needle) score = Math.min(score, 0);
        else if (text.includes(needle)) score = Math.min(score, 1);
        else if (words.every((word) => tokens.includes(word))) score = Math.min(score, 2);
        else if (words.every((word) => tokens.some((token) => token.includes(word))))
          score = Math.min(score, 3);
        else if (
          words.every((word) =>
            tokens.some((token) => {
              const limit = word.length < 4 ? 0 : word.length < 8 ? 1 : 2;
              return (
                Math.abs(token.length - word.length) <= limit && distance(word, token) <= limit
              );
            }),
          )
        )
          score = Math.min(score, 4);
      }
      return { segment, index, score };
    })
    .filter((hit) => Number.isFinite(hit.score))
    .sort((a, b) => a.score - b.score || a.index - b.index)
    .map((hit) => hit.segment);
}
