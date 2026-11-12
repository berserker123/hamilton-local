export const SECTION_ORDER = ['home','tools','living','weekend','kids','services'] as const;
const petAnchors = new Set(['pets', ...['shops','boarding','grooming','vets','dog-parks','daycare'].map(id=>'pet-'+id)]);
export const AT_IDS = new Set(['urgent-clinics','tool-school-terms','tool-find-school','stays','upick','everyday-places','tool-pay','tool-checklist','tool-gst','tool-units','tool-fishing','tool-pollen-flu',...petAnchors]);
export function canonicalHash(hash: string): string {
  const bare = hash.slice(1);
  if (petAnchors.has(bare)) return '#/services?tab=pets&at='+bare;
  if (!hash.startsWith('#/')) return '#/';
  const [path,query] = hash.slice(2).split('?');
  const params = new URLSearchParams(query);
  if (path === 'living' && (params.get('tab') === 'pets' || petAnchors.has(params.get('at') || ''))) {
    params.set('tab','pets');
    return '#/services?'+params;
  }
  return hash;
}
