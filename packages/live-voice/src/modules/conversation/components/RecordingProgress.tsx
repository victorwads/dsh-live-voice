import React from 'react';
import { useLanguage } from '../../../app/client/i18n/index.js';
import { RECORDING_KEY } from '../../recording/types.js';
import type { RecordingService, RecordingSession } from '../../recording/types.js';
/** Content-free saved frontier, visible without installing the optional debugger. */
export function RecordingProgress({ controller }: { controller: any }) {
  const { scoped: copy } = useLanguage((ctx) => ctx.recording);
  const [session, setSession] = React.useState<RecordingSession | null>(null);
  React.useEffect(() => {
    const service = (window as any)[RECORDING_KEY] as RecordingService | undefined;
    if (!service) return;
    let alive = true;
    let revision = 0;
    const update = () => {
      const request = ++revision;
      const id = controller.recognition?.session?.writer?.session.id ?? controller.recordingId?.();
      if (!id) {
        if (alive) setSession(null);
        return;
      }
      void service
        .get(id)
        .then((value) => {
          if (alive && request === revision) setSession(value);
        })
        .catch(() => {
          if (alive && request === revision) setSession(null);
        });
    };
    update();
    const unsubscribe = service.subscribe(update);
    const timer = setInterval(update, 1000);
    return () => {
      alive = false;
      unsubscribe();
      clearInterval(timer);
    };
  }, [controller]);
  if (!session || session.storage !== 'indexeddb') return null;
  const seconds = Math.floor(session.savedSamples / session.sampleRate);
  const time = Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
  return (
    <span className="dlv-status" title={(copy as any).status.saved({ time })}>
      ● {(copy as any).status.saved({ time })}
    </span>
  );
}
