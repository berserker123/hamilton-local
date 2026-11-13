import { BilingualTitle } from './BilingualTitle';
import { RegionFilter } from './RegionFilter';
import React, { useState } from 'react';
import VENUES from './party-venues.json';
import { PARTY_REGIONS, PARTY_TYPES, filterPartyVenues, partyDirections, partyPage } from './party-data';

type T = (zh: string, en: string) => string;
type Venue = typeof VENUES[number] & { service_area_zh?: string; service_area_en?: string; service_regions?: string[]; map_address?: string; map_precision?: string };
const ITEMS: Venue[] = VENUES;
const REGION_COUNTS = Object.fromEntries(PARTY_REGIONS.map(group => [group.id, filterPartyVenues(ITEMS, group.id, 'all').length]));

export function PartyVenues({ t, lang }: { t: T; lang: 'zh' | 'en' }) {
  const [region, setRegion] = useState('Hamilton');
  const [type, setType] = useState('all');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const filtered = filterPartyVenues(ITEMS, region, type);
  const shownRegions = PARTY_REGIONS.map(group => ({ ...group, venues: filtered.filter(venue => venue.region === group.id) })).filter(group => group.venues.length);
  const reset = () => { setRegion('Hamilton'); setType('all'); setExpanded({}); };

  return <div className="wa pv" data-party-venues>
    <div className="wa-heading">
      <div><p className="caption-4 wa-eyebrow">{t('亲子遛娃', 'Kids & family')}</p><h2 className="heading-4">{t('派对与场地', 'Parties & venues')}</h2><p className="caption-5 wa-muted">{t('按地区寻找游乐、运动、手作和聚会空间，也可选择上门派对服务。', 'Find play, sports, arts and gathering spaces by area, or choose a mobile party service.')}</p></div>
      <span className="wa-total caption-4">{VENUES.length} {t('项选择', 'options')}</span>
    </div>
    <RegionFilter label={t('按地区筛选场地', 'Filter venues by region')} moreLabel={t('更多地区', 'More areas')} attrName="data-party-region" value={region} onChange={id => { setRegion(id); setExpanded({}); }} options={[{ id: 'all', zh: '全部', en: 'All' }, ...PARTY_REGIONS].map(group => ({ id: group.id, label: t(group.zh, group.en), count: group.id === 'all' ? VENUES.length : REGION_COUNTS[group.id] }))} />
    <div className="pv-filter-row">
      <label className="pv-type caption-4" htmlFor="party-type">{t('场地类型', 'Venue type')}<select id="party-type" data-testid="party-type" value={type} onChange={e => { setType(e.target.value); setExpanded({}); }} aria-controls="party-results"><option value="all">{t('全部类型', 'All types')}</option>{PARTY_TYPES.map(item => <option key={item.id} value={item.id}>{t(item.zh, item.en)}</option>)}</select></label>
      <button className="wa-source button-sm pv-reset" onClick={reset}>{t('重置筛选', 'Reset filters')}</button>
    </div>
    <p className="wa-selection caption-5" role="status" aria-live="polite" aria-atomic="true">{t(`找到 ${filtered.length} 项选择`, `${filtered.length} options found`)} · {t('资料核对：2026年11月11日', 'Sources checked: 11 November 2026')}</p>
    <p className="pv-coverage caption-5">{t('地区数量包含官网明确覆盖当地的上门服务，服务单独分组；各地区数量不相加。更多地区在「更多地区」里。', 'Area counts include mobile services with stated local coverage, shown separately. Counts overlap. Further areas are under More areas.')}</p>
    <div id="party-results" className="wa-results" key={`${region}-${type}`}>
      {shownRegions.map(group => <section key={group.id} className="wa-region" data-party-group={group.id} aria-labelledby={`party-heading-${group.id.replaceAll(' ', '-')}`}>
        <div className="wa-region-heading"><h3 className="heading-5" id={`party-heading-${group.id.replaceAll(' ', '-')}`}>{t(group.zh, group.en)}</h3><span className="caption-4">{group.venues.length} {t('项', 'options')}</span></div>
        <div className="wa-market-rows" id={`party-rows-${group.id.replaceAll(' ', '-')}`}>
          {partyPage(group.venues, !!expanded[group.id]).map(venue => {
            const category = PARTY_TYPES.find(item => item.id === venue.type)!;
            return <article key={venue.id} className="wa-row pv-row" data-party-id={venue.id}>
              <div className="wa-time caption-4"><span>{t(category.zh, category.en)}</span><span className="pv-town caption-5">{t(venue.town, venue.town)}</span></div>
              <div className="wa-main">
                <BilingualTitle as="h4" className="title-3" zh={venue.name_zh} en={venue.name_en} t={t} />
                <p className="wa-venue caption-4"><span>{venue.type === 'mobile' ? t('服务范围：', 'Service area: ') + t(venue.service_area_zh || venue.town, venue.service_area_en || venue.town) : t(venue.address, venue.address)}</span></p>
                <p className="wa-hours caption-4">{t('适合年龄：', 'Ages: ')}{t(venue.ages_zh, venue.ages_en)}</p>
                <p className="pv-details caption-4">{t(venue.details_zh, venue.details_en)}</p>
              </div>
              <div className="wa-tail pv-tail"><p className="wa-price caption-4">{t(venue.price_zh, venue.price_en)}</p><div className="wa-sources caption-4"><a className="wa-source" href={venue.url} target="_blank" rel="noopener noreferrer" aria-label={`${t('官网与预订', 'Website & booking')} · ${venue.name_en}`}>{t('官网与预订', 'Website & booking')}<span aria-hidden="true">↗</span></a>{venue.type !== 'mobile' && <a className="wa-source" href={partyDirections(venue.map_address || venue.address)} target="_blank" rel="noopener noreferrer" aria-label={`Google Maps · ${venue.name_en}`}>{t('地图导航', 'Directions')}<span aria-hidden="true">↗</span></a>}</div></div>
            </article>;
          })}
        </div>
        {group.venues.length > 8 && <div className="pv-more"><span className="caption-5">{t(`已显示 ${partyPage(group.venues, !!expanded[group.id]).length} / ${group.venues.length} 项`, `Showing ${partyPage(group.venues, !!expanded[group.id]).length} of ${group.venues.length}`)}</span><button className="wa-chip button-xsm" data-party-more={group.id} aria-expanded={!!expanded[group.id]} aria-controls={`party-rows-${group.id.replaceAll(' ', '-')}`} onClick={() => setExpanded(current => ({ ...current, [group.id]: !current[group.id] }))}>{expanded[group.id] ? t('收起列表', 'Show fewer') : t(`显示更多（${group.venues.length - 8}）`, `Show more (${group.venues.length - 8})`)}</button></div>}
      </section>)}
      {filtered.length === 0 && <div className="pv-empty" data-testid="party-empty"><h3 className="title-3">{t('暂时没有匹配场地', 'No matching venues')}</h3><p className="caption-4">{t('试试其他类型，或重置回汉密尔顿全部场地。', 'Try another type, or reset to all Hamilton venues.')}</p><button className="wa-chip button-xsm" onClick={reset}>{t('显示汉密尔顿全部场地', 'Show all Hamilton venues')}</button></div>}
    </div>
    <p className="wa-footnote caption-5">{t('价格均为新西兰元，按项标注人数、时长或租用单位；普通门票不代表派对套餐。未公布的价格与年龄标为「待确认」。社区场地仅列可租用信息，不代表包含主持或餐饮，请向场地方确认适合年龄、人数及预订安排。', 'Prices are in NZD with the stated group, duration or hire unit. Admission is not a party package. Unpublished prices and ages are marked unconfirmed. Hire listings do not imply hosting or catering; confirm ages, capacity and bookings with each venue.')}</p>
  </div>;
}
