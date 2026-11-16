import { PAGES, normalizeLocation } from './site-routes.mjs';

/** Same-document navigation; the shared event also drives route-sensitive controls. */
export function navigate(url: string, replace = false) {
  const next = new URL(url, location.href);
  if (next.origin !== location.origin) return;
  const current = new URLSearchParams(location.search);
  for (const key of ['cards', 'hero']) {
    if (!next.searchParams.has(key) && current.has(key)) next.searchParams.set(key, current.get(key)!);
  }
  const dest = normalizeLocation(next);
  if (dest !== location.pathname + location.search + location.hash) {
    if (replace) history.replaceState(null, '', dest);
    else history.pushState(null, '', dest);
  }
  window.dispatchEvent(new Event('hl-navigate'));
}

export function installNavigation() {
  const sync = () => navigate(location.href, true);
  // Normalize before React reads the initial route, including old bare anchors.
  const dest = normalizeLocation(location);
  if (dest !== location.pathname + location.search + location.hash) history.replaceState(null, '', dest);
  window.addEventListener('hashchange', sync);
  window.addEventListener('popstate', sync);
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = (event.target as Element)?.closest<HTMLAnchorElement>('a[href]');
    if (!anchor || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return;
    if (anchor.getAttribute('href')?.startsWith('#')) return;
    const url = new URL(anchor.href);
    if (url.origin !== location.origin || !PAGES.some(page => page.path === url.pathname)) return;
    event.preventDefault();
    navigate(url.href);
  });
}
