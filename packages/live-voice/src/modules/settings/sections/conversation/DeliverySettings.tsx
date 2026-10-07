import React from 'react';
import { autoSendDelayOptions } from '../../../core/settings.js';
import { useLanguage } from '../../../../app/client/i18n/index.js';
import { SelectField } from '../../../../shared/design-system/index.js';
export function DeliverySettings({
  settings,
  updateSettings,
}: {
  settings: any;
  updateSettings(value: any): void;
}) {
  const { scoped } = useLanguage((ctx) => ctx.settings);
  const mode = settings.sendingMode || 'manual';
  const { scoped: commons } = useLanguage((ctx) => ctx.commons);
  const busyEnterHelpId = React.useId();
  return (
    <>
      <SelectField
        label={(scoped as any).delivery.label()}
        value={mode}
        options={[
          { value: 'manual', label: (scoped as any).delivery.manualLabel() },
          { value: 'queue', label: (scoped as any).delivery.queueLabel() },
          { value: 'steer', label: (scoped as any).delivery.steerLabel() },
        ]}
        onChange={(event) => updateSettings({ sendingMode: event.target.value })}
      />
      <SelectField
        label={(scoped as any).delivery.dshEnterQuestion()}
        aria-describedby={busyEnterHelpId}
        value={settings.dshBusyEnterBehavior || 'queue'}
        options={[
          { value: 'steer', label: (scoped as any).delivery.dshEnterSteer() },
          { value: 'queue', label: (scoped as any).delivery.dshEnterQueue() },
        ]}
        onChange={(event) => updateSettings({ dshBusyEnterBehavior: event.target.value })}
      />
      <p id={busyEnterHelpId} className="dlv-setting-description">
        {(scoped as any).delivery.dshEnterHelp()}
      </p>
      {mode !== 'manual' ? (
        <SelectField
          label={(scoped as any).autoSend.delay()}
          value={String(settings.autoSendDelaySeconds || 4)}
          options={autoSendDelayOptions.map((value) => ({
            value: String(value),
            label:
              value < 1
                ? (commons as any).milliseconds({ milliseconds: value * 1000 })
                : value === 1
                  ? (commons as any).second()
                  : (commons as any).seconds({ seconds: value }),
          }))}
          onChange={(event) => updateSettings({ autoSendDelaySeconds: Number(event.target.value) })}
        />
      ) : (
        <p className="dlv-setting-description">{(scoped as any).delivery.manualLabel()}</p>
      )}
    </>
  );
}
