import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Search } from 'lucide-react';
import { href } from './site-routes.mjs';
import { navigate } from './navigate';
import { POPULAR_SUGGESTIONS, resolveSearch, searchMatches } from './search';

type T = (zh: string, en: string) => string;

export function SearchResults({ query, t }: { query: string; t: T }) {
  const [input, setInput] = useState(query);
  useEffect(() => { setInput(query); }, [query]);
  const matches = searchMatches(query);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    navigate(resolveSearch(q));
  }

  return <section className="hl-search-page" aria-labelledby="hl-search-title">
    <div className="sb-container">
      <div className="sb-card hl-search-shell">
        <div className="hl-search-crumb"><a href={href('home')}>{t('首页', 'Home')}</a><span>/</span><span>{t('搜索', 'Search')}</span></div>
        <form className="hl-search-form" role="search" onSubmit={onSubmit}>
          <Search aria-hidden="true" />
          <input
            type="search"
            aria-label={t('搜索本地信息', 'Search local information')}
            placeholder={t('搜亚超、游乐场、家庭医生、黑五商品或工具…', 'Search grocers, playgrounds, GP, Black Friday or tools…')}
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <button className="hl-search-btn" type="submit">{t('搜索', 'Search')}</button>
        </form>

        {matches.length > 0 ? <div className="hl-search-results" data-testid="search-results">
          <div className="hl-search-head">
            <h1 id="hl-search-title" tabIndex={-1}>
              {t(`「${query}」的相关页面`, `Results for “${query}”`)}
            </h1>
            <p>{t(`找到 ${matches.length} 个相关入口，可直接前往查看。`, `Found ${matches.length} matching pages.`)}</p>
          </div>
          <div className="hl-search-cards">
            {matches.map(item => <a key={item.id} href={item.href} className="hl-search-card" data-search-match={item.id}>
              <span className="hl-search-tag">{t(item.tagZh, item.tagEn)}</span>
              <h2>{t(item.titleZh, item.titleEn)}</h2>
              <p>{t(item.descZh, item.descEn)}</p>
              <span className="hl-search-go">{t('前往查看', 'Open page')}<ArrowUpRight aria-hidden="true" /></span>
            </a>)}
          </div>
        </div> : <div className="hl-search-empty" data-testid="search-no-results">
          <div className="hl-search-head">
            <h1 id="hl-search-title" tabIndex={-1}>{t('没找到，可以试试这些', 'No results, try these')}</h1>
            <p>{query
              ? t(`暂时没有找到与「${query}」直接匹配的页面，可以从下面这些常用页面开始找。`, `No direct matches for “${query}”. Try one of these popular pages instead.`)
              : t('输入关键词查找本地生活、工具、活动或服务，或直接浏览常用页面。', 'Enter a keyword to search, or browse popular pages below.')
            }</p>
          </div>
          <div className="hl-search-cards">
            {POPULAR_SUGGESTIONS.map(item => <a key={item.id} href={item.href} className="hl-search-card" data-search-suggestion={item.id}>
              <span className="hl-search-tag">{t(item.tagZh, item.tagEn)}</span>
              <h2>{t(item.titleZh, item.titleEn)}</h2>
              <p>{t(item.descZh, item.descEn)}</p>
              <span className="hl-search-go">{t('查看页面', 'View page')}<ArrowUpRight aria-hidden="true" /></span>
            </a>)}
          </div>
        </div>}
      </div>
    </div>
  </section>;
}
