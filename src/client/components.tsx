// @ts-nocheck
import { createWhisperSettings } from './whisper-settings.tsx';
import { createQwenSettings } from './qwen-settings.tsx';
import { createFallbackTranslator } from './locale.ts';
import { useLanguage, withLiveVoiceLanguage } from './i18n-react.tsx';
import {
  defaultAgentVoiceContext,
  qwenVoices,
  usesPluginVoiceDetection,
  voiceDetectionPresets,
} from '../core/settings.ts';
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
export function createComponents(React, translate = createFallbackTranslator(), locale) {
  const fallbackTranslate = (key, params) => translate(key, params);
  function useLiveVoiceLanguage() {
    const { scoped: commons } = useLanguage((ctx) => ctx.commons);
    const { scoped: recognition } = useLanguage((ctx) => ctx.recognition);
    const { scoped: settings } = useLanguage((ctx) => ctx.settings);
    const { scoped: speak } = useLanguage((ctx) => ctx.speak);
    return React.useCallback(
      (key, params) => {
        const path = key.replace(/^dsh-live-voice\./, '').split('.');
        const roots = { commons, recognition, settings, speak };
        let value = roots[path.shift()];
        for (const segment of path) value = value?.[segment];
        return typeof value === 'function' ? value(params) : fallbackTranslate(key, params);
      },
      [commons, recognition, settings, speak],
    );
  }
  let t = fallbackTranslate;
  const localize = (value) =>
    typeof value === 'string' && value.startsWith('dsh-live-voice.') ? t(value) : value;
  const WhisperSettings = createWhisperSettings(React, t);
  const QwenSettings = createQwenSettings(React, t);
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
      skipNext: 'M5 5l10 7-10 7V5M19 5v14',
      send: 'M3 11.5L21 3l-8.5 18-2-7.5L3 11.5zm7.5 2L21 3',
      queue: 'M5 6h14M5 12h10M5 18h6M18 15v6M15 18h6',
      speakerOff: 'M3 9h4l6-5v16l-6-5H3V9M17 9l5 6M22 9l-5 6',
    };
    return <svg {...common}>{<path d={paths[name] || paths.mic} />}</svg>;
  }
  function Button({
    label,
    icon,
    visibleLabel,
    title = label,
    className = 'dlv-pill-button',
    ...props
  }) {
    label = localize(label);
    title = localize(title);
    visibleLabel = localize(visibleLabel);
    return (
      <button
        {...props}
        type="button"
        className={'dlv-icon-button ' + className}
        title={title}
        aria-label={label}
      >
        {<Icon name={icon} />}
        {visibleLabel ? (
          <span className="dlv-toggle-state" aria-hidden>
            {visibleLabel}
          </span>
        ) : null}
      </button>
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
    t = useLiveVoiceLanguage();
    return error ? (
      <div className="dlv-error" role="alert">
        {String(error)}
        {onDismiss ? (
          <button
            type="button"
            aria-label={t('dsh-live-voice.commons.dismissError')}
            onClick={onDismiss}
          >
            {t('dsh-live-voice.commons.dismiss')}
          </button>
        ) : null}
      </div>
    ) : null;
  }
  function MicrophoneButtons({ controller }) {
    t = useLiveVoiceLanguage();
    const state = useController(controller);
    const [invoke, error, clearError] = useActions(controller);
    const busy = state.conversation || state.listening || state.starting || state.recognizing;
    if (busy) return null;
    const recognition = state.capabilities?.recognition;
    const capture = state.capabilities?.capture;
    const pending = !recognition || !capture;
    const unavailable = recognition?.supported === false || capture?.supported === false;
    const reason = capture?.supported === false ? capture.reason : recognition?.reason;
    return (
      <React.Fragment>
        {
          <Button
            className="dlv-mic"
            icon="mic"
            label={
              pending
                ? 'dsh-live-voice.recognition.microphone.checking'
                : unavailable
                  ? reason || 'dsh-live-voice.recognition.status.unavailable'
                  : 'dsh-live-voice.commons.conversation.start'
            }
            disabled={pending}
            onClick={() =>
              unavailable ? invoke('explainRecognition') : invoke('startConversation')
            }
          />
        }
        {<ErrorText error={error} onDismiss={clearError} />}
      </React.Fragment>
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
    return <canvas ref={ref} className="dlv-wave" aria-hidden />;
  }
  function RecordingBar({ controller, questionOnly = false, overlay = false, overlayStyle }) {
    t = useLiveVoiceLanguage();
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
    const localizedStatus = localize(status);
    return (
      <div
        className={overlay ? 'dlv-bar-wrap dlv-question-overlay' : 'dlv-bar-wrap'}
        style={overlay ? overlayStyle : undefined}
      >
        {
          <div
            className="dlv-pill"
            role="group"
            aria-label={t('dsh-live-voice.commons.controls.title')}
          >
            {capture && !state.conversation ? (
              <Button
                label={t('dsh-live-voice.recognition.dictation.cancel')}
                icon="close"
                onClick={() => invoke('cancelDictation')}
              />
            ) : null}
            {state.conversation ? (
              <Button
                label={t('dsh-live-voice.commons.conversation.end')}
                icon="close"
                onClick={() => invoke('endConversation')}
              />
            ) : null}
            {<Waveform controller={controller} enabled={Boolean(state.listening)} />}
            {
              <span className="dlv-status" role="status" aria-live="polite">
                {localizedStatus}
              </span>
            }
            {
              <Button
                className="dlv-live-toggle"
                label={t('dsh-live-voice.settings.delivery.toggle')}
                title={t('dsh-live-voice.settings.delivery.status', {
                  mode:
                    state.settings.sendingMode === 'steer'
                      ? t('dsh-live-voice.settings.delivery.steerDescription')
                      : state.settings.sendingMode === 'queue'
                        ? t('dsh-live-voice.commons.queue')
                        : t('dsh-live-voice.commons.off'),
                })}
                icon={state.settings.sendingMode === 'queue' ? 'queue' : 'send'}
                visibleLabel={
                  state.settings.sendingMode === 'steer'
                    ? 'dsh-live-voice.commons.send'
                    : state.settings.sendingMode === 'queue'
                      ? 'dsh-live-voice.commons.delivery.queueBadge'
                      : 'dsh-live-voice.commons.toggle.offBadge'
                }
                aria-label={t('dsh-live-voice.settings.delivery.status', {
                  mode: t(
                    state.settings.sendingMode === 'steer'
                      ? 'dsh-live-voice.settings.delivery.steerDescription'
                      : state.settings.sendingMode === 'queue'
                        ? 'dsh-live-voice.commons.queue'
                        : 'dsh-live-voice.commons.manual',
                  ),
                })}
                aria-pressed={['queue', 'steer'].includes(state.settings.sendingMode)}
                data-mode={state.settings.sendingMode || 'manual'}
                onClick={() =>
                  invoke('updateSettings', {
                    sendingMode: !['queue', 'steer'].includes(state.settings.sendingMode)
                      ? 'queue'
                      : state.settings.sendingMode === 'queue'
                        ? 'steer'
                        : 'manual',
                  })
                }
              />
            }
            {
              <Button
                className={`dlv-live-toggle${state.speechSegmentsRemaining > 0 ? ' dlv-live-toggle-expanded' : ''}`}
                label={t('dsh-live-voice.speak.autoPlayback.label')}
                title={
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
                      })
                }
                icon={state.settings.announceAssistantMessages !== false ? 'speaker' : 'speakerOff'}
                visibleLabel={
                  state.settings.announceAssistantMessages === false
                    ? 'dsh-live-voice.commons.toggle.offBadge'
                    : state.speechSegmentsRemaining > 0
                      ? String(state.speechSegmentsRemaining)
                      : 'dsh-live-voice.commons.on'
                }
                role="switch"
                aria-checked={state.settings.announceAssistantMessages !== false}
                onClick={() =>
                  invoke('updateSettings', {
                    announceAssistantMessages: state.settings.announceAssistantMessages === false,
                  })
                }
              />
            }
            {remaining ? (
              <Button
                label={t('dsh-live-voice.settings.autoSend.cancel')}
                icon="close"
                onClick={() => invoke('cancelAutoSend')}
              />
            ) : null}
            {state.conversation && !capture ? (
              <Button
                label={t('dsh-live-voice.recognition.microphone.takeControl')}
                icon="mic"
                onClick={() => invoke('startConversation')}
              />
            ) : null}
            {capture ? (
              <Button
                className="dlv-live-toggle dlv-mic-state"
                label={
                  state.muted
                    ? 'dsh-live-voice.recognition.microphone.resume'
                    : 'dsh-live-voice.recognition.microphone.ignore'
                }
                title={t('dsh-live-voice.recognition.microphone.inputStatus', {
                  state: t(
                    state.muted
                      ? 'dsh-live-voice.commons.input.ignoring'
                      : 'dsh-live-voice.commons.input.listening',
                  ),
                })}
                icon={state.muted ? 'micOff' : 'mic'}
                visibleLabel={
                  state.muted
                    ? 'dsh-live-voice.commons.input.ignoringBadge'
                    : 'dsh-live-voice.commons.input.listeningBadge'
                }
                aria-pressed={Boolean(state.muted)}
                data-muted={state.muted ? 'true' : 'false'}
                onClick={() => invoke(state.muted ? 'resumeListeningInput' : 'muteListening')}
              />
            ) : null}
            {
              // Keep the playback controls mounted during the configured gap between
              // queued segments; only Pause is unavailable when no audio is active.
              state.speechSegmentsRemaining > 1 ? (
                <Button
                  label={t('dsh-live-voice.speak.playback.next')}
                  icon="skipNext"
                  onClick={() => invoke('skipSpeechSegment')}
                />
              ) : null
            }
            {state.speechSegmentsRemaining > 0 &&
            state.capabilities[state.settings.engine]?.pause ? (
              <Button
                label={t('dsh-live-voice.speak.playback.pause')}
                icon="pause"
                disabled={!state.speaking || state.paused}
                onClick={() => invoke('pauseSpeech')}
              />
            ) : null}
            {state.paused && state.capabilities[state.settings.engine]?.resume ? (
              <Button
                label={t('dsh-live-voice.speak.playback.resume')}
                icon="play"
                onClick={() => invoke('resumeSpeech')}
              />
            ) : null}
            {state.speechSegmentsRemaining > 0 ? (
              <Button
                label={t('dsh-live-voice.speak.playback.stopAll')}
                icon="stop"
                onClick={() => invoke('stopSpeech')}
              />
            ) : null}
          </div>
        }
        {
          <ErrorText
            error={error || state.error}
            onDismiss={() => {
              clearError();
              controller.clearError();
            }}
          />
        }
      </div>
    );
  }
  function SpeakButton({ active = false, disabled = false, label, onClick }) {
    t = useLiveVoiceLanguage();
    return (
      <Button
        className="dlv-speaker"
        label={
          label ||
          (active ? 'dsh-live-voice.speak.playback.stop' : 'dsh-live-voice.speak.playback.message')
        }
        icon={active ? 'stop' : 'speaker'}
        aria-pressed={Boolean(active)}
        disabled={disabled}
        onClick={onClick}
      />
    );
  }
  function SettingsPanel({ controller, onClose }) {
    t = useLiveVoiceLanguage();
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
      {
        id: 'conversation',
        label: 'dsh-live-voice.settings.tabs.conversation',
      },
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

    const field = (label, key, options) => (
      <label key={key}>
        {localize(label)}
        {
          <select
            value={settings[key] || options[0].value}
            onChange={(event) =>
              invoke(
                'updateSettings',
                key === 'engine'
                  ? { engine: event.target.value, voice: '' }
                  : { [key]: event.target.value },
              )
            }
          >
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {localize(option.label)}
              </option>
            ))}
          </select>
        }
      </label>
    );

    const panel = (id, children) => (
      <div
        id={`${tabsId}-panel-${id}`}
        className="dlv-settings-panel"
        role="tabpanel"
        aria-labelledby={`${tabsId}-tab-${id}`}
        hidden={activeTab !== id}
      >
        {children}
      </div>
    );

    const subcard = (title, children, open = false) => (
      <details className="dlv-settings-subcard" open={open}>
        {<summary>{localize(title)}</summary>}
        {<div className="dlv-settings-subcard-body">{children}</div>}
      </details>
    );

    return (
      <section className="dlv-settings" aria-label={t('dsh-live-voice.settings.title')}>
        {
          <div className="dlv-settings-heading">
            {<h3>{t('dsh-live-voice.commons.pluginName')}</h3>}
            {
              <div
                className="dlv-version-badges"
                aria-label={t('dsh-live-voice.commons.version.title')}
              >
                {
                  <a
                    className="dlv-shields-badge"
                    href={RELEASES_URL}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={t('dsh-live-voice.commons.version.link', {
                      version: CURRENT_VERSION,
                    })}
                    title={t('dsh-live-voice.commons.version.label', {
                      version: CURRENT_VERSION,
                    })}
                  >
                    {<img src={LIVE_VOICE_BADGE_URL} alt="" />}
                    {<span>{`v${CURRENT_VERSION}`}</span>}
                  </a>
                }
                {
                  <a
                    className="dlv-shields-badge"
                    href={TESTED_DSH_RELEASE_URL}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={t('dsh-live-voice.commons.version.compatibilityLink', {
                      version: TESTED_DSH_VERSION,
                    })}
                    title={t('dsh-live-voice.commons.version.compatibility', {
                      version: TESTED_DSH_VERSION,
                    })}
                  >
                    {<img src={DSH_BADGE_URL} alt="" />}
                    {<span>{`v${TESTED_DSH_VERSION}`}</span>}
                  </a>
                }
              </div>
            }
            {<span className="dlv-heading-divider" aria-hidden />}
            {updateAvailable ? (
              <a
                className="dlv-version-badge dlv-update-badge"
                href={latestRelease.url}
                target="_blank"
                rel="noreferrer"
                aria-label={t('dsh-live-voice.commons.update.link', {
                  version: latestRelease.tag,
                })}
                title={t('dsh-live-voice.commons.update.version', {
                  version: latestRelease.tag,
                })}
              >
                {
                  <span className="dlv-update-icon" aria-hidden>
                    {'↑'}
                  </span>
                }
                {t('dsh-live-voice.commons.update.label')}
              </a>
            ) : null}
            {updateAvailable ? <span className="dlv-heading-divider" aria-hidden /> : null}
            {
              <a
                className="dlv-version-badge dlv-star-badge"
                href={REPOSITORY_URL}
                target="_blank"
                rel="noreferrer"
                aria-label={t('dsh-live-voice.commons.repository.starLink')}
                title={t('dsh-live-voice.commons.repository.starLink')}
              >
                {
                  <span className="dlv-star-icon" aria-hidden>
                    {'★'}
                  </span>
                }
                {t('dsh-live-voice.commons.repository.starLabel')}
              </a>
            }
          </div>
        }
        {onClose ? (
          <Button label={t('dsh-live-voice.settings.close')} icon="close" onClick={onClose} />
        ) : null}
        {
          <div
            className="dlv-settings-tabs"
            role="tablist"
            aria-label={t('dsh-live-voice.settings.title')}
          >
            {tabs.map((tab, index) => {
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={(element) => {
                    tabRefs.current[index] = element;
                  }}
                  id={`${tabsId}-tab-${tab.id}`}
                  type="button"
                  role="tab"
                  className="dlv-settings-tab"
                  aria-selected={selected}
                  aria-controls={`${tabsId}-panel-${tab.id}`}
                  data-active={selected ? 'true' : undefined}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActiveTab(tab.id)}
                  onKeyDown={(event) => handleTabKeyDown(event, index)}
                >
                  {t(tab.label)}
                </button>
              );
            })}
          </div>
        }
        {
          <div
            id={`${tabsId}-panel-speech`}
            className="dlv-settings-panel"
            role="tabpanel"
            aria-labelledby={`${tabsId}-tab-speech`}
            hidden={activeTab !== 'speech'}
          >
            {
              <div className="dlv-settings-card-body">
                {field('dsh-live-voice.speak.engine.label', 'engine', [
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
                ])}
                {settings.engine !== 'say' ? (
                  field(
                    'dsh-live-voice.speak.output.device',
                    'outputDeviceId',
                    deviceOptions('audiooutput', 'dsh-live-voice.speak.output.fallbackName'),
                  )
                ) : (
                  <small>{t('dsh-live-voice.speak.macos.outputHelp')}</small>
                )}
                {settings.engine === 'browser' ? (
                  <React.Fragment>
                    {<small>{t('dsh-live-voice.speak.browser.outputHelp')}</small>}
                    {field('dsh-live-voice.speak.browser.voice', 'voice', [
                      {
                        value: '',
                        label: 'dsh-live-voice.speak.browser.automaticVoice',
                      },
                      ...(capabilities.browser?.voices || []).map((voice) => ({
                        value: voice.voiceURI || voice.name,
                        label:
                          voice.name +
                          ' — ' +
                          (voice.lang || t('dsh-live-voice.commons.unknownLanguage')),
                      })),
                    ])}
                  </React.Fragment>
                ) : null}
                {settings.engine === 'qwen-http' ? (
                  <React.Fragment>
                    {field(
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
                    )}
                    {<small>{t('dsh-live-voice.speak.qwen.voiceHelp')}</small>}
                    {subcard('dsh-live-voice.speak.qwen.connection', [
                      <QwenSettings key="qwen-output-settings" controller={controller} />,
                    ])}
                  </React.Fragment>
                ) : null}
                {subcard('dsh-live-voice.settings.filters.title', [
                  <label key="output-code-filter" className="dlv-check">
                    {
                      <input
                        type="checkbox"
                        checked={settings.outputCodeFilterEnabled !== false}
                        onChange={(event) =>
                          invoke('updateSettings', {
                            outputCodeFilterEnabled: event.target.checked,
                          })
                        }
                      />
                    }{' '}
                    {t('dsh-live-voice.speak.filters.code.enabled')}
                  </label>,
                  <label key="output-code-lines">
                    {t('dsh-live-voice.speak.filters.code.maxLines')}
                    {
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={settings.outputCodeMaxLines ?? 5}
                        disabled={settings.outputCodeFilterEnabled === false}
                        onChange={(event) => {
                          const value = Number(event.target.value);
                          if (Number.isInteger(value) && value >= 0 && value <= 100)
                            invoke('updateSettings', {
                              outputCodeMaxLines: value,
                            });
                        }}
                      />
                    }
                  </label>,
                  <label key="output-code-notice">
                    {t('dsh-live-voice.speak.filters.code.replacement')}
                    {
                      <input
                        type="text"
                        maxLength={300}
                        key={`output-code-notice-${settings.outputCodeNotice}`}
                        defaultValue={
                          settings.outputCodeNotice || t('dsh-live-voice.speak.filters.code.notice')
                        }
                        disabled={settings.outputCodeFilterEnabled === false}
                        onBlur={(event) =>
                          invoke('updateSettings', {
                            outputCodeNotice: event.target.value,
                          })
                        }
                      />
                    }
                  </label>,
                ])}
                {
                  <div className="dlv-settings-subcard">
                    {
                      <label>
                        {
                          <input
                            type="checkbox"
                            checked={settings.agentVoiceContextEnabled !== false}
                            onChange={(event) =>
                              invoke('updateSettings', {
                                agentVoiceContextEnabled: event.target.checked,
                              })
                            }
                          />
                        }
                        {t('dsh-live-voice.speak.agentContext.enabled')}
                      </label>
                    }
                    {<small>{t('dsh-live-voice.speak.agentContext.enabledHelp')}</small>}
                    {<label>{t('dsh-live-voice.speak.agentContext.label')}</label>}
                    {<small>{t('dsh-live-voice.speak.agentContext.help')}</small>}
                    {
                      <textarea
                        key={`agent-voice-context-${settings.agentVoiceContext}`}
                        defaultValue={settings.agentVoiceContext}
                        maxLength={4000}
                        rows={7}
                        onBlur={(event) =>
                          invoke('updateSettings', {
                            agentVoiceContext: event.target.value,
                          })
                        }
                      />
                    }
                    {
                      <button
                        type="button"
                        disabled={settings.agentVoiceContext === defaultAgentVoiceContext}
                        onClick={() =>
                          invoke('updateSettings', {
                            agentVoiceContext: defaultAgentVoiceContext,
                          })
                        }
                      >
                        {t('dsh-live-voice.speak.agentContext.restore')}
                      </button>
                    }
                  </div>
                }
                {
                  <label>
                    {t('dsh-live-voice.speak.rate.label')}
                    {
                      <input
                        type="number"
                        min={0.1}
                        max={3}
                        step={0.1}
                        value={settings.rate ?? 1}
                        onChange={(event) => {
                          const rate = Number(event.target.value);
                          if (Number.isFinite(rate) && rate >= 0.1 && rate <= 3)
                            invoke('updateSettings', { rate });
                        }}
                      />
                    }
                    {<small>{t('dsh-live-voice.speak.rate.help')}</small>}
                  </label>
                }
                {
                  <label>
                    {t('dsh-live-voice.speak.segmentGap.label')}
                    {
                      <input
                        type="number"
                        min={0}
                        max={2000}
                        step={50}
                        value={settings.segmentGapMs ?? 400}
                        onChange={(event) => {
                          const segmentGapMs = Number(event.target.value);
                          if (
                            Number.isFinite(segmentGapMs) &&
                            segmentGapMs >= 0 &&
                            segmentGapMs <= 2000
                          )
                            invoke('updateSettings', { segmentGapMs });
                        }}
                      />
                    }
                    {<small>{t('dsh-live-voice.speak.segmentGap.help')}</small>}
                  </label>
                }
                {<p>{t('dsh-live-voice.speak.engine.playbackHelp')}</p>}
                {['qwen-http', 'say', 'browser']
                  .filter((id) => capabilities[id]?.supported === false)
                  .map((id) => (
                    <p key={id} role="status">
                      {t('dsh-live-voice.commons.engine.failure', {
                        engine: t(
                          id === 'qwen-http'
                            ? 'dsh-live-voice.speak.qwen.name'
                            : id === 'say'
                              ? 'dsh-live-voice.speak.macos.name'
                              : 'dsh-live-voice.speak.browser.name',
                        ),
                        reason: capabilities[id].reason,
                      })}
                    </p>
                  ))}
                {
                  <div className="dlv-settings-actions">
                    {
                      <button
                        type="button"
                        disabled={
                          capabilities[settings.engine]?.supported !== true || state.speaking
                        }
                        onClick={() => invoke('speak', t('dsh-live-voice.speak.output.testPhrase'))}
                      >
                        {t(
                          state.speaking
                            ? 'dsh-live-voice.speak.output.testing'
                            : 'dsh-live-voice.speak.output.test',
                        )}
                      </button>
                    }
                    {state.speaking || state.paused ? (
                      <button type="button" onClick={() => invoke('stopSpeech')}>
                        {t('dsh-live-voice.speak.output.stopTest')}
                      </button>
                    ) : null}
                    {
                      <button type="button" onClick={() => invoke('refreshCapabilities')}>
                        {t('dsh-live-voice.settings.engine.refresh')}
                      </button>
                    }
                  </div>
                }
              </div>
            }
          </div>
        }
        {
          <div
            id={`${tabsId}-panel-recognition`}
            className="dlv-settings-panel"
            role="tabpanel"
            aria-labelledby={`${tabsId}-tab-recognition`}
            hidden={activeTab !== 'recognition'}
          >
            {
              <div className="dlv-settings-card-body">
                {
                  <label>
                    {t('dsh-live-voice.recognition.engine.label')}
                    {
                      <select
                        value={settings.recognitionEngine}
                        onChange={(event) =>
                          invoke(
                            'updateSettings',
                            event.target.value === 'browser' && settings.recognitionLang === 'auto'
                              ? {
                                  recognitionEngine: 'browser',
                                  recognitionLang: 'pt-BR',
                                }
                              : { recognitionEngine: event.target.value },
                          )
                        }
                      >
                        {
                          <option value="browser">
                            {t('dsh-live-voice.recognition.browser.label')}
                          </option>
                        }
                        {
                          <option value="qwen-http">
                            {t('dsh-live-voice.recognition.qwen.label')}
                          </option>
                        }
                        {
                          <option value="whisper-http">
                            {t('dsh-live-voice.recognition.whisper.label')}
                          </option>
                        }
                        {
                          <optgroup label={t('dsh-live-voice.recognition.planned.vote')}>
                            {
                              <option value="webgpu" disabled>
                                {t('dsh-live-voice.recognition.planned.webGpu')}
                              </option>
                            }
                            {
                              <option value="sherpa-onnx" disabled>
                                {t('dsh-live-voice.recognition.planned.sherpa')}
                              </option>
                            }
                            {
                              <option value="parakeet" disabled>
                                {t('dsh-live-voice.recognition.planned.parakeet')}
                              </option>
                            }
                            {
                              <option value="voxtral" disabled>
                                {t('dsh-live-voice.recognition.planned.voxtral')}
                              </option>
                            }
                          </optgroup>
                        }
                      </select>
                    }
                  </label>
                }
                {
                  <small className="dlv-recognition-engine-description">
                    {t(
                      settings.recognitionEngine === 'qwen-http'
                        ? 'dsh-live-voice.recognition.whisper.endpointHelp'
                        : settings.recognitionEngine === 'whisper-http'
                          ? 'dsh-live-voice.recognition.qwen.endpointHelp'
                          : 'dsh-live-voice.recognition.browser.help',
                    )}
                  </small>
                }
                {field(
                  'dsh-live-voice.recognition.microphone.device',
                  'inputDeviceId',
                  deviceOptions('audioinput', 'dsh-live-voice.recognition.microphone.label'),
                )}
                {settings.recognitionEngine === 'browser' ? (
                  <small>{t('dsh-live-voice.recognition.browser.microphoneHelp')}</small>
                ) : null}
                {field('dsh-live-voice.recognition.language.label', 'recognitionLang', [
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
                ])}
                {settings.recognitionEngine === 'browser' ? (
                  <React.Fragment>
                    {
                      <label className="dlv-check">
                        {
                          <input
                            type="checkbox"
                            checked={settings.recognitionProcessLocally !== false}
                            onChange={(event) =>
                              invoke('updateSettings', {
                                recognitionProcessLocally: event.target.checked,
                              })
                            }
                          />
                        }{' '}
                        {t('dsh-live-voice.recognition.browser.localProcessing')}
                      </label>
                    }
                    {settings.recognitionProcessLocally !== false ? (
                      <label className="dlv-check">
                        {
                          <input
                            type="checkbox"
                            checked={settings.recognitionAutoInstall !== false}
                            onChange={(event) =>
                              invoke('updateSettings', {
                                recognitionAutoInstall: event.target.checked,
                              })
                            }
                          />
                        }{' '}
                        {t('dsh-live-voice.recognition.browser.autoInstallPack')}
                      </label>
                    ) : (
                      <p role="status">
                        {t('dsh-live-voice.recognition.browser.remoteServiceWarning')}
                      </p>
                    )}
                  </React.Fragment>
                ) : (
                  <p role="status">
                    {t(
                      settings.recognitionEngine === 'qwen-http'
                        ? 'dsh-live-voice.recognition.qwen.captureHelp'
                        : 'dsh-live-voice.recognition.whisper.captureHelp',
                    )}
                  </p>
                )}
                {settings.recognitionEngine === 'whisper-http'
                  ? subcard('dsh-live-voice.commons.connection.title', [
                      <WhisperSettings key="settings" controller={controller} />,
                    ])
                  : null}
                {settings.recognitionEngine === 'qwen-http' && settings.engine !== 'qwen-http'
                  ? subcard('dsh-live-voice.speak.qwen.connection', [
                      <QwenSettings key="qwen-recognition-settings" controller={controller} />,
                    ])
                  : null}
                {<p>{t('dsh-live-voice.recognition.providerSettings.help')}</p>}
                {subcard('dsh-live-voice.recognition.commands.title', [
                  <label key="voice-commands-enabled" className="dlv-check">
                    {
                      <input
                        type="checkbox"
                        checked={settings.voiceCommandsEnabled !== false}
                        onChange={(event) =>
                          invoke('updateSettings', {
                            voiceCommandsEnabled: event.target.checked,
                          })
                        }
                      />
                    }{' '}
                    {t('dsh-live-voice.recognition.commands.enabled')}
                  </label>,
                  <small key="voice-command-help">
                    {t('dsh-live-voice.recognition.voiceCommands.help')}
                  </small>,

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
                  ].map(([label, key, fallback]) => (
                    <label key={key}>
                      {localize(label)}
                      {
                        <textarea
                          rows={2}
                          maxLength={1000}
                          defaultValue={settings[key] || fallback}
                          disabled={settings.voiceCommandsEnabled === false}
                          onBlur={(event) =>
                            invoke('updateSettings', {
                              [key]: event.target.value,
                            })
                          }
                        />
                      }
                    </label>
                  )),
                ])}
                {subcard('dsh-live-voice.settings.filters.title', [
                  <label key="recognition-filter" className="dlv-check">
                    {
                      <input
                        type="checkbox"
                        checked={settings.recognitionFilterEnabled !== false}
                        onChange={(event) =>
                          invoke('updateSettings', {
                            recognitionFilterEnabled: event.target.checked,
                          })
                        }
                      />
                    }{' '}
                    {t('dsh-live-voice.recognition.minimumWords.enabled')}
                  </label>,
                  <label key="recognition-minimum-words">
                    {t('dsh-live-voice.recognition.minimumWords.label')}
                    {
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={settings.recognitionMinimumWords ?? 2}
                        disabled={settings.recognitionFilterEnabled === false}
                        onChange={(event) => {
                          const value = Number(event.target.value);
                          if (Number.isInteger(value) && value >= 1 && value <= 20)
                            invoke('updateSettings', {
                              recognitionMinimumWords: value,
                            });
                        }}
                      />
                    }
                    {<small>{t('dsh-live-voice.recognition.minimumWords.help')}</small>}
                  </label>,
                ])}
                {capabilities.capture?.supported === false ? (
                  <p role="status">
                    {t('dsh-live-voice.recognition.microphone.failure', {
                      reason: capabilities.capture.reason,
                    })}
                  </p>
                ) : capabilities.capture?.permission === 'prompt' ? (
                  <p role="status">{t('dsh-live-voice.recognition.microphone.permissionHelp')}</p>
                ) : null}
                {capabilities.recognition?.supported === false ? (
                  <p role="status">{capabilities.recognition.reason}</p>
                ) : null}
                {usesPluginVoiceDetection(settings.recognitionEngine) ? (
                  <details
                    className="dlv-settings-subcard"
                    aria-label={t('dsh-live-voice.recognition.silenceDetection.title')}
                  >
                    {<summary>{t('dsh-live-voice.recognition.silenceDetection.label')}</summary>}
                    {
                      <div className="dlv-settings-subcard-body">
                        {<p>{t('dsh-live-voice.recognition.silenceDetection.help')}</p>}
                        {
                          <label className="dlv-setting-field">
                            {t('dsh-live-voice.recognition.maxUtterance.label')}
                            {
                              <input
                                type="number"
                                min={10}
                                max={300}
                                step={1}
                                value={settings.recognitionMaxUtteranceSeconds ?? 60}
                                onChange={(event) => {
                                  const value = Number(event.target.value);
                                  if (Number.isInteger(value) && value >= 10 && value <= 300)
                                    invoke('updateSettings', {
                                      recognitionMaxUtteranceSeconds: value,
                                    });
                                }}
                              />
                            }
                            {<small>{t('dsh-live-voice.recognition.maxUtterance.help')}</small>}
                          </label>
                        }
                        {
                          <div
                            className="dlv-preset-group"
                            role="radiogroup"
                            aria-label={t('dsh-live-voice.recognition.silenceDetection.pauseLabel')}
                          >
                            {Object.entries(voiceDetectionPresets).map(([value, preset]) => (
                              <label key={value} className="dlv-preset">
                                {
                                  <input
                                    type="radio"
                                    name="dlv-vad-preset"
                                    value={value}
                                    checked={(settings.voiceDetectionPreset || 'natural') === value}
                                    onChange={() =>
                                      invoke('updateSettings', {
                                        voiceDetectionPreset: value,
                                      })
                                    }
                                  />
                                }
                                {
                                  <span>
                                    {
                                      <strong>
                                        {t(`dsh-live-voice.recognition.presets.${value}.label`)}
                                      </strong>
                                    }
                                    {
                                      <small>
                                        {t(
                                          `dsh-live-voice.recognition.presets.${value}.description`,
                                        )}
                                      </small>
                                    }
                                  </span>
                                }
                              </label>
                            ))}
                          </div>
                        }
                        {
                          <p className="dlv-vad-summary">
                            {t('dsh-live-voice.recognition.silenceDetection.duration', {
                              milliseconds:
                                voiceDetectionPresets[settings.voiceDetectionPreset]?.silenceMs ||
                                voiceDetectionPresets.natural.silenceMs,
                            })}
                          </p>
                        }
                      </div>
                    }
                  </details>
                ) : null}
              </div>
            }
          </div>
        }
        {panel('conversation', [
          <label key="announce" className="dlv-check">
            {
              <input
                type="checkbox"
                checked={settings.announceAssistantMessages !== false}
                onChange={(event) =>
                  invoke('updateSettings', {
                    announceAssistantMessages: event.target.checked,
                  })
                }
              />
            }{' '}
            {t('dsh-live-voice.speak.autoPlayback.enabled')}
          </label>,
          <p key="policy">{t('dsh-live-voice.speak.autoPlayback.help')}</p>,
          <label key="interrupt-message" className="dlv-check">
            {
              <input
                type="checkbox"
                checked={settings.interruptSpeechOnUserMessage === true}
                onChange={(event) =>
                  invoke('updateSettings', {
                    interruptSpeechOnUserMessage: event.target.checked,
                  })
                }
              />
            }{' '}
            {t('dsh-live-voice.speak.interruption.enabled')}
          </label>,
          <p key="interrupt-message-description" className="dlv-setting-description">
            {t(
              settings.interruptSpeechOnUserMessage
                ? 'dsh-live-voice.speak.interruption.enabledHelp'
                : 'dsh-live-voice.speak.interruption.disabledHelp',
            )}
          </p>,
          <label key="hold-to-talk" className="dlv-check">
            {
              <input
                type="checkbox"
                checked={settings.holdToTalkEnabled !== false}
                onChange={(event) =>
                  invoke('updateSettings', {
                    holdToTalkEnabled: event.target.checked,
                  })
                }
              />
            }{' '}
            {t('dsh-live-voice.recognition.holdToTalk.enabled')}
          </label>,
          <p key="hold-to-talk-description" className="dlv-setting-description">
            {t('dsh-live-voice.recognition.holdToTalk.help')}
          </p>,

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
          <p key="mode-description" className="dlv-setting-description">
            {t(
              settings.mode === 'headphones'
                ? 'dsh-live-voice.recognition.headphoneMode.help'
                : 'dsh-live-voice.recognition.speakerMode.help',
            )}
          </p>,
          <label key="speech-delay">
            {t('dsh-live-voice.speak.responseDelay.label')}
            {
              <select
                value={String(settings.assistantSpeechDelaySeconds || 3)}
                onChange={(event) =>
                  invoke('updateSettings', {
                    assistantSpeechDelaySeconds: Number(event.target.value),
                  })
                }
              >
                {[1, 2, 3, 4, 5, 6, 8, 10].map((seconds) => (
                  <option key={seconds} value={String(seconds)}>
                    {t('dsh-live-voice.commons.seconds', { seconds })}
                  </option>
                ))}
              </select>
            }
            {<small>{t('dsh-live-voice.speak.responseDelay.help')}</small>}
          </label>,

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
          settings.sendingMode !== 'manual' ? (
            <label key="delay">
              {t('dsh-live-voice.settings.autoSend.delay')}
              {
                <select
                  value={String(settings.autoSendDelaySeconds || 4)}
                  onChange={(event) =>
                    invoke('updateSettings', {
                      autoSendDelaySeconds: Number(event.target.value),
                    })
                  }
                >
                  {[2, 3, 4, 5, 6, 8, 10].map((seconds) => (
                    <option key={seconds} value={String(seconds)}>
                      {t('dsh-live-voice.commons.seconds', { seconds })}
                    </option>
                  ))}
                </select>
              }
              {<small>{t('dsh-live-voice.recognition.autoSend.countdownHelp')}</small>}
            </label>
          ) : (
            <p key="manual" className="dlv-setting-description">
              {t('dsh-live-voice.recognition.manualSend.help')}
            </p>
          ),
        ])}
        {
          <ErrorText
            error={error || state.error}
            onDismiss={() => {
              clearError();
              controller.clearError();
            }}
          />
        }
      </section>
    );
  }
  const provide = (Component) => withLiveVoiceLanguage(Component, locale);
  return {
    MicrophoneButtons: provide(MicrophoneButtons),
    RecordingBar: provide(RecordingBar),
    SpeakButton: provide(SpeakButton),
    SettingsPanel: provide(SettingsPanel),
  };
}
