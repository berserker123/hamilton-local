import React, {useEffect,useMemo,useRef,useState} from 'react';
import * as L from 'leaflet';
import {MapPin,ArrowUpRight,RotateCcw,Trees} from 'lucide-react';
import DATA from './playgrounds.json';
import {filterPlaygrounds} from './playground-filters';
type T=(zh:string,en:string)=>string;
type Place=typeof DATA[number];
const navigation=(p:Place)=>'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(`${p.lat},${p.lng}`);
const fields=[['fenced','围栏','Fenced'],['toilets','厕所','Toilets'],['shade','遮阳','Shade']] as const;
function facts(p:Place,t:T){return fields.map(([key,zh,en])=>`${t(zh,en)}：${p[key]===true?t('有','Yes'):p[key]===false?t('无','No'):t('待确认','Unconfirmed')}`).join(' · ');}
function popup(p:Place,lang:string,t:T){
  const box=document.createElement('div');box.className='pg-popup';box.dataset.popupId=p.id;
  const add=(tag:string,text:string)=>{const el=document.createElement(tag);el.textContent=text;box.append(el);return el;};
  add('span',p.area);add('h3',lang==='zh'?p.zh:p.name);if(lang==='zh')add('p',p.name);
  add('p',p.address);add('p',lang==='zh'?p.highlightZh:p.highlightEn);add('p',facts(p,t));add('p',t('适合年龄：','Ages: ')+(lang==='zh'?p.ageZh:p.ageEn));
  const a=add('a',t('Google Maps 导航 ↗','Google Maps directions ↗')) as HTMLAnchorElement;a.href=navigation(p);a.target='_blank';a.rel='noopener noreferrer';
  return box;
}
export function PlaygroundMap({lang,t}:{lang:'zh'|'en';t:T}){
  const [area,setArea]=useState('all'),[facility,setFacility]=useState('all');
  const [selected,setSelected]=useState(''),[status,setStatus]=useState<'loading'|'ready'|'failed'>('loading'),[retry,setRetry]=useState(0),[ready,setReady]=useState(false);
  const container=useRef<HTMLDivElement>(null),map=useRef<L.Map|null>(null),markers=useRef<Record<string,L.Marker>>({});
  const areas=useMemo(()=>[...new Set(DATA.map(p=>p.area))].sort(),[]);
  const shown=useMemo(()=>filterPlaygrounds(DATA,area,facility),[area,facility]);
  useEffect(()=>{
    if(!container.current)return;
    let disposed=false,loaded=false;setStatus('loading');
    try{
      const m=L.map(container.current,{scrollWheelZoom:false,zoomAnimation:false,fadeAnimation:false,markerZoomAnimation:false}).setView([-37.77,175.28],12);map.current=m;
      m.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
      const layer=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'});
      layer.on('tileload',()=>{loaded=true;if(!disposed)setStatus('ready');});
      layer.on('tileerror',()=>{if(!loaded&&!disposed)setStatus('failed');});layer.addTo(m);setReady(true);
      const resize=new ResizeObserver(()=>m.invalidateSize({pan:false}));resize.observe(container.current);
      const timer=window.setTimeout(()=>{if(!loaded&&!disposed)setStatus('failed');},12000);
      return ()=>{disposed=true;clearTimeout(timer);resize.disconnect();setReady(false);markers.current={};m.remove();map.current=null;};
    }catch{setStatus('failed');return ()=>{disposed=true;map.current?.remove();map.current=null;};}
  },[retry]);
  useEffect(()=>{
    const m=map.current;if(!m||!ready)return;
    const layer=L.layerGroup().addTo(m);const next:Record<string,L.Marker>={};
    shown.forEach(p=>{
      const n=DATA.findIndex(item=>item.id===p.id)+1;
      const marker=L.marker([p.lat,p.lng],{title:p.name,alt:p.name,icon:L.divIcon({className:'pg-pin',html:`<span>${String(n).padStart(2,'0')}</span>`,iconSize:[32,40],iconAnchor:[16,40],popupAnchor:[0,-36]})}).addTo(layer);
      marker.bindPopup(popup(p,lang,t),{maxWidth:320,minWidth:200,autoPanPadding:L.point(24,24)}).on('click',()=>setSelected(p.id));next[p.id]=marker;
    });markers.current=next;
    if(shown.length)m.fitBounds(L.latLngBounds(shown.map(p=>[p.lat,p.lng] as L.LatLngTuple)),{padding:[40,48],maxZoom:14,animate:false});
    return ()=>{m.removeLayer(layer);markers.current={};};
  },[shown,lang,ready,retry]);
  function reset(){setArea('all');setFacility('all');setSelected('');map.current?.closePopup();map.current?.fitBounds(L.latLngBounds(DATA.map(p=>[p.lat,p.lng] as L.LatLngTuple)),{padding:[40,48],maxZoom:14,animate:false});}
  function choose(p:Place){setSelected(p.id);if(map.current&&markers.current[p.id]){map.current.setView([p.lat,p.lng],15,{animate:false});markers.current[p.id].openPopup();container.current?.scrollIntoView({block:'nearest',behavior:'instant'});}}
  return <section className="pg" aria-labelledby="pg-title">
    <div className="pg-heading"><div><p className="caption-3 pg-eyebrow">LITTLE ADVENTURES · HAMILTON</p><h2 id="pg-title" className="heading-4">{t('下一站，去哪里放电？','Where shall we play next?')}</h2><p className="body-6">{t('选个区域，找一处适合今天的小小探险。','Choose a neighbourhood for today’s little adventure.')}</p></div><span className="pg-count caption-3">{DATA.length} {t('处真实地点','real places')}</span></div>
    <div className="pg-filters"><label className="caption-3">{t('区域','Area')}<select data-testid="pg-area" value={area} onChange={e=>{setArea(e.target.value);setSelected('');}}><option value="all">{t('全部区域','All areas')}</option>{areas.map(a=><option key={a}>{a}</option>)}</select></label><label className="caption-3">{t('设施','Facilities')}<select data-testid="pg-facility" value={facility} onChange={e=>{setFacility(e.target.value);setSelected('');}}><option value="all">{t('全部设施','All facilities')}</option>{fields.map(([key,zh,en])=><option key={key} value={key}>{t(zh+'已确认',en+' confirmed')}</option>)}</select></label><button className="pg-reset button-sm" onClick={reset}><RotateCcw aria-hidden="true"/>{t('重置','Reset')}</button><p className="caption-5 pg-result-count" role="status">{t(`找到 ${shown.length} 处`,`Showing ${shown.length} places`)}</p></div>
    <div className="pg-layout"><div className="pg-map-panel"><div ref={container} className="pg-map" role="region" aria-label={t('Hamilton 游乐场交互地图','Interactive Hamilton playground map')} data-testid="playground-map" data-map-status={status}/>{status!=='ready'&&<div className="pg-map-status" role="status"><Trees aria-hidden="true"/><strong className="title-3">{t(status==='failed'?'地图暂时无法加载':'正在铺开城市地图',status==='failed'?'Map unavailable':'Loading the city map')}</strong><span className="caption-4">{t(status==='failed'?'下方地点列表与导航仍可使用。':'地点列表已就绪，可以先选好目的地。',status==='failed'?'The place list and directions remain available.':'The place list is ready to explore.')}</span>{status==='failed'&&<button className="pg-reset button-sm" onClick={()=>setRetry(v=>v+1)}>{t('重试地图','Retry map')}</button>}</div>}<div className="pg-map-caption caption-5"><MapPin aria-hidden="true"/><span>{t('点标记查看详情 · 拖动地图 · 用 + / − 缩放','Select a marker · Drag to explore · Use + / − to zoom')}</span></div></div>
      <div className="pg-list" aria-label={t('游乐场地点列表','Playground list')}>{shown.length?shown.map(p=><article className={'pg-place'+(selected===p.id?' pg-selected':'')} key={p.id} data-playground-id={p.id}><div className="pg-place-heading"><span className="pg-number caption-3">{String(DATA.indexOf(p)+1).padStart(2,'0')}</span><div><p className="caption-5 pg-eyebrow">{p.area}</p><h3 className="title-3">{lang==='zh'?p.zh:p.name}</h3></div></div><p className="caption-4 pg-address">{p.address}</p><p className="caption-4">{lang==='zh'?p.highlightZh:p.highlightEn}</p><p className="caption-5 pg-facts">{facts(p,t)}</p><p className="caption-5 pg-facts">{t('适合年龄：','Ages: ')}{lang==='zh'?p.ageZh:p.ageEn}</p><div className="pg-place-actions"><button className="button-sm" onClick={()=>choose(p)}><MapPin aria-hidden="true"/>{t('在地图查看','Show on map')}</button><a className="button-sm" href={navigation(p)} target="_blank" rel="noopener noreferrer">{t('导航','Directions')}<ArrowUpRight aria-hidden="true"/></a><a className="caption-5" href={p.source} target="_blank" rel="noopener noreferrer">{t('市政来源','Council source')}<ArrowUpRight aria-hidden="true"/></a></div></article>):<div className="pg-no-results"><Trees aria-hidden="true"/><h3 className="title-3">{t('暂时没有匹配地点','No matching places')}</h3><p className="caption-4">{t('未确认的设施不会纳入筛选，试试其他条件。','Unknown facilities are excluded. Try another filter.')}</p><button className="pg-reset button-sm" onClick={reset}>{t('清除筛选','Clear filters')}</button></div>}</div>
    </div><div className="pg-source-note caption-5"><p>{t('地点与设施核对：2026年11月11日 · Hamilton City Council。坐标取自市政页面链接的公园定位，并非每件游乐设备的精确位置。围栏、厕所、遮阳或年龄未获来源确认时均标为待确认。','Places and facilities checked 11 November 2026 against Hamilton City Council. Pins follow the park locations linked by Council; they are not individual equipment positions. Unknown facilities and ages remain unconfirmed.')}</p><p><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a> · <a href="https://hamilton.govt.nz/community-spaces/playgrounds" target="_blank" rel="noopener noreferrer">Hamilton City Council</a></p></div>
  </section>;
}
