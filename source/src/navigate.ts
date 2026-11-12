import { applyCardStyle } from './card-style';

/** Move to an in-app path without a full reload. Listeners use the `hl-navigate` event. */
export function navigate(url: string, replace = false) {
  const next = new URL(url, location.origin);
  const dest = next.pathname + next.search + next.hash;
  const current = location.pathname + location.search + location.hash;
  if (dest !== current) {
    if (replace) history.replaceState(null, '', dest);
    else history.pushState(null, '', dest);
  }
  applyCardStyle();
  window.dispatchEvent(new Event('hl-navigate'));
}
