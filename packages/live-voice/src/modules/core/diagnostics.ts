/** Versioned read-only boundary; debugger UI is never imported by the runtime. */
export const DIAGNOSTIC_KEY = Symbol.for('dsh-live-voice.diagnostics.v1');
export const DIAGNOSTIC_CHANGED = 'dsh-live-voice:diagnostics-changed';
export type DiagnosticValue =
  null | boolean | number | string | DiagnosticValue[] | { [key: string]: DiagnosticValue };
export interface DiagnosticSource {
  version: 1;
  read(options?: { includeContent?: boolean }): DiagnosticValue;
  subscribe(listener: () => void): () => void;
}
export function publishDiagnosticSource(target: any, source: DiagnosticSource) {
  target[DIAGNOSTIC_KEY] = source;
  const ChangedEvent = target.Event ?? Event;
  target.dispatchEvent?.(new ChangedEvent(DIAGNOSTIC_CHANGED));
  return () => {
    if (target[DIAGNOSTIC_KEY] !== source) return;
    delete target[DIAGNOSTIC_KEY];
    target.dispatchEvent?.(new ChangedEvent(DIAGNOSTIC_CHANGED));
  };
}
const number = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;
/** Explicit projection excludes audio, functions, resources and free-form errors. */
export function readCoordinatorDiagnostics(
  controller: any,
  includeContent = false,
): DiagnosticValue {
  const state = controller.getSnapshot();
  const recognition = controller.recognition?.session;
  const settings: Record<string, DiagnosticValue> = {};
  const publicSettings = new Set([
    'engine',
    'recognitionEngine',
    'voiceDetectionPreset',
    'sendingMode',
    'dshBusyEnterBehavior',
    'mode',
    'lang',
    'recognitionLang',
  ]);
  for (const [key, value] of Object.entries(state.settings ?? {})) {
    settings[key] =
      typeof value === 'string'
        ? includeContent || publicSettings.has(key)
          ? value
          : { characters: value.length }
        : typeof value === 'boolean' || typeof value === 'number'
          ? value
          : null;
  }
  const item = (entry: any): DiagnosticValue => ({
    messageId: entry.id == null ? null : String(entry.id),
    manual: entry.manual === true,
    characters: entry.text?.length ?? 0,
    ...(includeContent ? { text: String(entry.text ?? '') } : {}),
    preparing: Boolean(entry.preparing),
    prepared: Boolean(entry.prepared),
    failed: Boolean(entry.prepareError),
  });
  return {
    settings,
    lifecycle: {
      disposed: Boolean(controller.disposed),
      conversation: Boolean(state.conversation),
    },
    composer: {
      characters: controller.composer?.getDraft?.()?.length ?? 0,
      answeringQuestion: Boolean(state.answeringQuestion),
      ...(includeContent ? { draft: controller.composer?.getDraft?.() ?? '' } : {}),
    },
    capture: {
      starting: Boolean(state.starting),
      listening: Boolean(state.listening),
      muted: Boolean(state.muted),
      generation: number(controller.epoch),
      level: number(controller.meter?.level?.()),
      releaseFailed: Boolean(controller.inputReleaseError),
    },
    vad: {
      source: state.settings?.recognitionEngine === 'browser' ? 'native' : 'plugin',
      activity: Boolean(state.recognizing),
      threshold: recognition?.chunks ? 0.012 : null,
      silenceMs:
        recognition?.chunks && controller.meter?.context?.sampleRate
          ? (recognition.silence / controller.meter.context.sampleRate) * 1000
          : null,
    },
    chunker: {
      available: Boolean(recognition?.chunks),
      bufferedSamples: number(recognition?.samples),
      bufferedChunks: recognition?.chunks?.length ?? null,
      containsSpeech: recognition?.voiced ?? null,
    },
    recognition: {
      pendingTranscriptions: number(state.pendingTranscriptions),
      activeRequest: Boolean(recognition?.activeRequest),
      queue: (recognition?.transcriptionQueue ?? []).map((chunk: any) => ({
        samples: (chunk.samples ?? chunk).length,
        durationMs: controller.meter?.context?.sampleRate
          ? ((chunk.samples ?? chunk).length / controller.meter.context.sampleRate) * 1000
          : null,
      })),
    },
    delivery: {
      autoSendAt: number(state.autoSendAt),
      countdownActive: controller.autoSendTimer != null,
      holdToTalkRelease: Boolean(controller.holdToTalkRelease),
    },
    speech: {
      speaking: Boolean(state.speaking),
      paused: Boolean(state.paused),
      activeMessageId: state.activeMessageId == null ? null : String(state.activeMessageId),
      generation: number(controller.speechEpoch),
      controlGeneration: number(controller.controlEpoch),
      remaining: number(state.speechSegmentsRemaining),
      notBefore: number(controller.assistantSpeechNotBefore),
      waitingForActivity: controller.assistantSpeechNotBefore === Infinity,
      stopFailed: Boolean(controller.speechStopError),
      queue: (controller.queue ?? []).map(item),
      activeItem: controller.activeSpeechItem ? item(controller.activeSpeechItem) : null,
      prefetchCount: controller.prefetchItems?.size ?? 0,
      consumed: Object.fromEntries(controller.consumed ?? []),
      unfinished: [...(controller.unfinished ?? [])].map(String),
      suppressed: [...(controller.suppressed ?? [])].map(String),
    },
    interruption: {
      transcriptConfirmed: Boolean(controller.interruptionTranscriptConfirmed),
      pausedSpeech: Boolean(controller.interruptionPausedSpeech),
      timerActive: controller.interruptionTimer != null,
    },
    capabilities: Object.fromEntries(
      Object.entries(state.capabilities ?? {}).map(([key, cap]: [string, any]) => [
        key,
        cap
          ? {
              supported: cap.supported === true,
              local: cap.local ?? null,
              pause: cap.pause ?? null,
              resume: cap.resume ?? null,
              hasReason: Boolean(cap.reason),
            }
          : null,
      ]),
    ),
    error: {
      present: Boolean(state.error),
      ...(includeContent ? { message: state.error ?? null } : {}),
    },
  };
}
