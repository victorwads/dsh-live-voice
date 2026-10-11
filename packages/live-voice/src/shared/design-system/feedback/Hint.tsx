import React from 'react';

/** Non-interactive help in the top layer, clear of scrolling panel boundaries. */
export function Hint({
  label,
  children,
  id: suppliedId,
}: React.PropsWithChildren<{ label: string; id?: string }>) {
  const generatedId = React.useId();
  const id = suppliedId || generatedId;
  const [open, setOpen] = React.useState(false);
  const trigger = React.useRef<HTMLButtonElement>(null);
  const bubble = React.useRef<HTMLSpanElement>(null);
  const hovered = React.useRef(false);
  const focused = React.useRef(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const cancel = () => clearTimeout(timer.current);
  const closeLater = () => {
    cancel();
    timer.current = setTimeout(() => {
      if (!hovered.current && !focused.current) setOpen(false);
    }, 120);
  };
  React.useEffect(() => () => clearTimeout(timer.current), []);
  React.useLayoutEffect(() => {
    const node = bubble.current;
    if (!open || !node || !trigger.current) return;
    node.showPopover?.();
    const position = () => {
      const anchor = trigger.current!.getBoundingClientRect();
      const rect = node.getBoundingClientRect();
      node.style.left =
        Math.max(12, Math.min(anchor.left, window.innerWidth - rect.width - 12)) + 'px';
      const below = anchor.bottom + 8;
      node.style.top =
        Math.max(
          12,
          below + rect.height <= window.innerHeight - 12 ? below : anchor.top - rect.height - 8,
        ) + 'px';
    };
    position();
    const dismiss = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
      }
    };
    const outside = (e: PointerEvent) => {
      if (!node.contains(e.target as Node) && !trigger.current?.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener('keydown', dismiss, true);
    document.addEventListener('pointerdown', outside, true);
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    return () => {
      node.hidePopover?.();
      document.removeEventListener('keydown', dismiss, true);
      document.removeEventListener('pointerdown', outside, true);
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', position, true);
    };
  }, [open]);
  return (
    <span
      className="dlv-hint"
      onMouseEnter={() => {
        hovered.current = true;
        cancel();
        setOpen(true);
      }}
      onMouseLeave={() => {
        hovered.current = false;
        closeLater();
      }}
    >
      <button
        ref={trigger}
        type="button"
        className="dlv-hint-trigger"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onFocus={() => {
          focused.current = true;
          cancel();
          setOpen(true);
        }}
        onBlur={() => {
          focused.current = false;
          closeLater();
        }}
        onClick={() => setOpen(true)}
      >
        ?
      </button>
      <span
        ref={bubble}
        id={id}
        role="tooltip"
        popover="manual"
        hidden={!open}
        className="dlv-hint-bubble"
      >
        {children}
      </span>
    </span>
  );
}
