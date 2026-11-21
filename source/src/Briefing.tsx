import React, { useEffect, useState } from 'react';
import DATA from './data/briefing.json';
import { BilingualTitle } from './BilingualTitle';
import { newsHref } from './site-routes.mjs';
import {
  HOME_LIMIT, NEWS_LATEST_LIMIT, newsLayout, BriefingData, BriefingItem, BriefingLang,
  categoryLabel, formatBriefingDate, formatUpdated, isStaleBriefing, itemLang, itemText,
  arrangeItems, itemTime, interestScore, itemDisplay } from './briefing-model';

type T = (zh: string, en: string) => string;
export type BriefingVariant = 'a' | 'b' | 'c' | 'd' | 'e';
/** Layout E (news front page) is the default since 2026-11-18; ?bv=a|b|c|d still override for previews. */
export const DEFAULT_VARIANT: BriefingVariant = 'e';

/** `?bv=a|b|c|d|e` selects a preview layout; anything else keeps the current layout. */
export function parseVariant(search: string): BriefingVariant | undefined {
  const v = new URLSearchParams(search).get('bv');
  return v === 'a' || v === 'b' || v === 'c' || v === 'd' || v === 'e' ? v : undefined;
}
const CIVIC_CATS = ['breaking', 'police', 'council', 'weather', 'civil_defence'];
const isCivic = (i: BriefingItem) => !!i.urgent || CIVIC_CATS.includes(i.category) || interestScore(i) >= 55;

function useViewNow(fixedNow?: number): number {
  const [tick, setTick] = useState<number>(() => fixedNow ?? Date.now());
  useEffect(() => {
    if (fixedNow !== undefined) { setTick(fixedNow); return; }
    setTick(Date.now());
    const timer = window.setInterval(() => setTick(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, [fixedNow]);
  return fixedNow !== undefined ? fixedNow : tick;
}

function StaleNotice({ generatedAt, now, uiLang, t }: { generatedAt: string; now: number; uiLang: BriefingLang; t: T }) {
  if (!isStaleBriefing(generatedAt, now)) return null;
  const updated = formatUpdated(generatedAt, uiLang);
  return <p className="hl-brief-stale" role="status" data-testid="briefing-stale">
    {t(
      updated ? `快讯暂未更新，最近更新于 ${updated}` : '快讯暂未更新',
      updated ? `Briefing not recently updated · Last updated ${updated}` : 'Briefing not recently updated',
    )}
  </p>;
}

export function BriefingView({ data, t, now, variant }: { data: BriefingData; t: T; now?: number; variant?: BriefingVariant }) {
  const [open, setOpen] = useState(false);
  const [roadsOpen, setRoadsOpen] = useState(false);
  const viewNow = useViewNow(now);
  const uiLang: BriefingLang = t('中', 'en') === 'en' ? 'en' : 'zh';
  const { cards: items, roadworks } = arrangeItems(data.items || [], viewNow);
  if (!items.length && !roadworks.length) return null;
  if (variant === 'e') return <NewsFront data={data} t={t} now={viewNow} uiLang={uiLang} />;
  const limit = variant === 'c' || variant === 'd' ? 8 : variant === 'b' ? 8 : HOME_LIMIT;
  const shown = open ? items : items.slice(0, limit);
  const updated = formatUpdated(data.generated_at, uiLang);
  const lang = (i: BriefingItem) => itemLang(i, uiLang);
  const cls = (i: BriefingItem, extra = '') => 'hl-brief-item' + (i.urgent ? ' is-urgent' : '') + extra;
  const link = (i: BriefingItem) => <a href={i.url} target="_blank" rel="noopener noreferrer">{t('原文 ↗', 'Source ↗')}</a>;
  const pill = (i: BriefingItem) => <span className="hl-brief-pill hl-brief-cat">{categoryLabel(i.category, uiLang)}</span>;
  const foot = (i: BriefingItem) => <div className="hl-brief-foot"><span>{i.source}</span><span>{itemTime(i, viewNow, uiLang)}</span>{link(i)}</div>;
  const li = (i: BriefingItem, extra: string) => <li key={i.id} className={cls(i, extra)}>{pill(i)}<p lang={lang(i)}>{itemText(i, uiLang)}</p>{foot(i)}</li>;

  let body: React.ReactNode;
  if (variant === 'a') {
    const [lead, ...rest] = shown;
    body = <>
      <article className={cls(lead, ' hl-brief-lead')}>{pill(lead)}<p lang={lang(lead)}>{itemText(lead, uiLang)}</p>{foot(lead)}</article>
      {rest.length > 0 && <ul className="hl-brief-list">{rest.map(i => li(i, ' hl-brief-row'))}</ul>}
    </>;
  } else if (variant === 'b') {
    const cap = (xs: BriefingItem[]) => (open ? xs : xs.slice(0, limit / 2));
    const civic = cap(items.filter(isCivic)), life = cap(items.filter(i => !isCivic(i)));
    body = <div className="hl-brief-cols">
      {civic.length > 0 && <section className="hl-brief-col" aria-label={t('紧急与市政', 'Urgent & Civic')}><h3 className="hl-brief-colhead">{t('紧急 · 市政', 'Urgent · Civic')}</h3><ul className="hl-brief-list">{civic.map(i => li(i, ' hl-brief-row'))}</ul></section>}
      {life.length > 0 && <section className="hl-brief-col" aria-label={t('生活与新闻', 'Life & News')}><h3 className="hl-brief-colhead">{t('生活 · 新闻', 'Life · News')}</h3><ul className="hl-brief-list">{life.map(i => li(i, ' hl-brief-row'))}</ul></section>}
    </div>;
  } else if (variant === 'c') {
    body = <ul className="hl-brief-list">{shown.map(i => <li key={i.id} className={cls(i, ' hl-brief-tick')}>
      {pill(i)}<p lang={lang(i)}>{itemText(i, uiLang)}</p>
      <span className="hl-brief-time">{itemTime(i, viewNow, uiLang)}</span><span className="hl-brief-src">{i.source}</span>{link(i)}
    </li>)}</ul>;
  } else if (variant === 'd') {
    const urgent = shown.filter(i => i.urgent), rest = shown.filter(i => !i.urgent);
    body = <>
      {urgent.length > 0 && <ul className="hl-brief-banners">{urgent.map(i => li(i, ' hl-brief-banner'))}</ul>}
      {rest.length > 0 && <ul className="hl-brief-list">{rest.map(i => li(i, ' hl-brief-tile hl-brief-c-' + i.category))}</ul>}
    </>;
  } else {
    body = <ul className="hl-brief-list">{shown.map(i => <li key={i.id} className={'hl-brief-item' + (i.urgent ? ' is-urgent' : '')}>
      {pill(i)}
      <p lang={lang(i)}>{itemText(i, uiLang)}</p>
      <div className="hl-brief-foot"><span>{i.source}</span><span>{itemTime(i, viewNow, uiLang)}</span>{link(i)}</div>
    </li>)}</ul>;
  }

  return <section className={'sb-container hl-brief' + (variant ? ' hl-brief--' + variant : '')} aria-label={t('汉密尔顿每日快讯', 'Hamilton Daily Briefing')} data-testid="briefing">
    <div className="hl-brief-card">
      <div className="hl-brief-head">
        <div className="hl-brief-title"><BilingualTitle as="h2" zh="汉密尔顿每日快讯" en="Hamilton Daily Briefing" t={t} /></div>
        <div className="hl-brief-meta">{data.sample && <span className="hl-brief-pill hl-brief-sample">{t('示例数据', 'Sample data')}</span>}{updated && <span>{t('更新于 ', 'Updated ')}{updated}</span>}</div>
      </div>
      <StaleNotice generatedAt={data.generated_at} now={viewNow} uiLang={uiLang} t={t} />
      {body}
      {roadworks.length > 0 && <div className="hl-brief-roads">
        <button type="button" className="hl-brief-roads-btn" aria-expanded={roadsOpen} onClick={() => setRoadsOpen(!roadsOpen)}><span className="hl-brief-pill hl-brief-cat">{categoryLabel('roads', uiLang)}</span><span>{t(`今天 ${roadworks.length} 处施工或管制`, `${roadworks.length} roadworks or traffic controls today`)}</span><span aria-hidden="true">{roadsOpen ? '▴' : '▾'}</span></button>
        {roadsOpen && <ul className="hl-brief-roads-list">{roadworks.map(i => <li key={i.id}><span lang={lang(i)}>{itemText(i, uiLang)}</span> {link(i)}</li>)}</ul>}
      </div>}
      {items.length > limit && <button type="button" className="hl-brief-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? t('收起', 'Show less') : t(`查看全部 ${items.length} 条`, `View all ${items.length}`)}</button>}
    </div>
    <p className="hl-brief-note">{t('摘要仅供参考，详情请以原文为准。', 'Summaries for quick reference only; see original sources for full details.')}</p>
  </section>;
}
export function Briefing({ t }: { t: T }) {
  const variant = typeof window === 'undefined' ? DEFAULT_VARIANT : parseVariant(window.location.search) ?? DEFAULT_VARIANT;
  return <BriefingView data={DATA as BriefingData} t={t} variant={variant} />;
}

/** Variant e: news front page. Hierarchy by position and type size, no images. */
function NewsFront({ data, t, now, uiLang }: { data: BriefingData; t: T; now: number; uiLang: BriefingLang }) {
  const [roadsOpen, setRoadsOpen] = useState(false);
  const { alerts, lead, secondary, latest, roadworks } = newsLayout(data.items || [], now);
  const updated = formatUpdated(data.generated_at, uiLang);
  const total = alerts.length + (lead ? 1 : 0) + secondary.length + latest.length + roadworks.length;
  const lang = (i: BriefingItem) => itemLang(i, uiLang);
  const link = (i: BriefingItem, label = t('原文 ↗', 'Source ↗')) => <a href={i.url} target="_blank" rel="noopener noreferrer">{label}</a>;
  const more = (i: BriefingItem) => <a className="hl-brief-more" href={newsHref(i.id)}>{t('更多', 'More')}</a>;
  const kicker = (i: BriefingItem) => <span className={'hl-brief-e-kicker hl-brief-c-' + i.category}>{categoryLabel(i.category, uiLang)}</span>;
  const meta = (i: BriefingItem, label?: string) => {
    const timeLabel = itemTime(i, now, uiLang);
    return <div className="hl-brief-e-meta"><span>{i.source}</span>{timeLabel && <span>{timeLabel}</span>}{link(i, label)}{i.also_url ? <a href={i.also_url} target="_blank" rel="noopener noreferrer">{(i.also_source || t('另一来源', 'Also')) + ' ↗'}</a> : null}{more(i)}</div>;
  };
  const blurb = (i: BriefingItem) => {
    const teaser = itemDisplay(i, uiLang).teaser;
    if (!teaser) return null;
    const textLang = uiLang === 'en' && i.summary?.trim() ? 'en-NZ' : lang(i);
    return <p className="hl-brief-e-en hl-brief-e-summary" lang={textLang}>{teaser}</p>;
  };
  const shownLatest = latest.slice(0, NEWS_LATEST_LIMIT);
  const today = formatBriefingDate(data.generated_at, uiLang);
  return <section className="sb-container hl-brief hl-brief--e" aria-label={t('汉密尔顿每日快讯', 'Hamilton Daily Briefing')} data-testid="briefing">
    <div className="hl-brief-card hl-brief-e-card">
      <header className="hl-brief-e-mast">
        <div>
          <h2 className="hl-brief-e-title" lang={uiLang === 'en' ? 'en-NZ' : 'zh-CN'}>{t('汉密尔顿每日快讯', 'Hamilton Daily Briefing')}</h2>
          <p className="hl-brief-e-sub" lang={uiLang === 'en' ? 'en-NZ' : 'en-NZ'}>{uiLang === 'en' ? 'Hamilton & Waikato' : 'Hamilton Daily Briefing'}</p>
        </div>
        <div className="hl-brief-meta">
          {data.sample && <span className="hl-brief-pill hl-brief-sample">{t('示例数据', 'Sample data')}</span>}
          {today && <span>{today}</span>}
          {updated && <span>{t('更新于 ', 'Updated ')}{updated}</span>}
          <span>{t(`共 ${total} 条`, `${total} items`)}</span>
          <a href={newsHref()}>{t('全部新闻', 'All news')}</a>
        </div>
      </header>
      <StaleNotice generatedAt={data.generated_at} now={now} uiLang={uiLang} t={t} />
      {alerts.length > 0 && <ul className="hl-brief-e-alerts">{alerts.map(i => <li key={i.id} className="hl-brief-e-alert is-urgent">
        <span className="hl-brief-e-alertlabel">{t('提醒', 'Alert')} · {categoryLabel(i.category, uiLang)}</span>
        <p lang={lang(i)}>{itemDisplay(i, uiLang).title}</p>{blurb(i)}{meta(i)}
      </li>)}</ul>}
      <div className="hl-brief-e-grid">
        <div className="hl-brief-e-main">
          {lead && <article className="hl-brief-e-lead">
            <div className="hl-brief-e-flag"><span className="hl-brief-e-tag">{t('头条', 'Lead')}</span>{kicker(lead)}</div>
            <h3 lang={lang(lead)}>{itemDisplay(lead, uiLang).title}</h3>{blurb(lead)}{meta(lead, t('阅读原文 ↗', 'Read source ↗'))}
          </article>}
          {secondary.length > 0 && <div className="hl-brief-e-second">{secondary.map(i => <article key={i.id} className="hl-brief-e-story">
            {kicker(i)}<h3 lang={lang(i)}>{itemDisplay(i, uiLang).title}</h3>{blurb(i)}{meta(i)}
          </article>)}</div>}
        </div>
        {latest.length > 0 && <aside className="hl-brief-e-side" aria-label={t('更多新闻', 'More news')}>
          <h3 className="hl-brief-e-sidehead">{t('更多新闻', 'More news')}</h3>
          <ol className="hl-brief-e-latest">{shownLatest.map(i => {
            const timeLabel = itemTime(i, now, uiLang);
            return <li key={i.id} className={timeLabel ? undefined : 'no-time'}>
              {timeLabel && <span className="hl-brief-e-time">{timeLabel}</span>}
              <div>{kicker(i)}<p lang={lang(i)}>{itemDisplay(i, uiLang).title}</p>{blurb(i)}<div className="hl-brief-e-meta"><span>{i.source}</span>{link(i)}{i.also_url ? <a href={i.also_url} target="_blank" rel="noopener noreferrer">{(i.also_source || t('另一来源', 'Also')) + ' ↗'}</a> : null}{more(i)}</div></div>
            </li>;
          })}</ol>
          {latest.length > NEWS_LATEST_LIMIT && <a className="hl-brief-toggle" href={newsHref()}>{t('查看全部新闻', 'All news')}</a>}
        </aside>}
      </div>
      {roadworks.length > 0 && <div className="hl-brief-roads">
        <button type="button" className="hl-brief-roads-btn" aria-expanded={roadsOpen} onClick={() => setRoadsOpen(!roadsOpen)}><span className="hl-brief-pill hl-brief-cat">{categoryLabel('roads', uiLang)}</span><span>{t(`今天 ${roadworks.length} 处施工或管制`, `${roadworks.length} roadworks or traffic controls today`)}</span><span aria-hidden="true">{roadsOpen ? '▴' : '▾'}</span></button>
        {roadsOpen && <ul className="hl-brief-roads-list">{roadworks.map(i => <li key={i.id}><span lang={lang(i)}>{itemText(i, uiLang)}</span> {link(i)}</li>)}</ul>}
      </div>}
    </div>
    <p className="hl-brief-note">{t('摘要仅供参考，详情请以原文为准。', 'Summaries for quick reference only; see original sources for full details.')}</p>
  </section>;
}
