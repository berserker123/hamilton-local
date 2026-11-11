import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ArrowRight, Search, MapPin, Calendar, Pause, Play, Check, Store, Trees, Wrench, ShieldCheck } from 'lucide-react';
import { Reveal } from './Motion';
import { SUPERMARKETS, ROUTES } from './local-data';
import PLAYGROUNDS from './playgrounds.json';
import TEASERS from './teaser-images.json';
import { guideStats, PREVIEW_PICKS } from './home-guide-data';

type T = (zh: string, en: string) => string;
type ServiceCategories = Record<string, string[][]>;
const GUIDE_SECTIONS = [
  { id: 'living', zh: '本地生活', en: 'Local Living', Icon: Store, href: '#/living?tab=grocers', caption: { zh: '从附近的亚超开始。', en: 'Start with the weekly shop.' } },
  { id: 'weekend', zh: '周末活动', en: "What's On", Icon: Calendar, href: '#/weekend?tab=picks', caption: { zh: '给周末，留一点期待。', en: 'Make room for the weekend.' } },
  { id: 'kids', zh: '亲子遛娃', en: 'Kids & Family', Icon: Trees, href: '#/kids?tab=map', caption: { zh: '下一站，去游乐场。', en: 'A little adventure, close by.' } },
  { id: 'services', zh: '便民黄页', en: 'Local Services', Icon: Wrench, href: '#/services?tab=home', caption: { zh: '家里家外，按需查找。', en: 'Find the right kind of help.' } },
  { id: 'tools', zh: '实用工具箱', en: 'Daily Essentials', Icon: ShieldCheck, href: '#/tools?tab=transport', caption: { zh: '先看看，哪路公交经过。', en: 'Find your way around town.' } },
] as const;

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
    <div className="v23-stat-heading"><span className="ia-kicker">{t('从这里，认识本地', 'A LOCAL STARTING POINT')}</span><span>{t('来自本站收录资料', 'From the records in this guide')}</span></div>
    <div className="v23-stats" ref={root}>{guideStats(total).map(stat => <a key={stat.id} href={stat.href} className="v23-stat" data-stat={stat.id}>
      <span className="v23-stat-number"><span aria-hidden="true" data-count={stat.count}>{stat.count}</span><span className="sr-only">{stat.count}</span><ArrowUpRight aria-hidden="true" /></span>
      <strong>{t(stat.label.zh, stat.label.en)}</strong><span className="v23-stat-note">{t(stat.note.zh, stat.note.en)}</span>
    </a>)}</div>
  </div></section>;
}

export function GuideMarquee({ t }: { t: T }) {
  const [paused, setPaused] = useState(false);
  const links = [
    ...SUPERMARKETS.slice(0, 2).map(item => ({ name: t(item.zhName + ' · ' + item.suburb, item.name), href: '#/living?tab=grocers&q=' + encodeURIComponent(item.suburb) })),
    { name: t(PLAYGROUNDS[0].zh, PLAYGROUNDS[0].name), href: '#/kids?tab=map' },
    { name: t('派对与场地', 'Parties & venues'), href: '#/kids?tab=parties' },
    { name: t('周末集市', 'Weekend markets'), href: '#/weekend?tab=markets' },
    { name: t('垃圾清运', 'Bin days'), href: '#/tools?tab=bins' },
    { name: t('急诊诊所查询', 'Urgent care'), href: '#/tools?tab=urgent' },
  ];
  return <nav className={'v23-marquee' + (paused ? ' is-paused' : '')} aria-label={t('本地生活快捷入口', 'Local life shortcuts')}>
    <div className="sb-container v23-marquee-inner"><span className="v23-marquee-label">{t('在你身边', 'CLOSE BY')}</span><div className="v23-marquee-window"><div className="v23-marquee-track">
      <div className="v23-marquee-group">{links.map(link => <a key={link.href + link.name} href={link.href}><span aria-hidden="true">✦</span>{link.name}<ArrowUpRight aria-hidden="true" /></a>)}</div>
      <div className="v23-marquee-group v23-marquee-copy" aria-hidden="true">{links.map(link => <span key={link.href + link.name}><span>✦</span>{link.name}<ArrowUpRight /></span>)}</div>
    </div></div><button type="button" className="v23-pause" aria-pressed={paused} aria-label={t(paused ? '继续滚动快捷入口' : '暂停滚动快捷入口', paused ? 'Resume scrolling shortcuts' : 'Pause scrolling shortcuts')} onClick={() => setPaused(value => !value)}>{paused ? <Play /> : <Pause />}</button></div>
  </nav>;
}

export function GuidePreview({ t, categories }: { t: T; categories: ServiceCategories }) {
  const [selected, setSelected] = useState(0);
  const section = GUIDE_SECTIONS[selected];
  const rows = section.id === 'living' ? SUPERMARKETS.filter(item => ['newsave-tristram', 'wellmart', 'garden-fresh'].includes(item.id)).map(item => ({ id: item.id, title: t(item.zhName, item.name), detail: item.suburb }))
    : section.id === 'weekend' ? PREVIEW_PICKS.map(item => ({ id: item.id, title: t(item.title_zh, item.title_en), detail: `${item.dates.map(date => date.slice(5).replace('-', '/')).join(' · ')} · ${item.town}` }))
    : section.id === 'kids' ? PLAYGROUNDS.slice(0, 3).map(item => ({ id: item.id, title: t(item.zh, item.name), detail: item.area }))
    : section.id === 'services' ? categories.home.map(([zh, en], i) => ({ id: String(i), title: t(zh, en), detail: t('内容整理中 · 暂无商家', 'Coming soon · No listings yet') }))
    : ROUTES.slice(0, 3).map(item => ({ id: item.n, title: `${item.n} · ${item.name}`, detail: t('公交线路 · 查看交通信息', 'Bus route · View transport information') }));
  return <Reveal className="v23-discover"><div className="sb-container">
    <div className="v23-section-heading"><div><p className="ia-kicker">{t('五个入口，一份本地指南', 'FIVE SECTIONS. ONE LOCAL GUIDE.')}</p><h2>{t('先看看，再出发。', 'A little look. Then head out.')}</h2></div><p>{t('点选一个版块，看看里面有什么。', 'Pick a section. See what’s inside.')}</p></div>
    <div className="v23-feature"><div className="v23-feature-tabs" role="tablist" aria-label={t('指南版块预览', 'Guide section previews')} onKeyDown={event => {
      const next = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? (selected + 1) % 5 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? (selected + 4) % 5 : event.key === 'Home' ? 0 : event.key === 'End' ? 4 : -1;
      if (next < 0) return; event.preventDefault(); setSelected(next); document.getElementById('guide-tab-' + GUIDE_SECTIONS[next].id)?.focus();
    }}>{GUIDE_SECTIONS.map((item, i) => <button key={item.id} id={'guide-tab-' + item.id} type="button" role="tab" aria-selected={selected === i} aria-controls="guide-preview" tabIndex={selected === i ? 0 : -1} onClick={() => setSelected(i)}><span className="v23-tab-index">0{i + 1}</span><item.Icon aria-hidden="true" /><span>{t(item.zh, item.en)}<small>{t(item.en, item.zh)}</small></span><ArrowUpRight className="v23-tab-arrow" aria-hidden="true" /></button>)}</div>
      <div className="v23-preview-shell"><div className="v23-browser-bar" aria-hidden="true"><span className="v23-dots"><i /><i /><i /></span><span>Hamilton Local / {section.en}</span><span className="v23-preview-label">{t('收录预览', 'GUIDE PREVIEW')}</span></div>
        <div id="guide-preview" role="tabpanel" tabIndex={0} aria-labelledby={'guide-tab-' + section.id}><div key={section.id} className="v23-preview-content">
          <div className="v23-preview-photo"><img src={'./' + TEASERS.lockedMix[section.id]} alt="" loading="lazy" /><div><span className="ia-kicker">HAMILTON & WAIKATO</span><h3>{t(section.caption.zh, section.caption.en)}</h3></div></div>
          <div className="v23-preview-records">{rows.map(row => <a key={row.id} href={section.href} data-preview-record={row.id}><span className="v23-record-icon"><section.Icon aria-hidden="true" /></span><span><strong>{row.title}</strong><small>{row.detail}</small></span><ArrowUpRight aria-hidden="true" /></a>)}</div>
          <a className="v23-preview-open" href={section.href}>{t('进入', 'Explore')} {t(section.zh, section.en)}<ArrowRight aria-hidden="true" /></a>
        </div></div>
      </div>
    </div>
  </div></Reveal>;
}

export function GuideSteps({ t }: { t: T }) {
  return <Reveal className="v23-how"><div className="sb-container"><div className="v23-section-heading"><div><p className="ia-kicker">{t('第一次来？从这里开始', 'YOUR FIRST VISIT')}</p><h2>{t('找信息，三步就好。', 'Find your way in three steps.')}</h2></div><p>{t('少一点摸索，多一点生活。', 'Less searching. More living.')}</p></div>
    <ol className="v23-steps sb-stagger">
      <li><span className="v23-step-number">01</span><Search aria-hidden="true" /><h3>{t('搜你需要的', 'Start with a search')}</h3><p>{t('输入门店、地点或区域，找到相关入口。', 'Search a grocer, place or suburb to find the right section.')}</p><button type="button" onClick={() => document.querySelector<HTMLInputElement>('.ia-hero-search input')?.focus()}>{t('开始搜索', 'Start searching')}<ArrowUpRight aria-hidden="true" /></button></li>
      <li><span className="v23-step-number">02</span><MapPin aria-hidden="true" /><h3>{t('选适合自己的', 'Find your kind of local')}</h3><p>{t('按区域、设施或类别筛选，看看地址与详情。', 'Filter by area, facilities or category. Check addresses and details.')}</p><a href="#/kids?tab=map">{t('看看游乐场地图', 'Explore the playground map')}<ArrowUpRight aria-hidden="true" /></a></li>
      <li><span className="v23-step-number">03</span><Check aria-hidden="true" /><h3>{t('核对好，再出发', 'Check before you go')}</h3><p>{t('打开条目中的来源，核对时间、费用与最新安排。', 'Open each record’s sources to confirm hours, costs and current details.')}</p><a href="#/weekend?tab=picks">{t('看看本周精选与来源', 'See weekly picks & sources')}<ArrowUpRight aria-hidden="true" /></a></li>
    </ol>
  </div></Reveal>;
}
