import React, { useRef, useEffect, useState } from 'react';
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

type HeroMode = 'window' | 'a' | 'b';
const TRAIN = './photos/hero-train.webp';
// Only additional scenic imagery with an existing workspace credit record.
const SCENIC_SLIDES = [TRAIN, './photos/hamilton-lake.webp'];

function readHeroMode(): HeroMode {
  const hashQuery = location.hash.indexOf('?');
  const hash = new URLSearchParams(hashQuery < 0 ? '' : location.hash.slice(hashQuery + 1)).get('hero');
  const page = new URLSearchParams(location.search).get('hero');
  const valid = (value: string | null): value is HeroMode => value === 'window' || value === 'a' || value === 'b';
  return valid(hash) ? hash : valid(page) ? page : 'window';
}

// Only clean interior crops move. The original photo's baked window never travels.
function TrainWindow({ reduced = false }: { reduced?: boolean }) {
  return <div className="sb-hero-media sb-hero-media-window" data-hero={reduced ? 'static' : 'window'} aria-hidden="true">
    <div className="sb-window-view">
      {reduced ? <img className="sb-window-static" src={TRAIN} alt="" fetchPriority="high" decoding="async" /> : <>
        <div className="sb-window-track sb-window-distant">
          {[0, 1].map(i => <img key={i} src="./photos/hero-window-scenery.webp" alt="" fetchPriority="high" decoding="async" />)}
        </div>
        <div className="sb-window-ground">
          <div className="sb-window-track sb-window-near">
            {[0, 1].map(i => <img key={i} src="./photos/hero-window-ground.webp" alt="" decoding="async" />)}
          </div>
        </div>
      </>}
    </div>
    <div className="sb-window-rim" />
    <div className="sb-window-sill" />
  </div>;
}

function ScenicSlideshow() {
  const ref = useRef<HTMLDivElement>(null);
  const [slides, setSlides] = useState(SCENIC_SLIDES);
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(0);
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    const images = Array.from(ref.current?.querySelectorAll('img') || []);
    // Keep the train fully visible until every upcoming slide has decoded.
    Promise.allSettled(images.map(image => image.decode())).then(results => {
      if (cancelled) return;
      const decoded = SCENIC_SLIDES.filter((_, i) => i === 0 || results[i]?.status === 'fulfilled');
      setSlides(decoded);
      setReady(true);
      if (decoded.length > 1) timer = setInterval(() => setStep(value => value + 1), 8000);
    });
    return () => { cancelled = true; clearInterval(timer); };
  }, []);
  const current = step % slides.length;
  const previous = (step - 1 + slides.length) % slides.length;
  return <div ref={ref} className="sb-hero-media sb-hero-media-b" data-hero="b" data-ready={ready} aria-hidden="true">
    {slides.map((src, i) => <img key={src} src={src} alt="" loading="eager" fetchPriority={i === 0 ? 'high' : 'low'} decoding="async"
      className={i === current ? `is-current${step === 0 ? ' is-initial' : ''}` : step > 0 && i === previous ? 'is-previous' : ''} />)}
  </div>;
}

export function HeroMedia() {
  const [mode, setMode] = useState(readHeroMode);
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMotion = () => setReduced(motion.matches);
    const onLocation = () => setMode(readHeroMode());
    motion.addEventListener('change', onMotion);
    window.addEventListener('hashchange', onLocation);
    window.addEventListener('popstate', onLocation);
    return () => {
      motion.removeEventListener('change', onMotion);
      window.removeEventListener('hashchange', onLocation);
      window.removeEventListener('popstate', onLocation);
    };
  }, []);
  if (reduced || mode === 'window') return <TrainWindow reduced={reduced} />;
  if (mode === 'b') return <ScenicSlideshow />;
  return <div className="sb-hero-media sb-hero-media-a" data-hero="a" aria-hidden="true">
    <img src={TRAIN} alt="" fetchPriority="high" decoding="async" />
  </div>;
}

