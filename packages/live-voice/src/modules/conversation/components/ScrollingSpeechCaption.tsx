import React from 'react';

/** Visual approximation only: no word-level timing is available. */
export function ScrollingSpeechCaption({
  text,
  label,
  controller,
  segment,
  paused,
  loading,
}: {
  text: string;
  label: string;
  controller: any;
  segment: number;
  paused: boolean;
  loading: boolean;
}) {
  const viewport = React.useRef<HTMLDivElement>(null);
  const line = React.useRef<HTMLSpanElement>(null);
  const marker = React.useRef<HTMLSpanElement>(null);
  const current = React.useRef({ paused, loading });
  current.current = { paused, loading };
  React.useEffect(() => {
    const box = viewport.current;
    const content = line.current;
    const band = marker.current;
    if (!box || !content || !band) return;
    const host = box.ownerDocument.defaultView!;
    let width = box.clientWidth;
    let textWidth = content.scrollWidth;
    let fraction = 0;
    let previousTime = 0;
    let frame = 0;
    box.scrollLeft = 0;
    band.style.transform = 'translateX(0px)';
    const measure = () => {
      width = box.clientWidth;
      textWidth = content.scrollWidth;
    };
    const observer =
      typeof host.ResizeObserver === 'function' ? new host.ResizeObserver(measure) : null;
    observer?.observe(box);
    observer?.observe(content);
    const reduced = host.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const tick = (time: number) => {
      const delta = Math.min(100, previousTime ? time - previousTime : 16);
      previousTime = time;
      const state = current.current;
      if (!state.paused && !state.loading) {
        const progress = controller.getSpeechProgress?.();
        if (
          progress &&
          Number.isFinite(progress.durationSeconds) &&
          progress.durationSeconds > 0 &&
          Number.isFinite(progress.positionSeconds)
        ) {
          const target = Math.max(
            0,
            Math.min(1, progress.positionSeconds / progress.durationSeconds),
          );
          fraction = reduced
            ? target
            : fraction + (target - fraction) * (1 - Math.exp(-delta / 90));
        }
      }
      const bandWidth = Math.min(90, width, textWidth);
      const position = fraction * Math.max(0, textWidth - bandWidth);
      const scroll = Math.max(
        0,
        Math.min(Math.max(0, textWidth - width), position - (width - bandWidth) / 2),
      );
      box.scrollLeft = scroll;
      band.style.width = bandWidth + 'px';
      band.style.transform = 'translateX(' + Math.max(0, position - box.scrollLeft) + 'px)';
      band.style.opacity = state.loading ? '0' : '1';
      frame = host.requestAnimationFrame(tick);
    };
    frame = host.requestAnimationFrame(tick);
    return () => {
      host.cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [controller, text, segment]);
  return (
    <div className="dlv-caption-stage">
      <div
        ref={viewport}
        className="dlv-caption dlv-caption-scroll"
        title={text}
        aria-label={label}
      >
        <span ref={line} className="dlv-caption-line">
          {text}
        </span>
      </div>
      <span ref={marker} className="dlv-caption-marker" aria-hidden="true" />
    </div>
  );
}
