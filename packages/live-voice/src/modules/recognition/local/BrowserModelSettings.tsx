import React from 'react';
import { useLanguage } from '../../../app/client/i18n/index.js';
import {
  SelectField,
  SettingsSubcard,
  Hint,
  StatusMessage,
} from '../../../shared/design-system/index.js';
import { browserAsrModels } from './modelCatalog.js';
import { defaultSettings } from '../../core/settings.js';
import type { LocalModelManager, LocalModelSnapshot } from './LocalModelManager.js';
const size = (bytes: number) =>
  bytes >= 1e9 ? (bytes / 1e9).toFixed(2) + ' GB' : (bytes / 1e6).toFixed(0) + ' MB';
export function BrowserModelSettings({ controller, settings, updateSettings }: any) {
  const { scoped: recognition } = useLanguage((ctx) => ctx.recognition);
  const copy = (recognition as any).local;
  const manager: LocalModelManager | undefined = controller.localModels;
  const empty = React.useMemo<LocalModelSnapshot>(
    () => ({ models: {}, gpu: 'unavailable', storage: false, busy: false }),
    [],
  );
  const state = React.useSyncExternalStore(
    manager?.subscribe ?? (() => () => {}),
    manager?.getSnapshot ?? (() => empty),
  );
  const [confirm, setConfirm] = React.useState<'download' | 'remove' | null>(null);
  const [error, setError] = React.useState('');
  const family = settings.recognitionEngine === 'qwen-browser' ? 'qwen' : 'whisper';
  const models = browserAsrModels.filter((model) => model.family === family);
  const setting = family === 'qwen' ? 'browserQwenModel' : 'browserWhisperModel';
  const selected =
    models.find((model) => model.key === (settings[setting] ?? defaultSettings[setting])) ??
    models.find((model) => model.key === defaultSettings[setting]) ??
    models[0];
  const modelState = (state.models as any)[selected.key] ?? {
    phase: 'absent',
    loaded: 0,
    total: selected.bytes,
  };
  const device =
    selected.devices.length === 1 ? selected.devices[0] : (settings.browserAsrDevice ?? 'webgpu');
  React.useEffect(() => {
    setConfirm(null);
    setError('');
  }, [selected.key, device]);
  React.useEffect(() => {
    void manager?.refresh();
  }, [manager]);
  const action = (run: () => Promise<unknown>) => {
    setError('');
    void run().catch((error) =>
      setError(
        copy.error[((error as any).code ?? 'failed').replaceAll('-', '_')]?.() ??
          copy.error.failed(),
      ),
    );
  };
  const downloading = modelState.phase === 'downloading',
    loading = modelState.phase === 'loading';
  const exists = ['downloaded', 'ready'].includes(modelState.phase) || modelState.cached === true;
  const unsupported =
    !manager ||
    !state.storage ||
    (device === 'webgpu' && state.gpu === 'unavailable') ||
    ('requiresF16' in selected && selected.requiresF16 && !state.shaderF16);
  const progress = Math.max(
    0,
    Math.min(100, Math.floor((modelState.loaded / selected.bytes) * 100)),
  );
  return (
    <SettingsSubcard title={copy.title()} icon="settings" open>
      <SelectField
        label={copy.model()}
        value={selected.key}
        options={models.map((model) => ({
          value: model.key,
          label:
            model.name +
            (model.key === 'whisper-small' ? ' (' + copy.recommended() + ')' : '') +
            ' · ' +
            size(model.bytes),
        }))}
        disabled={downloading || loading || state.busy}
        onChange={(event) => updateSettings({ [setting]: event.target.value })}
      />
      <SelectField
        label={copy.device()}
        value={device}
        options={
          selected.devices.length === 1
            ? [{ value: 'webgpu', label: 'WebGPU' }]
            : [
                { value: 'webgpu', label: 'WebGPU' },
                { value: 'wasm', label: 'WebAssembly (CPU)' },
              ]
        }
        disabled={downloading || loading || state.busy}
        hint={copy.deviceHelp()}
        onChange={(event) => updateSettings({ browserAsrDevice: event.target.value })}
      />
      <div className="dlv-model-info">
        <span>{size(selected.bytes)}</span> ·{' '}
        <a
          href={'https://huggingface.co/' + selected.repository + '/tree/' + selected.revision}
          target="_blank"
          rel="noreferrer"
        >
          {copy.modelCard()}
        </a>{' '}
        · <span>{selected.license}</span>
        <Hint label={copy.help()}>{copy.privacy() + ' ' + copy.storageHelp()}</Hint>
      </div>
      {state.availableBytes !== undefined && (
        <StatusMessage>{copy.space({ size: size(state.availableBytes) })}</StatusMessage>
      )}
      {unsupported && (
        <StatusMessage>
          {!state.storage
            ? copy.error.storage_unavailable()
            : 'requiresF16' in selected && selected.requiresF16 && !state.shaderF16
              ? copy.error.f16_unavailable()
              : copy.error.gpu_unavailable()}
        </StatusMessage>
      )}
      <div role="status" aria-live="polite">
        {copy.phase[modelState.phase]?.() ?? copy.phase.absent()}
      </div>
      {(downloading || loading) && (
        <progress
          aria-label={copy.progress()}
          value={downloading ? progress : undefined}
          max={100}
        />
      )}
      {downloading && (
        <span>
          {progress}% · {size(modelState.loaded)} / {size(selected.bytes)}
        </span>
      )}
      <div className="dlv-settings-actions">
        {!exists && !downloading && !loading && (
          <button
            type="button"
            disabled={unsupported || state.busy}
            onClick={() => setConfirm('download')}
          >
            {copy.download()}
          </button>
        )}
        {(downloading || loading) && (
          <button type="button" onClick={() => manager?.cancel(selected.key)}>
            {copy.cancel()}
          </button>
        )}
        {exists && (
          <button
            type="button"
            disabled={
              unsupported ||
              loading ||
              state.busy ||
              (modelState.phase === 'ready' && modelState.device === device)
            }
            onClick={() => action(() => manager!.prepare(selected.key, device))}
          >
            {modelState.phase === 'ready' && modelState.device === device
              ? copy.phase.ready()
              : copy.load()}
          </button>
        )}
        {(exists || modelState.loaded > 0) && (
          <button
            type="button"
            disabled={state.busy || loading || downloading}
            onClick={() => setConfirm('remove')}
          >
            {copy.remove()}
          </button>
        )}
      </div>
      {confirm && (
        <div role="group" aria-label={copy.confirmTitle()} className="dlv-model-confirm">
          <span>
            {confirm === 'download'
              ? copy.confirmDownload({ model: selected.name, size: size(selected.bytes) })
              : copy.confirmRemove({ model: selected.name })}
          </span>
          <div className="dlv-settings-actions">
            <button
              type="button"
              onClick={() => {
                setConfirm(null);
                action(() =>
                  confirm === 'download'
                    ? manager!.download(selected.key)
                    : manager!.remove(selected.key),
                );
              }}
            >
              {copy.confirm()}
            </button>
            <button type="button" onClick={() => setConfirm(null)}>
              {copy.cancel()}
            </button>
          </div>
        </div>
      )}
      {(error || modelState.error) && (
        <div role="alert">
          {error ||
            copy.error[(modelState.error ?? 'failed').replaceAll('-', '_')]?.() ||
            copy.error.failed()}
        </div>
      )}
    </SettingsSubcard>
  );
}
