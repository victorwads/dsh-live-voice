// @ts-nocheck
const BASE = '/api/dsh-live-voice/qwen';
const UNLOADED =
  'Qwen settings routes are not loaded. A normal DSH server restart is required to load updated plugin routes; refreshing this page alone is not enough.';
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
    throw new Error('Sign in to DSH to manage Qwen settings.');
  if (response.status === 404 || response.status === 405) throw new Error(UNLOADED);
  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error(UNLOADED);
  }
  if (typeof body?.ok !== 'boolean') throw new Error(UNLOADED);
  if (!response.ok || !body.ok)
    throw new Error(body.error?.message || 'Qwen settings request failed.');
  return body.value;
}
export function createQwenSettings(React) {
  const h = React.createElement;
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
            setMessage('Saved on the DSH host. Active Qwen requests were cancelled.');
            await controller.refreshCapabilities?.();
          }
        } else {
          const value = await qwenSettingsRequest('/test', {
            method: 'POST',
            config: { ...draft, timeoutMs: Number(draft.timeoutMs) },
            signal: abort.signal,
          });
          if (!abort.signal.aborted) {
            if (!value.supported) throw new Error(value.reason || 'Qwen health check failed.');
            setMessage(
              'Connection successful. Both Qwen ASR and TTS are loaded. Unsaved edits have not been applied.',
            );
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
            setMessage('Unsaved changes');
            setError('');
          },
        }),
      );
    return h(
      React.Fragment,
      null,
      h(
        'p',
        null,
        'Host-wide settings for the Qwen3 ASR + TTS server. Enter any HTTP or HTTPS base URL reachable from the DSH host. The browser accesses it through authenticated DSH routes.',
      ),
      field('Qwen API base URL', 'baseUrl'),
      field('Request timeout (ms)', 'timeoutMs', 'number'),
      h(
        'div',
        { className: 'dlv-settings-actions' },
        h(
          'button',
          { type: 'button', disabled: busy || !loaded, onClick: () => run('save') },
          'Save Qwen settings',
        ),
        h(
          'button',
          { type: 'button', disabled: busy || !loaded, onClick: () => run('test') },
          'Test Qwen server',
        ),
        h(
          'button',
          { type: 'button', disabled: busy, onClick: () => run('load') },
          'Reload saved settings',
        ),
      ),
      busy ? h('p', { role: 'status' }, 'Contacting DSH host…') : null,
      message ? h('p', { role: 'status' }, message) : null,
      error ? h('p', { role: 'alert' }, error) : null,
    );
  };
}
