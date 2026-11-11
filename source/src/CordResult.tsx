import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import { CordPick } from './cord-picks';

type Result = { pick: CordPick; draw: number; route: string };
const TAGS: Record<string, [string, string]> = { playground: ['游乐场', 'Playground'], venue: ['亲子好去处', 'Family venue'], event: ['亲子活动', 'Family event'], category: ['服务分类', 'Service category'], tip: ['生活小锦囊', 'Everyday tip'] };
export function CordResult({ result, dismiss, lang }: { result: Result | null; dismiss: () => void; lang: 'zh' | 'en' }) {
  const ref = useRef<HTMLElement>(null);
  const dismissRef = useRef(dismiss); dismissRef.current = dismiss;
  const [position, setPosition] = useState({ right: 20, top: 140 });
  const zh = lang === 'zh';
  useEffect(() => {
    if (!result) return;
    const positionCard = () => { const rect = document.querySelector('[data-testid="page-cord"]')?.getBoundingClientRect(); if (rect) setPosition({ right: Math.max(16, innerWidth - rect.right), top: Math.max(16, Math.min(Math.max(innerWidth < 700 ? 142 : 116, rect.bottom + 42), innerHeight - 320)) }); };
    positionCard(); ref.current?.focus({ preventScroll: true });
    const close = (restore = true) => { if (restore && ref.current?.contains(document.activeElement)) document.querySelector<HTMLButtonElement>('[data-testid="page-cord"]')?.focus({ preventScroll: true }); dismissRef.current(); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); close(); } };
    const outside = (e: PointerEvent) => { const target = e.target as Element; if (!ref.current?.contains(target) && !target.closest('[data-testid="page-cord"]')) close(false); };
    document.addEventListener('keydown', key); document.addEventListener('pointerdown', outside); window.addEventListener('resize', positionCard);
    return () => { document.removeEventListener('keydown', key); document.removeEventListener('pointerdown', outside); window.removeEventListener('resize', positionCard); };
  }, [result?.draw]);
  if (!result) return null;
  const { pick, route, draw } = result;
  const close = () => { document.querySelector<HTMLButtonElement>('[data-testid="page-cord"]')?.focus({ preventScroll: true }); dismiss(); };
  const external = /^https?:/.test(pick.href);
  return <div className={'v22-result-shell v22-shell-' + route} style={{ ...position, '--v22-card-top': position.top + 'px' } as React.CSSProperties}><section key={draw} ref={ref} tabIndex={-1} role="region" aria-labelledby="cord-result-name" className={'v22-result v22-result-' + route} data-testid="cord-result" data-pick-id={pick.id}>
    <button className="v22-result-close" onClick={close} aria-label={zh ? '关闭小卡片' : 'Dismiss card'}><X aria-hidden="true" size={18} /></button>
    {route === 'services' && <div className="v22-phonebook" aria-hidden="true"><span>黄页</span><i /><i /><i /><small>LOCAL DIRECTORY</small></div>}
    {route === 'tools' && <div className="v22-toolbox" aria-hidden="true"><div className="v22-toolbox-lid" /><div className="v22-toolbox-base"><span>＋</span></div></div>}
    <p className="v22-draw-eyebrow">{route === 'kids' ? 'A LITTLE ADVENTURE' : route === 'services' ? (zh ? '这一页，刚好翻到' : 'OPENED TO THIS PAGE') : 'A LITTLE HELP FOR TODAY'}</p>
    <span className="v22-type-tag">{TAGS[pick.type]?.[zh ? 0 : 1]}</span>
    <h2 id="cord-result-name">{pick.name[lang]}</h2>
    <p className="v22-result-info">{pick.info[lang]}</p>
    <a className="v22-result-link" href={pick.href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined} onClick={() => {
      if (external) close(); else dismiss();
      if (pick.target) requestAnimationFrame(() => requestAnimationFrame(() => { const el = document.getElementById(pick.target!) || document.querySelector<HTMLElement>(`[data-place-id="${pick.target}"]`); el?.scrollIntoView({ block: 'center', behavior: 'instant' }); el?.setAttribute('tabindex', '-1'); el?.focus({ preventScroll: true }); }));
    }}>{zh ? (pick.type === 'playground' ? '地图 / 导航' : pick.type === 'category' ? '查看这个分类' : pick.type === 'tip' ? '打开工具' : '查看详情') : (pick.type === 'playground' ? 'Map / Directions' : pick.type === 'category' ? 'View category' : pick.type === 'tip' ? 'Open tool' : 'View details')}<ArrowUpRight size={16} aria-hidden="true" /></a>
  </section></div>;
}
