// @ts-nocheck
import React from 'react';
import { useLanguage } from '../../../app/client/i18n/index.js';

const BASE = '/api/dsh-live-voice/qwen';
const UNLOADED = 'dsh-live-voice.speak.qwen.restartRequired';

export async function qwenSettingsRequest(
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
    throw new Error('dsh-live-voice.speak.qwen.signInRequired');
  if (response.status === 404 || response.status === 405) throw new Error(UNLOADED);
  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error(UNLOADED);
  }
  if (typeof body?.ok !== 'boolean') throw new Error(UNLOADED);
  if (!response.ok || !body.ok)
    throw new Error(body.error?.message || 'dsh-live-voice.speak.qwen.requestFailed');
  return body.value;
}

export function QwenSettings({ controller }) {
  const { scoped: commons } = useLanguage((ctx) => ctx.commons);
  const { scoped: recognition } = useLanguage((ctx) => ctx.recognition);
  const { scoped: speak } = useLanguage((ctx) => ctx.speak);
  const [draft, setDraft] = React.useState({
    baseUrl: 'http://127.0.0.1:8080/',
    timeoutMs: 300000,
  });
  const [busy, setBusy] = React.useState(true);
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');
  const active = React.useRef(null);
  const translateStatus = (value) =>
    ({
      'dsh-live-voice.commons.connection.unsaved': commons.connection.unsaved(),
      'dsh-live-voice.speak.qwen.saved': speak.qwen.saved(),
      'dsh-live-voice.recognition.qwen.connectionSuccess': recognition.qwen.connectionSuccess(),
      'dsh-live-voice.speak.qwen.restartRequired': speak.qwen.restartRequired(),
      'dsh-live-voice.speak.qwen.signInRequired': speak.qwen.signInRequired(),
      'dsh-live-voice.speak.qwen.requestFailed': speak.qwen.requestFailed(),
      'dsh-live-voice.speak.qwen.healthFailed': speak.qwen.healthFailed(),
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
        const value = await qwenSettingsRequest('/config', { signal: abort.signal });
        if (!abort.signal.aborted) {
          setDraft(value);
          setLoaded(true);
        }
      } else if (action === 'save') {
        await controller.endConversation?.();
        const value = await qwenSettingsRequest('/config', {
          method: 'PUT',
          config: { ...draft, timeoutMs: Number(draft.timeoutMs) },
          signal: abort.signal,
        });
        if (!abort.signal.aborted) {
          setDraft(value);
          setMessage('dsh-live-voice.speak.qwen.saved');
          await controller.refreshCapabilities?.();
        }
      } else {
        const value = await qwenSettingsRequest('/test', {
          method: 'POST',
          config: { ...draft, timeoutMs: Number(draft.timeoutMs) },
          signal: abort.signal,
        });
        if (!abort.signal.aborted) {
          if (!value.supported)
            throw new Error(value.reason || 'dsh-live-voice.speak.qwen.healthFailed');
          setMessage('dsh-live-voice.recognition.qwen.connectionSuccess');
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
  const field = (label, key, type = 'text') => (
    <label>
      {label}
      <input
        type={type}
        value={draft[key]}
        disabled={busy || !loaded}
        autoComplete="off"
        {...(type === 'number' ? { min: 1000, max: 600000, step: 1 } : {})}
        onChange={(event) => {
          setDraft({ ...draft, [key]: event.target.value });
          setMessage('dsh-live-voice.commons.connection.unsaved');
          setError('');
        }}
      />
    </label>
  );
  return (
    <>
      <p>{recognition.qwen.hostHelp()}</p>
      {field(speak.qwen.endpoint(), 'baseUrl')}
      {field(commons.connection.timeout(), 'timeoutMs', 'number')}
      <div className="dlv-settings-actions">
        <button type="button" disabled={busy || !loaded} onClick={() => run('save')}>
          {speak.qwen.save()}
        </button>
        <button type="button" disabled={busy || !loaded} onClick={() => run('test')}>
          {speak.qwen.test()}
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
export function createQwenSettings() {
  return QwenSettings;
}
