import PARTIES from './party-venues.json';
import PLAYGROUNDS from './playgrounds.json';
import { AGENDA } from './agenda-data';
import DATA from './events-and-markets.json';
import { pageHref } from './site-routes.mjs';

export const uniqueCount = (items: readonly { id: string }[]) => new Set(items.map(item => item.id)).size;
export const PREVIEW_PICKS = AGENDA.picks.slice(0, 3);

// Counts describe records in this guide, never users, endorsements or verified businesses.
export function guideStats(serviceCategories: number) {
  return [
    { id: 'parties', count: uniqueCount(PARTIES), label: { zh: '派对与场地条目', en: 'Party & venue entries' }, note: { zh: 'Hamilton 与 Waikato', en: 'Hamilton & Waikato' }, href: pageHref('kids', 'parties') },
    { id: 'playgrounds', count: uniqueCount(PLAYGROUNDS), label: { zh: '游乐场地点', en: 'Playground locations' }, note: { zh: '地图、设施与导航', en: 'Map, facilities & directions' }, href: pageHref('kids', 'map') },
    { id: 'picks', count: uniqueCount(AGENDA.picks), label: { zh: '本周精选条目', en: 'Weekly pick entries' }, note: { zh: DATA.week_label_zh + ' · ' + DATA.window.start.slice(0, 4), en: DATA.week_label_en }, href: pageHref('weekend', 'picks') },
    { id: 'categories', count: serviceCategories, label: { zh: '便民服务分类', en: 'Service categories' }, note: { zh: '内容整理中 · 暂无商家', en: 'No listings yet · Coming soon' }, href: pageHref('services', 'home') },
  ];
}
