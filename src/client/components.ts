// @ts-nocheck
import { createWhisperSettings } from './whisper-settings.ts';
import { createQwenSettings } from './qwen-settings.ts';
import { qwenVoices, usesPluginVoiceDetection, voiceDetectionPresets } from '../core/settings.ts';
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
export function createComponents(React) {
  const h = React.createElement;
  const WhisperSettings = createWhisperSettings(React);
  const QwenSettings = createQwenSettings(React);
  function useController(controller) {
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
                { type: 'button', 'aria-label': 'Dismiss voice error', onClick: onDismiss },
                'Dismiss',
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
          ? 'Checking microphone availability'
          : unavailable
            ? reason || 'Speech recognition unavailable'
            : 'Start voice conversation',
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
        ? 'Recognizing answer…'
        : state.answeringQuestion && state.listening
          ? 'Listening for your answer…'
          : remaining
            ? `Sending in ${remaining}…`
            : state.starting
              ? 'Starting microphone…'
              : state.paused
                ? 'Speech paused'
                : state.speaking
                  ? 'Speaking'
                  : state.recognizing
                    ? 'Recognizing speech…'
                    : state.listening
                      ? 'Listening — waiting for speech'
                      : state.conversation
                        ? 'Conversation idle'
                        : 'Voice ready';
    return h(
      'div',
      {
        className: overlay ? 'dlv-bar-wrap dlv-question-overlay' : 'dlv-bar-wrap',
        style: overlay ? overlayStyle : undefined,
      },
      h(
        'div',
        { className: 'dlv-pill', role: 'group', 'aria-label': 'Voice controls' },
        capture && !state.conversation
          ? h(Button, {
              label: 'Cancel dictation',
              icon: 'close',
              onClick: () => invoke('cancelDictation'),
            })
          : null,
        state.conversation
          ? h(Button, {
              label: 'End voice conversation',
              icon: 'close',
              onClick: () => invoke('endConversation'),
            })
          : null,
        h(Waveform, { controller, enabled: Boolean(state.listening) }),
        h('span', { className: 'dlv-status', role: 'status', 'aria-live': 'polite' }, status),
        h(Button, {
          className: 'dlv-live-toggle',
          label: 'Automatic delivery mode',
          title: `Automatic delivery: ${
            state.settings.sendingMode === 'steer'
              ? 'send to the running agent'
              : state.settings.sendingMode === 'queue'
                ? 'queue'
                : 'off'
          }`,
          icon: state.settings.sendingMode === 'queue' ? 'queue' : 'send',
          visibleLabel:
            state.settings.sendingMode === 'steer'
              ? 'SEND'
              : state.settings.sendingMode === 'queue'
                ? 'QUEUE'
                : 'OFF',
          'aria-label': `Automatic delivery: ${state.settings.sendingMode || 'manual'}`,
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
          label: 'Automatic assistant speech',
          title: `Automatic assistant speech: ${
            state.settings.announceAssistantMessages !== false ? 'on' : 'off'
          }${state.speechSegmentsRemaining > 0 ? ` — ${state.speechSegmentsRemaining} speech segment${state.speechSegmentsRemaining === 1 ? '' : 's'} remaining` : ''}`,
          icon: state.settings.announceAssistantMessages !== false ? 'speaker' : 'speakerOff',
          visibleLabel:
            state.settings.announceAssistantMessages === false
              ? 'OFF'
              : state.speechSegmentsRemaining > 0
                ? String(state.speechSegmentsRemaining)
                : 'ON',
          role: 'switch',
          'aria-checked': state.settings.announceAssistantMessages !== false,
          onClick: () =>
            invoke('updateSettings', {
              announceAssistantMessages: state.settings.announceAssistantMessages === false,
            }),
        }),
        remaining
          ? h(Button, {
              label: 'Cancel automatic send',
              icon: 'close',
              onClick: () => invoke('cancelAutoSend'),
            })
          : null,
        state.conversation && !capture
          ? h(Button, {
              label: 'Take microphone',
              icon: 'mic',
              onClick: () => invoke('startConversation'),
            })
          : null,
        capture
          ? h(Button, {
              className: 'dlv-live-toggle dlv-mic-state',
              label: state.muted ? 'Resume listening' : 'Ignore composer input',
              title: `Microphone input: ${state.muted ? 'ignoring' : 'listening'}`,
              icon: state.muted ? 'micOff' : 'mic',
              visibleLabel: state.muted ? 'IGNORING' : 'LISTENING',
              'aria-pressed': Boolean(state.muted),
              'data-muted': state.muted ? 'true' : 'false',
              onClick: () => invoke(state.muted ? 'resumeListeningInput' : 'muteListening'),
            })
          : null,
        state.speaking && !state.paused && state.capabilities[state.settings.engine]?.pause
          ? h(Button, {
              label: 'Pause speech',
              icon: 'pause',
              onClick: () => invoke('pauseSpeech'),
            })
          : null,
        state.paused && state.capabilities[state.settings.engine]?.resume
          ? h(Button, {
              label: 'Resume speech',
              icon: 'play',
              onClick: () => invoke('resumeSpeech'),
            })
          : null,
        state.speaking || state.paused
          ? h(Button, {
              label: 'Stop all speech',
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
      label: label || (active ? 'Stop speaking' : 'Speak message'),
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
      { id: 'conversation', label: 'Conversation' },
      { id: 'speech', label: 'Speech' },
      { id: 'recognition', label: 'Speech recognition' },
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
      { value: '', label: 'System default' },
      ...audioDevices
        .filter(
          (device) => device.kind === kind && device.deviceId && device.deviceId !== 'default',
        )
        .map((device, index) => ({
          value: device.deviceId,
          label: device.label || `${fallback} ${index + 1}`,
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
      { className: 'dlv-settings', 'aria-label': 'Live Voice settings' },
      h(
        'div',
        { className: 'dlv-settings-heading' },
        h('h3', null, 'Live Voice'),
        h(
          'div',
          { className: 'dlv-version-badges', 'aria-label': 'Version information' },
          h(
            'a',
            {
              className: 'dlv-shields-badge',
              href: RELEASES_URL,
              target: '_blank',
              rel: 'noreferrer',
              'aria-label': `DSH Live Voice v${CURRENT_VERSION}. Open releases`,
              title: `DSH Live Voice v${CURRENT_VERSION}`,
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
              'aria-label': `Compatible with DSH v${TESTED_DSH_VERSION}. Open release`,
              title: `Compatible with DSH v${TESTED_DSH_VERSION}`,
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
                'aria-label': `Update available: ${latestRelease.tag}. Open release`,
                title: `Update available: ${latestRelease.tag}`,
              },
              h('span', { className: 'dlv-update-icon', 'aria-hidden': true }, '↑'),
              'Update available',
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
            'aria-label': 'Star DSH Live Voice on GitHub',
            title: 'Star DSH Live Voice on GitHub',
          },
          h('span', { className: 'dlv-star-icon', 'aria-hidden': true }, '★'),
          'Star Us on GitHub',
        ),
      ),
      onClose
        ? h(Button, { label: 'Close voice settings', icon: 'close', onClick: onClose })
        : null,
      h(
        'div',
        { className: 'dlv-settings-tabs', role: 'tablist', 'aria-label': 'Live Voice settings' },
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
          field('Speech engine', 'engine', [
            {
              value: 'qwen-http',
              label: 'Qwen3 TTS — local MLX server',
              disabled: capabilities['qwen-http']?.supported === false,
            },
            {
              value: 'say',
              label: 'macOS say — host audio',
              disabled: capabilities.say?.supported === false,
            },
            {
              value: 'browser',
              label: 'Browser speech — device audio',
              disabled: capabilities.browser?.supported === false,
            },
          ]),
          settings.engine !== 'say'
            ? field('Output device', 'outputDeviceId', deviceOptions('audiooutput', 'Audio output'))
            : h('small', null, 'macOS say uses the output selected on the DSH host.'),
          settings.engine === 'browser'
            ? h(
                React.Fragment,
                null,
                h(
                  'small',
                  null,
                  'Browser speech synthesis may ignore the selected output device; this browser API normally follows the system default.',
                ),
                field('Local browser voice', 'voice', [
                  { value: '', label: 'Automatic local voice' },
                  ...(capabilities.browser?.voices || []).map((voice) => ({
                    value: voice.voiceURI || voice.name,
                    label: `${voice.name} — ${voice.lang || 'unknown language'}`,
                  })),
                ]),
              )
            : null,
          settings.engine === 'qwen-http'
            ? h(
                React.Fragment,
                null,
                field('Qwen voice', 'voice', qwenVoices),
                h(
                  'small',
                  null,
                  `Aiden is used by default. These preset voices are not native Brazilian Portuguese voices.`,
                ),
                subcard('Qwen server connection', [
                  h(QwenSettings, { key: 'qwen-output-settings', controller }),
                ]),
              )
            : null,
          subcard('Filtering', [
            h(
              'label',
              { key: 'output-code-filter', className: 'dlv-check' },
              h('input', {
                type: 'checkbox',
                checked: settings.outputCodeFilterEnabled !== false,
                onChange: (event) =>
                  invoke('updateSettings', { outputCodeFilterEnabled: event.target.checked }),
              }),
              ' Filter Markdown code blocks before speaking',
            ),
            h(
              'label',
              { key: 'output-code-lines' },
              'Read code blocks up to this many lines',
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
              'Replacement phrase for larger code blocks',
              h('input', {
                type: 'text',
                maxLength: 300,
                value: settings.outputCodeNotice || 'Look the code on out conversation',
                disabled: settings.outputCodeFilterEnabled === false,
                onChange: (event) =>
                  invoke('updateSettings', { outputCodeNotice: event.target.value }),
              }),
            ),
          ]),
          h(
            'label',
            null,
            'Speech rate',
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
            h('small', null, 'Relative speed: 1 is normal.'),
          ),
          h(
            'p',
            null,
            'Qwen synthesis runs on the DSH host and the generated WAV plays in this browser. macOS say plays on the host; Browser speech plays on this device.',
          ),
          ...['qwen-http', 'say', 'browser']
            .filter((id) => capabilities[id]?.supported === false)
            .map((id) =>
              h(
                'p',
                { key: id, role: 'status' },
                `${id === 'qwen-http' ? 'Qwen3 local' : id === 'say' ? 'macOS say' : 'Browser speech'}: ${capabilities[id].reason}`,
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
                onClick: () =>
                  invoke('speak', 'DSH Live Voice. The selected speech output is working.'),
              },
              state.speaking ? 'Testing speech…' : 'Test selected speech output',
            ),
            state.speaking || state.paused
              ? h(
                  'button',
                  { type: 'button', onClick: () => invoke('stopSpeech') },
                  'Stop speech test',
                )
              : null,
            h(
              'button',
              { type: 'button', onClick: () => invoke('refreshCapabilities') },
              'Refresh available engines',
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
            'Recognition engine',
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
              h('option', { value: 'browser' }, 'Browser SpeechRecognition — Default option'),
              h('option', { value: 'qwen-http' }, 'Qwen3 ASR — HTTP API'),
              h('option', { value: 'whisper-http' }, 'Whisper — HTTP API'),
              h(
                'optgroup',
                { label: 'Coming Soon — vote on repo issues' },
                h('option', { value: 'webgpu', disabled: true }, 'Browser WebGPU Inference — Soon'),
                h(
                  'option',
                  { value: 'sherpa-onnx', disabled: true },
                  'sherpa-onnx Streaming — Soon',
                ),
                h('option', { value: 'parakeet', disabled: true }, 'NVIDIA Parakeet — Soon'),
                h('option', { value: 'voxtral', disabled: true }, 'Voxtral Realtime — Soon'),
              ),
            ),
          ),
          h(
            'small',
            { className: 'dlv-recognition-engine-description' },
            settings.recognitionEngine === 'qwen-http'
              ? 'HTTP API at the configured base URL (default: http://127.0.0.1:8080/). Compatible with POST /v1/audio/transcriptions.'
              : settings.recognitionEngine === 'whisper-http'
                ? 'HTTP API at the configured DSH host URL (default: http://127.0.0.1:8080/inference). Audio uses the authenticated DSH host transcription route.'
                : 'Uses the browser SpeechRecognition API. This is the default option.',
          ),
          field('Input device', 'inputDeviceId', deviceOptions('audioinput', 'Microphone')),
          settings.recognitionEngine === 'browser'
            ? h(
                'small',
                null,
                'Browser SpeechRecognition may use the browser or system default microphone instead of this selection.',
              )
            : null,
          field('Recognition language', 'recognitionLang', [
            ...(settings.recognitionEngine !== 'browser'
              ? [{ value: 'auto', label: 'Automatic — detect language' }]
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
                  ' Process recognition locally on this device',
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
                      ' Automatically install this browser language pack when needed',
                    )
                  : h(
                      'p',
                      { role: 'status' },
                      'Browser-service recognition is enabled. The browser may send microphone audio to its recognition service.',
                    ),
              )
            : h(
                'p',
                { role: 'status' },
                settings.recognitionEngine === 'qwen-http'
                  ? 'Audio is segmented into complete WAV utterances and sent through authenticated DSH to the host-local Qwen3 ASR model.'
                  : 'Audio is segmented into complete WAV utterances, sent through authenticated DSH, and processed by loopback whisper.cpp HTTP.',
              ),
          settings.recognitionEngine === 'whisper-http'
            ? subcard('Connection settings', [h(WhisperSettings, { key: 'settings', controller })])
            : null,
          settings.recognitionEngine === 'qwen-http' && settings.engine !== 'qwen-http'
            ? subcard('Qwen server connection', [
                h(QwenSettings, { key: 'qwen-recognition-settings', controller }),
              ])
            : null,
          h('p', null, 'Provider settings change with the selected recognition engine.'),
          subcard('Voice commands', [
            h(
              'label',
              { key: 'voice-commands-enabled', className: 'dlv-check' },
              h('input', {
                type: 'checkbox',
                checked: settings.voiceCommandsEnabled !== false,
                onChange: (event) =>
                  invoke('updateSettings', { voiceCommandsEnabled: event.target.checked }),
              }),
              ' Enable exact voice commands',
            ),
            h(
              'small',
              { key: 'voice-command-help' },
              'Separate phrases with commas. Matching ignores capitalization, accents, punctuation, and extra spaces. The entire final chunk must match.',
            ),
            ...[
              ['Send to running agent', 'voiceCommandSend', 'send, send message'],
              ['Put in queue', 'voiceCommandQueue', 'queue, queue message'],
              ['End conversation', 'voiceCommandEnd', 'end, end conversation'],
              ['Mute composer input', 'voiceCommandMute', 'mute, stop listening'],
              ['Resume composer input', 'voiceCommandResume', 'resume, start listening'],
              [
                'Stop assistant speech',
                'voiceCommandStopSpeaking',
                'stop talking, stop speaking, shut up',
              ],
              ['Clear composer', 'voiceCommandClear', 'clear all, clear message'],
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
          subcard('Filtering', [
            h(
              'label',
              { key: 'recognition-filter', className: 'dlv-check' },
              h('input', {
                type: 'checkbox',
                checked: settings.recognitionFilterEnabled !== false,
                onChange: (event) =>
                  invoke('updateSettings', { recognitionFilterEnabled: event.target.checked }),
              }),
              ' Ignore short final transcription chunks',
            ),
            h(
              'label',
              { key: 'recognition-minimum-words' },
              'Minimum words per final chunk',
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
              h(
                'small',
                null,
                'Final chunks with fewer words are ignored before they reach the composer or automatic delivery.',
              ),
            ),
          ]),
          capabilities.capture?.supported === false
            ? h('p', { role: 'status' }, `Microphone: ${capabilities.capture.reason}`)
            : capabilities.capture?.permission === 'prompt'
              ? h(
                  'p',
                  { role: 'status' },
                  'Microphone permission will be requested only when you start dictation or a voice conversation.',
                )
              : null,
          capabilities.recognition?.supported === false
            ? h('p', { role: 'status' }, capabilities.recognition.reason)
            : null,
          usesPluginVoiceDetection(settings.recognitionEngine)
            ? h(
                'details',
                { className: 'dlv-settings-subcard', 'aria-label': 'Silence detection settings' },
                h('summary', null, 'Silence detection'),
                h(
                  'div',
                  { className: 'dlv-settings-subcard-body' },
                  h(
                    'p',
                    null,
                    'Controls how long a pause must last before captured speech is sent for recognition.',
                  ),
                  h(
                    'label',
                    { className: 'dlv-setting-field' },
                    'Maximum continuous speech (seconds)',
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
                    h(
                      'small',
                      null,
                      'If speech never pauses, start a new transcription chunk after this duration. Default: 60 seconds.',
                    ),
                  ),
                  h(
                    'div',
                    {
                      className: 'dlv-preset-group',
                      role: 'radiogroup',
                      'aria-label': 'Pause before sending',
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
                          h('strong', null, preset.label),
                          h('small', null, preset.description),
                        ),
                      ),
                    ),
                  ),
                  h(
                    'p',
                    { className: 'dlv-vad-summary' },
                    'Pause before sending: ' +
                      (voiceDetectionPresets[settings.voiceDetectionPreset]?.silenceMs ||
                        voiceDetectionPresets.natural.silenceMs) +
                      ' ms',
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
          ' Automatically speak new assistant messages',
        ),
        h(
          'p',
          { key: 'policy' },
          'During a voice conversation, assistant phrases are announced automatically. Playback waits while you are speaking.',
        ),
        h(
          'label',
          { key: 'interrupt-message', className: 'dlv-check' },
          h('input', {
            type: 'checkbox',
            checked: settings.interruptSpeechOnUserMessage === true,
            onChange: (event) =>
              invoke('updateSettings', { interruptSpeechOnUserMessage: event.target.checked }),
          }),
          ' Stop assistant speech when I send a message',
        ),
        h(
          'p',
          { key: 'interrupt-message-description', className: 'dlv-setting-description' },
          settings.interruptSpeechOnUserMessage
            ? 'Sending or steering a new user message stops current or paused assistant speech.'
            : 'Sending another message does not stop the assistant audio you are already hearing.',
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
          ' Hold Control to talk',
        ),
        h(
          'p',
          { key: 'hold-to-talk-description', className: 'dlv-setting-description' },
          'While a composer is open, hold Control anywhere on the page to capture speech. Release it to flush queued transcription, wait the configured send delay, queue the message, and close voice capture. Press Escape while holding to cancel.',
        ),
        field('Listening mode', 'mode', [
          { value: 'speaker', label: 'Speakers — gated listening' },
          { value: 'headphones', label: 'Headphones — open microphone' },
        ]),
        h(
          'p',
          { key: 'mode-description', className: 'dlv-setting-description' },
          settings.mode === 'headphones'
            ? 'Open microphone keeps listening while responses play. When your speech is detected, playback pauses and resumes only when you choose.'
            : 'Gated listening releases the microphone while responses play, preventing speaker audio from being recognized. Use Take microphone to interrupt.',
        ),
        h(
          'label',
          { key: 'speech-delay' },
          'Assistant response delay',
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
              h('option', { key: seconds, value: String(seconds) }, seconds + ' seconds'),
            ),
          ),
          h(
            'small',
            null,
            'After you stop speaking, automatic assistant playback waits for this much continuous silence. Speaking again restarts the wait.',
          ),
        ),
        field('Sending mode', 'sendingMode', [
          { value: 'manual', label: 'Off — review and send manually' },
          { value: 'queue', label: 'Queue — automatically add after silence' },
          { value: 'steer', label: 'Steer — automatically send to the running agent' },
        ]),
        settings.sendingMode !== 'manual'
          ? h(
              'label',
              { key: 'delay' },
              'Send after silence',
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
                  h('option', { key: seconds, value: String(seconds) }, seconds + ' seconds'),
                ),
              ),
              h(
                'small',
                null,
                'Countdown starts after a final recognized phrase. New speech or edits cancel it.',
              ),
            )
          : h(
              'p',
              { key: 'manual', className: 'dlv-setting-description' },
              'Recognized text stays in the composer until you use the normal DSH Send control.',
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
