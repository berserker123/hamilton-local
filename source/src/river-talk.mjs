// 河边茶馆 / River Talk: shared by the SPA, static build, feed and tests.
export const ALERT_LIMIT = 3;
export const HOME_ARTICLE_LIMIT = 3;

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

export function articlesForBoard(data, board, now = Date.now()) {
  return activeArticles(data, now).filter(article => article.board === board);
}

export function formatTalkDate(date, lang) {
  const [y, m, d] = String(date).split('-').map(Number);
  if (!y || !m || !d) return '';
  if (lang === 'en') return d + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1] + ' ' + y;
  return y + '年' + m + '月' + d + '日';
}
