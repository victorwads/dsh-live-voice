export const iconPaths = {
  conversation: 'M4 3h16v13H8l-4 4V3M8 7h8M8 11h5',
  keyboard: 'M3 6h18v12H3V6M7 10h.01M11 10h.01M15 10h.01M18 10h.01M7 14h10',
  headphones: 'M3 14v-3a9 9 0 0 1 18 0v3M3 12h4v8H3v-8M17 12h4v8h-4v-8',
  commands: 'M3 6l2 2 3-4M11 6h10M3 14l2 2 3-4M11 14h10M11 20h10',
  bug: 'M8 8h8v9a4 4 0 0 1-8 0V8M9 8V6a3 3 0 0 1 6 0v2M3 9l5 2M16 11l5-2M3 16h5M16 16h5M5 22l3-3M16 19l3 3',
  meeting:
    'M8 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6M16 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6M2 20v-3a6 6 0 0 1 12 0v3M16 13a5 5 0 0 1 6 5v2',
  meetingOff:
    'M8 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6M16 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6M2 20v-3a6 6 0 0 1 12 0v3M17 16l5 5M22 16l-5 5',
  mic: 'M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0V5M6 10v2a6 6 0 0 0 12 0v-2M12 18v4M8 22h8',
  micOff:
    'M9 9v3a3 3 0 0 0 5.12 2.12M15 9V5a3 3 0 0 0-5.64-1.42M6 10v2a6 6 0 0 0 9.5 4.88M18 10v2a6 6 0 0 1-.5 2.4M12 18v4M8 22h8M3 3l18 18',
  speaker: 'M3 9h4l6-5v16l-6-5H3V9M17 8a6 6 0 0 1 0 8M20 5a10 10 0 0 1 0 14',
  speakerOff: 'M3 9h4l6-5v16l-6-5H3V9M17 9l5 6M22 9l-5 6',
  pause: 'M8 5v14M16 5v14',
  play: 'M7 4l13 8-13 8z',
  stop: 'M6 6h12v12H6z',
  skipNext: 'M5 5l10 7-10 7V5M19 5v14',
  skipPrevious: 'M19 5l-10 7 10 7V5M5 5v14',
  send: 'M3 11.5L21 3l-8.5 18-2-7.5L3 11.5zm7.5 2L21 3',
  queue: 'M5 6h14M5 12h10M5 18h6M18 15v6M15 18h6',
  settings: 'M4 7h16M4 17h16M8 4v6M16 14v6',
  filter: 'M3 5h18l-7 8v6l-4 2v-8L3 5z',
  link: 'M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.7 1.7M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.7-1.7',
  chevron: 'M6 9l6 6 6-6',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 7v5l3 2',
  close: 'M6 6l12 12M18 6 6 18',
} as const;

export type IconName = keyof typeof iconPaths;
