const modifierFlags = {
  Control: 'ctrlKey',
  Alt: 'altKey',
  Shift: 'shiftKey',
  Meta: 'metaKey',
} as const;
const modifiers = Object.keys(modifierFlags) as (keyof typeof modifierFlags)[];
const keyLabels: Record<string, string> = {
  Control: 'Ctrl',
  Meta: 'Command',
  Space: '␣',
  Enter: '↵',
  Backspace: '⌫',
  Delete: '⌦',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  Backquote: '`',
  Minus: '-',
  Equal: '=',
  BracketLeft: '[',
  BracketRight: ']',
  Backslash: '\\',
  Semicolon: ';',
  Quote: "'",
  Comma: ',',
  Period: '.',
  Slash: '/',
};
const validKey =
  /^(Key[A-Z]|Digit[0-9]|F([1-9]|1[0-9]|2[0-4])|Numpad([0-9]|Add|Subtract|Multiply|Divide|Decimal|Enter)|Space|Enter|Backspace|Delete|Insert|Home|End|PageUp|PageDown|Arrow(Up|Down|Left|Right)|Backquote|Minus|Equal|BracketLeft|BracketRight|Backslash|Semicolon|Quote|Comma|Period|Slash)$/;

/** Canonical, layout-stable browser key codes; an empty string disables a shortcut. */
export function normalizeShortcut(value: unknown, fallback = ''): string {
  if (typeof value !== 'string') return fallback;
  if (!value) return '';
  const parts = value.split('+');
  const keys = parts.filter((part) => !modifiers.includes(part as any));
  if (
    new Set(parts).size !== parts.length ||
    keys.length > 1 ||
    keys.some((key) => !validKey.test(key))
  )
    return fallback;
  return [...modifiers.filter((key) => parts.includes(key)), ...keys].join('+');
}

export function shortcutFromEvent(
  event: Pick<KeyboardEvent, 'key' | 'code' | 'ctrlKey' | 'altKey' | 'shiftKey' | 'metaKey'>,
): string {
  const parts = modifiers.filter((key) => event.key === key || event[modifierFlags[key]]);
  const modifier =
    modifiers.includes(event.key as any) ||
    /^(Control|Alt|Shift|Meta)(Left|Right)$/.test(event.code);
  const code =
    event.code || (/^[a-z]$/i.test(event.key) ? 'Key' + event.key.toUpperCase() : event.key);
  return normalizeShortcut([...parts, ...(modifier ? [] : [code])].join('+'));
}

export function matchesShortcut(event: KeyboardEvent, shortcut: string): boolean {
  return Boolean(shortcut) && shortcutFromEvent(event) === shortcut;
}

export function releasesShortcut(event: KeyboardEvent, shortcut: string): boolean {
  return shortcut.split('+').some((key) => key === event.key || key === event.code);
}

export function formatShortcut(shortcut: string): string {
  return shortcut
    .split('+')
    .filter(Boolean)
    .map((key) => keyLabels[key] || key.replace(/^Key|^Digit|^Numpad/, ''))
    .join(' + ');
}
