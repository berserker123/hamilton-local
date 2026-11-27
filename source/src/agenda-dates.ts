// Calendar date labels for the events calendar, one per site language.
const WEEKDAYS_ZH = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parts(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return { month, day, weekday: new Date(Date.UTC(year, month - 1, day)).getUTCDay() };
}

/** 2026-11-28 → 11月28日 周六 */
export function chineseDate(date: string) {
  const { month, day, weekday } = parts(date);
  return `${month}月${day}日 ${WEEKDAYS_ZH[weekday]}`;
}

/** 2026-11-28 → Sat 28 Nov */
export function englishDate(date: string) {
  const { month, day, weekday } = parts(date);
  return `${WEEKDAYS_EN[weekday]} ${day} ${MONTHS_EN[month - 1]}`;
}
