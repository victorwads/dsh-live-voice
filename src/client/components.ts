// @ts-nocheck
import { createWhisperSettings } from './whisper-settings.ts';
import { createQwenSettings } from './qwen-settings.ts';
import { usesPluginVoiceDetection, voiceDetectionPresets } from '../core/settings.ts';

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
      conversation: 'M3 10v4M7 6v12M11 3v18M15 7v10M19 5v14M23 10v4',
      speaker: 'M3 9h4l6-5v16l-6-5H3V9M17 8a6 6 0 0 1 0 8M20 5a10 10 0 0 1 0 14',
      close: 'M6 6l12 12M18 6L6 18',
      stop: 'M6 6h12v12H6z',
      pause: 'M8 5v14M16 5v14',
      play: 'M7 4l13 8-13 8z',
    };
    return h('svg', common, h('path', { d: paths[name] || paths.mic }));
  }
  function Button({ label, icon, className = 'dlv-pill-button', ...props }) {
    return h(
      'button',
      {
        ...props,
        type: 'button',
        className: 'dlv-icon-button ' + className,
        title: label,
        'aria-label': label,
      },
      h(Icon, { name: icon }),
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
            : 'Voice typing',
        disabled: pending,
        onClick: () => (unavailable ? invoke('explainRecognition') : invoke('startDictation')),
      }),
      h(Button, {
        className: 'dlv-mic',
        icon: 'conversation',
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
  function RecordingBar({ controller }) {
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
    const status = remaining
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
      { className: 'dlv-bar-wrap' },
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
              label: 'Stop listening',
              icon: 'stop',
              onClick: () => invoke('stopListening'),
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
    const card = (title, children, open = false) =>
      h(
        'details',
        { className: 'dlv-settings-card', open },
        h('summary', null, title),
        h('div', { className: 'dlv-settings-card-body' }, ...children),
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
      h('h3', null, 'Live Voice'),
      onClose
        ? h(Button, { label: 'Close voice settings', icon: 'close', onClick: onClose })
        : null,
      h(
        'details',
        { className: 'dlv-settings-card' },
        h('summary', null, 'Speech output'),
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
          settings.engine === 'browser'
            ? field('Local browser voice', 'voice', [
                { value: '', label: 'Automatic local voice' },
                ...(capabilities.browser?.voices || []).map((voice) => ({
                  value: voice.voiceURI || voice.name,
                  label: `${voice.name} — ${voice.lang || 'unknown language'}`,
                })),
              ])
            : settings.engine === 'say'
              ? h(
                  'label',
                  null,
                  'macOS say voice (empty uses system default)',
                  h('input', {
                    type: 'text',
                    value: settings.voice || '',
                    onChange: (event) => invoke('updateSettings', { voice: event.target.value }),
                    autoComplete: 'off',
                  }),
                )
              : null,
          settings.engine === 'qwen-http'
            ? subcard('Qwen server connection', [
                h(QwenSettings, { key: 'qwen-output-settings', controller }),
              ])
            : null,
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
        ),
      ),
      h(
        'details',
        { className: 'dlv-settings-card' },
        h('summary', null, 'Speech recognition'),
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
              h('option', { value: 'qwen-http' }, 'Qwen3 ASR — local MLX server'),
              h('option', { value: 'browser' }, 'Browser SpeechRecognition'),
              h('option', { value: 'whisper-http' }, 'Whisper HTTP — DSH host'),
            ),
          ),
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
      card(
        'Conversation',
        [
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
            { value: 'manual', label: 'Manual — review and send' },
            { value: 'automatic', label: 'Automatic — send after silence' },
          ]),
          settings.sendingMode === 'automatic'
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
        ],
        false,
      ),
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
          ? h('button', { type: 'button', onClick: () => invoke('stopSpeech') }, 'Stop speech test')
          : null,
        h(
          'button',
          { type: 'button', onClick: () => invoke('refreshCapabilities') },
          'Refresh available engines',
        ),
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
  return { MicrophoneButtons, RecordingBar, SpeakButton, SettingsPanel };
}
