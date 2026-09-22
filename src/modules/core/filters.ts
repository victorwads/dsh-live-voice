// @ts-nocheck
const words = (text) =>
  String(text || '')
    .trim()
    .match(/[\p{L}\p{N}]+(?:['’_-][\p{L}\p{N}]+)*/gu) || [];

export function normalizeVoiceCommand(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('en-US')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function matchVoiceCommand(text, commands) {
  const candidate = normalizeVoiceCommand(text);
  if (!candidate) return null;
  for (const [action, phrases] of Object.entries(commands || {})) {
    if (
      String(phrases || '')
        .split(/[,\r\n]+/)
        .some((phrase) => normalizeVoiceCommand(phrase) === candidate)
    )
      return action;
  }
  return null;
}

export function hasMinimumWords(text, minimum = 2) {
  return words(text).length >= minimum;
}

export function splitSpeechOutput(text, options = {}) {
  const filtered = filterSpeechOutput(text, options).trim();
  if (!filtered) return [];
  return filtered
    .split(/\r?\n+/u)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

export function hasUnclosedCodeFence(text) {
  return (String(text || '').match(/```/g) || []).length % 2 === 1;
}

export function filterSpeechOutput(
  text,
  {
    filterCodeBlocks = true,
    codeBlockMaxLines = 5,
    codeBlockNotice = 'Look the code on out conversation',
  } = {},
) {
  const source = String(text || '');
  if (!filterCodeBlocks) return source;
  return source.replace(/```[^\n]*\n?([\s\S]*?)```/g, (block, body) => {
    const normalized = body.replace(/\n$/, '');
    const lineCount = normalized ? normalized.split(/\r?\n/).length : 0;
    return lineCount <= codeBlockMaxLines ? normalized : codeBlockNotice;
  });
}
