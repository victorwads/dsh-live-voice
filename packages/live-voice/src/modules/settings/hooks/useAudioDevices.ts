import React from 'react';
export function useAudioDevices() {
  const [audioDevices, setAudioDevices] = React.useState<MediaDeviceInfo[]>([]);
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
  return audioDevices;
}
export function createDeviceOptions(
  devices: readonly MediaDeviceInfo[],
  kind: MediaDeviceKind,
  systemDefault: string,
  fallback: string,
) {
  return [
    { value: '', label: systemDefault },
    ...devices
      .filter((device) => device.kind === kind && device.deviceId && device.deviceId !== 'default')
      .map((device, index) => ({
        value: device.deviceId,
        label: device.label || `${fallback} ${index + 1}`,
      })),
  ];
}
