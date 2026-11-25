import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Cake, Clock, Dices, MapPin } from 'lucide-react';
import DATA from './data/food-guide.json';
import { DirectoryHeading } from './BilingualTitle';
import { href } from './site-routes.mjs';
import { DEFAULT_OCCASION, FOOD_OCCASIONS, PERKS_ID, cleanWhere, isOccasion, pickRandom, placesFor, reasonFor } from './food-guide.mjs';

type T = (zh: string, en: string) => string;
type FoodPlace = (typeof DATA.places)[number];
type Perk = (typeof DATA.perks)[number];

function readOccasion() {
  const value = new URLSearchParams(location.search).get('o') || '';
  return isOccasion(value) ? value : DEFAULT_OCCASION;
}

function Source({ url, t }: { url: string; t: T }) {
  return <a className="hl-food-source" href={url} target="_blank" rel="noopener noreferrer">{t('来源', 'Source')}<ArrowUpRight aria-hidden="true" /></a>;
}

function PlaceCard({ place: p, occasion, t }: { place: FoodPlace; occasion: string; t: T }) {
  const why = reasonFor(p, occasion);
  const meta = [t(p.cuisineZh || '', p.cuisineEn || ''), p.suburb].filter(Boolean).join(' · ');
  return <article className="hl-food-card" data-food-id={p.id}>
    <h3 lang="en-NZ">{p.name}</h3>
    {meta && <p className="hl-food-meta">{meta}</p>}
    {why && <p className="hl-food-why">{t(why.whyZh, why.whyEn)}</p>}
    {p.price && <p className="hl-food-line"><span className="hl-food-label">{t('价格参考', 'Prices')}</span><span lang="en-NZ">{p.price.text}</span><Source url={p.price.url} t={t} /></p>}
    {p.address && <p className="hl-food-line"><MapPin aria-hidden="true" /><span lang="en-NZ">{p.address}</span></p>}
    <details className="hl-food-more">
      <summary>{t(`看依据（${p.facts.length} 条，都附来源）`, `Why we list it (${p.facts.length} sourced facts)`)}</summary>
      <ul className="hl-food-facts">{p.facts.map((f, i) => <li key={i}><span>{t(f.zh, f.en)}</span><Source url={f.url} t={t} /></li>)}</ul>
    </details>
    {p.hours.length > 0 && <details className="hl-food-more">
      <summary><Clock aria-hidden="true" />{t('营业时间（官网原文）', 'Opening hours (as published)')}</summary>
      <ul className="hl-food-hours" lang="en-NZ">{p.hours.map((h, i) => <li key={i}>{h.text}</li>)}</ul>
      <Source url={p.hours[0].url} t={t} />
    </details>}
    {p.website && <a className="sb-action hl-food-site" href={p.website} target="_blank" rel="noopener noreferrer">{/instagram\.com/.test(p.website) ? t('餐厅 Instagram', 'Restaurant Instagram') : t('餐厅官网', 'Restaurant website')}<ArrowUpRight aria-hidden="true" /></a>}
  </article>;
}

function PerkCard({ perk: p, t }: { perk: Perk; t: T }) {
  const where = cleanWhere(p.where);
  return <article className="hl-food-card" data-perk={p.name}>
    <h3 lang="en-NZ">{p.name}</h3>
    {where && <p className="hl-food-meta" lang="en-NZ">{where}</p>}
    <p className="hl-food-why">{t(p.perkZh, p.perkEn)}</p>
    <p className="hl-food-conditions"><span className="hl-food-label">{t('条件', 'Conditions')}</span>{t(p.conditionsZh, p.conditionsEn)}</p>
    <a className="sb-action hl-food-site" href={p.url} target="_blank" rel="noopener noreferrer">{t('看官方说明', 'Official details')}<ArrowUpRight aria-hidden="true" /></a>
  </article>;
}

const reduceMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** 「摇一个」: picks one place at random from the whole guide. */
function DicePick({ t }: { t: T }) {
  const [picked, setPicked] = useState<FoodPlace | null>(null);
  const [rolling, setRolling] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);
  const roll = () => {
    if (rolling) return;
    const final = pickRandom(DATA.places, picked?.id) as FoodPlace | null;
    if (!final) return;
    if (reduceMotion()) { setPicked(final); return; }
    let n = 0;
    setPicked(null);
    timer.current = window.setInterval(() => {
      n += 1;
      if (n >= 8) { clearInterval(timer.current!); timer.current = null; setRolling(null); setPicked(final); return; }
      setRolling((pickRandom(DATA.places, null) as FoodPlace).name);
    }, 70);
  };
  return <div className="hl-food-dice">
    <div className="hl-food-dice-row">
      <button type="button" className="hl-food-dice-btn" onClick={roll} aria-busy={!!rolling}><Dices aria-hidden="true" />{picked ? t('再摇一次', 'Roll again') : t('今天没主意？摇一个', 'No idea today? Roll the dice')}</button>
      {picked && <button type="button" className="hl-food-dice-close" onClick={() => setPicked(null)}>{t('收起', 'Close')}</button>}
      {rolling && <span className="hl-food-dice-rolling" lang="en-NZ">{rolling}</span>}
    </div>
    <div aria-live="polite">{picked && <div className="hl-food-dice-result"><p className="hl-food-count">{t(`从全部 ${DATA.places.length} 家里摇到了：`, `Picked from all ${DATA.places.length} places:`)}</p><PlaceCard place={picked} occasion={picked.occasions[0].id} t={t} /></div>}</div>
  </div>;
}

export function FoodGuide({ t }: { t: T }) {
  const [occasion, setOccasion] = useState(readOccasion);
  const choose = (id: string) => {
    setOccasion(id);
    const url = new URL(location.href);
    if (id === DEFAULT_OCCASION) url.searchParams.delete('o'); else url.searchParams.set('o', id);
    history.replaceState(history.state, '', url.pathname + url.search + url.hash);
  };
  const places = occasion === PERKS_ID ? [] : placesFor(DATA.places, occasion);
  const options = [...FOOD_OCCASIONS, { id: PERKS_ID, zh: '生日福利', en: 'Birthday perks' }];
  return <section className="hl-food" data-testid="food-guide">
    <DirectoryHeading zh="屯里食堂" en="Tron Eats" introZh="按场合找地方吃饭。不打分，只列在餐厅官网能查到的事实，每条都附来源。" introEn="Find somewhere to eat by occasion. No scores, just facts from each restaurant's own pages, with sources." t={t} />
    <DicePick t={t} />
    <div className="hl-food-filter" role="group" aria-label={t('选择场合', 'Choose an occasion')}>
      {options.map(o => <button key={o.id} type="button" aria-pressed={occasion === o.id} onClick={() => choose(o.id)}>{o.id === PERKS_ID && <Cake aria-hidden="true" />}{t(o.zh, o.en)}</button>)}
    </div>
    {occasion === PERKS_ID
      ? <><p className="hl-food-count">{t(`${DATA.perks.length} 个生日福利，大多要先加入会员，以官方说明为准。`, `${DATA.perks.length} birthday perks. Most need a membership first; check the official terms.`)}</p>
        <div className="hl-food-grid">{DATA.perks.map(p => <PerkCard key={p.name} perk={p} t={t} />)}</div></>
      : <><p className="hl-food-count">{t(`${places.length} 家 · 按店名排序`, `${places.length} places · sorted by name`)}</p>
        {occasion === 'trending' && <p className="hl-food-tip">{t('这里收的是 2025 至 2026 年被媒体写过的店，卡片里附报道链接。', 'Places featured by the media in 2025–2026, with a link to each article.')}</p>}
        {occasion === 'kids' && <p className="hl-food-tip">{t('给孩子办生日派对？', 'Planning a kids party?')} <a href={href('kids', 'parties')}>{t('去看派对与场地', 'See party venues')}</a></p>}
        <div className="hl-food-grid">{places.map(p => <PlaceCard key={p.id} place={p} occasion={occasion} t={t} />)}</div></>}
    <p className="hl-food-note">{t(`信息核对于 ${DATA.checked}。营业时间和价格会变，出发前请以餐厅官网为准。`, `Checked ${DATA.checked}. Hours and prices change, so check the restaurant's website before you go.`)} {t('开餐厅想让大家找到你？', 'Run a restaurant?')} <a href={href('services')}>{t('便民黄页免费入驻', 'List free in Local Services')}</a></p>
  </section>;
}
