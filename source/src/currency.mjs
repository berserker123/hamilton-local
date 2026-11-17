/** Owner rule (2026-11-18): every amount in Chinese site text is in 纽币 (NZ dollars). */
export function normalizeCurrency(zh) {
  if (!zh) return zh;
  return String(zh)
    .replace(/(?:新西兰元|新西兰币|纽西兰元|新元|纽元|美元)/g, '纽币')
    .replace(/(?:NZ)?\$\s?(\d[\d,.]*\s*(?:千万|百万|万|亿|千)?)/g, '$1纽币');
}