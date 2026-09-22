import React from 'react';

export type WaveformProps = { controller: any; enabled: boolean };
export function Waveform({ controller, enabled }: WaveformProps) {
  const ref = React.useRef<HTMLCanvasElement>(null);
  React.useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    let frame = 0,
      width = 1,
      height = 40,
      ratio = 1;
    let disposed = false;
    const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    function resize() {
      const bounds = canvas.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height || 40);
      ratio = Math.max(1, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
    }
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
    observer?.observe(canvas);
    window.addEventListener('resize', resize);
    resize();
    function draw(time: number) {
      if (disposed) return;
      if (ratio !== Math.max(1, window.devicePixelRatio || 1)) resize();
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      const raw = Number(controller.meter?.level?.() ?? 0);
      const level = enabled && Number.isFinite(raw) ? Math.min(1, Math.max(0, raw)) : 0;
      const color = getComputedStyle(canvas).color;
      for (let layer = 0; layer < 3; layer += 1) {
        context.beginPath();
        context.strokeStyle = layer === 1 ? '#38bdf8' : color;
        context.globalAlpha = 0.4 + layer * 0.25;
        context.lineWidth = layer === 2 ? 2 : 1;
        const phase = motion?.matches ? 0 : time / (500 + layer * 170);
        for (let x = 0; x <= width; x += 2) {
          const envelope = Math.sin((Math.PI * x) / width);
          const y =
            height / 2 +
            Math.sin((x / width) * Math.PI * (4 + layer * 2) + phase) *
              envelope *
              level *
              height *
              (0.43 - layer * 0.08);
          if (x === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.stroke();
      }
      context.globalAlpha = 1;
      frame = window.requestAnimationFrame(draw);
    }
    frame = window.requestAnimationFrame(draw);
    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, [controller, enabled]);
  return <canvas ref={ref} className="dlv-wave" aria-hidden />;
}
