export const iconPaths = {
  mic: 'M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0V5M6 10v2a6 6 0 0 0 12 0v-2M12 18v4M8 22h8',
  micOff:
    'M9 9v3a3 3 0 0 0 5.12 2.12M15 9V5a3 3 0 0 0-5.64-1.42M6 10v2a6 6 0 0 0 9.5 4.88M18 10v2a6 6 0 0 1-.5 2.4M12 18v4M8 22h8M3 3l18 18',
  speaker: 'M3 9h4l6-5v16l-6-5H3V9M17 8a6 6 0 0 1 0 8M20 5a10 10 0 0 1 0 14',
  speakerOff: 'M3 9h4l6-5v16l-6-5H3V9M17 9l5 6M22 9l-5 6',
  pause: 'M8 5v14M16 5v14',
  play: 'M7 4l13 8-13 8z',
  stop: 'M6 6h12v12H6z',
  skipNext: 'M5 5l10 7-10 7V5M19 5v14',
  send: 'M3 11.5L21 3l-8.5 18-2-7.5L3 11.5zm7.5 2L21 3',
  queue: 'M5 6h14M5 12h10M5 18h6M18 15v6M15 18h6',
  close: 'M6 6l12 12M18 6 6 18',
} as const;

export type IconName = keyof typeof iconPaths;
