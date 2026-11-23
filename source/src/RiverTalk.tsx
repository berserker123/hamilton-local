import React, { useEffect, useRef, useState } from 'react';
import DATA from './data/river-talk.json';
import { BilingualTitle } from './BilingualTitle';
import {
  TALK_TOPICS, activeAlerts, activeArticles, activeNews, formatTalkDate, hasTopic, homeFeed, isCurrent, talkHref, talkIdFromPath,
} from './river-talk.mjs';

type T = (zh: string, en: string) => string;
type Board = (typeof DATA.boards)[number];
type Alert = (typeof DATA.alerts)[number];
type News = (typeof DATA.news)[number];
type PromptBlock = { titleZh: string; titleEn: string; text: string };
type Article = (typeof DATA.articles)[number] & {
  level?: number;
  topics: string[];
  cta?: { href: string; zh: string; en: string };
  factsTitleZh?: string; factsTitleEn?: string;
  actionsTitleZh?: string; actionsTitleEn?: string;
  noteZh?: string; noteEn?: string;
  prompts?: PromptBlock[];
};

const uiLang = (t: T) => (t('中', 'en') === 'en' ? 'en' : 'zh');
const boardOf = (id: string) => DATA.boards.find(board => board.id === id) as Board;
const isExternal = (href: string) => /^https?:/.test(href);
const linkProps = (href: string) => (isExternal(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {});
const topicLabel = (id: string, t: T) => {
  const topic = TALK_TOPICS.find(item => item.id === id);
  return topic ? t(topic.zh, topic.en) : '';
};

function BoardLabel({ id, t }: { id: string; t: T }) {
  const board = boardOf(id);
  return <span className={'hl-talk-board hl-talk-board-' + id}>{t(board.zh, board.en)}</span>;
}

function TopicTags({ topics, t }: { topics: string[]; t: T }) {
  return <span className="hl-talk-tags">{topics.map(id => <span key={id}>{topicLabel(id, t)}</span>)}</span>;
}

function Shout({ alerts, t }: { alerts: Alert[]; t: T }) {
  if (!alerts.length) return null;
  return <aside className="hl-talk-shout" aria-label={t('喊一嗓子', 'Heads Up')} data-testid="talk-shout">
    <div className="hl-talk-shout-head"><strong>{t('喊一嗓子', 'Heads Up')}</strong><span>{t('这事急，先跟你说一声', 'Worth knowing right now')}</span></div>
    <ul>{alerts.map(alert => <li key={alert.id}>
      <a href={alert.href} {...linkProps(alert.href)}>{t(alert.zh, alert.en)}</a>
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

function NewsHomeCard({ item, t }: { item: News; t: T }) {
  const lang = uiLang(t);
  const text = (zh: string, en: string) => (lang === 'en' ? en : zh);
  const link = talkHref() + '#news-' + item.id;
  return <article className="hl-talk-item hl-talk-home-news">
    <TopicTags topics={item.topics} t={t} />
    <h3><a href={link}>{text(item.titleZh, item.titleEn)}</a></h3>
    <p className="hl-talk-take"><strong>{t('唠一句', 'Our take')}</strong>{text(item.takeZh, item.takeEn)}</p>
    <a className="hl-talk-read" href={link} aria-label={text('看详情：' + item.titleZh, 'More: ' + item.titleEn)}>{t('看详情', 'More')}</a>
  </article>;
}

function NewsItem({ item, t, lang }: { item: News; t: T; lang: string }) {
  // News copy already names places the way it should read, so skip the automatic bilingual place names.
  const text = (zh: string, en: string) => (lang === 'en' ? en : zh);
  return <li id={'news-' + item.id} className="hl-talk-news-item">
    <div className="hl-talk-news-meta"><TopicTags topics={item.topics} t={t} /><time dateTime={item.date}>{formatTalkDate(item.date, lang)}</time></div>
    <h3>{text(item.titleZh, item.titleEn)}</h3>
    <p>{text(item.bodyZh, item.bodyEn)}</p>
    <p className="hl-talk-take"><strong>{t('唠一句', 'Our take')}</strong>{text(item.takeZh, item.takeEn)}</p>
    <a className="hl-talk-source-link" href={item.url} target="_blank" rel="noopener noreferrer">{t('来源：', 'Source: ')}{item.source} ↗</a>
  </li>;
}

export function RiverTalkHome({ t, now }: { t: T; now?: number }) {
  const clock = now ?? Date.now();
  const alerts = activeAlerts(DATA, clock) as Alert[];
  const cards = homeFeed(DATA, clock) as Array<{ kind: string; item: News | Article }>;
  if (!alerts.length && !cards.length) return null;
  return <section className="sb-container hl-talk" aria-label={t('屯里二三事', 'Tron Talk')} data-testid="river-talk">
    <div className="hl-brief-card hl-talk-card">
      <div className="hl-talk-head">
        <div><BilingualTitle as="h2" zh="屯里二三事" en="Tron Talk" t={t} /><p>{t('屯里大事小事，给你唠明白。', 'Big and small news from The Tron, made clear.')}</p></div>
        <a className="hl-brief-more" href={talkHref()}>{t('进屯看看', 'Come on in')}</a>
      </div>
      <Shout alerts={alerts} t={t} />
      <div className="hl-talk-grid">{cards.map(card => card.kind === 'news' ? <NewsHomeCard key={card.item.id} item={card.item as News} t={t} /> : <ArticleCard key={card.item.id} article={card.item as Article} t={t} />)}</div>
    </div>
  </section>;
}

function Crumb({ t, title }: { t: T; title?: string }) {
  return <div className="hl-news-crumb"><a href="/">{t('首页', 'Home')}</a><span>/</span>{title ? <><a href={talkHref()}>{t('屯里二三事', 'Tron Talk')}</a><span>/</span><span>{title}</span></> : <span>{t('屯里二三事', 'Tron Talk')}</span>}</div>;
}

function TalkIndex({ t, now }: { t: T; now: number }) {
  const [topic, setTopic] = useState('all');
  const lang = uiLang(t);
  const news = (activeNews(DATA, now) as News[]).filter(item => hasTopic(item, topic));
  const articles = (activeArticles(DATA, now) as Article[]).filter(item => hasTopic(item, topic));
  const boards = DATA.boards.map(board => ({ board, items: articles.filter(item => item.board === board.id) })).filter(group => group.items.length);
  return <section className="hl-news-page hl-talk-page" aria-labelledby="hl-talk-title" data-testid="talk-index">
    <div className="sb-container"><div className="hl-brief-card hl-news-card">
      <Crumb t={t} />
      <h1 id="hl-talk-title" className="hl-news-title" tabIndex={-1}>{t('屯里二三事', 'Tron Talk')}</h1>
      <p className="hl-talk-slogan">{t('屯里大事小事，给你唠明白。', 'Big and small news from The Tron, made clear.')}</p>
      <Shout alerts={activeAlerts(DATA, now) as Alert[]} t={t} />
      <div className="hl-talk-filter" role="group" aria-label={t('按主题看', 'Filter by topic')}>
        {[{ id: 'all', zh: '全部', en: 'All' }, ...TALK_TOPICS].map(item => <button type="button" key={item.id} aria-pressed={topic === item.id} onClick={() => setTopic(item.id)}>{t(item.zh, item.en)}</button>)}
      </div>
      {news.length > 0 && <section className="hl-talk-section" aria-labelledby="talk-news">
        <div className="hl-talk-section-head"><h2 id="talk-news">{t('屯里这阵子', 'Lately in The Tron')}</h2><p>{t('发生了什么，跟你有啥关系', 'What happened, and why it matters to you')}</p></div>
        <ul className="hl-talk-news">{news.map(item => <NewsItem key={item.id} item={item} t={t} lang={lang} />)}</ul>
      </section>}
      {boards.map(({ board, items }) => <section key={board.id} className="hl-talk-section" aria-labelledby={'talk-' + board.id}>
        <div className="hl-talk-section-head"><h2 id={'talk-' + board.id}>{t(board.zh, board.en)}</h2><p>{t(board.taglineZh, board.taglineEn)}</p></div>
        <div className="hl-talk-grid">{items.map(article => <ArticleCard key={article.id} article={article} t={t} />)}</div>
      </section>)}
      {!news.length && !boards.length && <p className="hl-talk-soon">{t('这事还在打听，下一篇很快来。', 'Still asking around. Next one soon.')}</p>}
    </div></div>
  </section>;
}

function PromptCard({ prompt, t }: { prompt: PromptBlock; t: T }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt.text);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch { setCopied(false); }
  }
  return <div className="hl-talk-prompt">
    <div className="hl-talk-prompt-head"><strong>{t(prompt.titleZh, prompt.titleEn)}</strong><button type="button" onClick={copy}>{copied ? t('已复制', 'Copied') : t('复制', 'Copy')}</button></div>
    <pre tabIndex={0}><code>{prompt.text}</code></pre>
  </div>;
}

function TalkArticle({ article, t, now }: { article: Article; t: T; now: number }) {
  const lang = uiLang(t);
  const title = t(article.titleZh, article.titleEn);
  const facts = lang === 'en' ? article.factsEn : article.factsZh;
  const actions = lang === 'en' ? article.actionsEn : article.actionsZh;
  return <section className="hl-news-page hl-talk-page" aria-labelledby="hl-talk-title" data-testid="talk-article">
    <div className="sb-container"><article className="hl-brief-card hl-news-card hl-talk-article">
      <Crumb t={t} title={t(boardOf(article.board).zh, boardOf(article.board).en)} />
      <div className="hl-talk-article-labels"><BoardLabel id={article.board} t={t} /><TopicTags topics={article.topics} t={t} /></div>
      <h1 id="hl-talk-title" className="hl-news-title" tabIndex={-1}>{title}</h1>
      {!isCurrent(article.validUntil, now) && <p className="hl-talk-expired" role="status">{t('这篇已过有效期，内容可能变了，请以官方信息为准。', 'This article has passed its review date. Check official sources.')}</p>}
      <div className="hl-talk-answer"><strong>{t('一句话', 'In short')}</strong><p>{t(article.answerZh, article.answerEn)}</p></div>
      <h2>{t('跟谁有关', 'Who this affects')}</h2>
      <p>{t(article.whoZh, article.whoEn)}</p>
      {article.noteZh && <p className="hl-talk-note">{t(article.noteZh, article.noteEn || article.noteZh)}</p>}
      <h2>{t(article.factsTitleZh || '具体情况', article.factsTitleEn || 'The details')}</h2>
      <ul>{facts.map(fact => <li key={fact}>{fact}</li>)}</ul>
      <h2>{t(article.actionsTitleZh || '你要做什么', article.actionsTitleEn || 'What to do')}</h2>
      <ol>{actions.map(action => <li key={action}>{action}</li>)}</ol>
      {article.prompts && <><h2>{t('直接复制去用', 'Copy and use')}</h2><div className="hl-talk-prompts">{article.prompts.map(prompt => <PromptCard key={prompt.titleEn} prompt={prompt} t={t} />)}</div></>}
      {article.cta && <a className="hl-talk-cta" href={article.cta.href} {...linkProps(article.cta.href)}>{t(article.cta.zh, article.cta.en)}</a>}
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
  useEffect(() => {
    if (!location.hash.startsWith('#news-')) { window.scrollTo({ top: 0, behavior: 'instant' }); return; }
    // Wait until the route change has finished its own scroll reset.
    const timer = window.setTimeout(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: 'start', behavior: 'instant' }), 80);
    return () => window.clearTimeout(timer);
  }, [id]);
  if (!id) return <TalkIndex t={t} now={clock} />;
  const article = DATA.articles.find(entry => entry.id === id) as Article | undefined;
  return article ? <TalkArticle article={article} t={t} now={clock} /> : <TalkMissing t={t} />;
}
