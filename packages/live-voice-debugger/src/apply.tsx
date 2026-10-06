import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { DebuggerPanel } from './DebuggerPanel.js';
import { dictionaries, namespace, type DebuggerCopy } from './locales.js';
import { styles } from './styles.js';
import { publishDeveloperExtension } from '../../live-voice/src/modules/core/developerExtension.js';
export const inject = ['locale'];
export function apply(ctx: any) {
  let enabled = false;
  let blocked = false;
  let popup: Window | null = null;
  let root: Root | null = null;
  let closedTimer: ReturnType<typeof setInterval> | null = null;
  const listeners = new Set<() => void>();
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };
  const notify = () => {
    for (const listener of listeners) listener();
  };
  for (const [locale, dictionary] of Object.entries(dictionaries)) {
    ctx.effect(() => ctx.locale.register(namespace, locale, dictionary), namespace + ': ' + locale);
  }
  const t = ctx.locale.bind(namespace);
  const copy = (): DebuggerCopy =>
    Object.fromEntries(Object.keys(dictionaries.en).map((key) => [key, t(key)])) as DebuggerCopy;
  const localeSubscribe = (listener: () => void) => ctx.locale.subscribe(listener);
  const localeSnapshot = () => ctx.locale.getSnapshot();
  const close = () => {
    if (closedTimer !== null) clearInterval(closedTimer);
    closedTimer = null;
    const oldRoot = root;
    const oldPopup = popup;
    root = null;
    popup = null;
    enabled = false;
    oldRoot?.unmount();
    if (oldPopup && !oldPopup.closed) oldPopup.close();
    notify();
  };
  function Host() {
    React.useSyncExternalStore(localeSubscribe, localeSnapshot);
    const labels = copy();
    React.useEffect(() => {
      if (popup && !popup.closed) popup.document.title = labels.title;
    }, [labels.title]);
    return <DebuggerPanel copy={labels} target={window} onClose={() => queueMicrotask(close)} />;
  }
  // Open synchronously inside the user's click so browsers preserve popup permission.
  const open = () => {
    if (popup && !popup.closed) {
      popup.focus();
      return;
    }
    close();
    blocked = false;
    let candidate: Window | null = null;
    try {
      candidate = window.open(
        '',
        '',
        'popup=yes,width=720,height=850,resizable=yes,scrollbars=yes',
      );
      if (!candidate) {
        blocked = true;
        notify();
        return;
      }
      popup = candidate;
      const doc = candidate.document;
      doc.title = copy().title;
      doc.body.replaceChildren();
      doc.body.className = 'dlvd-window';
      const style = doc.createElement('style');
      style.textContent = styles;
      doc.head.appendChild(style);
      const container = doc.createElement('div');
      container.dataset.plugin = namespace;
      doc.body.appendChild(container);
      root = createRoot(container);
      root.render(<Host />);
      enabled = true;
      closedTimer = setInterval(() => {
        if (popup?.closed) close();
      }, 250);
      notify();
    } catch {
      close();
      if (candidate && !candidate.closed) candidate.close();
      blocked = true;
      notify();
    }
  };
  function Settings() {
    const active = React.useSyncExternalStore(subscribe, () => enabled);
    const failed = React.useSyncExternalStore(subscribe, () => blocked);
    React.useSyncExternalStore(localeSubscribe, localeSnapshot);
    const labels = copy();
    return (
      <section>
        <h2>{labels.title}</h2>
        <p>{labels.help}</p>
        <label>
          <input
            type="checkbox"
            checked={active}
            onChange={(event) => (event.target.checked ? open() : close())}
          />
          {labels.activate}
        </label>
        {failed && <p role="alert">{labels.popupBlocked}</p>}
      </section>
    );
  }
  ctx.effect(
    () =>
      publishDeveloperExtension(window, {
        version: 1,
        label: () => t('developer'),
        component: Settings,
      }),
    namespace + ': Developer tab',
  );
  ctx.effect(() => {
    window.addEventListener('pagehide', close);
    return () => {
      window.removeEventListener('pagehide', close);
      close();
      listeners.clear();
    };
  }, namespace + ': separate window');
}
