// @ts-nocheck
import { createWhisperSettings } from './whisper-settings.ts';
import { createQwenSettings } from './qwen-settings.ts';
import { createFallbackTranslator } from './locale.ts';
import { defaultAgentVoiceContext, qwenVoices, usesPluginVoiceDetection, voiceDetectionPresets } from '../core/settings.ts';
import {
  checkLatestRelease,
  CURRENT_VERSION,
  DSH_BADGE_URL,
  hasNewerRelease,
  LIVE_VOICE_BADGE_URL,
  RELEASES_URL,
  REPOSITORY_URL,
  TESTED_DSH_RELEASE_URL,
  TESTED_DSH_VERSION,
} from './releases.ts';

// UI only: the controller owns capture, recognition, playback and policy.
const EMPTY_LOCALE_SNAPSHOT = Object.freeze({ revision: 0 });
export function createComponents(React, translate = createFallbackTranslator(), locale) {
  const t = (key, params) => translate(key, params);
  const localize = (value) =>
    typeof value === 'string' && value.startsWith('dsh-live-voice.') ? t(value) : value;
  const h = (type, props, ...children) => {
    const nextProps =
      props && typeof props === 'object'
        ? {
            ...props,
            ...(typeof props['aria-label'] === 'string'
              ? { 'aria-label': localize(props['aria-label']) }
              : {}),
            ...(typeof props.title === 'string' ? { title: localize(props.title) } : {}),
            ...(typeof props.label === 'string' ? { label: localize(props.label) } : {}),
            ...(typeof props.visibleLabel === 'string'
              ? { visibleLabel: localize(props.visibleLabel) }
              : {}),
          }
        : props;
    return React.createElement(type, nextProps, ...children.map(localize));
  };
  const WhisperSettings = createWhisperSettings(React, t);
  const QwenSettings = createQwenSettings(React, t);
  function useController(controller) {
    const localeSubscribe = React.useCallback(
      (listener) => locale?.subscribe?.(listener) || (() => {}),
      [],
    );
    const localeSnapshot = React.useCallback(
      () => locale?.getSnapshot?.() || EMPTY_LOCALE_SNAPSHOT,
      [],
    );
    React.useSyncExternalStore(localeSubscribe, localeSnapshot, localeSnapshot);
    const subscribe = React.useCallback((listener) => controller.subscribe(listener), [controller]);
    const read = React.useCallback(() => controller.getSnapshot(), [controller]);
    return React.useSyncExternalStore(subscribe, read, read);
  }
  function Icon({ name }) {
    const common = {
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 1.8,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      'aria-hidden': true,
    };
    const paths = {
      mic: 'M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0V5M6 10v2a6 6 0 0 0 12 0v-2M12 18v4M8 22h8',
      micOff:
        'M9 9v3a3 3 0 0 0 5.12 2.12M15 9V5a3 3 0 0 0-5.64-1.42M6 10v2a6 6 0 0 0 9.5 4.88M18 10v2a6 6 0 0 1-.5 2.4M12 18v4M8 22h8M3 3l18 18',
      speaker: 'M3 9h4l6-5v16l-6-5H3V9M17 8a6 6 0 0 1 0 8M20 5a10 10 0 0 1 0 14',
      close: 'M6 6l12 12M18 6L6 18',
      stop: 'M6 6h12v12H6z',
      pause: 'M8 5v14M16 5v14',
      play: 'M7 4l13 8-13 8z',
      send: 'M3 11.5L21 3l-8.5 18-2-7.5L3 11.5zm7.5 2L21 3',
      queue: 'M5 6h14M5 12h10M5 18h6M18 15v6M15 18h6',
      speakerOff: 'M3 9h4l6-5v16l-6-5H3V9M17 9l5 6M22 9l-5 6',
    };
    return h('svg', common, h('path', { d: paths[name] || paths.mic }));
  }
  function Button({
    label,
    icon,
    visibleLabel,
    title = label,
    className = 'dlv-pill-button',
    ...props
  }) {
    return h(
      'button',
      {
        ...props,
        type: 'button',
        className: 'dlv-icon-button ' + className,
        title,
        'aria-label': label,
      },
      h(Icon, { name: icon }),
      visibleLabel
        ? h('span', { className: 'dlv-toggle-state', 'aria-hidden': true }, visibleLabel)
        : null,
    );
  }
  // Keep rejection handling local without swallowing controller-published errors.
  function useActions(controller) {
    const [error, setError] = React.useState('');
    const alive = React.useRef(true);
    React.useEffect(() => {
      alive.current = true;
      return () => {
        alive.current = false;
      };
    }, []);
    const invoke = (name, ...args) => {
      setError('');
      try {
        Promise.resolve(controller[name](...args)).catch((reason) => {
          if (alive.current) setError(reason instanceof Error ? reason.message : String(reason));
        });
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : String(reason));
      }
    };
    return [invoke, error, () => setError('')];
  }
  function ErrorText({ error, onDismiss }) {
    return error
      ? h(
          'div',
          { className: 'dlv-error', role: 'alert' },
          String(error),
          onDismiss
            ? h(
                'button',
                {
                  type: 'button',
                  'aria-label': 'dsh-live-voice.commons.dismissError',
                  onClick: onDismiss,
                },
                'dsh-live-voice.commons.dismiss',
              )
            : null,
        )
      : null;
  }
  function MicrophoneButtons({ controller }) {
    const state = useController(controller);
    const [invoke, error, clearError] = useActions(controller);
    const busy = state.conversation || state.listening || state.starting || state.recognizing;
    if (busy) return null;
    const recognition = state.capabilities?.recognition;
    const capture = state.capabilities?.capture;
    const pending = !recognition || !capture;
    const unavailable = recognition?.supported === false || capture?.supported === false;
    const reason = capture?.supported === false ? capture.reason : recognition?.reason;
    return h(
      React.Fragment,
      null,
      h(Button, {
        className: 'dlv-mic',
        icon: 'mic',
        label: pending
          ? 'dsh-live-voice.recognition.microphone.checking'
          : unavailable
            ? reason || 'dsh-live-voice.recognition.status.unavailable'
            : 'dsh-live-voice.commons.conversation.start',
        disabled: pending,
        onClick: () => (unavailable ? invoke('explainRecognition') : invoke('startConversation')),
      }),
      h(ErrorText, { error, onDismiss: clearError }),
    );
  }
  function Waveform({ controller, enabled }) {
    const ref = React.useRef(null);
    React.useEffect(() => {
      const canvas = ref.current;
      const context = canvas?.getContext('2d');
      if (!context) return undefined;
      let frame = 0;
      let disposed = false;
      let width = 1;
      let height = 40;
      let ratio = 1;
      const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
      function resize() {
        const bounds = canvas.getBoundingClientRect();
        width = Math.max(1, bounds.width);
        height = Math.max(1, bounds.height || 40);
        ratio = Math.max(1, window.devicePixelRatio || 1);
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
      }
      const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
      observer?.observe(canvas);
      window.addEventListener('resize', resize);
      resize();
      function draw(time) {
        if (disposed) return;
        if (ratio !== Math.max(1, window.devicePixelRatio || 1)) resize();
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        context.clearRect(0, 0, width, height);
        const raw = Number(controller.meter?.level?.() ?? 0);
        const level = enabled && Number.isFinite(raw) ? Math.min(1, Math.max(0, raw)) : 0;
        const color = getComputedStyle(canvas).color;
        // Zero input is flat: decorative motion must never imply microphone activity.
        for (let layer = 0; layer < 3; layer += 1) {
          context.beginPath();
          context.strokeStyle = layer === 1 ? '#38bdf8' : color;
          context.globalAlpha = 0.4 + layer * 0.25;
          context.lineWidth = layer === 2 ? 2 : 1;
          const phase = motion?.matches ? 0 : time / (500 + layer * 170);
          for (let x = 0; x <= width; x += 2) {
            const envelope = Math.sin((Math.PI * x) / width);
            const y =
              height / 2 +
              Math.sin((x / width) * Math.PI * (4 + layer * 2) + phase) *
                envelope *
                level *
                height *
                (0.43 - layer * 0.08);
            if (x === 0) context.moveTo(x, y);
            else context.lineTo(x, y);
          }
          context.stroke();
        }
        context.globalAlpha = 1;
        frame = window.requestAnimationFrame(draw);
      }
      frame = window.requestAnimationFrame(draw);
      return () => {
        disposed = true;
        window.cancelAnimationFrame(frame);
        observer?.disconnect();
        window.removeEventListener('resize', resize);
      };
    }, [controller, enabled]);
    return h('canvas', { ref, className: 'dlv-wave', 'aria-hidden': true });
  }
  function RecordingBar({ controller, questionOnly = false, overlay = false, overlayStyle }) {
    const state = useController(controller);
    const [now, setNow] = React.useState(Date.now());
    React.useEffect(() => {
      if (!state.autoSendAt) return;
      setNow(Date.now());
      const timer = setInterval(() => setNow(Date.now()), 200);
      return () => clearInterval(timer);
    }, [state.autoSendAt]);
    const [invoke, error, clearError] = useActions(controller);
    const capture = state.starting || state.listening || state.recognizing;
    if (questionOnly && !state.answeringQuestion) return null;
    if (
      !state.conversation &&
      !capture &&
      !state.speaking &&
      !state.paused &&
      !state.error &&
      !error
    )
      return null;
    const remaining = state.autoSendAt
      ? Math.max(1, Math.ceil((state.autoSendAt - now) / 1000))
      : null;
    const status =
      state.answeringQuestion && state.recognizing
        ? 'dsh-live-voice.recognition.status.answer'
        : state.answeringQuestion && state.listening
          ? 'dsh-live-voice.recognition.status.awaitingAnswer'
          : remaining
            ? t('dsh-live-voice.settings.autoSend.countdown', { remaining })
            : state.starting
              ? 'dsh-live-voice.recognition.microphone.starting'
              : state.paused
                ? 'dsh-live-voice.speak.status.paused'
                : state.speaking
                  ? 'dsh-live-voice.speak.status.playing'
                  : state.recognizing
                    ? 'dsh-live-voice.recognition.status.processing'
                    : state.listening
                      ? 'dsh-live-voice.recognition.status.listening'
                      : state.conversation
                        ? 'dsh-live-voice.commons.conversation.idle'
                        : 'dsh-live-voice.commons.status.ready';
    return h(
      'div',
      {
        className: overlay ? 'dlv-bar-wrap dlv-question-overlay' : 'dlv-bar-wrap',
        style: overlay ? overlayStyle : undefined,
      },
      h(
        'div',
        {
          className: 'dlv-pill',
          role: 'group',
          'aria-label': 'dsh-live-voice.commons.controls.title',
        },
        capture && !state.conversation
          ? h(Button, {
              label: 'dsh-live-voice.recognition.dictation.cancel',
              icon: 'close',
              onClick: () => invoke('cancelDictation'),
            })
          : null,
        state.conversation
          ? h(Button, {
              label: 'dsh-live-voice.commons.conversation.end',
              icon: 'close',
              onClick: () => invoke('endConversation'),
            })
          : null,
        h(Waveform, { controller, enabled: Boolean(state.listening) }),
        h('span', { className: 'dlv-status', role: 'status', 'aria-live': 'polite' }, status),
        h(Button, {
          className: 'dlv-live-toggle',
          label: 'dsh-live-voice.settings.delivery.toggle',
          title: t('dsh-live-voice.settings.delivery.status', {
            mode:
              state.settings.sendingMode === 'steer'
                ? t('dsh-live-voice.settings.delivery.steerDescription')
                : state.settings.sendingMode === 'queue'
                  ? t('dsh-live-voice.commons.queue')
                  : t('dsh-live-voice.commons.off'),
          }),
          icon: state.settings.sendingMode === 'queue' ? 'queue' : 'send',
          visibleLabel:
            state.settings.sendingMode === 'steer'
              ? 'dsh-live-voice.commons.send'
              : state.settings.sendingMode === 'queue'
                ? 'dsh-live-voice.commons.delivery.queueBadge'
                : 'dsh-live-voice.commons.toggle.offBadge',
          'aria-label': t('dsh-live-voice.settings.delivery.status', {
            mode: t(
              state.settings.sendingMode === 'steer'
                ? 'dsh-live-voice.settings.delivery.steerDescription'
                : state.settings.sendingMode === 'queue'
                  ? 'dsh-live-voice.commons.queue'
                  : 'dsh-live-voice.commons.manual',
            ),
          }),
          'aria-pressed': ['queue', 'steer'].includes(state.settings.sendingMode),
          'data-mode': state.settings.sendingMode || 'manual',
          onClick: () =>
            invoke('updateSettings', {
              sendingMode: !['queue', 'steer'].includes(state.settings.sendingMode)
                ? 'queue'
                : state.settings.sendingMode === 'queue'
                  ? 'steer'
                  : 'manual',
            }),
        }),
        h(Button, {
          className: `dlv-live-toggle${state.speechSegmentsRemaining > 0 ? ' dlv-live-toggle-expanded' : ''}`,
          label: 'dsh-live-voice.speak.autoPlayback.label',
          title:
            state.speechSegmentsRemaining > 0
              ? t(
                  state.speechSegmentsRemaining === 1
                    ? 'dsh-live-voice.speak.autoPlayback.remainingOne'
                    : 'dsh-live-voice.speak.autoPlayback.remainingOther',
                  {
                    state: t(
                      state.settings.announceAssistantMessages !== false
                        ? 'dsh-live-voice.commons.on'
                        : 'dsh-live-voice.commons.off',
                    ),
                    count: state.speechSegmentsRemaining,
                  },
                )
              : t('dsh-live-voice.speak.autoPlayback.status', {
                  state: t(
                    state.settings.announceAssistantMessages !== false
                      ? 'dsh-live-voice.commons.on'
                      : 'dsh-live-voice.commons.off',
                  ),
                }),
          icon: state.settings.announceAssistantMessages !== false ? 'speaker' : 'speakerOff',
          visibleLabel:
            state.settings.announceAssistantMessages === false
              ? 'dsh-live-voice.commons.toggle.offBadge'
              : state.speechSegmentsRemaining > 0
                ? String(state.speechSegmentsRemaining)
                : 'dsh-live-voice.commons.on',
          role: 'switch',
          'aria-checked': state.settings.announceAssistantMessages !== false,
          onClick: () =>
            invoke('updateSettings', {
              announceAssistantMessages: state.settings.announceAssistantMessages === false,
            }),
        }),
        remaining
          ? h(Button, {
              label: 'dsh-live-voice.settings.autoSend.cancel',
              icon: 'close',
              onClick: () => invoke('cancelAutoSend'),
            })
          : null,
        state.conversation && !capture
          ? h(Button, {
              label: 'dsh-live-voice.recognition.microphone.takeControl',
              icon: 'mic',
              onClick: () => invoke('startConversation'),
            })
          : null,
        capture
          ? h(Button, {
              className: 'dlv-live-toggle dlv-mic-state',
              label: state.muted
                ? 'dsh-live-voice.recognition.microphone.resume'
                : 'dsh-live-voice.recognition.microphone.ignore',
              title: t('dsh-live-voice.recognition.microphone.inputStatus', {
                state: t(
                  state.muted
                    ? 'dsh-live-voice.commons.input.ignoring'
                    : 'dsh-live-voice.commons.input.listening',
                ),
              }),
              icon: state.muted ? 'micOff' : 'mic',
              visibleLabel: state.muted
                ? 'dsh-live-voice.commons.input.ignoringBadge'
                : 'dsh-live-voice.commons.input.listeningBadge',
              'aria-pressed': Boolean(state.muted),
              'data-muted': state.muted ? 'true' : 'false',
              onClick: () => invoke(state.muted ? 'resumeListeningInput' : 'muteListening'),
            })
          : null,
        state.speaking && !state.paused && state.capabilities[state.settings.engine]?.pause
          ? h(Button, {
              label: 'dsh-live-voice.speak.playback.pause',
              icon: 'pause',
              onClick: () => invoke('pauseSpeech'),
            })
          : null,
        state.paused && state.capabilities[state.settings.engine]?.resume
          ? h(Button, {
              label: 'dsh-live-voice.speak.playback.resume',
              icon: 'play',
              onClick: () => invoke('resumeSpeech'),
            })
          : null,
        state.speaking || state.paused
          ? h(Button, {
              label: 'dsh-live-voice.speak.playback.stopAll',
              icon: 'stop',
              onClick: () => invoke('stopSpeech'),
            })
          : null,
      ),
      h(ErrorText, {
        error: error || state.error,
        onDismiss: () => {
          clearError();
          controller.clearError();
        },
      }),
    );
  }
  function SpeakButton({ active = false, disabled = false, label, onClick }) {
    return h(Button, {
      className: 'dlv-speaker',
      label:
        label ||
        (active ? 'dsh-live-voice.speak.playback.stop' : 'dsh-live-voice.speak.playback.message'),
      icon: active ? 'stop' : 'speaker',
      'aria-pressed': Boolean(active),
      disabled,
      onClick,
    });
  }
  function SettingsPanel({ controller, onClose }) {
    const state = useController(controller);
    const [invoke, error, clearError] = useActions(controller);
    const settings = state.settings || {};
    const capabilities = state.capabilities || {};
    const tabsId = React.useId();
    const [latestRelease, setLatestRelease] = React.useState(null);
    React.useEffect(() => {
      let active = true;
      void checkLatestRelease().then((result) => {
        if (active) setLatestRelease(result.release);
      });
      return () => {
        active = false;
      };
    }, []);
    const updateAvailable = hasNewerRelease(latestRelease);
    const tabs = [
      { id: 'conversation', label: 'dsh-live-voice.settings.tabs.conversation' },
      { id: 'speech', label: 'dsh-live-voice.settings.tabs.speak' },
      {
        id: 'recognition',
        label: 'dsh-live-voice.settings.tabs.recognition',
      },
    ];
    const tabRefs = React.useRef([]);
    const [activeTab, setActiveTab] = React.useState('conversation');
    const activateTab = (index) => {
      const tab = tabs[index];
      if (!tab) return;
      setActiveTab(tab.id);
      tabRefs.current[index]?.focus();
    };
    const handleTabKeyDown = (event, index) => {
      let nextIndex;
      if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = tabs.length - 1;
      else return;
      event.preventDefault();
      activateTab(nextIndex);
    };
    const [audioDevices, setAudioDevices] = React.useState([]);
    React.useEffect(() => {
      let active = true;
      const refresh = async () => {
        try {
          const devices = await globalThis.navigator?.mediaDevices?.enumerateDevices?.();
          if (active) setAudioDevices(Array.from(devices || []));
        } catch {
          if (active) setAudioDevices([]);
        }
      };
      void refresh();
      globalThis.navigator?.mediaDevices?.addEventListener?.('devicechange', refresh);
      return () => {
        active = false;
        globalThis.navigator?.mediaDevices?.removeEventListener?.('devicechange', refresh);
      };
    }, []);
    const deviceOptions = (kind, fallback) => [
      { value: '', label: 'dsh-live-voice.commons.systemDefault' },
      ...audioDevices
        .filter(
          (device) => device.kind === kind && device.deviceId && device.deviceId !== 'default',
        )
        .map((device, index) => ({
          value: device.deviceId,
          label:
            device.label ||
            t('dsh-live-voice.commons.device.numberedLabel', {
              device: t(fallback),
              number: index + 1,
            }),
        })),
    ];
    const field = (label, key, options) =>
      h(
        'label',
        { key },
        label,
        h(
          'select',
          {
            value: settings[key] || options[0].value,
            onChange: (event) =>
              invoke(
                'updateSettings',
                key === 'engine'
                  ? { engine: event.target.value, voice: '' }
                  : { [key]: event.target.value },
              ),
          },
          options.map((option) =>
            h(
              'option',
              { key: option.value, value: option.value, disabled: option.disabled },
              option.label,
            ),
          ),
        ),
      );
    const panel = (id, children) =>
      h(
        'div',
        {
          id: `${tabsId}-panel-${id}`,
          className: 'dlv-settings-panel',
          role: 'tabpanel',
          'aria-labelledby': `${tabsId}-tab-${id}`,
          hidden: activeTab !== id,
        },
        ...children,
      );
    const subcard = (title, children, open = false) =>
      h(
        'details',
        { className: 'dlv-settings-subcard', open },
        h('summary', null, title),
        h('div', { className: 'dlv-settings-subcard-body' }, ...children),
      );
    return h(
      'section',
      {
        className: 'dlv-settings',
        'aria-label': 'dsh-live-voice.settings.title',
      },
      h(
        'div',
        { className: 'dlv-settings-heading' },
        h('h3', null, 'dsh-live-voice.commons.pluginName'),
        h(
          'div',
          {
            className: 'dlv-version-badges',
            'aria-label': 'dsh-live-voice.commons.version.title',
          },
          h(
            'a',
            {
              className: 'dlv-shields-badge',
              href: RELEASES_URL,
              target: '_blank',
              rel: 'noreferrer',
              'aria-label': t('dsh-live-voice.commons.version.link', {
                version: CURRENT_VERSION,
              }),
              title: t('dsh-live-voice.commons.version.label', {
                version: CURRENT_VERSION,
              }),
            },
            h('img', { src: LIVE_VOICE_BADGE_URL, alt: '' }),
            h('span', null, `v${CURRENT_VERSION}`),
          ),
          h(
            'a',
            {
              className: 'dlv-shields-badge',
              href: TESTED_DSH_RELEASE_URL,
              target: '_blank',
              rel: 'noreferrer',
              'aria-label': t('dsh-live-voice.commons.version.compatibilityLink', {
                version: TESTED_DSH_VERSION,
              }),
              title: t('dsh-live-voice.commons.version.compatibility', {
                version: TESTED_DSH_VERSION,
              }),
            },
            h('img', { src: DSH_BADGE_URL, alt: '' }),
            h('span', null, `v${TESTED_DSH_VERSION}`),
          ),
        ),
        h('span', { className: 'dlv-heading-divider', 'aria-hidden': true }),
        updateAvailable
          ? h(
              'a',
              {
                className: 'dlv-version-badge dlv-update-badge',
                href: latestRelease.url,
                target: '_blank',
                rel: 'noreferrer',
                'aria-label': t('dsh-live-voice.commons.update.link', {
                  version: latestRelease.tag,
                }),
                title: t('dsh-live-voice.commons.update.version', {
                  version: latestRelease.tag,
                }),
              },
              h('span', { className: 'dlv-update-icon', 'aria-hidden': true }, '↑'),
              'dsh-live-voice.commons.update.label',
            )
          : null,
        updateAvailable
          ? h('span', { className: 'dlv-heading-divider', 'aria-hidden': true })
          : null,
        h(
          'a',
          {
            className: 'dlv-version-badge dlv-star-badge',
            href: REPOSITORY_URL,
            target: '_blank',
            rel: 'noreferrer',
            'aria-label': 'dsh-live-voice.commons.repository.starLink',
            title: 'dsh-live-voice.commons.repository.starLink',
          },
          h('span', { className: 'dlv-star-icon', 'aria-hidden': true }, '★'),
          'dsh-live-voice.commons.repository.starLabel',
        ),
      ),
      onClose
        ? h(Button, {
            label: 'dsh-live-voice.settings.close',
            icon: 'close',
            onClick: onClose,
          })
        : null,
      h(
        'div',
        {
          className: 'dlv-settings-tabs',
          role: 'tablist',
          'aria-label': 'dsh-live-voice.settings.title',
        },
        tabs.map((tab, index) => {
          const selected = activeTab === tab.id;
          return h(
            'button',
            {
              key: tab.id,
              ref: (element) => {
                tabRefs.current[index] = element;
              },
              id: `${tabsId}-tab-${tab.id}`,
              type: 'button',
              role: 'tab',
              className: 'dlv-settings-tab',
              'aria-selected': selected,
              'aria-controls': `${tabsId}-panel-${tab.id}`,
              'data-active': selected ? 'true' : undefined,
              tabIndex: selected ? 0 : -1,
              onClick: () => setActiveTab(tab.id),
              onKeyDown: (event) => handleTabKeyDown(event, index),
            },
            tab.label,
          );
        }),
      ),
      h(
        'div',
        {
          id: `${tabsId}-panel-speech`,
          className: 'dlv-settings-panel',
          role: 'tabpanel',
          'aria-labelledby': `${tabsId}-tab-speech`,
          hidden: activeTab !== 'speech',
        },
        h(
          'div',
          { className: 'dlv-settings-card-body' },
          field('dsh-live-voice.speak.engine.label', 'engine', [
            {
              value: 'qwen-http',
              label: 'dsh-live-voice.speak.qwen.label',
              disabled: capabilities['qwen-http']?.supported === false,
            },
            {
              value: 'say',
              label: 'dsh-live-voice.speak.macos.label',
              disabled: capabilities.say?.supported === false,
            },
            {
              value: 'browser',
              label: 'dsh-live-voice.speak.browser.label',
              disabled: capabilities.browser?.supported === false,
            },
          ]),
          settings.engine !== 'say'
            ? field(
                'dsh-live-voice.speak.output.device',
                'outputDeviceId',
                deviceOptions('audiooutput', 'dsh-live-voice.speak.output.fallbackName'),
              )
            : h('small', null, 'dsh-live-voice.speak.macos.outputHelp'),
          settings.engine === 'browser'
            ? h(
                React.Fragment,
                null,
                h('small', null, 'dsh-live-voice.speak.browser.outputHelp'),
                field('dsh-live-voice.speak.browser.voice', 'voice', [
                  { value: '', label: 'dsh-live-voice.speak.browser.automaticVoice' },
                  ...(capabilities.browser?.voices || []).map((voice) => ({
                    value: voice.voiceURI || voice.name,
                    label:
                      voice.name +
                      ' — ' +
                      (voice.lang || t('dsh-live-voice.commons.unknownLanguage')),
                  })),
                ]),
              )
            : null,
          settings.engine === 'qwen-http'
            ? h(
                React.Fragment,
                null,
                field(
                  'dsh-live-voice.speak.qwen.voice',
                  'voice',
                  qwenVoices.map((voice) => ({
                    value: voice.value,
                    label: `dsh-live-voice.speak.qwen.voices.${
                      voice.value === 'uncle_fu'
                        ? 'uncleFu'
                        : voice.value === 'ono_anna'
                          ? 'onoAnna'
                          : voice.value
                    }`,
                  })),
                ),
                h('small', null, 'dsh-live-voice.speak.qwen.voiceHelp'),
                subcard('dsh-live-voice.speak.qwen.connection', [
                  h(QwenSettings, { key: 'qwen-output-settings', controller }),
                ]),
              )
            : null,
          subcard('dsh-live-voice.settings.filters.title', [
            h(
              'label',
              { key: 'output-code-filter', className: 'dlv-check' },
              h('input', {
                type: 'checkbox',
                checked: settings.outputCodeFilterEnabled !== false,
                onChange: (event) =>
                  invoke('updateSettings', { outputCodeFilterEnabled: event.target.checked }),
              }),
              ' ',
              'dsh-live-voice.speak.filters.code.enabled',
            ),
            h(
              'label',
              { key: 'output-code-lines' },
              'dsh-live-voice.speak.filters.code.maxLines',
              h('input', {
                type: 'number',
                min: 0,
                max: 100,
                value: settings.outputCodeMaxLines ?? 5,
                disabled: settings.outputCodeFilterEnabled === false,
                onChange: (event) => {
                  const value = Number(event.target.value);
                  if (Number.isInteger(value) && value >= 0 && value <= 100)
                    invoke('updateSettings', { outputCodeMaxLines: value });
                },
              }),
            ),
            h(
              'label',
              { key: 'output-code-notice' },
              'dsh-live-voice.speak.filters.code.replacement',
              h('input', {
                type: 'text',
                maxLength: 300,
                key: `output-code-notice-${settings.outputCodeNotice}`,
                defaultValue: settings.outputCodeNotice || t('dsh-live-voice.speak.filters.code.notice'),
                disabled: settings.outputCodeFilterEnabled === false,
                onBlur: (event) =>
                  invoke('updateSettings', { outputCodeNotice: event.target.value }),
              }),
            ),
          ]),
          h(
            'div',
            { className: 'dlv-settings-subcard' },
            h(
              'label',
              null,
              h('input', {
                type: 'checkbox',
                checked: settings.agentVoiceContextEnabled !== false,
                onChange: (event) => invoke('updateSettings', { agentVoiceContextEnabled: event.target.checked }),
              }),
              'dsh-live-voice.speak.agentContext.enabled',
            ),
            h('small', null, 'dsh-live-voice.speak.agentContext.enabledHelp'),
            h('label', null, 'dsh-live-voice.speak.agentContext.label'),
            h('small', null, 'dsh-live-voice.speak.agentContext.help'),
            h('textarea', {
              key: `agent-voice-context-${settings.agentVoiceContext}`,
              defaultValue: settings.agentVoiceContext,
              maxLength: 4000,
              rows: 7,
              onBlur: (event) => invoke('updateSettings', { agentVoiceContext: event.target.value }),
            }),
            h(
              'button',
              {
                type: 'button',
                disabled: settings.agentVoiceContext === defaultAgentVoiceContext,
                onClick: () => invoke('updateSettings', { agentVoiceContext: defaultAgentVoiceContext }),
              },
              'dsh-live-voice.speak.agentContext.restore',
            ),
          ),
          h(
            'label',
            null,
            'dsh-live-voice.speak.rate.label',
            h('input', {
              type: 'number',
              min: 0.1,
              max: 3,
              step: 0.1,
              value: settings.rate ?? 1,
              onChange: (event) => {
                const rate = Number(event.target.value);
                if (Number.isFinite(rate) && rate >= 0.1 && rate <= 3)
                  invoke('updateSettings', { rate });
              },
            }),
            h('small', null, 'dsh-live-voice.speak.rate.help'),
          ),
          h(
            'label',
            null,
            'dsh-live-voice.speak.segmentGap.label',
            h('input', {
              type: 'number',
              min: 0,
              max: 2000,
              step: 50,
              value: settings.segmentGapMs ?? 200,
              onChange: (event) => {
                const segmentGapMs = Number(event.target.value);
                if (Number.isFinite(segmentGapMs) && segmentGapMs >= 0 && segmentGapMs <= 2000)
                  invoke('updateSettings', { segmentGapMs });
              },
            }),
            h('small', null, 'dsh-live-voice.speak.segmentGap.help'),
          ),
          h('p', null, 'dsh-live-voice.speak.engine.playbackHelp'),
          ...['qwen-http', 'say', 'browser']
            .filter((id) => capabilities[id]?.supported === false)
            .map((id) =>
              h(
                'p',
                { key: id, role: 'status' },
                t('dsh-live-voice.commons.engine.failure', {
                  engine: t(
                    id === 'qwen-http'
                      ? 'dsh-live-voice.speak.qwen.name'
                      : id === 'say'
                        ? 'dsh-live-voice.speak.macos.name'
                        : 'dsh-live-voice.speak.browser.name',
                  ),
                  reason: capabilities[id].reason,
                }),
              ),
            ),
          h(
            'div',
            { className: 'dlv-settings-actions' },
            h(
              'button',
              {
                type: 'button',
                disabled: capabilities[settings.engine]?.supported !== true || state.speaking,
                onClick: () => invoke('speak', t('dsh-live-voice.speak.output.testPhrase')),
              },
              state.speaking
                ? 'dsh-live-voice.speak.output.testing'
                : 'dsh-live-voice.speak.output.test',
            ),
            state.speaking || state.paused
              ? h(
                  'button',
                  { type: 'button', onClick: () => invoke('stopSpeech') },
                  'dsh-live-voice.speak.output.stopTest',
                )
              : null,
            h(
              'button',
              { type: 'button', onClick: () => invoke('refreshCapabilities') },
              'dsh-live-voice.settings.engine.refresh',
            ),
          ),
        ),
      ),
      h(
        'div',
        {
          id: `${tabsId}-panel-recognition`,
          className: 'dlv-settings-panel',
          role: 'tabpanel',
          'aria-labelledby': `${tabsId}-tab-recognition`,
          hidden: activeTab !== 'recognition',
        },
        h(
          'div',
          { className: 'dlv-settings-card-body' },
          h(
            'label',
            null,
            'dsh-live-voice.recognition.engine.label',
            h(
              'select',
              {
                value: settings.recognitionEngine,
                onChange: (event) =>
                  invoke(
                    'updateSettings',
                    event.target.value === 'browser' && settings.recognitionLang === 'auto'
                      ? { recognitionEngine: 'browser', recognitionLang: 'pt-BR' }
                      : { recognitionEngine: event.target.value },
                  ),
              },
              h('option', { value: 'browser' }, 'dsh-live-voice.recognition.browser.label'),
              h('option', { value: 'qwen-http' }, 'dsh-live-voice.recognition.qwen.label'),
              h('option', { value: 'whisper-http' }, 'dsh-live-voice.recognition.whisper.label'),
              h(
                'optgroup',
                { label: 'dsh-live-voice.recognition.planned.vote' },
                h(
                  'option',
                  { value: 'webgpu', disabled: true },
                  'dsh-live-voice.recognition.planned.webGpu',
                ),
                h(
                  'option',
                  { value: 'sherpa-onnx', disabled: true },
                  'dsh-live-voice.recognition.planned.sherpa',
                ),
                h(
                  'option',
                  { value: 'parakeet', disabled: true },
                  'dsh-live-voice.recognition.planned.parakeet',
                ),
                h(
                  'option',
                  { value: 'voxtral', disabled: true },
                  'dsh-live-voice.recognition.planned.voxtral',
                ),
              ),
            ),
          ),
          h(
            'small',
            { className: 'dlv-recognition-engine-description' },
            settings.recognitionEngine === 'qwen-http'
              ? 'dsh-live-voice.recognition.whisper.endpointHelp'
              : settings.recognitionEngine === 'whisper-http'
                ? 'dsh-live-voice.recognition.qwen.endpointHelp'
                : 'dsh-live-voice.recognition.browser.help',
          ),
          field(
            'dsh-live-voice.recognition.microphone.device',
            'inputDeviceId',
            deviceOptions('audioinput', 'dsh-live-voice.recognition.microphone.label'),
          ),
          settings.recognitionEngine === 'browser'
            ? h('small', null, 'dsh-live-voice.recognition.browser.microphoneHelp')
            : null,
          field('dsh-live-voice.recognition.language.label', 'recognitionLang', [
            ...(settings.recognitionEngine !== 'browser'
              ? [
                  {
                    value: 'auto',
                    label: 'dsh-live-voice.recognition.language.automatic',
                  },
                ]
              : []),
            { value: 'pt-BR', label: 'Português (Brasil)' },
            { value: 'en-US', label: 'English (United States)' },
          ]),
          settings.recognitionEngine === 'browser'
            ? h(
                React.Fragment,
                null,
                h(
                  'label',
                  { className: 'dlv-check' },
                  h('input', {
                    type: 'checkbox',
                    checked: settings.recognitionProcessLocally !== false,
                    onChange: (event) =>
                      invoke('updateSettings', { recognitionProcessLocally: event.target.checked }),
                  }),
                  ' ',
                  'dsh-live-voice.recognition.browser.localProcessing',
                ),
                settings.recognitionProcessLocally !== false
                  ? h(
                      'label',
                      { className: 'dlv-check' },
                      h('input', {
                        type: 'checkbox',
                        checked: settings.recognitionAutoInstall !== false,
                        onChange: (event) =>
                          invoke('updateSettings', {
                            recognitionAutoInstall: event.target.checked,
                          }),
                      }),
                      ' ',
                      'dsh-live-voice.recognition.browser.autoInstallPack',
                    )
                  : h(
                      'p',
                      { role: 'status' },
                      'dsh-live-voice.recognition.browser.remoteServiceWarning',
                    ),
              )
            : h(
                'p',
                { role: 'status' },
                settings.recognitionEngine === 'qwen-http'
                  ? 'dsh-live-voice.recognition.qwen.captureHelp'
                  : 'dsh-live-voice.recognition.whisper.captureHelp',
              ),
          settings.recognitionEngine === 'whisper-http'
            ? subcard('dsh-live-voice.commons.connection.title', [
                h(WhisperSettings, { key: 'settings', controller }),
              ])
            : null,
          settings.recognitionEngine === 'qwen-http' && settings.engine !== 'qwen-http'
            ? subcard('dsh-live-voice.speak.qwen.connection', [
                h(QwenSettings, { key: 'qwen-recognition-settings', controller }),
              ])
            : null,
          h('p', null, 'dsh-live-voice.recognition.providerSettings.help'),
          subcard('dsh-live-voice.recognition.commands.title', [
            h(
              'label',
              { key: 'voice-commands-enabled', className: 'dlv-check' },
              h('input', {
                type: 'checkbox',
                checked: settings.voiceCommandsEnabled !== false,
                onChange: (event) =>
                  invoke('updateSettings', { voiceCommandsEnabled: event.target.checked }),
              }),
              ' ',
              'dsh-live-voice.recognition.commands.enabled',
            ),
            h(
              'small',
              { key: 'voice-command-help' },
              'dsh-live-voice.recognition.voiceCommands.help',
            ),
            ...[
              [
                'dsh-live-voice.recognition.commands.send',
                'voiceCommandSend',
                'send, send message',
              ],
              [
                'dsh-live-voice.recognition.commands.queue',
                'voiceCommandQueue',
                'queue, queue message',
              ],
              [
                'dsh-live-voice.commons.conversation.end',
                'voiceCommandEnd',
                'end, end conversation',
              ],
              [
                'dsh-live-voice.recognition.commands.mute',
                'voiceCommandMute',
                'mute, stop listening',
              ],
              [
                'dsh-live-voice.recognition.commands.resume',
                'voiceCommandResume',
                'resume, start listening',
              ],
              [
                'dsh-live-voice.recognition.commands.stopSpeech',
                'voiceCommandStopSpeaking',
                'stop talking, stop speaking, shut up',
              ],
              [
                'dsh-live-voice.recognition.commands.clear',
                'voiceCommandClear',
                'clear all, clear message',
              ],
            ].map(([label, key, fallback]) =>
              h(
                'label',
                { key },
                label,
                h('textarea', {
                  rows: 2,
                  maxLength: 1000,
                  defaultValue: settings[key] || fallback,
                  disabled: settings.voiceCommandsEnabled === false,
                  onBlur: (event) => invoke('updateSettings', { [key]: event.target.value }),
                }),
              ),
            ),
          ]),
          subcard('dsh-live-voice.settings.filters.title', [
            h(
              'label',
              { key: 'recognition-filter', className: 'dlv-check' },
              h('input', {
                type: 'checkbox',
                checked: settings.recognitionFilterEnabled !== false,
                onChange: (event) =>
                  invoke('updateSettings', { recognitionFilterEnabled: event.target.checked }),
              }),
              ' ',
              'dsh-live-voice.recognition.minimumWords.enabled',
            ),
            h(
              'label',
              { key: 'recognition-minimum-words' },
              'dsh-live-voice.recognition.minimumWords.label',
              h('input', {
                type: 'number',
                min: 1,
                max: 20,
                value: settings.recognitionMinimumWords ?? 2,
                disabled: settings.recognitionFilterEnabled === false,
                onChange: (event) => {
                  const value = Number(event.target.value);
                  if (Number.isInteger(value) && value >= 1 && value <= 20)
                    invoke('updateSettings', { recognitionMinimumWords: value });
                },
              }),
              h('small', null, 'dsh-live-voice.recognition.minimumWords.help'),
            ),
          ]),
          capabilities.capture?.supported === false
            ? h(
                'p',
                { role: 'status' },
                t('dsh-live-voice.recognition.microphone.failure', {
                  reason: capabilities.capture.reason,
                }),
              )
            : capabilities.capture?.permission === 'prompt'
              ? h('p', { role: 'status' }, 'dsh-live-voice.recognition.microphone.permissionHelp')
              : null,
          capabilities.recognition?.supported === false
            ? h('p', { role: 'status' }, capabilities.recognition.reason)
            : null,
          usesPluginVoiceDetection(settings.recognitionEngine)
            ? h(
                'details',
                {
                  className: 'dlv-settings-subcard',
                  'aria-label': 'dsh-live-voice.recognition.silenceDetection.title',
                },
                h('summary', null, 'dsh-live-voice.recognition.silenceDetection.label'),
                h(
                  'div',
                  { className: 'dlv-settings-subcard-body' },
                  h('p', null, 'dsh-live-voice.recognition.silenceDetection.help'),
                  h(
                    'label',
                    { className: 'dlv-setting-field' },
                    'dsh-live-voice.recognition.maxUtterance.label',
                    h('input', {
                      type: 'number',
                      min: 10,
                      max: 300,
                      step: 1,
                      value: settings.recognitionMaxUtteranceSeconds ?? 60,
                      onChange: (event) => {
                        const value = Number(event.target.value);
                        if (Number.isInteger(value) && value >= 10 && value <= 300)
                          invoke('updateSettings', { recognitionMaxUtteranceSeconds: value });
                      },
                    }),
                    h('small', null, 'dsh-live-voice.recognition.maxUtterance.help'),
                  ),
                  h(
                    'div',
                    {
                      className: 'dlv-preset-group',
                      role: 'radiogroup',
                      'aria-label': 'dsh-live-voice.recognition.silenceDetection.pauseLabel',
                    },
                    Object.entries(voiceDetectionPresets).map(([value, preset]) =>
                      h(
                        'label',
                        { key: value, className: 'dlv-preset' },
                        h('input', {
                          type: 'radio',
                          name: 'dlv-vad-preset',
                          value,
                          checked: (settings.voiceDetectionPreset || 'natural') === value,
                          onChange: () => invoke('updateSettings', { voiceDetectionPreset: value }),
                        }),
                        h(
                          'span',
                          null,
                          h('strong', null, `dsh-live-voice.recognition.presets.${value}.label`),
                          h(
                            'small',
                            null,
                            `dsh-live-voice.recognition.presets.${value}.description`,
                          ),
                        ),
                      ),
                    ),
                  ),
                  h(
                    'p',
                    { className: 'dlv-vad-summary' },
                    t('dsh-live-voice.recognition.silenceDetection.duration', {
                      milliseconds:
                        voiceDetectionPresets[settings.voiceDetectionPreset]?.silenceMs ||
                        voiceDetectionPresets.natural.silenceMs,
                    }),
                  ),
                ),
              )
            : null,
        ),
      ),
      panel('conversation', [
        h(
          'label',
          { key: 'announce', className: 'dlv-check' },
          h('input', {
            type: 'checkbox',
            checked: settings.announceAssistantMessages !== false,
            onChange: (event) =>
              invoke('updateSettings', { announceAssistantMessages: event.target.checked }),
          }),
          ' ',
          'dsh-live-voice.speak.autoPlayback.enabled',
        ),
        h('p', { key: 'policy' }, 'dsh-live-voice.speak.autoPlayback.help'),
        h(
          'label',
          { key: 'interrupt-message', className: 'dlv-check' },
          h('input', {
            type: 'checkbox',
            checked: settings.interruptSpeechOnUserMessage === true,
            onChange: (event) =>
              invoke('updateSettings', { interruptSpeechOnUserMessage: event.target.checked }),
          }),
          ' ',
          'dsh-live-voice.speak.interruption.enabled',
        ),
        h(
          'p',
          { key: 'interrupt-message-description', className: 'dlv-setting-description' },
          settings.interruptSpeechOnUserMessage
            ? 'dsh-live-voice.speak.interruption.enabledHelp'
            : 'dsh-live-voice.speak.interruption.disabledHelp',
        ),
        h(
          'label',
          { key: 'hold-to-talk', className: 'dlv-check' },
          h('input', {
            type: 'checkbox',
            checked: settings.holdToTalkEnabled !== false,
            onChange: (event) =>
              invoke('updateSettings', { holdToTalkEnabled: event.target.checked }),
          }),
          ' ',
          'dsh-live-voice.recognition.holdToTalk.enabled',
        ),
        h(
          'p',
          { key: 'hold-to-talk-description', className: 'dlv-setting-description' },
          'dsh-live-voice.recognition.holdToTalk.help',
        ),
        field('dsh-live-voice.recognition.mode.label', 'mode', [
          {
            value: 'speaker',
            label: 'dsh-live-voice.recognition.speakerMode.label',
          },
          {
            value: 'headphones',
            label: 'dsh-live-voice.recognition.headphoneMode.label',
          },
        ]),
        h(
          'p',
          { key: 'mode-description', className: 'dlv-setting-description' },
          settings.mode === 'headphones'
            ? 'dsh-live-voice.recognition.headphoneMode.help'
            : 'dsh-live-voice.recognition.speakerMode.help',
        ),
        h(
          'label',
          { key: 'speech-delay' },
          'dsh-live-voice.speak.responseDelay.label',
          h(
            'select',
            {
              value: String(settings.assistantSpeechDelaySeconds || 3),
              onChange: (event) =>
                invoke('updateSettings', {
                  assistantSpeechDelaySeconds: Number(event.target.value),
                }),
            },
            [1, 2, 3, 4, 5, 6, 8, 10].map((seconds) =>
              h(
                'option',
                { key: seconds, value: String(seconds) },
                t('dsh-live-voice.commons.seconds', { seconds }),
              ),
            ),
          ),
          h('small', null, 'dsh-live-voice.speak.responseDelay.help'),
        ),
        field('dsh-live-voice.settings.delivery.label', 'sendingMode', [
          {
            value: 'manual',
            label: 'dsh-live-voice.settings.delivery.manualLabel',
          },
          {
            value: 'queue',
            label: 'dsh-live-voice.settings.delivery.queueLabel',
          },
          {
            value: 'steer',
            label: 'dsh-live-voice.settings.delivery.steerLabel',
          },
        ]),
        settings.sendingMode !== 'manual'
          ? h(
              'label',
              { key: 'delay' },
              'dsh-live-voice.settings.autoSend.delay',
              h(
                'select',
                {
                  value: String(settings.autoSendDelaySeconds || 4),
                  onChange: (event) =>
                    invoke('updateSettings', {
                      autoSendDelaySeconds: Number(event.target.value),
                    }),
                },
                [2, 3, 4, 5, 6, 8, 10].map((seconds) =>
                  h(
                    'option',
                    { key: seconds, value: String(seconds) },
                    t('dsh-live-voice.commons.seconds', { seconds }),
                  ),
                ),
              ),
              h('small', null, 'dsh-live-voice.recognition.autoSend.countdownHelp'),
            )
          : h(
              'p',
              {
                key: 'manual',
                className: 'dlv-setting-description',
              },
              'dsh-live-voice.recognition.manualSend.help',
            ),
      ]),
      h(ErrorText, {
        error: error || state.error,
        onDismiss: () => {
          clearError();
          controller.clearError();
        },
      }),
    );
  }
  return { MicrophoneButtons, RecordingBar, SpeakButton, SettingsPanel };
}
