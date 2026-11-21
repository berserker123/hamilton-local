import React, { useEffect } from 'react';
import DATA from './data/briefing.json';
import { newsHref, newsIdFromPath } from './site-routes.mjs';
import {
  newsLayout, BriefingData, BriefingItem, BriefingLang,
  categoryLabel, formatBriefingDate, itemArticleText, itemDisplay, itemLang, itemTime,
} from './briefing-model';

type T = (zh: string, en: string) => string;

function orderedItems(data: BriefingData, now: number): BriefingItem[] {
  const { alerts, lead, secondary, latest, roadworks } = newsLayout(data.items || [], now);
  return [...alerts, ...(lead ? [lead] : []), ...secondary, ...latest, ...roadworks];
}

export function NewsPage({ t, now, pathname, data = DATA as BriefingData }: { t: T; now?: number; pathname?: string; data?: BriefingData }) {
  const path = pathname ?? (typeof location === 'undefined' ? '/news/' : location.pathname);
  const id = newsIdFromPath(path);
  const clock = now ?? Date.now();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [id]);
  const uiLang: BriefingLang = t('中', 'en') === 'en' ? 'en' : 'zh';
  const items = orderedItems(data, clock);
  const item = id ? (data.items || []).find(entry => entry.id === id) : undefined;
  if (id && !item) return <NewsMissing t={t} />;
  if (item) return <NewsArticle item={item} t={t} uiLang={uiLang} now={clock} generatedAt={data.generated_at} />;
  return <NewsList items={items} t={t} uiLang={uiLang} now={clock} generatedAt={data.generated_at} />;
}

function NewsList({ items, t, uiLang, now, generatedAt }: { items: BriefingItem[]; t: T; uiLang: BriefingLang; now: number; generatedAt: string }) {
  const today = formatBriefingDate(generatedAt, uiLang);
  return <section className="hl-news-page" aria-labelledby="hl-news-title" data-testid="news-list">
    <div className="sb-container">
      <div className="hl-brief-card hl-news-card">
        <div className="hl-news-crumb"><a href="/">{t('首页', 'Home')}</a><span>/</span><span>{t('每日快讯', 'Daily Briefing')}</span></div>
        <h1 id="hl-news-title" className="hl-news-title" tabIndex={-1} lang={uiLang === 'en' ? 'en-NZ' : 'zh-CN'}>{t('每日快讯', 'Daily Briefing')}</h1>
        <p className="hl-brief-e-sub">{uiLang === 'en' ? 'Hamilton & Waikato' : 'Hamilton Daily Briefing'}</p>
        {today && <p className="hl-news-date">{today}</p>}
        {items.length === 0 ? <p className="hl-news-empty">{t('今天还没有快讯。', 'No briefing items yet.')}</p> : <ol className="hl-news-index">{items.map(item => {
          const view = itemDisplay(item, uiLang);
          const timeLabel = itemTime(item, now, uiLang);
          return <li key={item.id}>
            <article>
              <span className={'hl-brief-e-kicker hl-brief-c-' + item.category}>{categoryLabel(item.category, uiLang)}</span>
              <h2 lang={itemLang(item, uiLang)}>{view.title}</h2>
              {view.teaser && <p className="hl-news-teaser" lang={itemLang(item, uiLang)}>{view.teaser}</p>}
              <div className="hl-brief-e-meta">
                {item.source && <span>{item.source}</span>}
                {timeLabel && <span>{timeLabel}</span>}
                <a className="hl-brief-more" href={newsHref(item.id)}>{t('更多', 'More')}</a>
              </div>
            </article>
          </li>;
        })}</ol>}
      </div>
      <p className="hl-brief-note">{t('摘要仅供参考，详情请以原文为准。', 'Summaries for quick reference only; see original sources for full details.')}</p>
    </div>
  </section>;
}

function NewsArticle({ item, t, uiLang, now, generatedAt }: { item: BriefingItem; t: T; uiLang: BriefingLang; now: number; generatedAt: string }) {
  const view = itemDisplay(item, uiLang);
  const body = itemArticleText(item);
  const showBody = body && body !== view.title;
  const timeLabel = itemTime(item, now, uiLang);
  const today = formatBriefingDate(generatedAt || item.published || '', uiLang);
  return <section className="hl-news-page" aria-labelledby="hl-news-title" data-testid="news-article">
    <div className="sb-container">
      <article className="hl-brief-card hl-news-card">
        <div className="hl-news-crumb"><a href="/">{t('首页', 'Home')}</a><span>/</span><a href={newsHref()}>{t('每日快讯', 'Daily Briefing')}</a></div>
        <div className="hl-brief-e-flag"><span className={'hl-brief-e-kicker hl-brief-c-' + item.category}>{categoryLabel(item.category, uiLang)}</span>{today && <span className="hl-news-date">{today}</span>}</div>
        <h1 id="hl-news-title" className="hl-news-title" tabIndex={-1} lang={itemLang(item, uiLang)}>{view.title}</h1>
        {showBody && <p className="hl-news-body" lang={itemLang(item, 'zh')}>{body}</p>}
        <div className="hl-brief-e-meta hl-news-actions">
          {item.source && <span>{item.source}</span>}
          {timeLabel && <span>{timeLabel}</span>}
          {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer">{t('阅读原文 ↗', 'Read source ↗')}</a>}
          <a className="hl-brief-more" href={newsHref()}>{t('全部新闻', 'All news')}</a>
        </div>
      </article>
      <p className="hl-brief-note">{t('摘要仅供参考，详情请以原文为准。', 'Summaries for quick reference only; see original sources for full details.')}</p>
    </div>
  </section>;
}

function NewsMissing({ t }: { t: T }) {
  return <section className="hl-news-page" aria-labelledby="hl-news-title" data-testid="news-missing">
    <div className="sb-container">
      <div className="hl-brief-card hl-news-card">
        <div className="hl-news-crumb"><a href="/">{t('首页', 'Home')}</a><span>/</span><a href={newsHref()}>{t('每日快讯', 'Daily Briefing')}</a></div>
        <h1 id="hl-news-title" className="hl-news-title" tabIndex={-1}>{t('这条快讯已经更新', 'This story is no longer listed')}</h1>
        <p className="hl-news-body">{t('今日列表里没有这一条。可以回到全部新闻，看现在的快讯。', 'It is not in today’s list. The current briefing is on the news page.')}</p>
        <a className="hl-brief-more" href={newsHref()}>{t('全部新闻', 'All news')}</a>
      </div>
    </div>
  </section>;
}
