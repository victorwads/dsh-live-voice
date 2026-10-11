/** Separate windows do not inherit the opener's CSS custom properties. */
export function syncDebuggerTheme(source: Window, destination: Document) {
  const theme = source.getComputedStyle(source.document.body);
  const target = destination.documentElement.style;
  for (const name of Array.from(theme)) {
    if (name.startsWith('--dsw-alias-')) target.setProperty(name, theme.getPropertyValue(name));
  }
  const scheme = theme.colorScheme;
  target.setProperty('--dlvd-color-scheme', scheme && scheme !== 'normal' ? scheme : 'dark');
  destination.body.style.fontFamily = theme.fontFamily || 'system-ui';
}
