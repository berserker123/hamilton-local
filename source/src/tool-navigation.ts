export const SECTION_ORDER = ['home','tools','living','weekend','kids','services'] as const;
export const TOOL_TABS = [
  ['bins','垃圾清运','Bins'], ['urgent','急诊信息','Urgent care'], ['bus','市区公交','City buses'],
  ['pay','税后收入','Pay calculator'], ['checklist','新移民清单','Arrival checklist'],
  ['gst','GST计算','GST calculator'], ['units','单位换算','Unit converter'],
  ['seasonal','季节提醒','Seasonal'], ['other','其他工具','Other tools'],
];
const toolAnchors: Record<string,string> = {
  'tool-bins':'bins', 'urgent-clinics':'urgent', 'tool-transport':'bus', 'tool-pay':'pay', 'tool-checklist':'checklist',
  'tool-gst':'gst', 'tool-units':'units', 'tool-fishing':'seasonal', 'tool-pollen-flu':'seasonal',
  'tool-school-terms':'other', 'tool-find-school':'other',
  'tool-weather':'other', 'tool-outages':'other', 'tool-government':'other', 'tool-fuel':'other',
};
const petAnchors = new Set(['pets', ...['shops','boarding','grooming','vets','dog-parks','daycare'].map(id=>'pet-'+id)]);
export const AT_IDS = new Set(['stays','upick','everyday-places',...Object.keys(toolAnchors),...petAnchors]);
export function canonicalHash(hash: string): string {
  const bare = hash.slice(1);
  if (petAnchors.has(bare)) return '#/services?tab=pets&at='+bare;
  if (Object.hasOwn(toolAnchors,bare)) return '#/tools?tab='+toolAnchors[bare]+'&at='+bare;
  if (!hash.startsWith('#/')) return '#/';
  const [path,query] = hash.slice(2).split('?');
  const params = new URLSearchParams(query);
  if (path === 'tools') {
    if (params.get('tab') === 'transport') {
      params.set('tab','bus');
      if (!params.has('at')) params.set('at','tool-transport');
    }
    const at = params.get('at') || '';
    if (Object.hasOwn(toolAnchors,at)) params.set('tab',toolAnchors[at]);
    return '#/tools'+(params.size?'?'+params:'');
  }
  if (path === 'weekend' && params.get('tab') === 'festivals') {
    params.set('tab','picks');
    return '#/weekend?'+params;
  }
  if (path === 'living' && (params.get('tab') === 'pets' || petAnchors.has(params.get('at') || ''))) {
    params.set('tab','pets');
    return '#/services?'+params;
  }
  return hash;
}
