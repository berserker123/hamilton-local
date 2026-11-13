export type PriceTone = 'is-faded' | 'is-tbc' | 'is-free' | 'is-priced';

const CLOSED = /售罄|已关闭|已结束|已取消|sold out|registrations closed/i;
const TBC = /待确认|\bTBC\b|\bTBA\b|unconfirmed/i;

export function displayPrice(zh: string, en: string) {
  return /^免费(入场)?$/.test(zh.trim()) ? { zh: '免费', en: 'Free' } : { zh, en };
}

export function priceTone(zh: string, en: string, past = false): PriceTone {
  const text = `${zh} ${en}`;
  if (past || CLOSED.test(text)) return 'is-faded';
  if (TBC.test(text)) return 'is-tbc';
  if (/免费/.test(zh) || /\bfree\b/i.test(en)) return 'is-free';
  return 'is-priced';
}
