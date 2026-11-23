// 屯里二三事 / Tron Talk: shared by the SPA, static build, feed and tests.
export const ALERT_LIMIT = 3;
export const HOME_CARD_LIMIT = 6;
export const TALK_TOPICS = [
  { id: 'money', zh: '钱袋子', en: 'Money' },
  { id: 'travel', zh: '出门在外', en: 'Getting around' },
  { id: 'kids', zh: '带娃日常', en: 'Kids' },
  { id: 'health', zh: '身子骨', en: 'Health' },
];

export function talkHref(id) {
  return id ? '/talk/' + encodeURIComponent(id) + '/' : '/talk/';
}

export function talkIdFromPath(pathname = '/') {
  const parts = String(pathname || '').split('/').filter(Boolean);
  if (parts[0] !== 'talk' || !parts[1]) return '';
  try { return decodeURIComponent(parts[1]); } catch { return ''; }
}

/** Calendar date in New Zealand, so content expires at local midnight. */
export function nzDate(now = Date.now()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Auckland', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now));
}

export const isCurrent = (until, now = Date.now()) => !until || nzDate(now) <= until;

export function activeAlerts(data, now = Date.now()) {
  return (data.alerts || [])
    .filter(alert => isCurrent(alert.until, now))
    .sort((a, b) => a.until.localeCompare(b.until))
    .slice(0, ALERT_LIMIT);
}

export function activeArticles(data, now = Date.now()) {
  return (data.articles || [])
    .filter(article => isCurrent(article.validUntil, now))
    .sort((a, b) => b.published.localeCompare(a.published));
}

export function activeNews(data, now = Date.now()) {
  return (data.news || [])
    .filter(item => isCurrent(item.until, now))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Homepage cards: hand-picked items first, then the newest. Expired items drop out automatically. */
export function homeFeed(data, now = Date.now()) {
  const news = activeNews(data, now).map(item => ({ kind: 'news', item, date: item.date }));
  const articles = activeArticles(data, now).map(item => ({ kind: 'article', item, date: item.published }));
  const rank = entry => entry.item.home ?? Number.MAX_SAFE_INTEGER;
  return [...news, ...articles]
    .sort((a, b) => rank(a) - rank(b) || b.date.localeCompare(a.date))
    .slice(0, HOME_CARD_LIMIT);
}

export const hasTopic = (item, topic) => topic === 'all' || (item.topics || []).includes(topic);

export function articlesForBoard(data, board, now = Date.now()) {
  return activeArticles(data, now).filter(article => article.board === board);
}

export function formatTalkDate(date, lang) {
  const [y, m, d] = String(date).split('-').map(Number);
  if (!y || !m || !d) return '';
  if (lang === 'en') return d + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1] + ' ' + y;
  return y + '年' + m + '月' + d + '日';
}
