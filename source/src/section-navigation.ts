import { AT_IDS, canonicalHash } from './tool-navigation';

export const SECTION_IDS = ['living', 'weekend', 'kids', 'services', 'tools'] as const;
export function sectionPath(route: string) {
  return route === 'home' ? '/' : '/' + route + '/';
}

// Retain old bookmarks, including legacy toolbox and pet category anchors.
export function legacyPath(hash: string): string | null {
  if (!hash.startsWith('#/') && !AT_IDS.has(hash.slice(1))) return null;
  const normalized = canonicalHash(hash);
  if (!hash.startsWith('#/') && normalized === '#/') return null;
  const [raw, query] = normalized.slice(2).split('?');
  const route = raw === 'whatson' ? 'weekend' : raw;
  if (route && !SECTION_IDS.includes(route as typeof SECTION_IDS[number])) return null;
  return (route ? sectionPath(route) : '/') + (query ? '?' + query : '');
}

export function routeUrl(url: URL): string {
  const legacy = legacyPath(url.hash);
  const direct = url.pathname.match(/^\/(living|weekend|kids|services|tools)(?:\/index\.html|\/)?$/);
  const target = legacy ?? (direct ? sectionPath(direct[1]) : url.pathname);
  const parsed = new URL(target, url.origin);
  const params = new URLSearchParams(url.search);
  parsed.searchParams.forEach((value, key) => params.set(key, value));
  const search = params.size ? '?' + params : '';
  const route = parsed.pathname.split('/')[1];
  const canonical = legacyPath('#/' + route + search);
  return (canonical ?? (parsed.pathname + search)) + (legacy === null ? url.hash : '');
}

export function normalizeLocation() {
  const next = routeUrl(new URL(location.href));
  if (next !== location.pathname + location.search + location.hash) history.replaceState(null, '', next);
}

export function navigate(href: string) {
  const url = new URL(href, location.href);
  if (url.origin !== location.origin) return;
  history.pushState(null, '', routeUrl(url));
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function followSectionLink(event: MouseEvent) {
  if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  const link = (event.target as Element).closest('a');
  if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
  const url = new URL(link.href, location.href);
  if (url.origin !== location.origin || url.hash || !/^\/(?:living\/|weekend\/|kids\/|services\/|tools\/)?$/.test(url.pathname)) return;
  event.preventDefault();
  navigate(link.href);
}
