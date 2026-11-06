import React, { useRef, useEffect } from 'react';
export function BlurText({ text, className = '', delay = 0 }: { text: string; className?: string; delay?: number }) {
  let index = 0;
  return (
    <span className={`sb-blur-text ${className}`}>
      <span className="sr-only">{text}</span>
      {text.split(/(\s+)/).filter(Boolean).map((word, wi) => (
        <span className="sb-blur-word" aria-hidden="true" key={wi}>
          {Array.from(word).map(char => (
            <span key={index} className="sb-blur-char" style={{ animationDelay: `${delay + index++ * 40}ms` }}>
              {char === ' ' ? '\u00a0' : char}
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}

export function Reveal({ children, id, className = '' }: { children: React.ReactNode; id?: string; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || !('IntersectionObserver' in window)) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motion.matches) return;
    const show = () => { element.classList.remove('is-pending'); element.classList.add('is-visible'); };
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { show(); observer.disconnect(); }
    }, { threshold: 0, rootMargin: '0px 0px -32px 0px' });
    element.classList.add('is-pending');
    observer.observe(element);
    const onMotion = () => { if (motion.matches) { show(); observer.disconnect(); } };
    const onFocus = () => { show(); observer.disconnect(); };
    motion.addEventListener('change', onMotion);
    element.addEventListener('focusin', onFocus);
    return () => { observer.disconnect(); motion.removeEventListener('change', onMotion); element.removeEventListener('focusin', onFocus); };
  }, []);
  return <section id={id} ref={ref} className={`sb-reveal ${className}`}>{children}</section>;
}

export function HeroMedia() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    const update = () => {
      frame = 0;
      const element = ref.current;
      if (!element) return;
      const height = element.parentElement?.offsetHeight || window.innerHeight;
      element.style.transform = motion.matches ? '' : `translate3d(0, ${Math.min(window.scrollY, height) * 0.12}px, 0)`;
    };
    const onScroll = () => { if (!frame && !motion.matches) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    motion.addEventListener('change', update);
    return () => { window.removeEventListener('scroll', onScroll); motion.removeEventListener('change', update); cancelAnimationFrame(frame); };
  }, []);
  return <div ref={ref} className="sb-hero-media" aria-hidden="true"><img src="./photos/hero-train.webp" alt="" fetchPriority="high" decoding="async" /></div>;
}

