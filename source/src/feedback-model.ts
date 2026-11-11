import { FEEDBACK_ACCESS_KEY } from './feedback-config';

export const FEEDBACK_TYPES = [
  { id: 'correction', zh: '信息纠错', en: 'Information correction' },
  { id: 'recommendation', zh: '新增推荐（店铺、活动、去处）', en: 'New recommendation (shop, event or place)' },
  { id: 'feature', zh: '功能建议', en: 'Feature suggestion' },
  { id: 'business', zh: '商家合作', en: 'Business enquiry' },
  { id: 'other', zh: '其他', en: 'Other' },
] as const;

export type FeedbackDraft = { type: string; message: string; name: string; contact: string; botcheck: string };
export type FeedbackContext = { url: string; section: string };
export type FeedbackErrors = Partial<Record<'type' | 'message' | 'name' | 'contact', string>>;
export const isPreviewFeedback = FEEDBACK_ACCESS_KEY === 'PENDING';
const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export function validateFeedback(draft: FeedbackDraft): FeedbackErrors {
  const errors: FeedbackErrors = {};
  if (!FEEDBACK_TYPES.some(type => type.id === draft.type)) errors.type = 'type';
  if (draft.message.trim().length < 5 || draft.message.length > 1000) errors.message = 'message';
  if (draft.name.length > 80) errors.name = 'name';
  if (draft.contact.length > 120 || (draft.contact.includes('@') && !isEmail(draft.contact.trim()))) errors.contact = 'contact';
  return errors;
}

export function feedbackPayload(draft: FeedbackDraft, context: FeedbackContext, lang: 'zh' | 'en', key: string) {
  const type = FEEDBACK_TYPES.find(type => type.id === draft.type)!;
  const contact = draft.contact.trim();
  return {
    access_key: key,
    subject: 'Hamilton Local 反馈：' + type[lang],
    from_name: 'Hamilton Local',
    type: type[lang],
    message: draft.message.trim(),
    name: draft.name.trim(),
    contact,
    ...(isEmail(contact) ? { replyto: contact } : {}),
    page_url: context.url,
    section: context.section,
    botcheck: Boolean(draft.botcheck),
  };
}

export function feedbackMailto(draft: FeedbackDraft, context: FeedbackContext, lang: 'zh' | 'en') {
  const data = feedbackPayload(draft, context, lang, '');
  const body = [data.type, data.message, '', `Name / 姓名: ${data.name || '—'}`, `Contact / 联系方式: ${data.contact || '—'}`, `Page / 页面: ${data.page_url}`, `Section / 位置: ${data.section}`].join('\n');
  return 'mailto:hello@hamiltonlocal.nz?subject=' + encodeURIComponent(data.subject) + '&body=' + encodeURIComponent(body);
}

export async function deliverFeedback(
  draft: FeedbackDraft, context: FeedbackContext, lang: 'zh' | 'en',
  options: { key?: string; fetcher?: typeof fetch; openMail?: (url: string) => void; signal?: AbortSignal } = {},
): Promise<'sent' | 'email' | 'blocked'> {
  if (draft.botcheck) return 'blocked';
  if (Object.keys(validateFeedback(draft)).length) throw new Error('Invalid feedback');
  const key = options.key ?? FEEDBACK_ACCESS_KEY;
  if (key === 'PENDING') {
    const url = feedbackMailto(draft, context, lang);
    if (options.openMail) options.openMail(url);
    else {
      const link = document.createElement('a');
      link.href = url;
      link.hidden = true;
      document.body.append(link);
      link.click();
      link.remove();
    }
    return 'email';
  }
  const response = await (options.fetcher ?? fetch)('https://api.web3forms.com/submit', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(feedbackPayload(draft, context, lang, key)), signal: options.signal,
  });
  if (!response.ok || (await response.json()).success !== true) throw new Error('Feedback submission failed');
  return 'sent';
}
