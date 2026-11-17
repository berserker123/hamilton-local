import React, { useState } from 'react';
import DATA from './data/briefing.json';
import { BilingualTitle } from './BilingualTitle';
import { CATEGORY_LABELS, HOME_LIMIT, BriefingData, formatUpdated, itemText, prepareItems, relativeTime } from './briefing-model';

type T = (zh: string, en: string) => string;

export function BriefingView({ data, t, now }: { data: BriefingData; t: T; now?: number }) {
  const [open, setOpen] = useState(false);
  const items = prepareItems(data.items || []);
  if (!items.length) return null;
  const shown = open ? items : items.slice(0, HOME_LIMIT);
  const updated = formatUpdated(data.generated_at);
  return <section className="sb-container hl-brief" aria-label="汉密尔顿每日快讯" data-testid="briefing">
    <div className="hl-brief-card">
      <div className="hl-brief-head">
        <div className="hl-brief-title"><BilingualTitle as="h2" zh="汉密尔顿每日快讯" en="Hamilton Daily Briefing" t={t} /></div>
        <div className="hl-brief-meta">{data.sample && <span className="hl-brief-pill hl-brief-sample">示例数据</span>}{updated && <span>更新于 {updated}</span>}</div>
      </div>
      <ul className="hl-brief-list">{shown.map(i => <li key={i.id} className={'hl-brief-item' + (i.urgent ? ' is-urgent' : '')}>
        <span className="hl-brief-pill hl-brief-cat">{CATEGORY_LABELS[i.category]}</span>
        <p lang={i.summary_zh ? 'zh-CN' : 'en-NZ'}>{itemText(i)}</p>
        <div className="hl-brief-foot"><span>{i.source}</span><span>{relativeTime(i.published, now)}</span><a href={i.url} target="_blank" rel="noopener noreferrer">原文 ↗</a></div>
      </li>)}</ul>
      {items.length > HOME_LIMIT && <button type="button" className="hl-brief-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? '收起' : `查看全部 ${items.length} 条`}</button>}
    </div>
    <p className="hl-brief-note">摘要仅供参考，详情请以原文为准。</p>
  </section>;
}
export function Briefing({ t }: { t: T }) { return <BriefingView data={DATA as BriefingData} t={t} />; }
