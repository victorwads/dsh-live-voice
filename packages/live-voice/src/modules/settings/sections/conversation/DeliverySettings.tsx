import React from 'react';
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
  const seconds = [2, 3, 4, 5, 6, 8, 10];
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
          options={seconds.map((value) => ({ value: String(value), label: String(value) }))}
          onChange={(event) => updateSettings({ autoSendDelaySeconds: Number(event.target.value) })}
        />
      ) : (
        <p className="dlv-setting-description">{(scoped as any).delivery.manualLabel()}</p>
      )}
    </>
  );
}
