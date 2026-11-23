export type SubscribeConfig = { provider: string; formAction: string; groups: Record<string, string>; baseGroups?: string[] };
export type SubscribeResult = 'soon' | 'invalid' | 'ok' | 'error';
type FetchLike = (url: string, init: { method: string; body: FormData }) => Promise<{ ok: boolean; json?: () => Promise<unknown> }>;

export function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
/** MailerLite embedded-form style POST. With no formAction nothing is sent. */
export async function submitSubscription(
  config: SubscribeConfig, email: string, topics: string[], fetchImpl: FetchLike = fetch as unknown as FetchLike,
): Promise<SubscribeResult> {
  if (!validEmail(email)) return 'invalid';
  if (!config.formAction) return 'soon';
  const body = new FormData();
  body.append('fields[email]', email.trim());
  // baseGroups is the Hamilton Local group, which receives the Monday email whatever topics are ticked.
  const groupIds = [...topics.map(id => config.groups[id]).filter(Boolean), ...(config.baseGroups || [])];
  for (const groupId of new Set(groupIds)) body.append('groups[]', groupId);
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
