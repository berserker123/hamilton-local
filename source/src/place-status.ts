// Pure freshness rules for directory Places (ADR-0004). Not wired into the UI until listings exist.
export const STALE_DAYS = 90;
export const HIDE_AFTER_STALE_DAYS = 30;
export const machineTranslatedLabel = { zh: '机器翻译', en: 'Machine translated' };

export type PlaceVisibility = 'fresh' | 'stale' | 'hidden';

export function placeVisibility(verifiedAt: string, now: Date): PlaceVisibility {
  const verified = new Date(verifiedAt).getTime();
  if (Number.isNaN(verified)) return 'hidden';
  const days = (now.getTime() - verified) / 86400000;
  if (days > STALE_DAYS + HIDE_AFTER_STALE_DAYS) return 'hidden';
  if (days > STALE_DAYS) return 'stale';
  return 'fresh';
}
