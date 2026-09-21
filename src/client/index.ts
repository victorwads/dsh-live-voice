// @ts-nocheck
import React from 'react';
import { createPortal } from 'react-dom';
import { VoiceCoordinator } from '../core/coordinator.ts';
import { VoiceOwnership } from '../core/ownership.ts';
import { normalizeSettings } from '../core/settings.ts';
import { MicrophoneMeter } from '../core/microphone.ts';
import { BrowserSpeakingEngine } from '../engines/speaking/browser.ts';
import { HostAudioSpeakingEngine } from '../engines/speaking/host-audio.ts';
import { BrowserRecognitionEngine } from '../engines/recognition/browser.ts';
import { WhisperHttpRecognitionEngine } from '../engines/recognition/whisper-http.ts';
import { QwenHttpRecognitionEngine } from '../engines/recognition/qwen-http.ts';
import { QwenHttpSpeakingEngine } from '../engines/speaking/qwen-http.ts';
import { createComponents } from './components.ts';
import { registerLiveVoiceLocales } from './locale.ts';
import { styles } from './styles.ts';
import {
  assistantMessages,
  addressedTurn,
  latestUserSequence,
  pendingQuestionSpeech,
} from './chat.ts';

export const inject = ['slots', 'connection', 'uiConversation', 'uiSession', 'locale'];
export function apply(ctx) {
  const t = registerLiveVoiceLocales(ctx);
  const e = React.createElement;
  const { MicrophoneButtons, RecordingBar, SpeakButton, SettingsPanel } = createComponents(
    React,
    t,
    ctx.locale,
  );
  const controllers = new Map();
  const retiring = new Set();
  let disposed = false;
  // Voice conversation mode belongs to the plugin, not to a mounted composer.
  // A route change may replace every conversation slot, but the next committed
  // composer should inherit the user's explicit choice to remain in voice mode.
  let voiceModeActive = false;
  const publishVoiceContext = (entry, active = entry?.controller?.getSnapshot().conversation === true) => {
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
    'recognitionMaxUtteranceSeconds',
  ]);
  const changesRecognition = (next) =>
    Object.keys(next).some((key) => recognitionSettingKeys.has(key));
  const recognitionFor = (settings, meter) =>
    settings.recognitionEngine === 'qwen-http'
      ? new QwenHttpRecognitionEngine({
          meter,
          voiceDetectionPreset: settings.voiceDetectionPreset,
          maxUtteranceSeconds: settings.recognitionMaxUtteranceSeconds,
        })
      : settings.recognitionEngine === 'whisper-http'
        ? new WhisperHttpRecognitionEngine({
            meter,
            voiceDetectionPreset: settings.voiceDetectionPreset,
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
    entry.chatListeners.clear();
    if (controllers.get(entry.key) === entry) controllers.delete(entry.key);
    // Keep teardown in the hardware handoff barrier, not in the session registry.
    const done = run(entry.controller, entry.controller.dispose());
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
      composers: new Map(),
      refs: 0,
      buttons: 0,
      request: 0,
      closed: false,
      lastVoiceContextBody: null,
    };
    let settings = {};
    try {
      settings = normalizeSettings(
        JSON.parse(localStorage.getItem('dsh-live-voice.settings') || '{}'),
      );
    } catch {
      settings = normalizeSettings(null);
    }
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
      recognition,
      engines: { browser: engineBrowser, say: engineSay, 'qwen-http': engineQwen },
      meter,
      composer: {
        getDraft: () => entry.draft,
        submit: (mode = 'queue') => {
          const owner = [...entry.composers.values()].at(-1);
          if (!owner) return;
          if (mode === 'steer') {
            // InputActions deliberately exposes no delivery-mode argument. Dispatch the
            // DSH accelerated composer gesture instead: Ctrl/Cmd+Enter resolves to the
            // opposite of the normal busy-enter policy, which is direct steering when
            // the ordinary action queues. Never fall back to inputActions.submit() here:
            // it would silently turn an explicit steer request into a queued message.
            owner.submitAccelerated?.();
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
          // `setDraft()` updates Lexical synchronously but the subscribed InputState
          // can publish on a subsequent React commit. Preserve the optimistic value
          // until that exact publication arrives; otherwise another slot render can
          // make a later recognition result start from stale text.
          entry.draft = text;
          entry.pendingDraft = text;
          owner.actions.setDraft(text);
        },
      },
      settings,
    });
    const controller = entry.controller;
    entry.unsubscribeVoiceContext = controller.subscribe(() => publishVoiceContext(entry));
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
      const settings = controller.getSnapshot().settings;
      try {
        localStorage.setItem('dsh-live-voice.settings', JSON.stringify(settings));
      } catch {}
      for (const other of controllers.values()) {
        if (other !== entry && !other.closed) other.applySettings(settings);
      }
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
        if (method === 'startConversation') voiceModeActive = true;
        const request = ++entry.request;
        return ownership.run(
          controller,
          [...controllers.values()].map((other) => other.controller).concat([...retiring]),
          () => {
            if (disposed || entry.closed || !entry.refs || request !== entry.request) return;
            if (method !== 'speak' && !entry.composers.size) return;
            const result = original(...args);
            Promise.resolve(result).finally(() => publishVoiceContext(entry));
            return result;
          },
        );
      };
    }
    controllers.set(key, entry);
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
        submitAccelerated: () => {
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
              ctrlKey: true,
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
      if (entry.pendingDraft === undefined) entry.draft = published;
      else if (published === entry.pendingDraft) {
        entry.draft = published;
        entry.pendingDraft = undefined;
      }
      entry.controller.composerChanged(entry.draft);
    });
  }
  function Buttons(props) {
    const entry = useEntry(props.sessionId, 'buttons');
    useComposer(entry, props);
    return entry ? e(MicrophoneButtons, { controller: entry.controller }) : null;
  }
  function Settings() {
    const [controller, setController] = React.useState(null);
    React.useEffect(() => {
      let settings;
      try {
        settings = normalizeSettings(
          JSON.parse(localStorage.getItem('dsh-live-voice.settings') || '{}'),
        );
      } catch {
        settings = normalizeSettings(null);
      }
      const browser = new BrowserSpeakingEngine({ lang: settings.lang });
      const qwen = new QwenHttpSpeakingEngine({ lang: settings.lang });
      const meter = new MicrophoneMeter();
      const recognition = recognitionFor(settings, meter);
      const c = new VoiceCoordinator({
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
          () => speak(...args),
        );
      const update = c.updateSettings.bind(c);
      let settingsRevision = 0;
      c.updateSettings = async (next) => {
        const revision = ++settingsRevision;
        update(next);
        browser.lang = c.getSnapshot().settings.lang;
        qwen.lang = c.getSnapshot().settings.lang;
        const settings = c.getSnapshot().settings;
        if (changesRecognition(next)) c.replaceRecognition(recognitionFor(settings, c.meter));
        localStorage.setItem('dsh-live-voice.settings', JSON.stringify(settings));
        run(c, c.refreshCapabilities());
        const active = [...controllers.values()];
        await Promise.allSettled([
          c.endConversation(),
          ...active.map((entry) => entry.controller.endConversation()),
        ]);
        if (revision !== settingsRevision || disposed || c.disposed) return;
        for (const entry of controllers.values()) {
          if (entry.closed) continue;
          if (changesRecognition(next))
            entry.controller.replaceRecognition(recognitionFor(settings, entry.controller.meter));
          entry.applySettings(settings);
          run(entry.controller, entry.controller.refreshCapabilities());
        }
      };
      const refresh = () => run(c, c.refreshCapabilities());
      document.addEventListener('dsh-live-voice:capabilitieschanged', refresh);
      setController(c);
      refresh();
      return () => {
        document.removeEventListener('dsh-live-voice:capabilitieschanged', refresh);
        void c.dispose();
      };
    }, []);
    return controller ? e(SettingsPanel, { controller }) : null;
  }
  ctx.slots.inject('settings.section', () =>
    ctx.slots.register(
      {
        name: 'settings.section',
        id: 'dsh-live-voice',
        order: 65,
        label: () => t('dsh-live-voice.commons.pluginName'),
      },
      Settings,
    ),
  );
  function Dock(props) {
    const entry = useEntry(props.sessionId, 'dock');
    useComposer(entry, props);
    return entry ? e(RecordingBar, { controller: entry.controller }) : null;
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
          e(RecordingBar, {
            controller: entry.controller,
            questionOnly: true,
            overlay: true,
            overlayStyle,
          }),
          target,
        )
      : null;
  }
  function QuestionStatus(props) {
    const entry = useEntry(props.sessionId, 'question-status');
    return entry ? e(QuestionStatusView, { entry }) : null;
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
    return e(SpeakButton, {
      active,
      disabled: !message.text.trim() || (!active && unavailable),
      label: unavailable
        ? capability?.reason || t('dsh-live-voice.speak.output.checking')
        : undefined,
      onClick: () =>
        run(
          entry.controller,
          active ? entry.controller.stopSpeech() : entry.controller.speak(message.text, message.id),
        ),
    });
  }
  function Action(props) {
    const entry = useEntry(props.sessionId, 'action');
    return entry ? e(ActionView, { entry, messageId: props.messageId }) : null;
  }
  ctx.effect(() => {
    const style = document.createElement('style');
    style.dataset.plugin = 'dsh-live-voice';
    style.textContent = styles;
    document.head.appendChild(style);
    return () => style.remove();
  });
  for (const [name, id, order, component] of [
    ['conversation.input.right', 'live-voice-controls', 6, Buttons],
    ['conversation.input.dock', 'live-voice-status', -100, Dock],
    ['conversation.session.header.utilities', 'live-voice-question-status', 100, QuestionStatus],
    ['conversation.chat.assistant-actions', 'live-voice-speak', 5, Action],
  ])
    ctx.slots.inject(name, () =>
      ctx.slots.register(
        { name, id, order, label: () => t('dsh-live-voice.commons.pluginName') },
        component,
      ),
    );
  ctx.effect(() => {
    const stop = () => {
      ownership.cancel();
      for (const entry of controllers.values())
        run(entry.controller, entry.controller.endConversation());
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
