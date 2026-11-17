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