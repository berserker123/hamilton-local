export type BriefingItem = {
  id: string; source: string; title: string; url: string; published: string;
  summary?: string; category: string; urgent?: boolean; summary_zh?: string; date_only?: boolean;
};
export type BriefingData = { generated_at: string; sample?: boolean; items: BriefingItem[] };

export const CATEGORY_LABELS: Record<string, string> = {
  breaking: '突发', police: '警方', council: '市政', roads: '路况',
  weather: '天气', civil_defence: '民防', news: '新闻',
};
export const HOME_LIMIT = 6;

export function visibleItems(items: BriefingItem[]): BriefingItem[] {
  return items.filter(i => Object.prototype.hasOwnProperty.call(CATEGORY_LABELS, i.category));
}
export function sortItems(items: BriefingItem[]): BriefingItem[] {
  const time = (i: BriefingItem) => Date.parse(i.published) || 0;
  return [...items].sort((a, b) => Number(!!b.urgent) - Number(!!a.urgent) || time(b) - time(a));
}
export function prepareItems(items: BriefingItem[]): BriefingItem[] {
  return sortItems(visibleItems(items));
}
/** Chinese text only: summary_zh, else the English title. Never the English summary. */
export function itemText(i: BriefingItem): string {
  return i.summary_zh && i.summary_zh.trim() ? i.summary_zh : i.title;
}
export function formatUpdated(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-NZ', { timeZone: 'Pacific/Auckland', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(d).map(x => [x.type, x.value]));
  return `${p.month}月${p.day}日 ${p.hour}:${p.minute}`;
}
export function relativeTime(iso: string, now: number = Date.now()): string {
  const t = Date.parse(iso);
  if (isNaN(t)) return '';
  const mins = Math.max(0, Math.round((now - t) / 60000));
  if (mins < 60) return `${Math.max(mins, 1)}分钟前`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}小时前`;
  return `${Math.floor(hrs / 24)}天前`;
}

function nzYmd(ms: number): [number, number, number] {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-NZ', { timeZone: 'Pacific/Auckland', year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(new Date(ms)).map(x => [x.type, x.value]));
  return [Number(p.year), Number(p.month), Number(p.day)];
}
/** date_only items show 今天 / 昨天 / M月D日 (NZ calendar dates); others a relative time. */
export function itemTime(i: Pick<BriefingItem, 'published' | 'date_only'>, now: number = Date.now()): string {
  if (!i.date_only) return relativeTime(i.published, now);
  const t = Date.parse(i.published);
  if (isNaN(t)) return '';
  const [y, mo, d] = nzYmd(t), [ny, nmo, nd] = nzYmd(now);
  const diff = Math.round((Date.UTC(ny, nmo - 1, nd) - Date.UTC(y, mo - 1, d)) / 86400000);
  if (diff === 0) return '今天';
  if (diff === 1) return '昨天';
  return `${mo}月${d}日`;
}
/** Reader-interest ranking (owner requests 2026-11-17): council finance/infrastructure first, then lifestyle; routine roadworks collapsed. */
export const INTEREST_RULES = {
  lifestyle: /\b(?:food|eat(?:s|ing)?|restaurants?|caf[eé]s?|dish(?:es)?|menu|bestsellers?|festival|concerts?|gigs?|shows?|arts?|music|singing|markets?|events?|flights?|routes?|airport|airlines?|hotels?|openings?|opens|shops?|stores?|deals?|sales?|discounts?|free|family|kids|holidays?|christmas|black friday|beach|zoo|gardens)\b/i,
  people: /\b(?:awards?|honours?|honors?|wins?|winners?|celebrat\w*|the (?:man|woman|people) behind)\b/i,
  residentImpact: /\b(?:fees?|rates? (?:rise|increase|hike)|water (?:outage|shutdown|restrictions?)|boil water|rubbish|bins?|parking|bus(?:es)?|power cut)\b/i,
  civic: /\b(?:deficits?|coffers|unpaid rates|rates|budget|debt|wastewater|reservoirs?|stormwater|water (?:towers?|tanks?|supply)|tanks|credit rating|long-term plan|infrastructure|council)\b/i,
  roadwork: /\b(?:road ?works?|road closures?|closures?|stop\/go|SH ?\d+\w?)\b/i,
};
const ruleText = (i: BriefingItem) => `${i.title} ${i.summary ?? ''}`;
/** Routine (non-urgent) road items, plus news items that are really roadworks or closures. */
export function isRoadwork(i: BriefingItem): boolean {
  if (i.urgent) return false;
  if (i.category === 'roads') return true;
  return i.category === 'news' && INTEREST_RULES.roadwork.test(i.title);
}
export function interestScore(i: BriefingItem): number {
  if (i.urgent) return 100;
  const s = ruleText(i), r = INTEREST_RULES;
  if (i.category === 'weather' || i.category === 'civil_defence' || i.category === 'breaking') return 60;
  if (r.civic.test(s)) return 55;
  if (r.lifestyle.test(s)) return 50;
  if (r.residentImpact.test(s)) return 35;
  if (r.people.test(s)) return 30;
  return i.category === 'police' ? 20 : i.category === 'council' ? 10 : 15;
}
export function arrangeItems(items: BriefingItem[]): { cards: BriefingItem[]; roadworks: BriefingItem[] } {
  const all = prepareItems(items);
  const time = (i: BriefingItem) => Date.parse(i.published) || 0;
  const cards = all.filter(i => !isRoadwork(i)).sort((a, b) => interestScore(b) - interestScore(a) || time(b) - time(a));
  return { cards, roadworks: all.filter(isRoadwork) };
}
export const NEWS_SECONDARY = 4;
export const NEWS_LATEST_LIMIT = 5;
/** News front-page selection (variant e): urgent -> alert strips, first non-urgent -> lead, next NEWS_SECONDARY -> secondary, rest -> latest. Order follows arrangeItems; nothing is duplicated. */
export function newsLayout(items: BriefingItem[]): { alerts: BriefingItem[]; lead?: BriefingItem; secondary: BriefingItem[]; latest: BriefingItem[]; roadworks: BriefingItem[] } {
  const { cards, roadworks } = arrangeItems(items);
  const alerts = cards.filter(i => i.urgent), rest = cards.filter(i => !i.urgent);
  return { alerts, lead: rest[0], secondary: rest.slice(1, 1 + NEWS_SECONDARY), latest: rest.slice(1 + NEWS_SECONDARY), roadworks };
}
