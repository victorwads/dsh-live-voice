// @ts-nocheck
import React from 'react';
import { useLanguage } from './i18n-react.js';

const BASE = '/api/dsh-live-voice/whisper';
const UNLOADED = 'dsh-live-voice.recognition.whisper.restartRequired';
export async function whisperSettingsRequest(
  path,
  { method = 'GET', config, signal } = {},
  fetchImpl = globalThis.fetch,
) {
  const response = await fetchImpl(BASE + path, {
    method,
    credentials: 'same-origin',
    signal,
    headers: config ? { 'content-type': 'application/json' } : undefined,
    body: config ? JSON.stringify(config) : undefined,
  });
  if (response.status === 401 || response.status === 403)
    throw new Error('dsh-live-voice.recognition.whisper.signInRequired');
  if (response.status === 404 || response.status === 405) throw new Error(UNLOADED);
  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error(UNLOADED);
  }
  if (typeof body?.ok !== 'boolean') throw new Error(UNLOADED);
  if (!response.ok || !body.ok)
    throw new Error(body.error?.message || 'dsh-live-voice.recognition.whisper.requestFailed');
  return body.value;
}
export function WhisperSettings({ controller }) {
  const { scoped: commons } = useLanguage((ctx) => ctx.commons);
  const { scoped: recognition } = useLanguage((ctx) => ctx.recognition);
  const { scoped: settings } = useLanguage((ctx) => ctx.settings);
  const [draft, setDraft] = React.useState({
    url: 'http://127.0.0.1:8080/inference',
    healthUrl: '/health',
    timeoutMs: 30000,
  });
  const [busy, setBusy] = React.useState(true);
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');
  const active = React.useRef(null);
  const translateStatus = (value) =>
    ({
      'dsh-live-voice.commons.connection.unsaved': commons.connection.unsaved(),
      'dsh-live-voice.recognition.whisper.saved': recognition.whisper.saved(),
      'dsh-live-voice.recognition.whisper.connectionSuccess':
        recognition.whisper.connectionSuccess(),
      'dsh-live-voice.recognition.whisper.restartRequired': recognition.whisper.restartRequired(),
      'dsh-live-voice.recognition.whisper.signInRequired': recognition.whisper.signInRequired(),
      'dsh-live-voice.recognition.whisper.requestFailed': recognition.whisper.requestFailed(),
      'dsh-live-voice.recognition.whisper.healthFailed': recognition.whisper.healthFailed(),
    })[value] ?? value;
  async function run(action) {
    active.current?.abort();
    const abort = new AbortController();
    active.current = abort;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      if (action === 'load') {
        const value = await whisperSettingsRequest('/config', { signal: abort.signal });
        if (!abort.signal.aborted) {
          setDraft(value);
          setLoaded(true);
        }
      } else if (action === 'save') {
        await controller.endConversation?.();
        const value = await whisperSettingsRequest('/config', {
          method: 'PUT',
          config: { ...draft, timeoutMs: Number(draft.timeoutMs) },
          signal: abort.signal,
        });
        if (!abort.signal.aborted) {
          setDraft(value);
          setMessage('dsh-live-voice.recognition.whisper.saved');
          await controller.refreshCapabilities?.();
        }
      } else {
        const value = await whisperSettingsRequest('/test', {
          method: 'POST',
          config: { ...draft, timeoutMs: Number(draft.timeoutMs) },
          signal: abort.signal,
        });
        if (!abort.signal.aborted) {
          if (!value.supported)
            throw new Error(value.reason || 'dsh-live-voice.recognition.whisper.healthFailed');
          setMessage('dsh-live-voice.recognition.whisper.connectionSuccess');
        }
      }
    } catch (reason) {
      if (!abort.signal.aborted) setError(reason.message || String(reason));
    } finally {
      if (!abort.signal.aborted) setBusy(false);
    }
  }
  React.useEffect(() => {
    void run('load');
    return () => active.current?.abort();
  }, []);
  function field(label, key, type = 'text') {
    return (
      <label>
        {label}
        <input
          type={type}
          value={draft[key]}
          disabled={busy || !loaded}
          autoComplete="off"
          {...(type === 'number' ? { min: 100, max: 300000, step: 1 } : {})}
          onChange={(event) => {
            setDraft({ ...draft, [key]: event.target.value });
            setMessage('dsh-live-voice.commons.connection.unsaved');
            setError('');
          }}
        />
      </label>
    );
  }
  return (
    <>
      <p>{settings.whisper.hostHelp()}</p>
      {field(commons.connection.endpoint(), 'url')}
      {field(commons.connection.healthEndpoint(), 'healthUrl')}
      {field(commons.connection.timeout(), 'timeoutMs', 'number')}
      <div className="dlv-settings-actions">
        <button type="button" disabled={busy || !loaded} onClick={() => run('save')}>
          {recognition.whisper.save()}
        </button>
        <button type="button" disabled={busy || !loaded} onClick={() => run('test')}>
          {commons.connection.test()}
        </button>
        <button type="button" disabled={busy} onClick={() => run('load')}>
          {commons.connection.reload()}
        </button>
      </div>
      {busy && <p role="status">{commons.connection.contactingHost()}</p>}
      {message && <p role="status">{translateStatus(message)}</p>}
      {error && <p role="alert">{translateStatus(error)}</p>}
    </>
  );
}
export function createWhisperSettings() {
  return WhisperSettings;
}
