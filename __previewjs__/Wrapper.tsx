import React from 'react';
import type { ReactNode } from 'react';
import { LiveVoiceTranslationProvider } from '../src/app/client/i18n/index.js';
import { styles } from '../src/styles/index.js';

const previewTheme = {
  '--dsw-alias-bg-layer-1': '#18181b',
  '--dsw-alias-bg-layer-2': '#27272a',
  '--dsw-alias-border-l1': '#3f3f46',
  '--dsw-alias-border-l2': '#52525b',
  '--dsw-alias-interactive-bg-hover': '#27272a',
  '--dsw-alias-label-primary': '#fafafa',
  '--dsw-alias-label-secondary': '#d4d4d8',
  '--dsw-alias-label-tertiary': '#a1a1aa',
  '--dsw-alias-state-business-primary': '#38bdf8',
  '--dsw-alias-state-error-primary': '#fb7185',
} as React.CSSProperties;

export function Wrapper({ children }: { children: ReactNode }) {
  return (
    <LiveVoiceTranslationProvider>
      <style>{styles}</style>
      <div
        style={{
          ...previewTheme,
          boxSizing: 'border-box',
          minHeight: '100vh',
          padding: 24,
          background: '#09090b',
          color: '#fafafa',
          fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        }}
      >
        {children}
      </div>
    </LiveVoiceTranslationProvider>
  );
}
