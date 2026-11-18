import { href } from './site-routes.mjs';
import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Pause, Play } from 'lucide-react';
import { BilingualTitle } from './BilingualTitle';
import { SUPERMARKETS, ROUTES } from './local-data';
import PLAYGROUNDS from './playgrounds.json';
import { guideStats } from './home-guide-data';

type T = (zh: string, en: string) => string;
type ServiceCategories = Record<string, string[][]>;

export function GuideStats({ t, categories }: { t: T; categories: ServiceCategories }) {
  const root = useRef<HTMLDivElement>(null);
  const total = Object.values(categories).flat().length;
  useEffect(() => {
    const elements = root.current?.querySelectorAll<HTMLElement>('[data-count]');
    if (!elements || !('IntersectionObserver' in window)) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    if (motion.matches) return;
    let frame = 0;
    const finish = () => { cancelAnimationFrame(frame); elements.forEach(el => { el.textContent = el.dataset.count!; }); };
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - start) / 1100, 1);
        elements.forEach(el => { el.textContent = String(Math.round(Number(el.dataset.count) * (1 - (1 - progress) ** 3))); });
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, { threshold: 0.25 });
    observer.observe(root.current!);
    const onMotion = () => { if (motion.matches) { observer.disconnect(); finish(); } };
    motion.addEventListener('change', onMotion);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); motion.removeEventListener('change', onMotion); };
  }, [total]);
  return <section className="v23-stat-section" aria-label={t('指南收录概览', 'Inside the guide')}><div className="sb-container">
    <div className="v23-stat-heading"><BilingualTitle as="h2" zh="从这里，认识本地" en="A local starting point" t={t} /><span>{t('来自本站收录资料', 'From the records in this guide')}</span></div>
    <div className="v23-stats" ref={root}>{guideStats(total).map(stat => <a key={stat.id} href={stat.href} className="v23-stat" data-stat={stat.id}>
      <span className="v23-stat-number"><span aria-hidden="true" data-count={stat.count}>{stat.count}</span><span className="sr-only">{stat.count}</span><ArrowUpRight aria-hidden="true" /></span>
      <strong>{t(stat.label.zh, stat.label.en)}</strong><span className="v23-stat-note">{t(stat.note.zh, stat.note.en)}</span>
    </a>)}</div>
  </div></section>;
}

export function GuideMarquee({ t }: { t: T }) {
  const [paused, setPaused] = useState(false);
  const links = [
    ...SUPERMARKETS.slice(0, 2).map(item => ({ name: t(item.zhName + ' · ' + item.suburb, item.name), href: '/living/grocers/?q=' + encodeURIComponent(item.suburb) })),
    { name: t(PLAYGROUNDS[0].zh, PLAYGROUNDS[0].name), href: '/kids/map/' },
    { name: t('派对与场地', 'Parties & venues'), href: '/kids/parties/' },
    { name: t('周末集市', 'Weekend markets'), href: '/whatson/markets/' },
    { name: t('垃圾分类与收运', 'Rubbish & recycling'), href: '/tools/bins/' },
    { name: t('急诊诊所查询', 'Urgent care'), href: '/tools/urgent/' },
  ];
  return <nav className={'v23-marquee' + (paused ? ' is-paused' : '')} aria-label={t('本地生活快捷入口', 'Local life shortcuts')}>
    <div className="sb-container v23-marquee-inner"><span className="v23-marquee-label">{t('在你身边', 'CLOSE BY')}</span><div className="v23-marquee-window"><div className="v23-marquee-track">
      <div className="v23-marquee-group">{links.map(link => <a key={link.href + link.name} href={link.href}><span aria-hidden="true">✦</span>{link.name}<ArrowUpRight aria-hidden="true" /></a>)}</div>
      <div className="v23-marquee-group v23-marquee-copy" aria-hidden="true">{links.map(link => <span key={link.href + link.name}><span>✦</span>{link.name}<ArrowUpRight /></span>)}</div>
    </div></div><button type="button" className="v23-pause" aria-pressed={paused} aria-label={t(paused ? '继续滚动快捷入口' : '暂停滚动快捷入口', paused ? 'Resume scrolling shortcuts' : 'Pause scrolling shortcuts')} onClick={() => setPaused(value => !value)}>{paused ? <Play /> : <Pause />}</button></div>
  </nav>;
}

