import { BilingualTitle } from './BilingualTitle';
import { RegionFilter } from './RegionFilter';
import React, { useState } from 'react';
import { ArrowUpRight, MapPin } from 'lucide-react';
import DATA from './events-and-markets.json';
import { AGENDA } from './agenda-data';
import PHOTO from './weekend-photo.json';

type T = (zh: string, en: string) => string;
type Event = typeof DATA.events_this_week[number];
type Market = typeof DATA.markets.already_on_site[number] | typeof DATA.markets.hamilton_new[number] | typeof DATA.markets.waikato_other[number];
const regions = [
  { id: 'Hamilton', zh: '汉密尔顿', en: 'Hamilton' },
  { id: 'Cambridge', zh: '剑桥', en: 'Cambridge' },
  { id: 'Raglan', zh: '拉格伦', en: 'Raglan' },
  { id: 'other', zh: '其他怀卡托', en: 'Elsewhere in Waikato' },
];
const regionOf = (town: string) => ['Hamilton', 'Cambridge', 'Raglan'].includes(town) ? town : 'other';
const marketItems = AGENDA.markets;
const picks = AGENDA.picks;
const festivals = AGENDA.festivals.map(item => 'dates' in item ? item : {
  ...item, dates: [] as string[], time: item.hours, price_zh: '费用待确认', price_en: 'Price unconfirmed',
});
const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
export function chineseDate(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return `${month}月${day}日 ${weekdays[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]}`;
}
function Sources({ item, t }: { item: { source_url: string; also?: string[] }; t: T }) {
  const urls = [item.source_url];
  return <div className="wa-sources caption-4">{urls.map((url, i) => <a key={url} href={url} target="_blank" rel="noopener noreferrer" aria-label={`${t('查看来源', 'View source')} ${i + 1}${url.includes('facebook.com') ? ' Facebook' : ''}`} className="wa-source">{url.includes('openfoodnetwork.nz') ? t('来源待确认', 'Source unconfirmed') : i === 0 ? t('来源', 'Source') : url.includes('facebook.com') ? 'Facebook' : t(`来源 ${i + 1}`, `Source ${i + 1}`)}<ArrowUpRight aria-hidden="true" /></a>)}</div>;
}
function eventNotes(item: Event) {
  const notes: string[] = [];
  if (item.time.startsWith('待确认')) notes.push(item.time);
  if ('time_note_zh' in item && item.time_note_zh && item.time.startsWith('待确认')) notes.push(String(item.time_note_zh));
  if ('notes_zh' in item && item.notes_zh && (item.id === 'cambridge-art-trail' || item.id.startsWith('pixel-'))) notes.push(String(item.notes_zh));
  return notes;
}
function eventFaded(item: Event) {
  if (/售罄|已关闭|已结束|已取消|sold out|registrations closed/i.test(item.price_zh + ' ' + item.price_en)) return true;
  if (!item.dates.length) return false;
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Auckland' }).format(new Date());
  return [...item.dates].sort().at(-1)! < today;
}
function displayPrice(zh: string, en: string) {
  return /^免费(入场)?$/.test(zh.trim()) ? { zh: '免费', en: 'Free' } : { zh, en };
}
function priceTone(zh: string, en: string, faded: boolean) {
  if (faded) return ' is-faded';
  if (/待确认/.test(zh) || /unconfirmed/i.test(en)) return ' is-tbc';
  if (/^免费/.test(zh.trim())) return ' is-free';
  return '';
}
function EventRow({ item, t }: { item: Event; t: T }) {
  const multi = item.dates.length > 1;
  const notes = eventNotes(item);
  const timeUnconfirmed = !multi && item.time.startsWith('待确认');
  const when = multi
    ? `${chineseDate(item.dates[0])} – ${chineseDate(item.dates.at(-1)!)}`
    : (timeUnconfirmed ? t('时间待确认', 'Time unconfirmed') : item.time);
  const price = displayPrice(item.price_zh, item.price_en);
  return <article className="wa-row wa-event" data-event-id={item.id} data-past={eventFaded(item) ? 'true' : undefined}>
    <p className={'wa-time wa-event-time caption-4' + (timeUnconfirmed ? ' is-tbc' : '')}>{when}</p>
    <div className="wa-main wa-event-copy">
      <BilingualTitle as="h4" className="title-3 wa-event-title" zh={item.title_zh} en={item.title_en} t={t} />
      <p className="wa-venue caption-4"><MapPin aria-hidden="true" /><span>{t(item.venue, item.venue)}{regionOf(item.town) === 'other' ? ` · ${item.town}` : ''}</span></p>
      {multi && <p className="wa-hours caption-4">{item.time.replace('Sat ', t('周六 ', 'Sat ')).replace('Sun ', t('周日 ', 'Sun '))}</p>}
      {notes.length > 0 && <div className="wa-event-note">{notes.map(note => <p key={note} className="caption-5">{note}</p>)}</div>}
    </div>
    <div className="wa-tail wa-event-side">
      <p className={'wa-price caption-4' + priceTone(item.price_zh, item.price_en, eventFaded(item))}>{t(price.zh, price.en)}</p>
      <Sources item={item} t={t} />
    </div>
  </article>;
}
function MarketRow({ item, t }: { item: Market; t: T }) {
  const day = item.day.replace('Every Sunday', t('每周日', 'Every Sunday')).replace('2026-10-02', '10月2日');
  const past = ['cambridge-trash-n-treasure', 'morrinsville-country-market'].includes(item.id);
  const priced = DATA.events_this_week.find(event => event.town === item.town && event.title_zh === item.title_zh);
  const raw = 'price_zh' in item ? { zh: item.price_zh!, en: item.price_en! } : priced ? { zh: priced.price_zh, en: priced.price_en } : { zh: '费用待确认', en: 'Price unconfirmed' };
  const price = displayPrice(raw.zh, raw.en);
  const closed = past || /售罄|已关闭|已结束|已取消|sold out|registrations closed/i.test(raw.zh + ' ' + raw.en);
  return <article className="wa-row" data-weekend-market-id={item.id}>
    <div className={'wa-time caption-4' + (item.hours.startsWith('待确认') ? ' is-tbc' : '')}><span>{item.hours.startsWith('待确认') ? t('时间待确认', 'Time unconfirmed') : item.hours}</span></div>
    <div className="wa-main"><BilingualTitle as="h4" className="title-3" zh={item.title_zh} en={item.title_en} t={t} /><p className={'wa-hours caption-4' + (past ? ' wa-caution' : '')}>{past ? t('本周无场次 · ', 'No session this week · ') : ''}{day}</p><p className="wa-venue caption-4"><MapPin aria-hidden="true" /><span>{t(item.venue, item.venue)}{regionOf(item.town)==='other'?` · ${item.town}`:''}</span></p>{item.hours.startsWith('待确认') && <p className="wa-caution caption-5">{item.hours}</p>}{'note_zh' in item && item.note_zh && item.id === 'cambridge-trash-n-treasure' ? <p className="wa-caution caption-5">{item.note_zh}</p> : null}</div>
    <div className="wa-tail"><p className={'wa-price caption-4' + priceTone(raw.zh, raw.en, closed)}>{t(price.zh, price.en)}</p><Sources item={item} t={t} /></div>
  </article>;
}
function EventGroups({ items, t }: { items: Event[]; t: T }) {
  const days = [...new Set(items.filter(e => e.dates.length === 1).map(e => e.dates[0]))].sort();
  const continuous = items.filter(e => e.dates.length > 1).sort((a,b)=>a.dates[0].localeCompare(b.dates[0]));
  const groups = [...days.map(day=>({key:day, label:chineseDate(day), items:items.filter(e=>e.dates.length===1 && e.dates[0]===day).sort((a,b)=>a.time.localeCompare(b.time))})), ...(continuous.length?[{key:'ongoing',label:t('多日活动', 'Across several days'),items:continuous}]:[])];
  const undated=items.filter(e=>!e.dates.length);
  if(undated.length)groups.push({key:'unconfirmed',label:t('日期待确认','Dates unconfirmed'),items:undated});
  return <>{groups.map(group=><section key={group.key} className="wa-day" data-agenda-day={group.key} aria-label={group.label}><h3 className="wa-day-label caption-3">{group.key==='unconfirmed' ? group.label : group.key==='ongoing' ? <><span>{t('多日活动', 'Several days')}</span><small className="caption-5">{t('各项日期见下', 'See each date range')}</small></> : <time dateTime={group.key}>{group.label}</time>}</h3><div className="wa-day-rows">{group.items.map(item=><EventRow key={item.id} item={item} t={t}/>)}</div></section>)}</>;
}
export function WeekendAgenda({ mode, t }: { mode: 'picks' | 'markets' | 'festivals'; t: T }) {
  const [selection, setSelection] = useState('Hamilton');
  const items = mode==='picks' ? picks : mode==='festivals' ? festivals : marketItems;
  const available = regions.filter(region=>items.some(item=>regionOf(item.town)===region.id));
  const active = selection==='all' || available.some(r=>r.id===selection) ? selection : available[0]?.id || 'all';
  const shown = active==='all' ? available : available.filter(r=>r.id===active);
  return <div className="wa" data-agenda-mode={mode}><div className="wa-backdrop" aria-hidden="true" />
    <div className="wa-heading"><div><p className="caption-4 wa-eyebrow">{t(mode==='picks'?'本周精选':mode==='festivals'?'节日活动':'周末集市',mode==='picks'?'This week':mode==='festivals'?'Festivals':'Weekend markets')}</p><h2 className="heading-4" data-week-label>{DATA.week_label_zh}</h2><p className="caption-5 wa-muted" lang="en-NZ">{DATA.week_label_en}</p></div><span className="wa-total caption-4">{items.length} {t(mode!=='markets'?'项活动':'个集市',mode!=='markets'?'events':'markets')}</span></div>
    <RegionFilter label={t('按地区筛选', 'Filter by region')} moreLabel={t('更多地区', 'More areas')} attrName="data-region" value={active} onChange={setSelection} options={[{id:'all',zh:'全部',en:'All'},...available].map(region => ({ id: region.id, label: t(region.zh, region.en), count: region.id === 'all' ? items.length : items.filter(item => regionOf(item.town) === region.id).length }))} />
    <div id={`agenda-${mode}`} className="wa-results" key={`${mode}-${active}`}>
      {shown.map(region=><section className="wa-region" data-region-group={region.id} key={region.id} aria-labelledby={`region-${mode}-${region.id}`}>
        <div className="wa-region-heading"><p className="wa-region-kicker caption-5" role="status">{t(active==='all'?'按地区浏览全部条目':'已按地区筛选',active==='all'?'Showing all regions':'Filtered by region')} · {t(mode!=='markets'?'新西兰当地时间':'定期集市与本周单场',mode!=='markets'?'New Zealand local time':'Recurring markets and dated listings')}</p><div className="wa-region-bar"><div className="wa-region-names"><h2 className="heading-5" id={`region-${mode}-${region.id}`} lang={t('中','en')==='en'?'en-NZ':'zh-CN'}>{t('中','en')==='en'?region.en:region.zh}</h2>{t('中','en')!=='en' && <p className="ia-secondary-name" lang="en-NZ">{region.en}</p>}</div><span className="wa-region-count caption-4">{items.filter(i=>regionOf(i.town)===region.id).length} {t('项', 'listings')}</span></div></div>
        {mode!=='markets'?<EventGroups items={(mode==='festivals'?festivals:picks).filter(i=>regionOf(i.town)===region.id)} t={t}/>:<div className="wa-market-rows">{marketItems.filter(i=>regionOf(i.town)===region.id).map(item=><MarketRow key={item.id} item={item} t={t}/>)}</div>}
      </section>)}
    </div>
    <p className="wa-footnote caption-5">{t(mode!=='markets'?'多日活动仅列一次，日期范围随项保留。费用、报名与取消安排请查看来源；待确认信息未作推定。':'保留定期集市资料；本周已过的场次已注明，非全部在本周举行。费用与开放安排以来源为准。',mode!=='markets'?'Multi-day events appear once, with their date ranges. Check sources for prices, bookings and cancellations; unknown details remain unconfirmed.':'Recurring market directory. Past sessions are labelled and not all markets run this week. Check sources for current arrangements.')}</p>
    <p className="wa-photo-credit caption-5">{t('背景照片', 'Backdrop')} · {PHOTO.author} · <a href={PHOTO.licenseUrl} target="_blank" rel="noopener noreferrer">{PHOTO.license}</a> · <a href={PHOTO.source} target="_blank" rel="noopener noreferrer">{t(PHOTO.zh, PHOTO.en)}</a></p>
  </div>;
}
