import DATA from './events-and-markets.json';

// Classification examines reader-facing titles and descriptions, never source URLs.
export function isFestival(item: Record<string, unknown>) {
  return /festival|fiesta|carnival|节|慶典|庆典/i.test(Object.entries(item)
    .filter(([key]) => /title|description|notes?|summary/i.test(key))
    .map(([, value]) => typeof value === 'string' ? value : '').join(' '));
}
function firstDate(item: { id: string; dates?: string[] }) {
  const dates = Array.isArray(item.dates) ? [...item.dates].sort() : [];
  return (dates[0] || '9999-99-99') + '\0' + item.id;
}
export function splitAgenda<E extends { id: string; dates?: string[] }, M extends { id: string; dates?: string[] }>(events: E[], markets: M[]) {
  const festivals = [...new Map([...events, ...markets].filter(isFestival).map(item => [item.id, item])).values()];
  const picks = [...new Map([...events.filter(item => !isFestival(item)), ...festivals].map(item => [item.id, item])).values()]
    .sort((a, b) => firstDate(a).localeCompare(firstDate(b)));
  return { picks, markets: markets.filter(item => !isFestival(item)), festivals };
}
export const AGENDA = splitAgenda(DATA.events_this_week, [...DATA.markets.already_on_site, ...DATA.markets.hamilton_new, ...DATA.markets.waikato_other]);
