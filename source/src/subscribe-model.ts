export type SubscribeConfig = { provider: string; formAction: string; groups: Record<string, string> };
export type TopicId = 'events' | 'briefing' | 'blackfriday';
export const TOPICS: ReadonlyArray<{ id: TopicId; zh: string; en: string }> = [
  { id: 'events', zh: '每周活动日历', en: 'Weekly events' },
  { id: 'briefing', zh: '每日快讯摘要', en: 'Daily briefing digest' },
  { id: 'blackfriday', zh: '黑五优惠', en: 'Black Friday deals' },
];
export type SubscribeResult = 'soon' | 'invalid' | 'ok' | 'error';
type FetchLike = (url: string, init: { method: string; body: FormData }) => Promise<{ ok: boolean; json?: () => Promise<unknown> }>;

export function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
/** MailerLite embedded-form style POST. With no formAction nothing is sent. */
export async function submitSubscription(
  config: SubscribeConfig, email: string, topics: TopicId[], fetchImpl: FetchLike = fetch as unknown as FetchLike,
): Promise<SubscribeResult> {
  if (!validEmail(email)) return 'invalid';
  if (!config.formAction) return 'soon';
  const body = new FormData();
  body.append('fields[email]', email.trim());
  for (const id of topics) if (config.groups[id]) body.append('groups[]', config.groups[id]);
  body.append('ml-submit', '1');
  body.append('anticsrf', 'true');
  try {
    const res = await fetchImpl(config.formAction, { method: 'POST', body });
    if (!res.ok) return 'error';
    // MailerLite answers HTTP 200 with {success:false,...} on rejected signups.
    if (typeof res.json === 'function') {
      const data = await res.json().catch(() => null) as { success?: boolean } | null;
      if (data && data.success === false) return 'error';
    }
    return 'ok';
  } catch {
    return 'error';
  }
}
