// @ts-nocheck
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
export function createQwenSettings(React, translate = (value) => value) {
  const t = translate;
  const h = (type, props, ...children) =>
    React.createElement(
      type,
      props,
      ...children.map((value) =>
        typeof value === 'string' && value.startsWith('dsh-live-voice.') ? t(value) : value,
      ),
    );
  return function QwenSettings({ controller }) {
    const [draft, setDraft] = React.useState({
      baseUrl: 'http://127.0.0.1:8080/',
      timeoutMs: 300000,
    });
    const [busy, setBusy] = React.useState(true),
      [loaded, setLoaded] = React.useState(false),
      [error, setError] = React.useState(''),
      [message, setMessage] = React.useState('');
    const active = React.useRef(null);
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
    const field = (label, key, type = 'text') =>
      h(
        'label',
        null,
        label,
        h('input', {
          type,
          value: draft[key],
          disabled: busy || !loaded,
          autoComplete: 'off',
          ...(type === 'number' ? { min: 1000, max: 600000, step: 1 } : {}),
          onChange: (event) => {
            setDraft({ ...draft, [key]: event.target.value });
            setMessage('dsh-live-voice.commons.connection.unsaved');
            setError('');
          },
        }),
      );
    return h(
      React.Fragment,
      null,
      h('p', null, 'dsh-live-voice.recognition.qwen.hostHelp'),
      field('dsh-live-voice.speak.qwen.endpoint', 'baseUrl'),
      field('dsh-live-voice.commons.connection.timeout', 'timeoutMs', 'number'),
      h(
        'div',
        { className: 'dlv-settings-actions' },
        h(
          'button',
          { type: 'button', disabled: busy || !loaded, onClick: () => run('save') },
          'dsh-live-voice.speak.qwen.save',
        ),
        h(
          'button',
          { type: 'button', disabled: busy || !loaded, onClick: () => run('test') },
          'dsh-live-voice.speak.qwen.test',
        ),
        h(
          'button',
          { type: 'button', disabled: busy, onClick: () => run('load') },
          'dsh-live-voice.commons.connection.reload',
        ),
      ),
      busy ? h('p', { role: 'status' }, 'dsh-live-voice.commons.connection.contactingHost') : null,
      message ? h('p', { role: 'status' }, message) : null,
      error ? h('p', { role: 'alert' }, error) : null,
    );
  };
}
