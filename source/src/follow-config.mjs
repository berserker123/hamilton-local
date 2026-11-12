// Follow & email subscribe — the only place these values live.
//
// TODO(owner): fill in the two strings below, then rebuild from source/:
//   npm run build
// Until they are real https URLs, the site hides the matching control.
// Nothing is submitted, and the page never pretends a subscription succeeded.
//
// 1. XIAOHONGSHU_URL
//    Your Xiaohongshu profile. A full https link is best:
//    https://www.xiaohongshu.com/user/profile/YOUR_PROFILE_ID
//    Leave '' to hide the follow button.
//
// 2. EMAIL_SUBSCRIBE_ENDPOINT
//    Recommended provider: Buttondown (https://buttondown.com).
//    The free plan covers a small newsletter, the form is one POST, and you
//    can actually email subscribers later. After you create a username, set:
//    https://buttondown.com/api/emails/embed-subscribe/YOUR_USERNAME
//    This form sends a field named "email", which is what that endpoint expects.
//    Buttondown then shows its own confirmation page (do not fake success here).
//    Leave '' to hide the form.
//
//    The same "email" field also works with Formspree
//    (https://formspree.io/f/YOUR_FORM_ID) if you only want signup emails and
//    not a newsletter. Buttondown is the better fit for "subscribe".

export const XIAOHONGSHU_URL = '';
export const EMAIL_SUBSCRIBE_ENDPOINT = '';
export const EMAIL_FIELD_NAME = 'email';

export function configuredHttpsUrl(value) {
  const raw = String(value || '').trim();
  if (!raw || /TODO|YOUR_|example\.com|CHANGEME|PENDING/i.test(raw)) return '';
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:') return '';
    return url.toString();
  } catch {
    return '';
  }
}

export function xiaohongshuUrl() {
  return configuredHttpsUrl(XIAOHONGSHU_URL);
}

export function emailSubscribeEndpoint() {
  return configuredHttpsUrl(EMAIL_SUBSCRIBE_ENDPOINT);
}
