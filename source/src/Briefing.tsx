import React, { useState } from 'react';
import DATA from './data/briefing.json';
import { BilingualTitle } from './BilingualTitle';
import { CATEGORY_LABELS, HOME_LIMIT, BriefingData, BriefingItem, formatUpdated, itemText, arrangeItems, itemTime, interestScore } from './briefing-model';

type T = (zh: string, en: string) => string;
export type BriefingVariant = 'a' | 'b' | 'c' | 'd';
/** Owner picked layout D (magazine cards) on 2026-11-17; ?bv= still overrides for previews. */
export const DEFAULT_VARIANT: BriefingVariant = 'd';

/** `?bv=a|b|c|d` selects a preview layout; anything else keeps the current layout. */
export function parseVariant(search: string): BriefingVariant | undefined {
  const v = new URLSearchParams(search).get('bv');
  return v === 'a' || v === 'b' || v === 'c' || v === 'd' ? v : undefined;
}
const CIVIC_CATS = ['breaking', 'police', 'council', 'weather', 'civil_defence'];
const isCivic = (i: BriefingItem) => !!i.urgent || CIVIC_CATS.includes(i.category) || interestScore(i) >= 55;

export function BriefingView({ data, t, now, variant }: { data: BriefingData; t: T; now?: number; variant?: BriefingVariant }) {
  const [open, setOpen] = useState(false);
  const [roadsOpen, setRoadsOpen] = useState(false);
  const { cards: items, roadworks } = arrangeItems(data.items || []);
  if (!items.length && !roadworks.length) return null;
  const limit = variant === 'c' || variant === 'd' ? 8 : variant === 'b' ? 8 : HOME_LIMIT;
  const shown = open ? items : items.slice(0, limit);
  const updated = formatUpdated(data.generated_at);
  const lang = (i: BriefingItem) => (i.summary_zh ? 'zh-CN' : 'en-NZ');
  const cls = (i: BriefingItem, extra = '') => 'hl-brief-item' + (i.urgent ? ' is-urgent' : '') + extra;
  const link = (i: BriefingItem) => <a href={i.url} target="_blank" rel="noopener noreferrer">原文 ↗</a>;
  const pill = (i: BriefingItem) => <span className="hl-brief-pill hl-brief-cat">{CATEGORY_LABELS[i.category]}</span>;
  const foot = (i: BriefingItem) => <div className="hl-brief-foot"><span>{i.source}</span><span>{itemTime(i, now)}</span>{link(i)}</div>;
  const li = (i: BriefingItem, extra: string) => <li key={i.id} className={cls(i, extra)}>{pill(i)}<p lang={lang(i)}>{itemText(i)}</p>{foot(i)}</li>;

  let body: React.ReactNode;
  if (variant === 'a') {
    const [lead, ...rest] = shown;
    body = <>
      <article className={cls(lead, ' hl-brief-lead')}>{pill(lead)}<p lang={lang(lead)}>{itemText(lead)}</p>{foot(lead)}</article>
      {rest.length > 0 && <ul className="hl-brief-list">{rest.map(i => li(i, ' hl-brief-row'))}</ul>}
    </>;
  } else if (variant === 'b') {
    const cap = (xs: BriefingItem[]) => (open ? xs : xs.slice(0, limit / 2));
    const civic = cap(items.filter(isCivic)), life = cap(items.filter(i => !isCivic(i)));
    body = <div className="hl-brief-cols">
      {civic.length > 0 && <section className="hl-brief-col" aria-label="紧急与市政"><h3 className="hl-brief-colhead">紧急 · 市政</h3><ul className="hl-brief-list">{civic.map(i => li(i, ' hl-brief-row'))}</ul></section>}
      {life.length > 0 && <section className="hl-brief-col" aria-label="生活与新闻"><h3 className="hl-brief-colhead">生活 · 新闻</h3><ul className="hl-brief-list">{life.map(i => li(i, ' hl-brief-row'))}</ul></section>}
    </div>;
  } else if (variant === 'c') {
    body = <ul className="hl-brief-list">{shown.map(i => <li key={i.id} className={cls(i, ' hl-brief-tick')}>
      {pill(i)}<p lang={lang(i)}>{itemText(i)}</p>
      <span className="hl-brief-time">{itemTime(i, now)}</span><span className="hl-brief-src">{i.source}</span>{link(i)}
    </li>)}</ul>;
  } else if (variant === 'd') {
    const urgent = shown.filter(i => i.urgent), rest = shown.filter(i => !i.urgent);
    body = <>
      {urgent.length > 0 && <ul className="hl-brief-banners">{urgent.map(i => li(i, ' hl-brief-banner'))}</ul>}
      {rest.length > 0 && <ul className="hl-brief-list">{rest.map(i => li(i, ' hl-brief-tile hl-brief-c-' + i.category))}</ul>}
    </>;
  } else {
    body = <ul className="hl-brief-list">{shown.map(i => <li key={i.id} className={'hl-brief-item' + (i.urgent ? ' is-urgent' : '')}>
      <span className="hl-brief-pill hl-brief-cat">{CATEGORY_LABELS[i.category]}</span>
      <p lang={i.summary_zh ? 'zh-CN' : 'en-NZ'}>{itemText(i)}</p>
      <div className="hl-brief-foot"><span>{i.source}</span><span>{itemTime(i, now)}</span><a href={i.url} target="_blank" rel="noopener noreferrer">原文 ↗</a></div>
    </li>)}</ul>;
  }

  return <section className={'sb-container hl-brief' + (variant ? ' hl-brief--' + variant : '')} aria-label="汉密尔顿每日快讯" data-testid="briefing">
    <div className="hl-brief-card">
      <div className="hl-brief-head">
        <div className="hl-brief-title"><BilingualTitle as="h2" zh="汉密尔顿每日快讯" en="Hamilton Daily Briefing" t={t} /></div>
        <div className="hl-brief-meta">{data.sample && <span className="hl-brief-pill hl-brief-sample">示例数据</span>}{updated && <span>更新于 {updated}</span>}</div>
      </div>
      {body}
      {roadworks.length > 0 && <div className="hl-brief-roads">
        <button type="button" className="hl-brief-roads-btn" aria-expanded={roadsOpen} onClick={() => setRoadsOpen(!roadsOpen)}><span className="hl-brief-pill hl-brief-cat">路况</span><span>今天 {roadworks.length} 处施工或管制</span><span aria-hidden="true">{roadsOpen ? '▴' : '▾'}</span></button>
        {roadsOpen && <ul className="hl-brief-roads-list">{roadworks.map(i => <li key={i.id}><span lang={lang(i)}>{itemText(i)}</span> {link(i)}</li>)}</ul>}
      </div>}
      {items.length > limit && <button type="button" className="hl-brief-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? '收起' : `查看全部 ${items.length} 条`}</button>}
    </div>
    <p className="hl-brief-note">摘要仅供参考，详情请以原文为准。</p>
  </section>;
}
export function Briefing({ t }: { t: T }) {
  const variant = typeof window === 'undefined' ? DEFAULT_VARIANT : parseVariant(window.location.search) ?? DEFAULT_VARIANT;
  return <BriefingView data={DATA as BriefingData} t={t} variant={variant} />;
}
