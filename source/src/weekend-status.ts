export type PriceTone = 'is-faded' | 'is-tbc' | 'is-free' | 'is-priced';

const CLOSED = /售罄|已关闭|已结束|已取消|sold out|registrations closed/i;
const TBC = /待确认|\bTBC\b|\bTBA\b|unconfirmed/i;

export function displayPrice(zh: string, en: string) {
  return /^免费(入场)?$/.test(zh.trim()) ? { zh: '免费', en: 'Free' } : { zh, en };
}

export function isWeekendDate(iso: string) {
  const [year, month, day] = iso.split('-').map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return weekday === 5 || weekday === 6 || weekday === 0;
}

export function weekendDates(start: string, end: string) {
  const dates: string[] = [];
  for (let time = Date.parse(start + 'T00:00:00Z'); time <= Date.parse(end + 'T00:00:00Z'); time += 86400000) {
    const iso = new Date(time).toISOString().slice(0, 10);
    if (isWeekendDate(iso)) dates.push(iso);
  }
  return dates;
}

export function isWeekendEvent(dates: readonly string[], start: string, end: string) {
  return dates.some(date => date >= start && date <= end && isWeekendDate(date));
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function weekendHeading(start: string, end: string) {
  const dates = weekendDates(start, end);
  const first = dates[0] ?? start;
  const last = dates[dates.length - 1] ?? end;
  const [y1, m1, d1] = first.split('-').map(Number);
  const [y2, m2, d2] = last.split('-').map(Number);
  const zh = m1 === m2 ? `${m1}月${d1}日–${d2}日` : `${m1}月${d1}日–${m2}月${d2}日`;
  const en = m1 === m2 && y1 === y2 ? `${d1}–${d2} ${MONTHS[m1 - 1]} ${y1}` : `${d1} ${MONTHS[m1 - 1]}–${d2} ${MONTHS[m2 - 1]} ${y2}`;
  return { zh, en, first, last };
}

export function priceTone(zh: string, en: string, past = false): PriceTone {
  const text = `${zh} ${en}`;
  if (past || CLOSED.test(text)) return 'is-faded';
  if (TBC.test(text)) return 'is-tbc';
  if (/免费/.test(zh) || /\bfree\b/i.test(en)) return 'is-free';
  return 'is-priced';
}
