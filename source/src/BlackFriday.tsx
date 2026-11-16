import React, { useRef, useState } from 'react';
import { ArrowUpRight, BadgePercent, Calendar, ShieldCheck } from 'lucide-react';
import DATA from './data/blackfriday.json';
import { CATEGORIES, Deal, realDiscount, selectDeals, verdict, Verdict } from './blackfriday-model';

type T = (zh: string, en: string) => string;
const DEALS = DATA as Deal[];
const STORES = [...new Set(DEALS.map(d => d.store))].sort();
const ACTIVE_CATEGORIES = CATEGORIES.filter(([zh]) => DEALS.some(d => d.category === zh));
const money = (price: number) => new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD' }).format(price);
const LABELS: Record<Verdict, string> = { '真优惠': 'Good deal', '一般': 'Standard offer', '先别急': 'Wait and compare', '待核实': 'History unverified' };
const CLASSES: Record<Verdict, string> = { '真优惠': 'good', '一般': 'ordinary', '先别急': 'poor', '待核实': 'unverified' };
export const UNVERIFIED_LABELS = [
  {
    zh: '新面孔',
    en: 'New face',
    noteZh: '比价网站还没见过它，划不划算你说了算',
    noteEn: "Price trackers haven't met this one yet, so you be the judge.",
  },
  {
    zh: '价格神秘',
    en: 'Price mystery',
    noteZh: '店家说打折了，我们没有证据，也没法反驳',
    noteEn: "The store says it's a deal. We can't prove it, or disprove it.",
  },
] as const;
function VerdictPill({ value, t, variant }: { value: Verdict; t: T; variant?: 0 | 1 }) {
  if (value === '待核实') {
    const label = UNVERIFIED_LABELS[variant ?? 0];
    return <span className="bf-verdict bf-verdict-unverified" title={t(label.noteZh, label.noteEn)}>{t(label.zh, label.en)}</span>;
  }
  return <span className={'bf-verdict bf-verdict-' + CLASSES[value]}>{t(value, LABELS[value])}</span>;
}
export function BlackFridayBanner({ t }: { t: T }) {
  return <div className="sb-container bf-banner-wrap"><a className="bf-banner" href="/living/blackfriday/" data-testid="bf-home-banner"><span className="bf-banner-icon"><BadgePercent aria-hidden="true" /></span><span className="bf-banner-copy"><strong lang="zh-CN">黑五专区 · 真假优惠一眼看清</strong><span lang="en-NZ">Black Friday · See what you’re really saving</span></span><span className="bf-banner-date">27 NOV 2026</span><ArrowUpRight aria-label={t('查看黑五专区', 'Explore Black Friday')} /></a></div>;
}
function PriceCheckPanel({ t }: { t: T }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return <section className="bf-price-check" aria-labelledby="bf-price-check-title">
    <div>
      <h3 id="bf-price-check-title" lang="zh-CN">想比价其他商品？</h3>
      <p className="bf-price-check-en" lang="en-NZ">Check any product's price history</p>
    </div>
    <form role="search" aria-label={t('比价搜索', 'Price check')} action="https://pricespy.co.nz/search" method="get" target="_blank" rel="noopener noreferrer" onSubmit={event => {
      const input = inputRef.current;
      if (input) input.value = input.value.trim();
      if (!input?.value) { event.preventDefault(); input?.focus(); }
    }}>
      <div className="bf-price-check-controls">
        <input ref={inputRef} type="text" name="query" required aria-label={t('输入商品名', 'Product name')} aria-describedby="bf-price-check-help" placeholder="输入商品名，如 iPhone 17、Dyson V15" enterKeyHint="search" />
        <button type="submit" className="bf-price-check-submit">去比价<ArrowUpRight aria-hidden="true" /></button>
      </div>
      <p id="bf-price-check-help" className="bf-price-check-help" lang="zh-CN">跳转到 PriceSpy NZ，查看各家店价格与历史走势</p>
      <div className="bf-price-check-chips" role="group" aria-label={t('快捷比价', 'Quick price checks')}>
        {['AirPods', 'PlayStation 5', 'Dyson', 'Air Fryer'].map(query => <button type="button" key={query} onClick={event => {
          if (inputRef.current) { inputRef.current.value = query; event.currentTarget.form?.requestSubmit(); }
        }}>{query}</button>)}
      </div>
    </form>
  </section>;
}
export function BlackFriday({ t }: { t: T }) {
  const [category, setCategory] = useState('all');
  const [store, setStore] = useState('all');
  const [sort, setSort] = useState('discount');
  const shown = selectDeals(DEALS, category, store, sort);
  const dates = [...new Set(DEALS.map(d => d.checkedAt.slice(0, 10)))].sort();
  function reset() { setCategory('all'); setStore('all'); setSort('discount'); }
  return <section className="bf-page" aria-labelledby="bf-title">
    <div className="bf-intro">
      <div className="bf-heading-row"><div><p className="bf-kicker">{t('买得明白，才是优惠', 'A clearer look at the price')}</p><h2 id="bf-title" lang="zh-CN">黑五专区</h2><p className="bf-title-en" lang="en-NZ">Black Friday</p></div><span className="bf-date"><Calendar aria-hidden="true" /><span>{t('新西兰黑五', 'NZ Black Friday')}<strong>{t('11月27日 · 周五', 'Fri 27 November')}<small>2026</small></strong></span></span></div>
      <p>{t('把商家现价与近三个月的平时价放在一起看，少一点冲动，多一点依据。', 'Compare retailer prices with the typical price over the last three months, for a more informed shop.')}</p>
      <p className="bf-checked"><ShieldCheck aria-hidden="true" />{t('价格核对', 'Prices checked')}：{dates.length ? (dates.length > 1 ? `${dates[0]} – ${dates[dates.length - 1]}` : dates[0]) : '—'} · NZD</p>
      <p className="bf-research-note">{t('本页为黑五前价格观察。未标明黑五活动的商品显示当前价；历史不足的条目不计算折扣，也不作优惠判断。', 'This is a pre-Black Friday price watch. Listings without an explicit Black Friday promotion show current prices. Incomplete history means no calculated discount or deal verdict.')}</p>
      <details className="bf-method"><summary>{t('怎样判断真假优惠？', 'How are offers assessed?')}</summary><ul>
        <li><VerdictPill value="真优惠" t={t} />{t('现价低于平时价，且不高于近三个月最低价加$1。', 'Below typical price and within $1 of, or below, the three-month low.')}</li>
        <li><VerdictPill value="一般" t={t} />{t('比平时价低，但未达近三个月最低价；低于约10%或常规促销同样适用。', 'Below typical price but above the three-month low, including savings under about 10% or regular promotions.')}</li>
        <li><VerdictPill value="先别急" t={t} />{t('现价不低于平时价，或有证据显示先涨后降且现价距平时价不足$1；仅为价格比较标签。', 'At or above typical, or a documented pre-sale rise ending within $1 of typical. This label is a price comparison.')}</li>
        <li><VerdictPill value="待核实" variant={0} t={t} />{t('比价网站还没见过它，划不划算你说了算。商家划线价、RRP不当作平时价。', "Price trackers haven't met this one yet, so you be the judge. Retailer “was” prices and RRP are not treated as typical prices.")}</li>
        <li><VerdictPill value="待核实" variant={1} t={t} />{t('店家说打折了，我们没有证据，也没法反驳。缺少近三个月完整历史，不计算折扣。', "The store says it's a deal. We can't prove it, or disprove it. Insufficient three-month history means no calculated discount.")}</li>
      </ul></details>
      <p className="bf-research-note">{t('平时价为 PriceSpy 同款商品近90天日价的中位数，按卡片标明的市场最低价或所列商家历史计算。市场数据不代表该商家的日常售价；3月最低采用同一范围与窗口，不含运费及二手商品。', 'Typical price is the ~90-day median of PriceSpy’s daily prices for the exact variant, using either the market-low series or the listed store’s history as marked on each card. Market data is not the store’s usual price. The three-month low uses the same scope and window, excluding delivery and used items.')}</p>
      <p className="bf-disclaimer">{t('价格以商家页面为准，可能随时变动', 'Prices are subject to the retailer’s page and may change at any time.')}</p>
    </div>
    <PriceCheckPanel t={t} />
    <div className="bf-filters" aria-label={t('筛选优惠', 'Filter listings')}>
      <div className="bf-categories" role="group" aria-label={t('商品分类', 'Category')}><button type="button" aria-pressed={category === 'all'} onClick={() => setCategory('all')}>{t('全部', 'All')}</button>{ACTIVE_CATEGORIES.map(([zh, en]) => <button type="button" key={zh} aria-pressed={category === zh} onClick={() => setCategory(zh)}>{t(zh, en)}</button>)}</div>
      <div className="bf-selects"><label>{t('商家', 'Store')}<select aria-label={t('选择商家', 'Choose store')} value={store} onChange={e => setStore(e.target.value)}><option value="all">{t('全部商家', 'All stores')}</option>{STORES.map(s => <option key={s}>{s}</option>)}</select></label><label>{t('排序', 'Sort')}<select aria-label={t('排序方式', 'Sort by')} value={sort} onChange={e => setSort(e.target.value)}><option value="discount">{t('折扣最大', 'Biggest discount')}</option><option value="newest">{t('最新加入', 'Newest added')}</option><option value="price">{t('价格从低到高', 'Price: low to high')}</option></select></label></div>
    </div>
    <div className="bf-results"><p role="status" aria-live="polite">{t(`${shown.length} 件商品 / 共 ${DEALS.length} 件`, `${shown.length} of ${DEALS.length} listings`)}</p>{sort === 'discount' && <span>{t('未核实折扣排在最后', 'Unverified discounts appear last')}</span>}{(category !== 'all' || store !== 'all') && <button type="button" onClick={reset}>{t('清除筛选', 'Clear filters')}</button>}</div>
    {shown.length ? (() => {
      let unverifiedIdx = 0;
      return <div className="bf-grid">{shown.map(d => {
        const result = verdict(d), discount = realDiscount(d);
        const humorVariant = result === '待核实' ? (unverifiedIdx++ % 2 as 0 | 1) : undefined;
        const humor = humorVariant != null ? UNVERIFIED_LABELS[humorVariant] : null;
        return <article className="bf-card" key={d.id} data-deal-id={d.id}>
          <div className="bf-card-top"><span>{d.store}</span><VerdictPill value={result} variant={humorVariant} t={t} /></div>
          <div className="bf-product-title"><h3 lang="zh-CN">{d.nameZh}</h3><p lang="en-NZ">{d.name}</p></div>
          <div className="bf-price"><span>{d.blackFridayConfirmed ? t('黑五价', 'Black Friday price') : t('当前价 · 黑五价待确认', 'Current price · BF offer unconfirmed')}</span><strong>{money(d.salePrice)}</strong><small>NZD</small></div>
          <dl className="bf-comparison"><div><dt>{t('平时价', 'Typical price')}<small>{d.historyScope === 'retailer' ? t('近90天商家日价中位数', '90-day store median') : t('近90天市场日价中位数', '90-day market median')}</small></dt><dd>{d.historyVerified && d.typicalPrice != null ? money(d.typicalPrice) : t('暂无记录', 'Not tracked')}</dd></div><div><dt>{t('3月最低', '3-month low')}</dt><dd>{d.historyVerified && d.lowestPrice90d != null ? money(d.lowestPrice90d) : t('暂无记录', 'Not tracked')}</dd></div><div><dt>{t('真实折扣', 'Real discount')}</dt><dd>{discount == null ? '—' : `${discount}%`}</dd></div></dl>
          <p className="bf-history-note">{humor ? t(humor.noteZh, humor.noteEn) : discount == null ? t('历史价格不足，暂不判断是否优惠。', 'Insufficient price history to assess this offer.') : d.historyScope === 'retailer' ? t('以同款商家日价中位数计算，不以RRP计算。', 'Compared with this store’s exact-variant median, not RRP.') : t('以同款市场日价中位数计算，不以RRP计算。', 'Compared with the exact variant’s market median, not RRP.')}</p>
          {d.currentPriceRecheck?.status === 'domain-blocked' && <p className="bf-history-note">{t('本轮未能刷新商家价格；保留早前记录，核对日期见下。', 'Retailer refresh unavailable; earlier price retained, see the checked date below.')}</p>}
          {d.currentPriceRecheck?.status === 'pricespy-offer' && <p className="bf-history-note">{t('商家页面暂时无法打开；现价按 PriceSpy 当日同店报价核对。', 'Retailer page unavailable; price confirmed against the same store’s live PriceSpy offer.')}</p>}
          {d.offerNote && <p className="bf-history-note">{t(d.offerNote, 'Single-item price. The buy-two save-15% promotion is not included.')}</p>}
          <div className="bf-card-meta"><span>{t('核对', 'Checked')} · {d.checkedAt.slice(0, 10)}</span><span>{d.saleEnds ? t('优惠至 ', 'Offer ends ') + d.saleEnds : t('截止日期未注明', 'End date not stated')}</span></div>
          <div className="bf-card-actions"><a href={d.productUrl} target="_blank" rel="noopener noreferrer">{t('去商家', 'Visit store')}<ArrowUpRight aria-hidden="true" /></a>{d.priceSpyUrl ? <a href={d.priceSpyUrl} target="_blank" rel="noopener noreferrer">{t('价格走势', 'Price history')}<ArrowUpRight aria-hidden="true" /></a> : <span>{t('价格走势 · 暂无已核实链接', 'Price history · Link unverified')}</span>}</div>
          {d.priceSpyUrl && <p className="bf-variant-note">{t('PriceSpy 可能合并相关型号、颜色或包装；请先核对具体款式。', 'PriceSpy may combine related models, colours or packs; check the exact variant first.')}</p>}
        </article>;
      })}</div>;
    })() : <div className="bf-empty"><h3>{t('这个组合暂时没有商品', 'No listings for this combination')}</h3><p>{t('试试其他分类或商家。', 'Try another category or store.')}</p><button type="button" onClick={reset}>{t('清除筛选', 'Clear filters')}</button></div>}
  </section>;
}
