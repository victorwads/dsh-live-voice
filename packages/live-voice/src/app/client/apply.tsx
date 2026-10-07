// @ts-nocheck
import React from 'react';
import { SpeechStatusBar } from '../../modules/conversation/components/SpeechStatusBar.js';
import { MeetingController } from '../../modules/conversation/models/meeting.js';
import { SharedAudioMeter, requestSharedAudio } from '../../modules/core/sharedAudio.js';
import {
  MeetingToggle,
  MeetingBars,
} from '../../modules/conversation/components/MeetingControls.js';
import { createPortal } from 'react-dom';
import { preserveComposerSelection } from './composerSelection.js';
import { MicrophoneMeter, VoiceCoordinator, VoiceOwnership } from '../../modules/core/index.js';
import {
  BrowserRecognitionEngine,
  QwenHttpRecognitionEngine,
  WhisperHttpRecognitionEngine,
} from '../../modules/recognition/index.js';
import {
  BrowserSpeakingEngine,
  HostAudioSpeakingEngine,
  QwenHttpSpeakingEngine,
} from '../../modules/speak/index.js';
import { createLiveVoiceSettings } from '../../modules/settings/index.js';
import {
  ConversationControls,
  ConversationStatusBar,
  SpeakButton as ModularSpeakButton,
} from '../../modules/conversation/index.js';
import { registerLiveVoiceLocales } from './i18n/index.js';
import { registerConversationSlots, registerSettingsSlot } from './registerSlots.js';
import { styles } from '../../styles/index.js';
import { createSettingsClient } from '../../modules/settings/models/settingsStorage.js';
import {
  publishDiagnosticSource,
  readCoordinatorDiagnostics,
} from '../../modules/core/diagnostics.js';
import {
  assistantMessages,
  addressedTurn,
  latestUserSequence,
  pendingQuestionSpeech,
} from '../../modules/conversation/models/chat.js';

export const inject = ['slots', 'connection', 'uiConversation', 'uiSession', 'locale'];
export function apply(ctx) {
  const t = registerLiveVoiceLocales(ctx);
  const SettingsPanel = createLiveVoiceSettings(t, ctx.locale);
  const controllers = new Map();
  const retiring = new Set();
  const preferences = createSettingsClient();
  const settingsControllers = new Set();
  let disposed = false;
  // Voice conversation mode belongs to the plugin, not to a mounted composer.
  // A route change may replace every conversation slot, but the next committed
  // composer should inherit the user's explicit choice to remain in voice mode.
  let voiceModeActive = false;
  const diagnosticListeners = new Set();
  const notifyDiagnostics = () => {
    for (const listener of diagnosticListeners) {
      try {
        listener();
      } catch {
        /* Observers never own voice behavior. */
      }
    }
  };
  ctx.effect(() => {
    const unpublish = publishDiagnosticSource(window, {
      version: 1,
      read: ({ includeContent = false } = {}) => ({
        application: { disposed, voiceModeActive, retiring: retiring.size },
        sessions: Object.fromEntries(
          [...controllers].map(([id, entry]) => [
            id,
            readCoordinatorDiagnostics(entry.controller, includeContent),
          ]),
        ),
        settingsControllers: [...settingsControllers].map((controller) =>
          readCoordinatorDiagnostics(controller, includeContent),
        ),
      }),
      subscribe: (listener) => {
        diagnosticListeners.add(listener);
        return () => {
          diagnosticListeners.delete(listener);
        };
      },
    });
    return () => {
      unpublish();
      diagnosticListeners.clear();
    };
  }, 'dsh-live-voice: diagnostic bridge');
  const publishVoiceContext = (
    entry,
    active = entry?.controller?.getSnapshot().conversation === true,
  ) => {
    if (!entry) return;
    const settings = entry.controller.getSnapshot().settings;
    const body = JSON.stringify({
      sessionId: entry.key,
      active:
        active &&
        settings.announceAssistantMessages !== false &&
        settings.agentVoiceContextEnabled !== false,
      context: settings.agentVoiceContext,
    });
    if (body === entry.lastVoiceContextBody) return;
    entry.lastVoiceContextBody = body;
    void fetch('/api/dsh-live-voice/voice-context', {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body,
    }).catch(() => {});
  };
  const ownership = new VoiceOwnership();
  const recognitionSettingKeys = new Set([
    'recognitionEngine',
    'recognitionProcessLocally',
    'recognitionAutoInstall',
    'voiceDetectionPreset',
    'voiceDetectionCustomSilenceMs',
    'recognitionMaxUtteranceSeconds',
  ]);
  const changesRecognition = (next) =>
    Object.keys(next).some((key) => recognitionSettingKeys.has(key));
  const recognitionFor = (settings, meter) =>
    settings.recognitionEngine === 'qwen-http'
      ? new QwenHttpRecognitionEngine({
          meter,
          voiceDetectionPreset: settings.voiceDetectionPreset,
          voiceDetectionCustomSilenceMs: settings.voiceDetectionCustomSilenceMs,
          maxUtteranceSeconds: settings.recognitionMaxUtteranceSeconds,
        })
      : settings.recognitionEngine === 'whisper-http'
        ? new WhisperHttpRecognitionEngine({
            meter,
            voiceDetectionPreset: settings.voiceDetectionPreset,
            voiceDetectionCustomSilenceMs: settings.voiceDetectionCustomSilenceMs,
            maxUtteranceSeconds: settings.recognitionMaxUtteranceSeconds,
          })
        : new BrowserRecognitionEngine({
            processLocally: settings.recognitionProcessLocally,
            autoInstallLocalPack: settings.recognitionAutoInstall,
          });
  const run = (controller, promise) =>
    Promise.resolve(promise).catch((error) => {
      if (!disposed && !controller.disposed)
        controller.patch({ error: error?.message || String(error) });
    });
  async function savePreferences(controller, next) {
    try {
      return await preferences.save(next);
    } catch {
      const error = new Error(t('dsh-live-voice.settings.persistence.saveError'));
      if (!disposed && !controller.disposed) controller.patch({ error: error.message });
      throw error;
    }
  }
  const unsubscribePreferences = preferences.subscribe((settings) => {
    if (disposed) return;
    for (const entry of controllers.values()) {
      if (entry.closed) continue;
      const previous = entry.controller.getSnapshot().settings;
      if ([...recognitionSettingKeys].some((key) => previous[key] !== settings[key]))
        entry.controller.replaceRecognition(recognitionFor(settings, entry.controller.meter));
      entry.applySettings(settings);
    }
    for (const c of settingsControllers) {
      if (c.disposed) continue;
      const previous = c.getSnapshot().settings;
      if ([...recognitionSettingKeys].some((key) => previous[key] !== settings[key]))
        c.replaceRecognition(recognitionFor(settings, c.meter));
      c.applySavedSettings(settings);
      for (const engine of Object.values(c.engines)) engine.lang = settings.lang;
      run(c, c.refreshCapabilities());
    }
  });
  ctx.effect(
    () => () => unsubscribePreferences(),
    'dsh-live-voice: remove preferences subscription',
  );
  function retire(entry) {
    if (entry.closed) return;
    entry.closed = true;
    entry.request++;
    entry.composers.clear();
    entry.unsubscribe?.();
    entry.unsubscribe = null;
    entry.unsubscribeVoiceContext?.();
    entry.unsubscribeVoiceContext = null;
    entry.unsubscribePendingQuestion?.();
    entry.unsubscribePendingQuestion = null;
    entry.questionCapture = null;
    entry.controller.patch({ answeringQuestion: false });
    publishVoiceContext(entry, false);
    entry.unsubscribeMeetingMicrophone?.();
    entry.chatListeners.clear();
    if (controllers.get(entry.key) === entry) controllers.delete(entry.key);
    notifyDiagnostics();
    // Keep teardown in the hardware handoff barrier, not in the session registry.
    const done = run(
      entry.controller,
      Promise.all([entry.controller.dispose(), entry.meeting?.dispose()]),
    );
    const barrier = { endConversation: () => done };
    retiring.add(barrier);
    void done.finally(() => retiring.delete(barrier));
  }
  function get(sessionId) {
    const key = String(sessionId);
    if (controllers.has(key)) return controllers.get(key);
    const entry = {
      key,
      draft: '',
      pendingDraft: undefined,
      publishedDraft: undefined,
      publishedRevision: undefined,
      pendingRevision: undefined,
      staleDrafts: new Set(),
      composers: new Map(),
      refs: 0,
      buttons: 0,
      request: 0,
      closed: false,
      lastVoiceContextBody: null,
    };
    const settings = preferences.getSnapshot();
    const engineBrowser = new BrowserSpeakingEngine({ lang: settings.lang || 'pt-BR' });
    const engineSay = new HostAudioSpeakingEngine({
      endpoint: '/api/dsh-live-voice/say/speech',
      capability: '/api/dsh-live-voice/say/capabilities',
      lang: settings.lang || 'pt-BR',
      synthesisRate: () => 175,
      playbackRate: (rate) => rate,
    });
    const engineQwen = new QwenHttpSpeakingEngine({ lang: settings.lang || 'pt-BR' });
    const meter = new MicrophoneMeter();
    const recognition = recognitionFor(settings, meter);
    entry.controller = new VoiceCoordinator({
      persistSettings: (next) => savePreferences(entry.controller, next),
      recognition,
      engines: { browser: engineBrowser, say: engineSay, 'qwen-http': engineQwen },
      meter,
      composer: {
        getDraft: () => entry.draft,
        appendFinal: (text, startedAt) => {
          if (entry.meeting?.getSnapshot().shared.listening) {
            entry.meeting.transcript.append('microphone', text, startedAt);
            return entry.draft;
          }
          return null;
        },
        submit: (mode = 'queue') => {
          const owner = [...entry.composers.values()].at(-1);
          if (!owner) return;
          const busyEnter = entry.controller.getSnapshot().settings.dshBusyEnterBehavior;
          if (mode !== busyEnter || busyEnter === 'steer') {
            // InputActions.submit() always queues; it does not emulate normal Enter.
            // Use an actual Enter gesture for steering-default composers, adding Ctrl
            // only for the opposite mode. Read the preference at delivery time.
            // Never fall back to normal submit: that would deliver the wrong mode.
            owner.submitAccelerated?.(mode !== busyEnter);
            return;
          }
          owner.actions.submit?.();
        },
        handleQuestionResult: ({ final, interim }) => {
          const capture = entry.questionCapture;
          if (!capture || capture.answering || (!final && !interim)) return false;
          if (final?.trim()) {
            capture.answering = true;
            capture.answers.push({
              id: capture.interaction.questions[capture.index].id,
              selected: [],
              custom: final.trim(),
            });
            capture.index++;
            if (capture.index < capture.interaction.questions.length) {
              capture.answering = false;
              const text = pendingQuestionSpeech(capture.interaction, capture.index);
              if (text)
                run(entry.controller, entry.controller.speak(text, capture.interaction.key));
            } else {
              entry.questionCapture = null;
              entry.controller.patch({ answeringQuestion: false });
              run(entry.controller, capture.interaction.answer({ answers: capture.answers }));
            }
          }
          return true;
        },
        setDraft: (text) => {
          if (disposed || entry.closed) return;
          const owner = [...entry.composers.values()].at(-1);
          if (!owner) return;
          // Preserve unacknowledged voice writes across unchanged slot renders,
          // but let new editor publications (including manual edits) supersede them.
          if (entry.pendingDraft === undefined) entry.staleDrafts.clear();
          entry.staleDrafts.add(entry.draft);
          if (entry.publishedDraft !== undefined) entry.staleDrafts.add(entry.publishedDraft);
          const previous = entry.draft;
          entry.draft = text;
          entry.pendingDraft = text;
          entry.pendingRevision = entry.publishedRevision;
          const append = text.length > previous.length && text.startsWith(previous);
          if (append) preserveComposerSelection(() => owner.actions.setDraft(text));
          else owner.actions.setDraft(text);
        },
      },
      settings,
    });
    const controller = entry.controller;
    entry.unsubscribeVoiceContext = controller.subscribe(() => {
      publishVoiceContext(entry);
      notifyDiagnostics();
    });
    notifyDiagnostics();
    publishVoiceContext(entry);
    entry.chat = ctx.uiConversation.binding(sessionId).target('chat');
    entry.chatListeners = new Set();
    entry.subscribeChat = (listener) => {
      if (entry.closed) return () => {};
      entry.chatListeners.add(listener);
      return () => entry.chatListeners.delete(listener);
    };
    entry.readChat = entry.chat.getSnapshot.bind(entry.chat);
    const refresh = (baseline = false) => {
      if (disposed || entry.closed) return;
      const snapshot = entry.readChat();
      const userSeq = latestUserSequence(snapshot);
      if (
        !baseline &&
        userSeq > entry.userSeq &&
        controller.getSnapshot().settings.interruptSpeechOnUserMessage &&
        (controller.getSnapshot().speaking || controller.getSnapshot().paused)
      )
        run(controller, controller.stopSpeech());
      entry.userSeq = Math.max(entry.userSeq ?? -1, userSeq);
      for (const message of assistantMessages(snapshot))
        controller.observeMessage(message.id, message.text, {
          complete: message.complete,
          baseline: baseline || message.interrupted,
        });
    };
    refresh(true);
    entry.unsubscribe = entry.chat.subscribe(() => {
      refresh();
      for (const listener of entry.chatListeners) listener();
    });
    // DSH 0.1.6 may omit this legacy store. Keep the remaining voice controls
    // available while structured-question integration is unavailable.
    const pendingInteractions = ctx.uiSession.pendingInteractions;
    const refreshPendingQuestion = (baseline = false) => {
      if (disposed || entry.closed || !pendingInteractions) return;
      const interaction = pendingInteractions.getSnapshot().get(sessionId);
      const key = interaction?.kind === 'question' ? interaction.key : null;
      if (!key || (entry.questionCapture && entry.questionCapture.interaction.key !== key)) {
        entry.questionCapture = null;
        controller.patch({ answeringQuestion: false });
      }
      if (baseline) {
        entry.pendingQuestionKey = key;
        return;
      }
      if (!key || key === entry.pendingQuestionKey) return;
      entry.pendingQuestionKey = key;
      const text = pendingQuestionSpeech(interaction);
      if (text && controller.getSnapshot().conversation) {
        entry.questionCapture = { interaction, index: 0, answers: [], answering: false };
        controller.patch({ answeringQuestion: true });
        run(controller, controller.speak(text, key));
      }
    };
    if (pendingInteractions) {
      refreshPendingQuestion(true);
      entry.unsubscribePendingQuestion = pendingInteractions.subscribe(refreshPendingQuestion);
    }
    const update = controller.updateSettings.bind(controller);
    entry.applySettings = (next) => {
      update(next);
      publishVoiceContext(entry);
      engineBrowser.lang = controller.getSnapshot().settings.lang;
      engineQwen.lang = controller.getSnapshot().settings.lang;
      run(controller, controller.refreshCapabilities());
    };
    controller.updateSettings = (next) => {
      if (disposed || entry.closed) return;
      entry.applySettings(next);
      return savePreferences(controller, next);
    };
    // Cancel only this entry's queued acquisition. Global cancellation here would
    // invalidate a newer session while its predecessor is being unmounted.
    for (const method of ['stopListening', 'cancelDictation', 'endConversation', 'stopSpeech']) {
      const original = controller[method].bind(controller);
      controller[method] = (...args) => {
        entry.request++;
        if (method === 'endConversation' && args[0] !== true) voiceModeActive = false;
        const result = original(...args);
        Promise.resolve(result).finally(() => publishVoiceContext(entry));
        return result;
      };
    }
    for (const method of ['startDictation', 'startHoldToTalk', 'startConversation', 'speak']) {
      const original = controller[method].bind(controller);
      controller[method] = (...args) => {
        if (disposed || entry.closed || !entry.refs) return Promise.resolve();
        if (method !== 'speak' && !entry.composers.size) return Promise.resolve();
        if (method === 'startConversation') {
          // Re-entering voice mode must not replay visible history or the portion
          // of a response that streamed while voice mode was off. Consume the
          // current chat snapshot before admitting new assistant text.
          refresh(true);
          voiceModeActive = true;
        }
        const request = ++entry.request;
        return ownership.run(
          controller,
          [...controllers.values()].map((other) => other.controller).concat([...retiring]),
          async () => {
            try {
              await preferences.ready;
            } catch {
              throw new Error(t('dsh-live-voice.settings.persistence.loadError'));
            }
            if (disposed || entry.closed || !entry.refs || request !== entry.request) return;
            if (method !== 'speak' && !entry.composers.size) return;
            const result = original(...args);
            Promise.resolve(result).finally(() => publishVoiceContext(entry));
            return result;
          },
        );
      };
    }
    entry.meeting = new MeetingController({
      composer: entry.controller.composer,
      settings: () => entry.controller.getSnapshot().settings,
      translate: (key) => t('dsh-live-voice.meeting.' + key),
      createSource: (source, settings) => {
        const meter = source === 'shared' ? new SharedAudioMeter() : new MicrophoneMeter();
        return { meter, engine: recognitionFor(settings, meter) };
      },
    });
    entry.startMeetingSource = (source) => {
      try {
        const request = requestSharedAudio();
        request.catch(() => {});
        void entry.meeting.start(source, request);
      } catch {
        entry.meeting.patch(source, { error: t('dsh-live-voice.meeting.failed') });
      }
    };
    let microphoneActive = false;
    const unsubscribeMeetingMicrophone = controller.subscribe(() => {
      const state = controller.getSnapshot();
      const next = Boolean((state.listening || state.starting) && !state.muted);
      if (next !== microphoneActive) {
        microphoneActive = next;
        entry.meeting.transcript.setActive('microphone', next);
      }
    });
    entry.unsubscribeMeetingMicrophone = unsubscribeMeetingMicrophone;
    controllers.set(key, entry);
    void preferences.ready.catch(() => {
      if (!entry.closed)
        controller.patch({ error: t('dsh-live-voice.settings.persistence.loadError') });
    });
    run(controller, controller.refreshCapabilities());
    return entry;
  }
  function useEntry(sessionId, kind) {
    const [entry, setEntry] = React.useState(null);
    React.useLayoutEffect(() => {
      if (disposed) return;
      // Allocation and subscriptions happen only for committed mounts. Suspended
      // or abandoned renders never acquire a session, probe engines, or retain it.
      const current = get(sessionId);
      current.refs++;
      if (kind === 'buttons') current.buttons++;
      setEntry(current);
      return () => {
        current.refs--;
        if (kind === 'buttons') current.buttons--;
        if (!current.refs) current.request++;
        // StrictMode replay reacquires the same entry before this microtask.
        queueMicrotask(() => {
          if (!current.refs) retire(current);
        });
      };
    }, [sessionId, kind]);
    return entry?.key === String(sessionId) && !entry.closed ? entry : null;
  }
  function useComposer(entry, props) {
    // DSH publishes shell.state as useInput and shell.actions as inputActions.
    // Subscribe even when an embedding also supplies an input snapshot: that
    // snapshot is not the reactive owner of the shell-owned editor.
    const subscribedInput = props.useInput?.((value) => value);
    const input = subscribedInput ?? props.input;
    const token = React.useRef({});
    React.useLayoutEffect(() => {
      if (!entry || entry.closed || disposed) return;
      return () => {
        entry.composers.delete(token.current);
        // Message-action mounts may outlive the composer; never retain its actions.
        // Do not interpret a route-driven composer unmount as the user's request
        // to leave voice mode. Retirement still releases the old controller; the
        // next committed composer resumes the conversation automatically.
      };
    }, [entry]);
    React.useLayoutEffect(() => {
      if (!entry || entry.closed || disposed) return;
      if (!input || typeof props.inputActions?.setDraft !== 'function') return;
      entry.composers.set(token.current, {
        actions: props.inputActions,
        submitAccelerated: (accelerated = true) => {
          const active = document.activeElement;
          const editor =
            active?.nodeType === 1 && active.isContentEditable
              ? active
              : document.querySelector('[contenteditable="true"]');
          if (!editor || editor.nodeType !== 1) return;
          editor.focus();
          const KeyboardEventCtor = editor.ownerDocument.defaultView?.KeyboardEvent;
          if (!KeyboardEventCtor) return;
          editor.dispatchEvent(
            new KeyboardEventCtor('keydown', {
              key: 'Enter',
              code: 'Enter',
              ctrlKey: accelerated,
              bubbles: true,
              cancelable: true,
            }),
          );
        },
      });
      if (voiceModeActive && !entry.controller.getSnapshot().conversation)
        run(entry.controller, entry.controller.startConversation());
    }, [entry, input, props.inputActions]);
    React.useLayoutEffect(() => {
      if (!entry || entry.closed || disposed || !input) return;
      const published = typeof input.draft === 'string' ? input.draft : '';
      // A voice write is optimistic until React commits the editor publication.
      // Unrelated slot renders must not restore the previous draft in between.
      entry.publishedDraft = published;
      entry.publishedRevision = input.draftRev;
      const newerRevision =
        Number.isInteger(input.draftRev) &&
        Number.isInteger(entry.pendingRevision) &&
        input.draftRev > entry.pendingRevision;
      if (entry.pendingDraft === undefined) entry.draft = published;
      else if (
        published === entry.pendingDraft ||
        newerRevision ||
        !entry.staleDrafts.has(published)
      ) {
        // A new manual edit is authoritative even if the exact voice echo was skipped.
        entry.draft = published;
        entry.pendingDraft = undefined;
        entry.staleDrafts.clear();
      }
      entry.controller.composerChanged(entry.draft);
    });
  }
  function Buttons(props) {
    const entry = useEntry(props.sessionId, 'buttons');
    useComposer(entry, props);
    return entry ? (
      <>
        <MeetingToggle
          meeting={entry.meeting}
          onToggle={() => {
            const value = entry.meeting.getSnapshot().shared;
            if (value.starting || value.listening) void entry.meeting.stop('shared');
            else entry.startMeetingSource('shared');
          }}
        />
        <ConversationControls controller={entry.controller} />
      </>
    ) : null;
  }
  function Settings() {
    const [controller, setController] = React.useState(null);
    React.useEffect(() => {
      const settings = preferences.getSnapshot();
      const browser = new BrowserSpeakingEngine({ lang: settings.lang });
      const qwen = new QwenHttpSpeakingEngine({ lang: settings.lang });
      const meter = new MicrophoneMeter();
      const recognition = recognitionFor(settings, meter);
      const c = new VoiceCoordinator({
        persistSettings: (next) => savePreferences(c, next),
        recognition,
        engines: {
          browser,
          say: new HostAudioSpeakingEngine({
            endpoint: '/api/dsh-live-voice/say/speech',
            capability: '/api/dsh-live-voice/say/capabilities',
            synthesisRate: () => 175,
            playbackRate: (rate) => rate,
          }),
          'qwen-http': qwen,
        },
        meter,
        composer: { getDraft: () => '', setDraft: () => {} },
        settings,
      });
      const speak = c.speak.bind(c);
      c.speak = (...args) =>
        ownership.run(
          c,
          [...controllers.values()].map((entry) => entry.controller).concat([...retiring]),
          async () => {
            try {
              await preferences.ready;
            } catch {
              throw new Error(t('dsh-live-voice.settings.persistence.loadError'));
            }
            if (!disposed && !c.disposed) return speak(...args);
          },
        );
      const update = c.updateSettings.bind(c);
      c.applySavedSettings = update;
      settingsControllers.add(c);
      const unsubscribeDiagnostics = c.subscribe(notifyDiagnostics);
      notifyDiagnostics();
      void preferences.ready.catch(() =>
        c.patch({ error: t('dsh-live-voice.settings.persistence.loadError') }),
      );
      let settingsRevision = 0;
      c.updateSettings = async (next) => {
        const revision = ++settingsRevision;
        update(next);
        browser.lang = c.getSnapshot().settings.lang;
        qwen.lang = c.getSnapshot().settings.lang;
        const settings = c.getSnapshot().settings;
        if (changesRecognition(next)) c.replaceRecognition(recognitionFor(settings, c.meter));
        const saved = savePreferences(c, next);
        run(c, c.refreshCapabilities());
        const active = [...controllers.values()];
        const [savedSettings] = await Promise.all([
          saved,
          c.endConversation(),
          ...active.map((entry) =>
            Promise.all([entry.controller.endConversation(), entry.meeting.end()]),
          ),
        ]);
        if (revision !== settingsRevision || disposed || c.disposed) return;
        for (const entry of controllers.values()) {
          if (entry.closed) continue;
          if (changesRecognition(next))
            entry.controller.replaceRecognition(
              recognitionFor(savedSettings, entry.controller.meter),
            );
          entry.applySettings(savedSettings);
          run(entry.controller, entry.controller.refreshCapabilities());
        }
      };
      const refresh = () => run(c, c.refreshCapabilities());
      document.addEventListener('dsh-live-voice:capabilitieschanged', refresh);
      setController(c);
      refresh();
      return () => {
        document.removeEventListener('dsh-live-voice:capabilitieschanged', refresh);
        unsubscribeDiagnostics();
        settingsControllers.delete(c);
        notifyDiagnostics();
        void c.dispose();
      };
    }, []);
    return controller ? <SettingsPanel controller={controller} /> : null;
  }
  registerSettingsSlot(ctx, Settings, () => t('dsh-live-voice.commons.pluginName'));
  function Dock(props) {
    const entry = useEntry(props.sessionId, 'dock');
    useComposer(entry, props);
    return entry ? (
      <div className="dlv-bar-stack">
        <SpeechStatusBar controller={entry.controller} />
        <MeetingBars meeting={entry.meeting} />
        <ConversationStatusBar controller={entry.controller} includeSpeech={false} />
      </div>
    ) : null;
  }
  function QuestionStatusView({ entry }) {
    const snapshot = React.useSyncExternalStore(
      entry.controller.subscribe,
      entry.controller.getSnapshot,
    );
    const [overlayStyle, setOverlayStyle] = React.useState();
    React.useLayoutEffect(() => {
      if (!snapshot.answeringQuestion) return;
      const seat = document.querySelector('[data-composer-seat]');
      if (!seat) return;
      const update = () => {
        const rect = seat.getBoundingClientRect();
        setOverlayStyle({
          left: rect.left + rect.width / 2,
          width: Math.min(720, Math.max(0, rect.width - 32)),
        });
      };
      update();
      const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(update) : null;
      observer?.observe(seat);
      window.addEventListener('resize', update);
      return () => {
        observer?.disconnect();
        window.removeEventListener('resize', update);
      };
    }, [snapshot.answeringQuestion]);
    const target = typeof document === 'undefined' ? null : document.body;
    return snapshot.answeringQuestion && target && overlayStyle
      ? createPortal(
          <ConversationStatusBar
            controller={entry.controller}
            questionOnly
            overlay
            overlayStyle={overlayStyle}
          />,

          target,
        )
      : null;
  }
  function QuestionStatus(props) {
    const entry = useEntry(props.sessionId, 'question-status');
    return entry ? <QuestionStatusView entry={entry} /> : null;
  }
  function ActionView({ entry, messageId }) {
    const snapshot = React.useSyncExternalStore(
      entry.controller.subscribe,
      entry.controller.getSnapshot,
    );
    const chat = React.useSyncExternalStore(entry.subscribeChat, entry.readChat);
    const message = addressedTurn(assistantMessages(chat), messageId);
    const capability = snapshot.capabilities[snapshot.settings.engine];
    const active = snapshot.speaking && message.id === snapshot.activeMessageId;
    const unavailable = capability?.supported !== true;
    return (
      <ModularSpeakButton
        active={active}
        disabled={!message.text.trim() || (!active && unavailable)}
        label={
          unavailable ? capability?.reason || t('dsh-live-voice.speak.output.checking') : undefined
        }
        onClick={() =>
          run(
            entry.controller,
            active
              ? entry.controller.stopSpeech()
              : entry.controller.speak(message.text, message.id),
          )
        }
      />
    );
  }
  function Action(props) {
    const entry = useEntry(props.sessionId, 'action');
    return entry ? <ActionView entry={entry} messageId={props.messageId} /> : null;
  }
  ctx.effect(() => {
    const style = document.createElement('style');
    style.dataset.plugin = 'dsh-live-voice';
    style.textContent = styles;
    document.head.appendChild(style);
    return () => style.remove();
  });
  registerConversationSlots(ctx, { Buttons, Dock, QuestionStatus, Action }, () =>
    t('dsh-live-voice.commons.pluginName'),
  );
  ctx.effect(() => {
    const stop = () => {
      ownership.cancel();
      for (const entry of controllers.values()) {
        run(entry.controller, entry.controller.endConversation());
        void entry.meeting.end();
      }
    };
    let holdToTalk = null;
    const candidate = () => {
      const candidates = [...controllers.values()].filter(
        (entry) => entry.buttons > 0 && entry.composers.size > 0,
      );
      return candidates.length === 1 ? candidates[0] : null;
    };
    const releaseHoldToTalk = () => {
      const entry = holdToTalk;
      holdToTalk = null;
      if (!entry || entry.closed) return;
      run(entry.controller, entry.controller.releaseHoldToTalk());
    };
    const onKeyDown = (event) => {
      if (disposed || event.defaultPrevented || event.repeat) return;
      if (event.key === 'Escape' && holdToTalk) {
        const entry = holdToTalk;
        holdToTalk = null;
        event.preventDefault();
        run(entry.controller, entry.controller.cancelDictation());
        return;
      }
      if (event.ctrlKey && event.shiftKey && event.code === 'Space') {
        const entry = candidate();
        if (!entry) return;
        event.preventDefault();
        const c = entry.controller;
        run(
          c,
          c.getSnapshot().listening || c.getSnapshot().starting
            ? c.stopListening()
            : c.startDictation(),
        );
        return;
      }
      if (event.key !== 'Control' || event.altKey || event.metaKey || event.shiftKey) return;
      const entry = candidate();
      if (!entry || !entry.controller.getSnapshot().settings.holdToTalkEnabled) return;
      holdToTalk = entry;
      run(entry.controller, entry.controller.startHoldToTalk());
    };
    const onKeyUp = (event) => {
      if (event.key === 'Control') releaseHoldToTalk();
    };
    const refreshCapabilities = () => {
      for (const entry of controllers.values())
        run(entry.controller, entry.controller.refreshCapabilities());
      document.dispatchEvent(new Event('dsh-live-voice:capabilitieschanged'));
    };
    const visibilityChanged = () => {
      if (document.visibilityState === 'visible') refreshCapabilities();
    };
    window.speechSynthesis?.addEventListener?.('voiceschanged', refreshCapabilities);
    navigator.mediaDevices?.addEventListener?.('devicechange', refreshCapabilities);
    document.addEventListener('visibilitychange', visibilityChanged);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', releaseHoldToTalk);
    window.addEventListener('pagehide', stop);
    return () => {
      disposed = true;
      ownership.close();
      window.speechSynthesis?.removeEventListener?.('voiceschanged', refreshCapabilities);
      navigator.mediaDevices?.removeEventListener?.('devicechange', refreshCapabilities);
      document.removeEventListener('visibilitychange', visibilityChanged);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', releaseHoldToTalk);
      window.removeEventListener('pagehide', stop);
      for (const entry of controllers.values()) retire(entry);
    };
  });
}
