export function filterPlaygrounds<P extends {area:string}>(places:P[],area:string,facility:string):P[]{
  return places.filter(p=>(area==='all'||p.area===area)&&(facility==='all'||(p as Record<string,unknown>)[facility]===true));
}
