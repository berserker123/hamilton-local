import PLAYGROUNDS from './playgrounds.json';
import PLACES from './places.json';
import EVENTS from './events-and-markets.json';

export type Bilingual = { zh: string; en: string };
export type CordPick = { id: string; type: string; name: Bilingual; info: Bilingual; href: string; dates?: string[]; tab?: string; target?: string };
export function nzToday() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Auckland', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
export function familyPicks(today = nzToday()): CordPick[] {
  return [
    ...PLAYGROUNDS.map(p => ({ id: 'pg-' + p.id, type: 'playground', name: { zh: p.zh, en: p.name }, info: { zh: p.highlightZh, en: p.highlightEn }, href: 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(`${p.lat},${p.lng}`) })),
    ...PLACES.filter(p => p.km != null && p.km <= 10 && /kids|children|family|toddler|all ages/i.test(p.en.description + ' ' + p.en.tag)).map(p => ({ id: 'venue-' + p.id, type: 'venue', name: { zh: p.zh, en: p.name }, info: { zh: p.description, en: p.en.description }, href: '#/kids?tab=places&q=' + encodeURIComponent(p.name), target: p.id })),
    ...EVENTS.events_this_week.filter(e => e.family_friendly === true && e.dates.some(d => d >= today)).map(e => ({ id: 'event-' + e.id, type: 'event', name: { zh: e.title_zh, en: e.title_en }, info: { zh: e.venue + ' · ' + e.dates.filter(d => d >= today).join(' / '), en: e.venue + ' · ' + e.dates.filter(d => d >= today).join(' / ') }, href: e.source_url, dates: e.dates })),
  ];
}
// One bag per page: use all eligible IDs before reshuffling; never repeat across a boundary.
export function createDrawBag(random = Math.random) {
  let remaining: string[] = [], previous: string | undefined;
  return (ids: string[]) => {
    if (!ids.length) { remaining = []; return undefined; }
    remaining = remaining.filter(id => ids.includes(id));
    if (!remaining.length) {
      remaining = [...ids];
      for (let i = remaining.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [remaining[i], remaining[j]] = [remaining[j], remaining[i]]; }
      if (remaining.length > 1 && remaining.at(-1) === previous) [remaining[0], remaining[remaining.length - 1]] = [remaining[remaining.length - 1], remaining[0]];
    }
    previous = remaining.pop(); return previous;
  };
}
