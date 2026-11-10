import React, { useEffect, useRef, useState } from 'react';
import { Search, Trash2, Bus, Stethoscope, MapPin, Clock, Calendar, ArrowUpRight, ArrowDown, X, Globe, Sparkles, Copy, Sun, Store, Trees, Wrench, BookOpen, ShieldCheck, ExternalLink } from 'lucide-react';
import { LogoMark } from './Logo';
import { BlurText, Reveal, HeroMedia } from './Motion';
import { SUPERMARKETS, URGENT, ROUTES, TEXT, LAKE_BAND } from './local-data';
import PLACES from './places.json';
import VERIFIED from './verified-urls.json';
import TEASER_IMAGES from './teaser-images.json';
import { WeekendAgenda } from './WeekendAgenda';
import { PlaygroundMap } from './PlaygroundMap';
import { ContactCard } from './ContactCard';
import { PartyVenues } from './PartyVenues';

type Lang = 'zh' | 'en';
type Route = 'home' | 'living' | 'weekend' | 'kids' | 'services' | 'tools';
type T = (zh: string, en: string) => string;
const CHECKED = '11月6日 周五';
const URLS = Object.fromEntries(VERIFIED.verified.map(item => [item.id, item.url]));
const SECTIONS = [
  { id: 'home', zh: '首页', en: 'Home', Icon: BookOpen },
  { id: 'living', zh: '生活与吃喝', en: 'Living & Dining', Icon: Store },
  { id: 'weekend', zh: '周末活动', en: "What's On", Icon: Calendar },
  { id: 'kids', zh: '亲子遛娃', en: 'Kids & Family', Icon: Trees },
  { id: 'services', zh: '便民黄页', en: 'Local Services', Icon: Wrench },
  { id: 'tools', zh: '实用工具箱', en: 'Daily Essentials', Icon: ShieldCheck },
] as const;
const MARKET_CHECKED = SUPERMARKETS.filter(s => s.verificationStatus === 'verified').length;
const MARKET_PENDING = SUPERMARKETS.length - MARKET_CHECKED;
const PAGE = {
  living: { zh: '从一日三餐，到日常散步。', en: 'Groceries, good food and a little fresh air.', photo: 'band-market.webp' },
  weekend: { zh: '留一点时间，给周末。', en: 'Make a little room for the weekend.', photo: 'band-hamilton-lake.webp' },
  kids: { zh: '陪孩子，把城市慢慢逛遍。', en: 'Small adventures, close to home.', photo: 'band-hamilton-lake.webp' },
  services: { zh: '家里家外，总有需要帮忙的时候。', en: 'A little help for everyday life.', photo: 'band-tools.webp' },
  tools: { zh: '把日常琐事，安排得更顺手。', en: 'The practical side of life, all in one place.', photo: 'band-tools.webp' },
};
const TABS = {
  living: [['grocers', '亚超与杂货', 'Asian grocers'], ['dining', '美食探索', 'Food discoveries'], ['places', '日常好去处', 'Everyday outings']],
  weekend: [['picks', '本周精选', 'This week'], ['markets', '周末集市', 'Weekend markets'], ['festivals', '节日活动', 'Festivals']],
  kids: [['map', 'Playground 地图', 'Playground map'], ['places', '遛娃好去处', 'Family outings'], ['parties', '派对与场地', 'Parties & venues']],
  services: [['home', '房屋维护', 'Home maintenance'], ['trades', '专业工种', 'Skilled trades'], ['daily', '生活便民', 'Everyday services']],
  tools: [['bins', '垃圾清运', 'Bins'], ['transport', '交通信息', 'Buses'], ['urgent', '急诊信息', 'Urgent care']],
};
function href(route: string, tab?: string, q?: string) {
  const params = new URLSearchParams();
  if (tab) params.set('tab', tab);
  if (q) params.set('q', q);
  return '#/' + (route === 'home' ? '' : route) + (params.size ? '?' + params : '');
}
function readRoute() {
  const [path, query] = location.hash.slice(2).split('?');
  const route = (SECTIONS.some(s => s.id === path) ? path : 'home') as Route;
  const params = new URLSearchParams(query);
  const tabs = route === 'home' ? [] : TABS[route];
  const tab = tabs.find(item => item[0] === params.get('tab'))?.[0] || tabs[0]?.[0] || '';
  return { route, tab, q: params.get('q') || '' };
}
function OutLink({ id, children, className = 'sb-action' }: { id: string; children: React.ReactNode; className?: string }) {
  if (!URLS[id]) return null;
  return <a className={className} href={URLS[id]} target="_blank" rel="noopener noreferrer">{children}<ArrowUpRight aria-hidden="true" /></a>;
}
function Empty({ t, title, detail }: { t: T; title?: string; detail?: string }) {
  return <div className="ia-empty sb-card" data-testid="empty-state"><span className="sb-icon-disc"><BookOpen /></span><p className="ia-kicker">{t('慢慢整理，认真收录', 'A guide worth taking time over')}</p><h2>{title || t('内容整理中', 'Coming soon')}</h2><p>{detail || t('确认好实用的信息，再和你分享。', 'We’re gathering useful local information to share here.')}</p></div>;
}
function Tabs({ route, tab, t }: { route: Exclude<Route, 'home'>; tab: string; t: T }) {
  const tabs = TABS[route];
  return <div role="tablist" aria-label={t(SECTIONS.find(s => s.id === route)!.zh, SECTIONS.find(s => s.id === route)!.en)} className="sb-tabs ia-tabs" onKeyDown={e => {
    const current = tabs.findIndex(item => item[0] === tab);
    const next = e.key === 'ArrowRight' ? (current + 1) % tabs.length : e.key === 'ArrowLeft' ? (current + tabs.length - 1) % tabs.length : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : -1;
    if (next < 0) return;
    e.preventDefault(); location.hash = href(route, tabs[next][0]);
    requestAnimationFrame(() => document.getElementById('tab-' + tabs[next][0])?.focus());
  }}>{tabs.map(([id, zh, en]) => <a key={id} id={'tab-' + id} data-testid={'tab-' + id} role="tab" aria-selected={id === tab} aria-controls="section-panel" tabIndex={id === tab ? 0 : -1} href={href(route, id)} className={'sb-tab ' + (id === tab ? 'sb-tab-on' : '')}>{t(zh, en)}</a>)}</div>;
}
function PlaceGrid({ places, lang, t }: { places: typeof PLACES; lang: Lang; t: T }) {
  return <div className="ia-place-grid">{places.map(p => <article className="sb-card ia-place" key={p.id} data-place-id={p.id}>
    {'photo' in p && p.photo ? <div className="ia-place-photo"><img src={'./photos/' + p.photo} alt={lang === 'zh' ? p.photoAlt : p.en.photoAlt} loading="lazy" /></div> : <div className="ia-place-symbol ia-photo-pending"><Trees aria-hidden="true" /><span className="caption-3">{t(p.zh, p.name)}</span><span className="caption-5">{t('实景照片待补充', 'Location photo pending')}</span></div>}
    <div className="ia-place-body"><span className="ia-kicker">{p.area} · {t('约', '~')}{p.km} km</span><h3>{t(p.zh, p.name)}</h3>{lang === 'zh' && <p className="ia-secondary-name">{p.name}</p>}<p>{t(p.description, p.en.description)}</p><p className="sb-icon-line"><MapPin /><span>{p.address}</span></p>{p.id === 'hamilton-gardens' ? <OutLink id="hamilton-gardens">{t('访问花园官网', 'Visit Hamilton Gardens')}</OutLink> : <span className="ia-place-note">{t('出发前请确认开放信息', 'Check opening details before visiting')}</span>}</div>
  </article>)}</div>;
}
// Family picks are derived from explicit child/family wording in the existing records.
const FAMILY_PLACES = PLACES.filter(p => p.km <= 10 && /kids|children|family|toddler|all ages/i.test(p.en.description + ' ' + p.en.tag));
const DAILY_PLACES = PLACES.filter(p => p.km <= 10 && !p.indoor);
function Living({ tab, query, lang, t, toast }: { tab: string; query: string; lang: Lang; t: T; toast: (text: string) => void }) {
  const [q, setQ] = useState(query);
  if (tab === 'dining') return <Empty t={t} title={t('美食探索 · 内容整理中', 'Food discoveries · Coming soon')} />;
  if (tab === 'places') {
    const places = DAILY_PLACES.filter(p => !q || [p.zh, p.name, p.area, p.description, p.en.description].join(' ').toLowerCase().includes(q.toLowerCase()));
    return <>{q && <div className="ia-list-toolbar"><p>{t('搜索', 'Search')}: {q}</p><button className="sb-action" onClick={() => setQ('')}>{t('清除搜索', 'Clear search')}<X /></button></div>}{places.length ? <PlaceGrid places={places} lang={lang} t={t} /> : <Empty t={t} title={t('没有匹配的地点', 'No matching places')} detail={t('试试其他关键词，或清除搜索。', 'Try another keyword or clear your search.')} />}</>;
  }
  const markets = SUPERMARKETS.filter(s => [s.name, s.zhName, s.address, s.suburb, ...s.tags.zh, ...s.tags.en].join(' ').toLowerCase().includes(q.trim().toLowerCase()));
  return <><div className="ia-list-toolbar"><p>{t(`${SUPERMARKETS.length} 家门店 · ${MARKET_CHECKED} 家已核对 · ${MARKET_PENDING} 家品牌待核实`, `${SUPERMARKETS.length} stores · ${MARKET_CHECKED} checked · ${MARKET_PENDING} brand unconfirmed`)}</p><label className="ia-inline-search"><Search /><input type="search" aria-label={t('搜索亚超', 'Search grocers')} value={q} onChange={e => setQ(e.target.value)} placeholder={t('门店、区域或地址', 'Store, suburb or address')} />{q && <button aria-label={t('清除搜索', 'Clear search')} onClick={() => setQ('')}><X /></button>}</label></div>
  <div className="ia-market-grid">{markets.map(s => <article key={s.id} data-market-id={s.id} className="sb-card ia-market-card"><div className="ia-card-top"><Store /><span className={'sb-tag ' + (s.verificationStatus === 'uncertain' ? 'ia-pending' : '')}>{s.verificationStatus === 'uncertain' ? t('品牌待核实', 'Brand unconfirmed') : s.suburb}</span></div><h2>{t(`${s.zhName} ${s.brand}`, s.name)}</h2>{lang === 'zh' && s.name !== s.zhName && <p className="ia-secondary-name">{s.name}</p>}<p className="sb-icon-line"><MapPin /><span>{s.address}</span></p><p className="sb-icon-line"><Clock /><span>{s.hours ? s.hours[lang] : t('电话与营业时间待核实', 'Phone and hours unverified')}</span></p>{s.phone && <p className="ia-phone">{s.phone}</p>}{s.verificationNote && <p className="ia-verification">{s.verificationNote[lang]}</p>}<div className="ia-card-bottom">{s.mapLink && <a className="sb-action" href={s.mapLink} target="_blank" rel="noopener noreferrer"><MapPin />{t('地图 / 导航', 'Map / Directions')}</a>}<span>{s.tags[lang].join(' · ')}</span><button className="sb-action" onClick={async () => { try { await navigator.clipboard.writeText(s.address); toast(t('地址已复制', 'Address copied')); } catch { toast(t('请选中卡片中的地址复制', 'Select the address on the card to copy it')); } }}><Copy />{t('复制地址', 'Copy address')}</button></div></article>)}</div>
  {!markets.length && <Empty t={t} title={t('没有匹配的门店', 'No matching stores')} detail={t('试试其他区域，或清除搜索。', 'Try another suburb or clear your search.')} />}
  <p className="ia-section-note">{t('营业时间沿用现有资料，出发前请确认。jany.io / edan.io 为第三方目录信息，非商家官网。', 'Hours come from the existing records; confirm before visiting. jany.io / edan.io are third-party directory listings, not official business sites.')}</p></>;
}
function Weekend({ tab, t }: { tab: string; t: T }) {
  return <><WeekendAgenda key={tab} mode={tab as 'picks' | 'markets' | 'festivals'} t={t} />{tab === 'festivals' && <aside className="wa-organiser"><span className="caption-3">{t('汉密尔顿 · 年度节庆入口', 'Hamilton · Annual festival')}</span><h3 className="title-3">{t('怀卡托热气球节', 'Balloons over Waikato')}</h3><p className="caption-4">{t('保留主办方入口。日期、场地与节目待确认，不列入本周场次。', 'Organiser directory. Dates, venues and programme unconfirmed; not a listing for this week.')}</p><OutLink id="balloons">{t('查看主办方', 'Visit organiser')}</OutLink></aside>}</>;
}
function Kids({ tab, lang, t }: { tab: string; lang: Lang; t: T }) {
  if (tab === 'places') return <PlaceGrid places={FAMILY_PLACES} lang={lang} t={t} />;
  if (tab === 'parties') return <PartyVenues t={t} />;
  return <PlaygroundMap lang={lang} t={t} />;
}
const SERVICE_CATS = {
  home: [['园艺与庭院', 'Garden & grounds'], ['房屋维修', 'Home repairs'], ['清洁整理', 'Cleaning']],
  trades: [['水管服务', 'Plumbing'], ['电工服务', 'Electrical'], ['木工与油漆', 'Carpentry & painting']],
  daily: [['搬家运输', 'Moving'], ['生活协助', 'Everyday help'], ['社区服务', 'Community services']],
};
function Services({ tab, t, toast }: { tab: string; t: T; toast: (text: string) => void }) {
  return <><div className="ia-category-grid">{SERVICE_CATS[tab as keyof typeof SERVICE_CATS].map(([zh, en]) => <div className="sb-card ia-category" key={en}><Wrench /><h2>{t(zh, en)}</h2><span>{t('内容整理中 · 暂无商家', 'Coming soon · No listings yet')}</span></div>)}</div><div className="sb-card ia-join"><div><p className="ia-kicker">{t('一起完善本地指南', 'Build a better local guide')}</p><h2>{t('在 Hamilton 提供服务？', 'Work with the Hamilton community?')}</h2><p>{t('商家入驻即将开放。', 'Business listings are coming soon.')}</p></div><button className="sb-action ia-primary" data-testid="join" onClick={() => toast(t('商家入驻 · 即将开放', 'Business listings · Coming soon'))}>{t('商家入驻', 'List your business')}<ArrowUpRight /></button></div></>;
}
const TOOL_GROUPS = [
  { zh: 'UV 与天气', en: 'Weather & UV', Icon: Sun, ids: ['metservice-hamilton', 'niwa-uv', 'niwa-uv-index'] },
  { zh: '学期与公共假期', en: 'Terms & public holidays', Icon: Calendar, ids: ['school-terms', 'public-holidays'] },
  { zh: '学区查询', en: 'Find a school', Icon: BookOpen, ids: ['find-school'] },
  { zh: '停水停电与道路施工', en: 'Outages & road works', Icon: Wrench, ids: ['wel-outages', 'hcc-roadworks', 'water-services', 'iawai'] },
  { zh: '常用政府入口', en: 'Government services', Icon: ShieldCheck, ids: ['govt-nz', 'hcc-home'] },
  { zh: '油价与充电桩', en: 'Petrol & EV charging', Icon: MapPin, ids: ['gaspy', 'charge-net', 'plugshare'] },
];
const SHORT_LABELS: Record<string, [string, string]> = {
  'metservice-hamilton': ['Hamilton 天气', 'Hamilton weather'], 'niwa-uv': ['NIWA UV 与臭氧', 'NIWA UV & ozone'], 'niwa-uv-index': ['NIWA UV 指数', 'NIWA UV index'], 'school-terms': ['教育部 · 学期与假期', 'Ministry of Education'], 'public-holidays': ['公共假期', 'Public holidays'], 'find-school': ['Education Counts · 找学校', 'Education Counts'], 'wel-outages': ['WEL · 停电信息', 'WEL outages'], 'hcc-roadworks': ['HCC · 道路施工', 'HCC road works'], 'water-services': ['HCC · 供水服务', 'HCC water services'], iawai: ['IAWAI · 供水', 'IAWAI water'], 'govt-nz': ['新西兰政府', 'govt.nz'], 'hcc-home': ['汉密尔顿市政', 'Hamilton City Council'], gaspy: ['Gaspy · 油价', 'Gaspy'], 'charge-net': ['ChargeNet · 充电网络', 'ChargeNet'], plugshare: ['PlugShare · 充电桩', 'PlugShare'],
};
function Tools({ tab, lang, t }: { tab: string; lang: Lang; t: T }) {
  const text = TEXT[lang];
  const bins = [{ color: 'red', label: text.red, note: text.redNote }, { color: 'yellow', label: text.yellow, note: text.yellowNote }, { color: 'glass', label: text.glass, note: text.glassNote }, { color: 'food', label: text.food, note: text.foodNote }];
  return <>{tab === 'bins' && <div className="sb-card sb-panel"><div className="sb-panel-heading"><span className="sb-icon-disc"><Trash2 /></span><div><h2>{text.binH}</h2><p>{text.binP}</p></div></div><div className="sb-bin-schedules">{[{ label: text.redWeek, items: [bins[0], bins[3]] }, { label: text.yellowWeek, items: [bins[1], bins[2], bins[3]] }].map(col => <div className="sb-bin-week" key={col.label}><h3><Calendar />{col.label}</h3>{col.items.map(b => <div className="sb-bin-row" key={b.color}><span className={'sb-bin-dot sb-dot-' + b.color} /><div><strong>{b.label}</strong><p>{b.note}</p></div></div>)}</div>)}</div><div className="sb-bin-lookup"><p>{text.binDay}</p><OutLink id="hcc-bins">{text.lookup}</OutLink></div><p className="sb-icon-line ia-section-note"><Clock /><span>{text.binTip}</span></p></div>}
  {tab === 'transport' && <div className="sb-card sb-panel"><div className="sb-panel-heading"><span className="sb-icon-disc"><Bus /></span><div><h2>{text.busH}</h2><p>{t('线路沿用现有资料；时刻表、票价及实时变更请查询 Busit。', 'Routes from the existing guide; check Busit for timetables, fares and live changes.')}</p></div></div><div className="sb-feature-routes">{ROUTES.filter(r => r.hf).map(r => <div className="sb-route sb-route-feature" key={r.n}><span className="sb-route-number">{r.n}</span><span><strong>{r.name}</strong><span className="sb-route-description">{lang === 'zh' ? r.zh : r.en}</span></span></div>)}</div><h3 className="ia-subheading">{text.allRoutes}</h3><div className="sb-routes">{ROUTES.filter(r => !r.hf).map(r => <div className="sb-route" key={r.n}><span className="sb-route-number">{r.n}</span><span>{r.name}</span></div>)}</div><div className="ia-panel-actions"><OutLink id="busit-routes">{t('查看 Hamilton 线路', 'View Hamilton routes')}</OutLink><OutLink id="busit">{text.planner}</OutLink><span>Busit · 0800 205 305</span></div></div>}
  {tab === 'urgent' && <div className="sb-card sb-panel ia-urgent"><div className="ia-emergency"><span>{text.em111Big}</span><strong>111</strong><p>{text.medDisc}</p></div><div className="ia-healthline"><ShieldCheck /><div><h2>Healthline · 0800 611 116</h2><p>{text.healthlineNote}</p></div><OutLink id="healthline">{t('Health NZ 健康热线', 'Health NZ Healthline')}</OutLink></div><div className="sb-clinics">{URGENT.map(c => <article className="sb-clinic" key={c.id}><h3>{t(c.zh, c.name)}</h3><p className="sb-icon-line"><Clock /><span>{c.hours[lang]}</span></p><p className="sb-icon-line"><MapPin /><span>{c.address}</span></p><p>{c.note[lang]}</p><div className="ia-clinic-foot"><strong>{c.phone}</strong>{c.id !== 'rototuna' ? <OutLink id={c.id === 'terapa' ? 'tui-te-rapa' : c.id === 'victoria' ? 'victoria-clinic' : 'anglesea'}>{t('诊所信息', 'Clinic information')}</OutLink> : <span>{t('官网链接待核对', 'Website link pending review')}</span>}</div></article>)}</div><p className="ia-section-note">{t('就医信息沿用现有资料，营业安排可能变化；出发前请致电确认。', 'Clinic details are from the existing guide. Hours can change; call before visiting.')}</p></div>}
  <div className="ia-tool-heading"><p className="ia-kicker">{t('更多日常入口', 'More everyday essentials')}</p><h2>{t('需要时，少找一会儿。', 'A few less things to search for.')}</h2></div><div className="ia-tool-grid">{TOOL_GROUPS.map(g => <article key={g.en} className="sb-card ia-tool-card"><g.Icon /><h3>{t(g.zh, g.en)}</h3><div>{g.ids.map(id => <OutLink id={id} key={id} className="ia-tool-link">{t(...SHORT_LABELS[id])}</OutLink>)}</div></article>)}</div></>;
}
function Modal({ kind, close, lang, t, route }: { kind: 'sources' | 'credits'; close: () => void; lang: Lang; t: T; route: Route }) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef(document.activeElement as HTMLElement | null);
  useEffect(() => { const dialog = ref.current!; dialog.showModal(); const old = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = old; dialog.close(); opener.current?.focus({ preventScroll: true }); }; }, []);
  const isSources = kind === 'sources';
  return <dialog ref={ref} className="sb-modal ia-dialog sb-dark" aria-labelledby="dialog-title" onCancel={e => { e.preventDefault(); close(); }} onClick={e => { if (e.target === e.currentTarget) { const r = e.currentTarget.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close(); } }}><div className="sb-modal-heading"><h2 id="dialog-title">{isSources ? t('资料来源', 'Sources') : t('图片来源与授权', 'Photo credits & licences')}</h2><button autoFocus className="sb-action" onClick={close} aria-label={t('关闭', 'Close')}><X /></button></div>{isSources ? <><p>{t('资料核对日期', 'Records checked')} · {CHECKED}</p>{route === 'living' && <><p className="ia-section-note">{t('原始来源集中列于此处。未在本次核对链接清单中的地址仅以文本保留。jany.io / edan.io 为目录信息，非商家官网。', 'Original references are collected here. Addresses outside the verified link list are retained as text. jany.io / edan.io are directory listings, not official merchant sites.')}</p><ul className="ia-source-list">{SUPERMARKETS.map(s => <li key={s.id}><h3>{t(`${s.zhName} ${s.brand}`, s.name)}</h3>{[...new Set(s.sources)].map(url => <div className="ia-source-record" key={url}><span>{/jany\.io|edan\.io/.test(url) ? t('目录信息 / directory listing', 'Directory listing') : t('公开资料', 'Public reference')}</span><code>{url}</code></div>)}</li>)}</ul></>}
  <h3>{t('已核对的外部入口', 'Verified external links')}</h3><div className="ia-verified-list">{VERIFIED.verified.map(v => <OutLink key={v.id} id={v.id} className="ia-tool-link">{lang === 'zh' ? v.label_zh : v.label_en}</OutLink>)}</div></> : <><p>{t('沿用工作区现有照片，保留作者、授权与原始出处。照片可能经裁剪、压缩及调色；未在核对清单中的出处仅作文本展示。', 'Existing workspace photographs, with original authors, licences and references retained. Images may be cropped, resized or graded. References outside the verified list are shown as text.')}</p><p className="ia-section-note">{t('hero-train、band-tools、band-market 与 band-urgent 为继承的设计素材，工作区未提供作者或授权记录。', 'hero-train, band-tools, band-market and band-urgent are inherited design assets without author or licence records in the workspace.')}</p><p className="ia-section-note"><a href="./photos/CREDITS-v17.md" target="_blank" rel="noopener noreferrer">{t('v17 新增照片授权记录：中央图书馆（2011年历史外观）', 'v17 photo licence record: Central Library (2011 historical exterior)')}<ArrowUpRight aria-hidden="true" /></a></p><ul className="ia-source-list">{TEASER_IMAGES.credits.map(image => <li key={image.id} data-photo-credit={image.id}><h3>{image.id}</h3><p>{image.sourceFile}</p><p>{image.author} · {image.license}</p><code>{image.url}</code><code>{image.licenseUrl}</code><p>{t('图片经裁剪、缩放并转换为 WebP，用于首页导览。', 'Cropped, resized and converted to WebP for homepage teasers.')}</p><p>{image.note}</p></li>)}<li><h3>{t(LAKE_BAND.zh, LAKE_BAND.name)}</h3><p>{LAKE_BAND.credit} · {LAKE_BAND.license}</p><code>{LAKE_BAND.source}</code><code>{LAKE_BAND.licenseUrl}</code></li>{PLACES.filter(p => 'photo' in p).map(p => 'photo' in p && <li key={p.id}><h3>{t(p.zh, p.name)}</h3><p>{p.photoCredit} · {p.photoLicense}</p><code>{p.photoSource}</code><code>{p.photoLicenseUrl}</code></li>)}</ul></>}</dialog>;
}
function Home({ lang, t, toast }: { lang: Lang; t: T; toast: (text: string) => void }) {
  const [query, setQuery] = useState('');
  const TEASER_PHOTOS = TEASER_IMAGES.lockedMix;
  function search(e: React.FormEvent) {
    e.preventDefault(); const q = query.trim();
    if (!q) return;
    if (/bin|bus|urgent|clinic|weather|school|垃圾|公交|急|天气|学区|工具/i.test(q)) { location.hash = href('tools', /bus|公交/i.test(q) ? 'transport' : /urgent|clinic|急/i.test(q) ? 'urgent' : 'bins'); return; }
    const place = PLACES.some(p => [p.zh, p.name, p.area].join(' ').toLowerCase().includes(q.toLowerCase()));
    location.hash = href('living', place ? 'places' : 'grocers', q);
  }
  const teaserDetails = {
    living: [t('把熟悉的味道，带回家。', 'A taste of home, close by.'), t('新宜超市 New Save · 物美超市 Wellmart · 华盛超市 Garden Fresh', 'New Save · Wellmart · Garden Fresh')],
    weekend: [t('周末慢一点，去湖边走走。', 'Slow down. Take a walk by the lake.'), t('汉密尔顿湖公园 · 汉密尔顿花园', 'Hamilton Lake · Hamilton Gardens')],
    kids: [t('小小探险，就在身边。', 'Little adventures, right here.'), FAMILY_PLACES.slice(0, 2).map(p => t(p.zh, p.name)).join(' · ')],
    services: [t('本地服务，认真整理。', 'Local help, thoughtfully gathered.'), t('房屋维护 · 专业工种 · 生活便民', 'Home maintenance · Trades · Everyday help')],
    tools: [t('生活琐事，一处找齐。', 'Everyday details, within reach.'), t('垃圾清运 · 公交 · 急诊', 'Bins · Buses · Urgent care')],
  };
  return <><section className="sb-hero"><HeroMedia /><div className="sb-hero-shade" /><div className="sb-hero-content"><div className="sb-sticker"><Sparkles size={14} />{t('Hamilton 与 Waikato 的日常生活指南', 'Your everyday guide to Hamilton & Waikato')}</div><h1 className="sb-h1" tabIndex={-1} key={lang}><BlurText className="sb-h1a" text={t('在汉密尔顿，', 'Life in Hamilton,')} /><BlurText className="sb-h1b" delay={120} text={t('把日子过得更顺手', 'made a little easier')} /></h1><p className="sb-lead">{t('从一日三餐到周末时光，从带娃出门到日常琐事。\n在这里，找到离生活近一点的信息。', 'From the weekly shop to a weekend outside. Find the local information that makes everyday life a little easier.')}</p><form className="sb-search ia-hero-search" onSubmit={search}><Search /><input type="search" aria-label={t('搜索本地信息', 'Search local information')} placeholder={t('搜亚超、地点、区域或工具…', 'Search grocers, places or tools…')} value={query} onChange={e => setQuery(e.target.value)} /><button className="sb-btn" type="submit">{t('搜索', 'Search')}</button></form><div className="ia-quick-links"><a href={href('living')}>{t('找亚超', 'Grocers')}</a><a href={href('kids', 'places')}>{t('带娃出门', 'Family outings')}</a><a href={href('tools')}>{t('查垃圾日', 'Bin days')}</a></div><a href="#overview" onClick={e => { e.preventDefault(); document.getElementById('overview')?.scrollIntoView({ behavior: 'smooth' }); }} className="sb-ghost ia-explore">{t('看看本地生活', 'Explore local life')}<ArrowDown /></a></div><div className="sb-hero-weather"><OutLink id="metservice-hamilton" className="sb-pill ia-weather"><Sun />{t('Hamilton 天气 · 查看预报', 'Hamilton weather · View forecast')}</OutLink></div><span className="sb-hero-location">Hamilton · Waikato · New Zealand</span></section>
  <Reveal id="overview" className="ia-overview"><div className="sb-container"><div className="ia-overview-title"><div><p className="ia-kicker">YOUR LOCAL FIELD GUIDE</p><h2>{t('生活在这里。', 'At home, here.')}</h2></div><p>{t('五个入口，照顾日常的不同片刻。', 'Five ways into everyday life in Hamilton.')}</p></div><div className="ia-teaser-grid">{SECTIONS.filter(s => s.id !== 'home').map((s, i) => <article key={s.id} data-teaser={s.id} className={'sb-card ia-teaser ia-teaser-' + s.id}><img className="ia-teaser-photo" src={'./' + TEASER_PHOTOS[s.id]} alt="" loading="lazy" /><div className="ia-teaser-top"><s.Icon /><span>0{i + 1} / {s.en.toUpperCase()}</span></div><h3>{t(s.zh, s.en)}</h3><p className="ia-teaser-title">{teaserDetails[s.id][0]}</p><p className="ia-teaser-detail">{teaserDetails[s.id][1]}</p><div className="ia-teaser-foot"><a href={href(s.id)} className="sb-action">{t('查看全部', 'View all')}<ArrowUpRight /></a>{s.id === 'services' && <button onClick={() => toast(t('商家入驻 · 即将开放', 'Business listings · Coming soon'))}>{t('商家入驻', 'List your business')}</button>}</div>{(s.id === 'tools' || s.id === 'weekend') && <div className="ia-tool-pills">{TABS[s.id].map(([id, zh, en]) => <a key={id} href={href(s.id, id)}>{t(zh, en)}</a>)}</div>}</article>)}</div></div></Reveal></>;
}
export default function App() {
  const [state, setState] = useState(readRoute);
  const [lang, setLang] = useState<Lang>(() => { try { return localStorage.getItem('hl-lang') === 'en' ? 'en' : 'zh'; } catch { return 'zh'; } });
  const [modal, setModal] = useState<'sources' | 'credits' | null>(null);
  const [message, setMessage] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  const t: T = (zh, en) => lang === 'zh' ? zh : en;
  const current = SECTIONS.find(s => s.id === state.route)!;
  function toast(text: string) { setMessage(text); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setMessage(''), 3200); }
  useEffect(() => { if (!location.hash.startsWith('#/')) history.replaceState(null, '', '#/'); const change = () => { setState(readRoute()); setModal(null); }; window.addEventListener('hashchange', change); return () => { window.removeEventListener('hashchange', change); clearTimeout(toastTimer.current); }; }, []);
  useEffect(() => { try { localStorage.setItem('hl-lang', lang); } catch {} document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en-NZ'; document.title = t(current.zh, current.en) + ' · Hamilton Local'; }, [lang, state.route]);
  const previousRoute = useRef(state.route);
  useEffect(() => { if (previousRoute.current !== state.route) { window.scrollTo({ top: 0, behavior: 'instant' }); document.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true }); previousRoute.current = state.route; } }, [state.route]);
  return <div className="sb-root sb-dark ia-root"><a className="ia-skip" href="#main" onClick={e => { e.preventDefault(); document.getElementById('main')?.focus(); }}>{t('跳转到内容', 'Skip to content')}</a><header className="sb-header"><div className="sb-header-inner"><a href={href('home')} className="sb-brand"><span className="sb-logo"><LogoMark /></span><span><span className="sb-brand-name">Hamilton Local</span><span className="sb-brand-sub">{t('汉密尔顿生活指南', 'Your local field guide')}</span></span></a><nav className="sb-desktop-nav" aria-label={t('主导航', 'Main navigation')}>{SECTIONS.map(s => <a key={s.id} href={href(s.id)} aria-current={s.id === state.route ? 'page' : undefined} className={'sb-nav ' + (s.id === state.route ? 'sb-nav-on' : '')}>{t(s.zh, s.en)}</a>)}</nav><div className="sb-header-actions"><span className="ia-preview">{t('预览', 'Preview')}</span><button data-testid="lang" className="sb-pill sb-language" aria-label={t('切换到英文', 'Switch to Chinese')} onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}><Globe />{lang === 'zh' ? 'EN' : '中文'}</button></div></div><nav className="sb-mobile-nav" aria-label={t('主导航', 'Main navigation')}>{SECTIONS.map(s => <a key={s.id} href={href(s.id)} aria-current={s.id === state.route ? 'page' : undefined} className={'sb-mnav ' + (s.id === state.route ? 'sb-nav-on' : '')}>{t(s.zh, s.en)}</a>)}</nav></header>
  <main id="main" tabIndex={-1}>{state.route === 'home' ? <Home lang={lang} t={t} toast={toast} /> : <><div className="ia-section-media" aria-hidden="true"><img src={'./photos/' + PAGE[state.route].photo} alt="" /></div><div className="sb-container ia-page-intro"><div className="ia-breadcrumb"><a href={href('home')}>{t('首页', 'Home')}</a><span>/</span><span>{t(current.zh, current.en)}</span></div><p className="ia-kicker">{current.en.toUpperCase()} · HAMILTON LOCAL</p><h1 className="ia-page-title" tabIndex={-1} key={current.id + lang}><BlurText text={t(current.zh, current.en)} /></h1><div className="ia-intro-bottom"><p>{t(PAGE[state.route].zh, PAGE[state.route].en)}</p><button data-testid="sources-btn" className="sb-action" onClick={() => setModal('sources')}><BookOpen />{t('资料来源', 'Sources')}</button></div></div><Reveal className="ia-content" key={state.route}><div className="sb-container"><Tabs route={state.route} tab={state.tab} t={t} /><div id="section-panel" role="tabpanel" aria-labelledby={'tab-' + state.tab} tabIndex={0}>
  {state.route === 'living' && <Living key={state.tab + state.q} tab={state.tab} query={state.q} lang={lang} t={t} toast={toast} />}
  {state.route === 'weekend' && <Weekend tab={state.tab} t={t} />}
  {state.route === 'kids' && <Kids tab={state.tab} lang={lang} t={t} />}
  {state.route === 'services' && <Services tab={state.tab} t={t} toast={toast} />}
  {state.route === 'tools' && <Tools tab={state.tab} lang={lang} t={t} />}
  </div></div></Reveal></>}</main>
  <footer className="sb-footer ia-footer"><div className="sb-container"><ContactCard t={t} /><div className="ia-footer-top"><div><a href={href('home')} className="sb-footer-brand"><LogoMark /><span>Hamilton Local</span></a><p>{t('离生活近一点。', 'A little closer to everyday life.')}</p></div><div className="ia-footer-actions"><button data-testid="credits-btn" className="sb-action" onClick={() => setModal('credits')}>{t('图片来源与授权', 'Photo credits')}<ArrowUpRight /></button><button className="sb-action" onClick={() => setModal('sources')}>{t('资料来源', 'Sources')}<BookOpen /></button></div></div><p className="ia-footer-note">{t('独立整理的本地生活指南，与所列机构及商家无关联。资料核对于', 'An independent local guide, unaffiliated with listed organisations and businesses. Records checked')} {CHECKED}。{t('信息可能变化，请以官方渠道为准。', ' Details may change; confirm with official sources.')}</p><div className="ia-footer-bottom"><span>© 2026 Hamilton Local</span><span>{t('本地预览 · 未发布', 'Local preview · Unpublished')}</span><span>Hamilton · Waikato · New Zealand</span></div></div></footer>
  {modal && <Modal kind={modal} close={() => setModal(null)} lang={lang} t={t} route={state.route} />}{message && <div role="status" className="ia-toast sb-toast"><Sparkles /><span>{message}</span></div>}</div>;
}
