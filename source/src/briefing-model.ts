import { normalizeCurrency } from './currency.mjs';

export type BriefingLang = 'zh' | 'en';
export type BriefingItem = {
  id: string; source: string; title: string; url: string; published: string | null;
  summary?: string; category: string; urgent?: boolean; summary_zh?: string; date_only?: boolean;
  expires_at?: string | null; ends_at?: string | null; reopen_at?: string | null;
  /** Manual editorial items (briefing-manual.json): short Chinese headline and fixed display order. */
  headline_zh?: string; order?: number; manual?: boolean;
  /** First sentence kept when an afternoon brief is shortened to a headline. */
  detail_zh?: string;
};
export type BriefingData = { generated_at: string; sample?: boolean; items: BriefingItem[] };

export const CATEGORY_LABELS: Record<string, string> = {
  breaking: '突发', police: '警方', council: '市政', roads: '路况',
  weather: '天气', civil_defence: '民防', news: '新闻',
};
export const CATEGORY_LABELS_EN: Record<string, string> = {
  breaking: 'Breaking', police: 'Police', council: 'Council', roads: 'Roads',
  weather: 'Weather', civil_defence: 'Civil Defence', news: 'News',
};
export const HOME_LIMIT = 6;
export const STALE_HOURS = 36;

export function categoryLabel(category: string, lang: BriefingLang = 'zh'): string {
  return (lang === 'en' ? CATEGORY_LABELS_EN[category] : CATEGORY_LABELS[category]) || CATEGORY_LABELS[category] || category;
}

/** True when briefing generated_at is older than thresholdHours (default 36h). */
export function isStaleBriefing(generatedAt: string, now: number = Date.now(), thresholdHours: number = STALE_HOURS): boolean {
  const t = Date.parse(generatedAt);
  if (isNaN(t)) return false;
  return now - t > thresholdHours * 3600000;
}

/** True only when an item carries a structured ISO end/reopen/expiry timestamp that has already passed. */
export function isExpiredItem(item: BriefingItem, now: number = Date.now()): boolean {
  const raw = item.expires_at ?? item.ends_at ?? item.reopen_at;
  if (!raw || typeof raw !== 'string') return false;
  const trimmed = raw.trim();
  if (!trimmed) return false;
  // Date-only YYYY-MM-DD stays valid through the end of that NZ calendar day.
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, mo, d] = trimmed.split('-').map(Number);
    const [ny, nmo, nd] = nzYmd(now);
    return Date.UTC(ny, nmo - 1, nd) > Date.UTC(y, mo - 1, d);
  }
  const t = Date.parse(trimmed);
  if (isNaN(t)) return false;
  return now > t;
}

export function visibleItems(items: BriefingItem[], now?: number): BriefingItem[] {
  return items.filter(i => {
    if (!Object.prototype.hasOwnProperty.call(CATEGORY_LABELS, i.category)) return false;
    if (now !== undefined && isExpiredItem(i, now)) return false;
    return true;
  });
}
export function sortItems(items: BriefingItem[]): BriefingItem[] {
  const time = (i: BriefingItem) => (i.published ? Date.parse(i.published) || 0 : 0);
  return [...items].sort((a, b) => Number(!!b.urgent) - Number(!!a.urgent) || time(b) - time(a));
}
export function prepareItems(items: BriefingItem[], now?: number): BriefingItem[] {
  return sortItems(visibleItems(items, now));
}
/** In ZH: summary_zh (NZD normalized), else English title. In EN: original English title, else summary, else Chinese fallback. */
export function itemText(i: BriefingItem, lang: BriefingLang = 'zh'): string {
  if (lang === 'en') {
    if (i.title && i.title.trim()) return i.title.trim();
    if (i.summary && i.summary.trim()) return i.summary.trim();
    return i.summary_zh && i.summary_zh.trim() ? normalizeCurrency(i.summary_zh) : '';
  }
  return i.summary_zh && i.summary_zh.trim() ? normalizeCurrency(i.summary_zh) : i.title;
}
/** Headline text: manual items show headline_zh in ZH (summary_zh then goes underneath); otherwise itemText. */
export function itemHeadline(i: BriefingItem, lang: BriefingLang = 'zh'): string {
  if (lang === 'zh' && i.headline_zh && i.headline_zh.trim()) return i.headline_zh.trim();
  return itemText(i, lang);
}

/** Up to two sentences, if they fit. A longer first sentence is cut at a clause instead. */
export const TEASER_MAX = 100;
/** Window used when the first sentence itself is longer than TEASER_MAX. */
export const TEASER_CLAUSE = 78;

const OPEN_BRACKETS = new Set(['（', '「', '『', '《', '(', '【', '“', '‘']);
const CLOSE_BRACKETS = new Set(['）', '」', '』', '》', ')', '】', '”', '’']);

function codePoints(text: string): string[] {
  return Array.from(text);
}

/** Full Chinese write-up (summary plus any detail sentence). English falls back to the same text. */
export function itemFullText(i: BriefingItem, lang: BriefingLang = 'zh'): string {
  const summary = i.summary_zh && i.summary_zh.trim() ? normalizeCurrency(i.summary_zh.trim()) : '';
  const detail = i.detail_zh && i.detail_zh.trim() ? normalizeCurrency(i.detail_zh.trim()) : '';
  let zh = summary;
  if (detail && !summary.includes(detail)) zh = summary ? summary + (/[。！？!?]$/.test(summary) ? '' : '。') + detail : detail;
  if (lang === 'en') {
    if (i.summary && i.summary.trim()) return i.summary.trim();
    if (!zh && i.title && i.title.trim()) return i.title.trim();
  }
  return zh || (i.title && i.title.trim()) || '';
}

/** Body for the article page: the Chinese write-up, or the English text when that is all there is. */
export function itemArticleText(i: BriefingItem): string {
  return itemFullText(i, 'zh') || (i.summary && i.summary.trim()) || (i.title && i.title.trim()) || '';
}

/** Text that follows a headline already shown as the title. Exact prefix only, so wording stays intact. */
export function textAfterHeadline(full: string, headline: string): string {
  const body = full.trim();
  const head = headline.trim();
  if (!body || !head || body === head) return body === head ? '' : body;
  if (body.startsWith(head)) return body.slice(head.length).replace(/^[：:，,。.!！？?\s]+/, '').trim();
  return body;
}

function splitSentences(text: string): string[] {
  const out: string[] = [];
  let buf = '';
  for (const ch of text) {
    buf += ch;
    if (ch === '。' || ch === '！' || ch === '？' || ch === '!' || ch === '?') {
      if (buf.trim()) out.push(buf.trim());
      buf = '';
    }
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

function truncateAtClause(text: string, max: number): string {
  const chars = codePoints(text.trim());
  if (chars.length <= max) return chars.join('');
  const slice = chars.slice(0, max);
  let depth = 0;
  let strong = -1;
  let soft = -1;
  const minStrong = Math.floor(max * 0.35);
  const minSoft = Math.floor(max * 0.45);
  for (let i = 0; i < slice.length; i++) {
    const ch = slice[i];
    if (OPEN_BRACKETS.has(ch)) depth++;
    else if (CLOSE_BRACKETS.has(ch)) depth = Math.max(0, depth - 1);
    else if (depth === 0) {
      if ('。！？!?；;'.includes(ch)) strong = i;
      else if ('，,、'.includes(ch)) soft = i;
    }
  }
  let cut = strong >= minStrong ? strong : soft >= minSoft ? soft : -1;
  let keepPunct = false;
  if (cut >= 0) keepPunct = '。！？!?'.includes(slice[cut]);
  let end = cut >= 0 ? (keepPunct ? cut + 1 : cut) : max;
  if (cut < 0) {
    const at = slice[end - 1] || '';
    if (/[A-Za-z0-9]/.test(at)) {
      let i = end - 1;
      while (i > 0 && /[A-Za-z0-9]/.test(slice[i])) i--;
      if (i >= minSoft) end = i;
    }
    // Back out of an unclosed bracket so we never end inside （Hamilton）.
    depth = 0;
    let openAt = -1;
    for (let i = 0; i < end; i++) {
      if (OPEN_BRACKETS.has(slice[i])) { depth++; openAt = i; }
      else if (CLOSE_BRACKETS.has(slice[i])) { depth = Math.max(0, depth - 1); if (!depth) openAt = -1; }
    }
    if (depth > 0 && openAt >= minSoft) end = openAt;
  }
  let result = chars.slice(0, end).join('').replace(/[\s，,、；;：:]+$/u, '').trim();
  if (!result) result = chars.slice(0, Math.min(max, chars.length)).join('').trim();
  if (result && !/[。！？!?…]$/.test(result)) result += '…';
  return result;
}

/** 1–2 sentences, or a clause cut when the first sentence is longer. Never splits a code point. */
export function itemTeaser(text: string, max: number = TEASER_MAX): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  const parts = splitSentences(clean);
  let chosen = '';
  for (let n = 1; n <= Math.min(2, parts.length); n++) {
    const candidate = parts.slice(0, n).join('');
    if (codePoints(candidate).length <= max) chosen = candidate;
    else break;
  }
  if (chosen) return chosen;
  return truncateAtClause(parts[0] || clean, Math.min(max, TEASER_CLAUSE));
}

/** Homepage title plus a short summary. Full wording stays on the article page. */
export function itemDisplay(i: BriefingItem, lang: BriefingLang = 'zh'): { title: string; teaser: string } {
  if (lang === 'en' && i.title && i.title.trim()) {
    return { title: i.title.trim(), teaser: itemTeaser(i.summary && i.summary.trim() ? i.summary.trim() : '') };
  }
  const title = ((i.headline_zh && i.headline_zh.trim()) || itemHeadline(i, lang)).trim();
  const extra = textAfterHeadline(itemFullText(i, 'zh'), title);
  if (extra) return { title, teaser: itemTeaser(extra) };
  if (codePoints(title).length > TEASER_CLAUSE) return { title: itemTeaser(title, TEASER_CLAUSE), teaser: '' };
  return { title, teaser: '' };
}
/** True when an item has an explicit editorial order (manual briefing). */
export const hasOrder = (i: BriefingItem) => typeof i.order === 'number' && Number.isFinite(i.order);
export function itemLang(i: BriefingItem, lang: BriefingLang = 'zh'): string {
  if (lang === 'en') return i.title?.trim() || i.summary?.trim() ? 'en-NZ' : 'zh-CN';
  return i.summary_zh && i.summary_zh.trim() ? 'zh-CN' : 'en-NZ';
}
export function formatUpdated(iso: string, lang: BriefingLang = 'zh'): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  if (lang === 'en') {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-NZ', {
      timeZone: 'Pacific/Auckland', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(d).map(x => [x.type, x.value]));
    return `${p.day} ${p.month}, ${p.hour}:${p.minute}`;
  }
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-NZ', {
    timeZone: 'Pacific/Auckland', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(d).map(x => [x.type, x.value]));
  return `${p.month}月${p.day}日 ${p.hour}:${p.minute}`;
}
export function formatBriefingDate(iso: string, lang: BriefingLang = 'zh'): string {
  const dateMs = Date.parse(iso);
  if (isNaN(dateMs)) return '';
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-NZ' : 'zh-CN', {
    timeZone: 'Pacific/Auckland', month: 'long', day: 'numeric', weekday: 'long',
  }).format(new Date(dateMs));
}
export function relativeTime(iso: string | null | undefined, now: number = Date.now(), lang: BriefingLang = 'zh'): string {
  if (!iso) return '';
  const t = Date.parse(iso);
  if (isNaN(t)) return '';
  const mins = Math.max(0, Math.round((now - t) / 60000));
  if (mins < 60) {
    const m = Math.max(mins, 1);
    return lang === 'en' ? (m === 1 ? '1 min ago' : `${m} mins ago`) : `${m}分钟前`;
  }
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) {
    return lang === 'en' ? (hrs === 1 ? '1 hour ago' : `${hrs} hours ago`) : `${hrs}小时前`;
  }
  const days = Math.floor(hrs / 24);
  return lang === 'en' ? (days === 1 ? '1 day ago' : `${days} days ago`) : `${days}天前`;
}

function nzYmd(ms: number): [number, number, number] {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-NZ', {
    timeZone: 'Pacific/Auckland', year: 'numeric', month: 'numeric', day: 'numeric',
  }).formatToParts(new Date(ms)).map(x => [x.type, x.value]));
  return [Number(p.year), Number(p.month), Number(p.day)];
}
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** date_only items show 今天 / 昨天 / M月D日 (EN: Today / Yesterday / D Mon) in NZ calendar dates; others a relative time. */
export function itemTime(i: Pick<BriefingItem, 'published' | 'date_only'>, now: number = Date.now(), lang: BriefingLang = 'zh'): string {
  if (!i.published) return '';
  if (!i.date_only) return relativeTime(i.published, now, lang);
  const t = Date.parse(i.published);
  if (isNaN(t)) return '';
  const [y, mo, d] = nzYmd(t), [ny, nmo, nd] = nzYmd(now);
  const diff = Math.round((Date.UTC(ny, nmo - 1, nd) - Date.UTC(y, mo - 1, d)) / 86400000);
  if (diff === 0) return lang === 'en' ? 'Today' : '今天';
  if (diff === 1) return lang === 'en' ? 'Yesterday' : '昨天';
  return lang === 'en' ? `${d} ${MONTHS_EN[mo - 1]}` : `${mo}月${d}日`;
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
export function arrangeItems(items: BriefingItem[], now?: number): { cards: BriefingItem[]; roadworks: BriefingItem[] } {
  const all = prepareItems(items, now);
  const time = (i: BriefingItem) => (i.published ? Date.parse(i.published) || 0 : 0);
  const ord = (i: BriefingItem) => (hasOrder(i) ? i.order! : Infinity);
  // Manual editorial order (owner-supplied items) wins over interest ranking.
  const cards = all.filter(i => !isRoadwork(i)).sort((a, b) => (ord(a) - ord(b) || 0) || interestScore(b) - interestScore(a) || time(b) - time(a));
  return { cards, roadworks: all.filter(isRoadwork) };
}
/** Hamilton place names (city + suburbs) used to spot stories about our own neighbourhoods. */
export const LOCAL_PLACES = /\b(?:Hamilton|Hillcrest|Fairfield|Rototuna|Chartwell|Flagstaff|Dinsdale|Frankton|Claudelands|Nawton|Melville|Glenview|Silverdale|Pukete|St Andrews|Huntington|Te Rapa|Enderley|Whitiora|Queenwood|Rotokauri|Peacocke|Bader|Fitzroy|Deanwell|Hamilton Lake|Beerescourt|Forest Lake|Maeroa|Crawshaw|Grandview|Western Heights|Riverlea|Ruakura|Tamahere)\b/i;
/** Everyday-life topics: water, transport, parks, schools, travel, food and festivals; not council finance on its own. */
export const LOCAL_LIFE = /\b(?:reservoirs?|water|wastewater|stormwater|tanks?|towers?|traffic|lights?|bus(?:es)?|parking|rubbish|bins?|parks?|playgrounds?|schools?|librar(?:y|ies)|pools?|cycleways?|footpaths?|housing|homes?|routes?|airport|flights?|festival|concerts?|markets?|restaurants?|caf[eé]s?|food|hospital|clinics?|power)\b/i;
export function isLocalLife(i: BriefingItem): boolean {
  const s = `${i.title} ${i.summary ?? ''}`;
  return LOCAL_PLACES.test(s) && LOCAL_LIFE.test(s);
}
export const NEWS_SECONDARY = 4;
export const NEWS_LATEST_LIMIT = 5;
/** News front-page selection (variant e): urgent -> alert strips, first non-urgent -> lead, next NEWS_SECONDARY -> secondary, rest -> latest. Order follows arrangeItems; nothing is duplicated. */
export function newsLayout(items: BriefingItem[], now?: number): { alerts: BriefingItem[]; lead?: BriefingItem; secondary: BriefingItem[]; latest: BriefingItem[]; roadworks: BriefingItem[] } {
  const { cards, roadworks } = arrangeItems(items, now);
  const alerts = cards.filter(i => i.urgent), nonUrgent = cards.filter(i => !i.urgent);
  // Owner rule (2026-11-18): the big headlines (lead + secondary) go to stories about everyday life in Hamilton first.
  const rest = nonUrgent.length && nonUrgent.every(hasOrder) ? nonUrgent : [...nonUrgent.filter(isLocalLife), ...nonUrgent.filter(i => !isLocalLife(i))];
  return { alerts, lead: rest[0], secondary: rest.slice(1, 1 + NEWS_SECONDARY), latest: rest.slice(1 + NEWS_SECONDARY), roadworks };
}
