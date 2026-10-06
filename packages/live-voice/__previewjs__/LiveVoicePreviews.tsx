import React from 'react';
import { createConversationComponents } from '../src/modules/conversation/components/createConversationComponents.js';
import { defaultSettings, normalizeSettings } from '../src/modules/core/settings.js';
import { LiveVoiceSettings } from '../src/modules/settings/components/LiveVoiceSettings.js';

type VoiceScenario = 'listening' | 'processing' | 'speaking' | 'paused' | 'queued';

type PreviewState = {
  conversation: boolean;
  listening: boolean;
  recognizing: boolean;
  pendingTranscriptions: number;
  muted: boolean;
  speaking: boolean;
  paused: boolean;
  starting: boolean;
  error: string | null;
  activeMessageId: string | null;
  answeringQuestion: boolean;
  autoSendAt: number | null;
  speechSegmentsRemaining: number;
  capabilities: Record<string, any>;
  settings: Record<string, any>;
};

// useSyncExternalStore requires referentially stable snapshots when nothing changed.
const localeSnapshot = Object.freeze({ active: 'en', revision: 0 });
const locale = {
  getSnapshot: () => localeSnapshot,
  subscribe: () => () => {},
};

const { RecordingBar: CreatedRecordingBar } = createConversationComponents(
  React,
  undefined,
  locale,
);
const RecordingBar = CreatedRecordingBar as React.ComponentType<{
  controller: Record<string, any>;
}>;

const capabilities = {
  browser: {
    supported: true,
    pause: true,
    resume: true,
    voices: [
      { name: 'Local English Voice', voiceURI: 'preview-en', localService: true },
      { name: 'Local Portuguese Voice', voiceURI: 'preview-pt', localService: true },
    ],
  },
  capture: { supported: true, permission: 'granted' },
  recognition: { supported: true, local: true },
  say: { supported: true, pause: false, resume: false },
  qwen: { supported: true, pause: true, resume: true },
  'qwen-http': { supported: true, pause: true, resume: true },
  'qwen-http-recognition': { supported: true },
  'whisper-http': { supported: true },
};

function stateForScenario(scenario: VoiceScenario): Partial<PreviewState> {
  switch (scenario) {
    case 'processing':
      return { listening: false, recognizing: true };
    case 'speaking':
      return { listening: false, speaking: true, speechSegmentsRemaining: 3 };
    case 'paused':
      return { listening: false, paused: true, speechSegmentsRemaining: 2 };
    case 'queued':
      return { listening: true, speechSegmentsRemaining: 4 };
    default:
      return { listening: true };
  }
}

function createPreviewController(initial: Partial<PreviewState> = {}) {
  let snapshot: PreviewState = {
    conversation: true,
    listening: true,
    recognizing: false,
    pendingTranscriptions: 0,
    muted: false,
    speaking: false,
    paused: false,
    starting: false,
    error: null,
    activeMessageId: null,
    answeringQuestion: false,
    autoSendAt: null,
    speechSegmentsRemaining: 0,
    capabilities,
    settings: normalizeSettings(defaultSettings),
    ...initial,
  };
  const listeners = new Set<() => void>();
  const patch = (next: Partial<PreviewState>) => {
    snapshot = { ...snapshot, ...next };
    listeners.forEach((listener) => listener());
  };
  const controller: Record<string, any> = {
    meter: { level: () => (snapshot.listening && !snapshot.muted ? 0.42 : 0) },
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    clearError: () => patch({ error: null }),
    updateSettings(next: Record<string, unknown>) {
      patch({ settings: normalizeSettings({ ...snapshot.settings, ...next }) });
    },
    endConversation: () =>
      patch({ conversation: false, listening: false, recognizing: false, muted: false }),
    startConversation: () => patch({ conversation: true, listening: true, muted: false }),
    muteListening: () => patch({ muted: true }),
    resumeListeningInput: () => patch({ muted: false, listening: true }),
    pauseSpeech: () => patch({ speaking: false, paused: true }),
    resumeSpeech: () => patch({ speaking: true, paused: false }),
    stopSpeech: () => patch({ speaking: false, paused: false, speechSegmentsRemaining: 0 }),
    skipSpeechSegment: () =>
      patch({ speechSegmentsRemaining: Math.max(0, snapshot.speechSegmentsRemaining - 1) }),
    cancelAutoSend: () => patch({ autoSendAt: null }),
    cancelDictation: () => patch({ listening: false, recognizing: false }),
    refreshCapabilities: async () => undefined,
  };
  return controller;
}

export function VoiceBarPreview({ scenario = 'listening' }: { scenario?: VoiceScenario }) {
  const controller = React.useMemo(
    () => createPreviewController(stateForScenario(scenario)),
    [scenario],
  );
  return (
    <main style={{ display: 'grid', minHeight: 240, alignContent: 'center' }}>
      <RecordingBar controller={controller} />
    </main>
  );
}

export function SettingsScreenPreview() {
  const controller = React.useMemo(() => createPreviewController(), []);
  return (
    <main style={{ display: 'grid', justifyItems: 'center' }}>
      <LiveVoiceSettings controller={controller} onClose={() => undefined} />
    </main>
  );
}
