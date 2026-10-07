// @ts-nocheck
import { markdownSpeech } from './markdownSpeech.js';
export { hasIncompleteSpeechMarkdown } from './markdownSpeech.js';
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

/** Split only the initial item at sentence punctuation or colons, never commas. */
export function splitInitialSpeechItem(text) {
  const result = [];
  let start = 0;
  // Require whitespace/end after punctuation to preserve decimals, URLs and file names.
  for (const match of text.matchAll(/[.!?:]+(?:["”’)]*)?(?=\s|$)/gu)) {
    const end = match.index + match[0].length;
    const part = text.slice(start, end).trim();
    if (part) result.push(part);
    start = end;
  }
  const tail = text.slice(start).trim();
  if (tail) result.push(tail);
  return result.length ? result : [text];
}

export function hasUnclosedCodeFence(text) {
  return (String(text || '').match(/```/g) || []).length % 2 === 1;
}

export function filterSpeechOutput(text, options = {}) {
  return markdownSpeech(text, options);
}
