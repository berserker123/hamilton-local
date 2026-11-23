import React, { useEffect } from 'react';
import DATA from './data/river-talk.json';
import { BilingualTitle } from './BilingualTitle';
import {
  HOME_ARTICLE_LIMIT, activeAlerts, activeArticles, articlesForBoard, formatTalkDate, isCurrent, talkHref, talkIdFromPath,
} from './river-talk.mjs';

type T = (zh: string, en: string) => string;
type Board = (typeof DATA.boards)[number];
type Alert = (typeof DATA.alerts)[number];
type Article = (typeof DATA.articles)[number] & { level?: number; cta?: { href: string; zh: string; en: string } };

const uiLang = (t: T) => (t('中', 'en') === 'en' ? 'en' : 'zh');
const boardOf = (id: string) => DATA.boards.find(board => board.id === id) as Board;
const isExternal = (href: string) => /^https?:/.test(href);

function BoardLabel({ id, t }: { id: string; t: T }) {
  const board = boardOf(id);
  return <span className={'hl-talk-board hl-talk-board-' + id}>{t(board.zh, board.en)}</span>;
}

function Shout({ alerts, t }: { alerts: Alert[]; t: T }) {
  if (!alerts.length) return null;
  return <aside className="hl-talk-shout" aria-label={t('喊一嗓子', 'Heads Up')} data-testid="talk-shout">
    <div className="hl-talk-shout-head"><strong>{t('喊一嗓子', 'Heads Up')}</strong><span>{t('这事急，先跟你说一声', 'Worth knowing right now')}</span></div>
    <ul>{alerts.map(alert => <li key={alert.id}>
      <a href={alert.href} {...(isExternal(alert.href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{t(alert.zh, alert.en)}</a>
    </li>)}</ul>
  </aside>;
}

function ArticleCard({ article, t }: { article: Article; t: T }) {
  return <article className="hl-talk-item">
    <BoardLabel id={article.board} t={t} />
    <h3><a href={talkHref(article.id)}>{t(article.titleZh, article.titleEn)}</a></h3>
    <p>{t(article.answerZh, article.answerEn)}</p>
    <a className="hl-talk-read" href={talkHref(article.id)} aria-label={t('读全文：' + article.titleZh, 'Read: ' + article.titleEn)}>{t('读全文', 'Read')}</a>
  </article>;
}

export function RiverTalkHome({ t, now }: { t: T; now?: number }) {
  const clock = now ?? Date.now();
  const alerts = activeAlerts(DATA, clock) as Alert[];
  const articles = activeArticles(DATA, clock).slice(0, HOME_ARTICLE_LIMIT) as Article[];
  if (!alerts.length && !articles.length) return null;
  return <section className="sb-container hl-talk" aria-label={t('屯里二三事', 'Tron Talk')} data-testid="river-talk">
    <div className="hl-brief-card hl-talk-card">
      <div className="hl-talk-head">
        <div><BilingualTitle as="h2" zh="屯里二三事" en="Tron Talk" t={t} /><p>{t('屯里大事小事，给你唠明白。', 'Big and small news from The Tron, made clear.')}</p></div>
        <a className="hl-brief-more" href={talkHref()}>{t('进屯看看', 'Come on in')}</a>
      </div>
      <Shout alerts={alerts} t={t} />
      <div className="hl-talk-grid">{articles.map(article => <ArticleCard key={article.id} article={article} t={t} />)}</div>
    </div>
  </section>;
}

function Crumb({ t, title }: { t: T; title?: string }) {
  return <div className="hl-news-crumb"><a href="/">{t('首页', 'Home')}</a><span>/</span>{title ? <><a href={talkHref()}>{t('屯里二三事', 'Tron Talk')}</a><span>/</span><span>{title}</span></> : <span>{t('屯里二三事', 'Tron Talk')}</span>}</div>;
}

function TalkIndex({ t, now }: { t: T; now: number }) {
  return <section className="hl-news-page hl-talk-page" aria-labelledby="hl-talk-title" data-testid="talk-index">
    <div className="sb-container"><div className="hl-brief-card hl-news-card">
      <Crumb t={t} />
      <h1 id="hl-talk-title" className="hl-news-title" tabIndex={-1}>{t('屯里二三事', 'Tron Talk')}</h1>
      <p className="hl-talk-slogan">{t('屯里大事小事，给你唠明白。', 'Big and small news from The Tron, made clear.')}</p>
      <Shout alerts={activeAlerts(DATA, now) as Alert[]} t={t} />
      {DATA.boards.map(board => {
        const items = articlesForBoard(DATA, board.id, now) as Article[];
        return <section key={board.id} className="hl-talk-section" aria-labelledby={'talk-' + board.id}>
          <div className="hl-talk-section-head"><h2 id={'talk-' + board.id}>{t(board.zh, board.en)}</h2><p>{t(board.taglineZh, board.taglineEn)}</p></div>
          {'soon' in board && board.soon
            ? <p className="hl-talk-soon">{t('屯口的桌子还在搬，马上开张。', 'Still moving the tables in. Opening soon.')}</p>
            : items.length
              ? <div className="hl-talk-grid">{items.map(article => <ArticleCard key={article.id} article={article} t={t} />)}</div>
              : <p className="hl-talk-soon">{t('这事还在打听，下一篇很快来。', 'Still asking around. Next one soon.')}</p>}
        </section>;
      })}
    </div></div>
  </section>;
}

function TalkArticle({ article, t, now }: { article: Article; t: T; now: number }) {
  const lang = uiLang(t);
  const title = t(article.titleZh, article.titleEn);
  const facts = lang === 'en' ? article.factsEn : article.factsZh;
  const actions = lang === 'en' ? article.actionsEn : article.actionsZh;
  return <section className="hl-news-page hl-talk-page" aria-labelledby="hl-talk-title" data-testid="talk-article">
    <div className="sb-container"><article className="hl-brief-card hl-news-card hl-talk-article">
      <Crumb t={t} title={t(boardOf(article.board).zh, boardOf(article.board).en)} />
      <BoardLabel id={article.board} t={t} />
      <h1 id="hl-talk-title" className="hl-news-title" tabIndex={-1}>{title}</h1>
      {!isCurrent(article.validUntil, now) && <p className="hl-talk-expired" role="status">{t('这篇已过有效期，内容可能变了，请以官方信息为准。', 'This article has passed its review date. Check official sources.')}</p>}
      <div className="hl-talk-answer"><strong>{t('一句话', 'In short')}</strong><p>{t(article.answerZh, article.answerEn)}</p></div>
      <h2>{t('跟谁有关', 'Who this affects')}</h2>
      <p>{t(article.whoZh, article.whoEn)}</p>
      <h2>{t('具体情况', 'The details')}</h2>
      <ul>{facts.map(fact => <li key={fact}>{fact}</li>)}</ul>
      <h2>{t('你要做什么', 'What to do')}</h2>
      <ol>{actions.map(action => <li key={action}>{action}</li>)}</ol>
      {article.cta && <a className="hl-talk-cta" href={article.cta.href}>{t(article.cta.zh, article.cta.en)}</a>}
      <footer className="hl-talk-source">
        <p>{t('核对于 ', 'Checked ')}{formatTalkDate(article.checked, lang)}{t(' · 有效期至 ', ' · Valid until ')}{formatTalkDate(article.validUntil, lang)}</p>
        <p>{t('来源：', 'Sources: ')}{article.sources.map((source, index) => <React.Fragment key={source.url}>{index > 0 && ' · '}<a href={source.url} target="_blank" rel="noopener noreferrer">{source.label} ↗</a></React.Fragment>)}</p>
      </footer>
      <a className="hl-brief-more hl-talk-back" href={talkHref()}>{t('回屯里', 'Back to Tron Talk')}</a>
    </article></div>
  </section>;
}

function TalkMissing({ t }: { t: T }) {
  return <section className="hl-news-page hl-talk-page" aria-labelledby="hl-talk-title" data-testid="talk-missing">
    <div className="sb-container"><div className="hl-brief-card hl-news-card">
      <Crumb t={t} />
      <h1 id="hl-talk-title" className="hl-news-title" tabIndex={-1}>{t('这事已经翻篇了', 'This one has moved on')}</h1>
      <a className="hl-brief-more hl-talk-back" href={talkHref()}>{t('回屯里', 'Back to Tron Talk')}</a>
    </div></div>
  </section>;
}

export function RiverTalkPage({ t, now, pathname }: { t: T; now?: number; pathname?: string }) {
  const path = pathname ?? (typeof location === 'undefined' ? '/talk/' : location.pathname);
  const id = talkIdFromPath(path);
  const clock = now ?? Date.now();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [id]);
  if (!id) return <TalkIndex t={t} now={clock} />;
  const article = DATA.articles.find(entry => entry.id === id) as Article | undefined;
  return article ? <TalkArticle article={article} t={t} now={clock} /> : <TalkMissing t={t} />;
}
