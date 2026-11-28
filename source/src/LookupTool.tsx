import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, BookOpen, HeartPulse, MapPin, Search, Smile } from 'lucide-react';
import { href } from './site-routes.mjs';
import { BilingualTitle } from './BilingualTitle';
import { URGENT } from './local-data';
import PLAYGROUNDS from './playgrounds.json';
import { LOOKUP_DATA_URL, LookupAddress, LookupData, LookupIndex, addressAt, buildIndex, formatKm, nearest, searchAddresses, zoneOrder, zoneStartsLater, zoneTypeLabel } from './lookup-model';

type T = (zh: string, en: string) => string;
type Status = 'idle' | 'loading' | 'ready' | 'error';

let cached: Promise<LookupIndex> | null = null;
function loadIndex(): Promise<LookupIndex> {
  if (!cached) cached = fetch(LOOKUP_DATA_URL).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then((d: LookupData) => buildIndex(d));
  cached.catch(() => { cached = null; });
  return cached;
}
function todayNZ(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Auckland', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

export function LookupTool({ t }: { t: T }) {
  const chinese = t('中', 'en') !== 'en';
  const [status, setStatus] = useState<Status>('idle');
  const [index, setIndex] = useState<LookupIndex | null>(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<LookupAddress | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function ensureLoaded() {
    if (status === 'loading' || status === 'ready') return;
    setStatus('loading');
    loadIndex().then(i => { setIndex(i); setStatus('ready'); }).catch(() => setStatus('error'));
  }
  useEffect(() => { ensureLoaded(); }, []);

  const hits = useMemo(() => index && query.trim() ? searchAddresses(index, query) : [], [index, query]);
  useEffect(() => { setActive(0); }, [query]);

  function choose(i: number) {
    if (!index) return;
    const address = addressAt(index, i);
    setPicked(address);
    setQuery(index.labels[i]);
    setOpen(false);
  }
  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!hits.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive(a => (a + 1) % hits.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setOpen(true); setActive(a => (a - 1 + hits.length) % hits.length); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(hits[Math.min(active, hits.length - 1)]); }
    else if (e.key === 'Escape') setOpen(false);
  }

  const showList = open && hits.length > 0;
  const noMatch = status === 'ready' && open && query.trim().length >= 3 && /[a-z]/i.test(query) && hits.length === 0;

  return <section id="tool-lookup" className="v25g-tools hl-lookup">
    <div className="v25-directory-heading v25g-heading"><BilingualTitle as="h2" zh="一键查" en="Address lookup" t={t} /><p className="v25g-intro">{t('输入 Hamilton 的地址，一次看到：在哪些学校的学区内、最近的急诊、附近的游乐场。', 'Enter a Hamilton address to see its school zones, the nearest urgent care and playgrounds nearby.')}</p></div>
    <div className="sb-card v25g-calculator">
      <label className="hl-lookup-label" htmlFor="lookup-input">{t('地址（英文，例如 12 Grey Street）', 'Address (e.g. 12 Grey Street)')}</label>
      <div className="hl-lookup-field">
        <Search aria-hidden="true" />
        <input ref={inputRef} id="lookup-input" type="text" autoComplete="off" spellCheck={false} role="combobox" aria-expanded={showList} aria-controls="lookup-options" aria-autocomplete="list"
          aria-activedescendant={showList ? 'lookup-option-' + active : undefined} value={query} placeholder={t('门牌号 + 街道名', 'Number + street')}
          onFocus={() => { ensureLoaded(); setOpen(true); }} onChange={e => { setQuery(e.target.value); setOpen(true); }} onKeyDown={onKey} onBlur={() => window.setTimeout(() => setOpen(false), 150)} />
      </div>
      {showList && index && <ul id="lookup-options" role="listbox" className="hl-lookup-options" aria-label={t('匹配的地址', 'Matching addresses')}>{hits.map((i, n) =>
        <li key={i} id={'lookup-option-' + n} role="option" aria-selected={n === active} className={n === active ? 'is-active' : undefined} onMouseDown={e => { e.preventDefault(); choose(i); }} onMouseEnter={() => setActive(n)}>{index.labels[i]}</li>)}</ul>}
      <p className="v25g-hint" aria-live="polite" data-testid="lookup-status">{
        status === 'loading' ? t('正在载入地址数据（约 600KB，只在第一次载入）…', 'Loading address data (about 600 KB, first time only)…') :
        status === 'error' ? t('地址数据没载入成功，请刷新页面再试。', 'The address data did not load. Please refresh and try again.') :
        noMatch ? t('没找到这个地址。请用英文写门牌号和街道名；目前只收 Hamilton 市内的地址。', 'No match. Use the street number and name; only addresses inside Hamilton City are included.') :
        t('地址只在你的浏览器里查，不会发送给我们或任何人。', 'Your address is looked up in your browser and is never sent to us or anyone else.')}</p>
    </div>
    {picked && <LookupResults address={picked} chinese={chinese} t={t} />}
    <footer className="v25g-sources hl-lookup-sources"><span>{t('数据：地址来自 LINZ（CC BY 4.0，2026-11-28 下载）；学区边界来自教育部（CC BY 3.0 NZ，2026-10-02 版）。', 'Data: addresses from LINZ (CC BY 4.0, downloaded 2026-11-28); enrolment zones from the Ministry of Education (CC BY 3.0 NZ, 2 Oct 2026 edition).')}</span></footer>
  </section>;
}

function LookupResults({ address, chinese, t }: { address: LookupAddress; chinese: boolean; t: T }) {
  const today = todayNZ();
  const zones = [...address.zones].sort((a, b) => zoneOrder(a) - zoneOrder(b) || a.name.localeCompare(b.name));
  const clinics = nearest(URGENT, address, c => {
    const p = LOOKUP_CLINICS[c.id];
    return p ? { lat: p[0], lng: p[1] } : null;
  }, 3);
  const parks = nearest(PLAYGROUNDS, address, p => ({ lat: p.lat, lng: p.lng }), 3);
  return <div className="hl-lookup-results" data-testid="lookup-results">
    <p className="hl-lookup-picked"><MapPin aria-hidden="true" /><strong>{address.number} {address.road}</strong><span>{address.suburb}</span></p>
    <div className="hl-lookup-grid">
      <article className="sb-card hl-lookup-card" data-testid="lookup-zones">
        <div className="hl-lookup-card-top"><BookOpen aria-hidden="true" /><BilingualTitle zh="学区" en="School zones" t={t} /></div>
        {zones.length ? <ul className="hl-lookup-list">{zones.map(z => {
          const [zh, en] = zoneTypeLabel(z.type);
          return <li key={z.poly}><strong lang="en-NZ">{z.name}</strong><span>{t(zh, en)}{zoneStartsLater(z, today) && z.eff ? ' · ' + t(z.eff + ' 起生效', 'from ' + z.eff) : ''}</span></li>;
        })}</ul> : <p>{t('这个地址不在任何学校的学区内。', 'This address is not inside any school zone.')}</p>}
        <p className="v25g-hint">{t('只列出有学区的学校；没有学区的学校，谁都可以报名。教会学校和特殊学校还有别的入学条件。边界数据比较粗，住在边界附近请以学校官方为准。', 'Only schools with an enrolment zone are listed; schools without one accept anyone. Church and special-character schools have other entry rules. Boundaries are approximate, so near an edge, check with the school.')}</p>
        <a className="hl-lookup-more" href={href('tools', 'other', undefined, 'tool-find-school')}>{t('学区查询：看学校详情', 'Find a school: school details')}<ArrowRight aria-hidden="true" /></a>
      </article>
      <article className="sb-card hl-lookup-card" data-testid="lookup-urgent">
        <div className="hl-lookup-card-top"><HeartPulse aria-hidden="true" /><BilingualTitle zh="最近的急诊" en="Nearest urgent care" t={t} /></div>
        <ul className="hl-lookup-list">{clinics.map(({ item, km }) => <li key={item.id}><strong>{t(item.zh, item.name)}</strong><span>{formatKm(km, chinese)} · {item.hours[chinese ? 'zh' : 'en']}</span><a href={'tel:' + item.phone.replace(/\s/g, '')}>{item.phone}</a></li>)}</ul>
        <p className="v25g-hint">{t('危及生命请拨 111。距离是直线距离，实际路程会更远；出发前请先打电话确认。', 'For life-threatening emergencies call 111. Distances are straight-line; call before you go.')}</p>
        <a className="hl-lookup-more" href={href('tools', 'urgent', undefined, 'urgent-clinics')}>{t('急诊与健康热线', 'Urgent care & Healthline')}<ArrowRight aria-hidden="true" /></a>
      </article>
      <article className="sb-card hl-lookup-card" data-testid="lookup-playgrounds">
        <div className="hl-lookup-card-top"><Smile aria-hidden="true" /><BilingualTitle zh="附近的游乐场" en="Playgrounds nearby" t={t} /></div>
        <ul className="hl-lookup-list">{parks.map(({ item, km }) => <li key={item.id}><strong>{t(item.zh, item.name)}</strong><span>{formatKm(km, chinese)} · {item.area}</span></li>)}</ul>
        <p className="v25g-hint">{t('从网站收录的 ' + PLAYGROUNDS.length + ' 个游乐场里挑最近的。', 'Closest of the ' + PLAYGROUNDS.length + ' playgrounds in our guide.')}</p>
        <a className="hl-lookup-more" href={href('kids', 'map')}>{t('Playground 地图', 'Playground map')}<ArrowRight aria-hidden="true" /></a>
      </article>
    </div>
  </div>;
}

// Clinic positions come from LINZ address points for each clinic's listed address (built 2026-11-28).
// Rototuna is listed only as "cnr Horsham Downs Rd & Thomas Rd", so its point is the corner, about 30 m accuracy.
export const LOOKUP_CLINICS: Record<string, [number, number]> = {
  anglesea: [-37.79202, 175.28291],
  terapa: [-37.75757, 175.24687],
  victoria: [-37.7914, 175.28295],
  rototuna: [-37.73028, 175.273],
};
