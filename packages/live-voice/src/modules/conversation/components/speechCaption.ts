/** Approximate character timing; keep the current word visible. */
export function remainingSpeechCaption(
  text: string,
  progress: { positionSeconds: number; durationSeconds: number } | null,
) {
  if (
    !progress ||
    !Number.isFinite(progress.durationSeconds) ||
    progress.durationSeconds <= 0 ||
    !Number.isFinite(progress.positionSeconds)
  )
    return text;
  const characters = Array.from(text);
  let index = Math.min(
    characters.length - 1,
    Math.floor(
      characters.length *
        Math.max(0, Math.min(1, progress.positionSeconds / progress.durationSeconds)),
    ),
  );
  if (/\s/u.test(characters[index])) {
    while (index < characters.length - 1 && /\s/u.test(characters[index])) index++;
  } else if (/\s/u.test(text)) {
    while (index > 0 && !/\s/u.test(characters[index - 1])) index--;
  }
  return characters.slice(Math.max(0, index)).join('').trimStart();
}
