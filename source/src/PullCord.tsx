import React, { useEffect, useRef } from 'react';

const THRESHOLD = 48;
const MAX_PULL = 112;
const LENGTH = 24;
export function PullCord({ lang, label, status, badge, onActivate }: {
  lang: 'zh' | 'en'; label: string; status: string; badge?: string; onActivate: () => void;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const line = useRef<HTMLSpanElement>(null);
  const grip = useRef<HTMLButtonElement>(null);
  const gesture = useRef<{ id: number; y: number; x: number; pull: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const animations = useRef<Animation[]>([]);
  const zh = lang === 'zh';

  useEffect(() => {
    return () => { animations.current.forEach(animation => animation.cancel()); };
  }, []);

  function finish(cancelled: boolean) {
    const drag = gesture.current;
    if (!drag) return;
    gesture.current = null;
    suppressClick.current = drag.moved || cancelled;
    frame.current!.dataset.pulling = 'false';
    frame.current!.dataset.ready = 'false';
    grip.current!.style.transform = '';
    line.current!.style.transform = '';
    if (!cancelled && drag.moved && drag.pull >= THRESHOLD) onActivate();
    if (drag.pull && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const timing = { duration: 620, easing: 'cubic-bezier(.22,1,.36,1)' };
      animations.current = [
        grip.current!.animate([
          { transform: `translateY(${drag.pull}px) rotate(0deg)` },
          { transform: 'translateY(-8px) rotate(-7deg)', offset: .48 },
          { transform: 'translateY(3px) rotate(4deg)', offset: .72 },
          { transform: 'translateY(0) rotate(0deg)' },
        ], timing),
        line.current!.animate([
          { transform: `scaleY(${1 + drag.pull / LENGTH})` },
          { transform: 'scaleY(.67)', offset: .48 },
          { transform: 'scaleY(1.125)', offset: .72 },
          { transform: 'scaleY(1)' },
        ], timing),
      ];
    }
  }
  const hint = zh
    ? `${status}。向下拉动后松手，或点击、按 Enter 或空格。${label}。`
    : `${status}. Pull down and release, click, or press Enter or Space. ${label}.`;
  return <div ref={frame} className="v20-cord" data-pulling="false" data-ready="false">
    <span className="v20-cord-anchor" aria-hidden="true" />
    <span ref={line} className="v20-cord-line" aria-hidden="true" />
    <button ref={grip} type="button" className="v20-cord-grip" data-testid="page-cord"
      aria-label={label} aria-describedby="page-cord-hint" title={hint}
      onPointerDown={event => {
        if (!event.isPrimary || event.button !== 0 || gesture.current) return;
        animations.current.forEach(animation => animation.cancel());
        animations.current = [];
        suppressClick.current = false;
        gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, pull: 0, moved: false };
        event.currentTarget.setPointerCapture(event.pointerId);
        frame.current!.dataset.pulling = 'true';
      }}
      onPointerMove={event => {
        const drag = gesture.current;
        if (!drag || drag.id !== event.pointerId) return;
        const delta = event.clientY - drag.y;
        drag.moved ||= Math.hypot(event.clientX - drag.x, delta) > 6;
        drag.pull = Math.max(0, Math.min(MAX_PULL, delta));
        grip.current!.style.transform = `translateY(${drag.pull}px)`;
        line.current!.style.transform = `scaleY(${1 + drag.pull / LENGTH})`;
        frame.current!.dataset.ready = String(drag.pull >= THRESHOLD);
      }}
      onPointerUp={event => { if (gesture.current?.id === event.pointerId) finish(false); }}
      onPointerCancel={() => finish(true)} onLostPointerCapture={() => finish(true)}
      onKeyDown={event => { if (event.key === 'Escape') finish(true); if (event.repeat && (event.key === ' ' || event.key === 'Enter')) event.preventDefault(); }}
      onClick={event => { if (suppressClick.current && event.detail !== 0) { suppressClick.current = false; return; } onActivate(); }}>
      <span className="v20-cord-capsule" aria-hidden="true"><span /></span>
    </button>
    {badge && <span className="v21-season-badge caption-3" aria-hidden="true">{badge}</span>}
    <span className="v20-cord-hint caption-5" aria-hidden="true">{zh ? '拉一下' : 'Pull'}</span>
    <span id="page-cord-hint" className="v20-sr-only">{hint}</span>
    <span className="v20-sr-only" role="status" aria-live="polite" aria-atomic="true">{status}</span>
  </div>;
}
