import { placeNames } from './place-names';
import React, { useEffect, useRef, useState } from 'react';
import { currentNZSeason, nextScene, nextSeason, SCENES, SEASON_LABELS, Season } from './experience-model';
import { CordPick, createDrawBag, familyPicks } from './cord-picks';
import { pageHref } from './site-routes.mjs';
import { navigate } from './navigate';

export function usePageExperience(route: string, lang: 'zh' | 'en', pools: { services: CordPick[]; tools: CordPick[] }) {
  const [scene, setScene] = useState(0);
  const [season, setSeason] = useState<Season>(currentNZSeason);
  const [burst, setBurst] = useState(0);
  const [active, setActive] = useState(false);
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [notice, setNotice] = useState('');
  const [result, setResult] = useState<{ pick: CordPick; draw: number; route: string } | null>(null);
  const bags = useRef<Record<string, ReturnType<typeof createDrawBag>>>({});
  const drawCount = useRef(0);
  const loading = useRef(false);
  const generation = useRef(0);
  const zh = lang === 'zh';
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => { setReduced(media.matches); if (media.matches) setActive(false); };
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    setActive(false); setBurst(0); setNotice(''); setResult(null); loading.current = false;
    generation.current++;
    return () => { generation.current++; };
  }, [route]);
  useEffect(() => {
    if (result?.route !== 'services') return;
    let raf = 0, attempts = 0, selected: HTMLElement | null = null;
    const show = () => {
      selected = document.getElementById(result.pick.target || '');
      if (!selected && attempts++ < 20) { raf = requestAnimationFrame(show); return; }
      selected?.classList.add('v22-selected-category');
      selected?.scrollIntoView({ block: 'center', behavior: reduced ? 'instant' : 'smooth' });
    };
    const timer = setTimeout(() => { raf = requestAnimationFrame(show); }, reduced ? 0 : 950);
    return () => { clearTimeout(timer); cancelAnimationFrame(raf); selected?.classList.remove('v22-selected-category'); };
  }, [result, reduced]);
  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setActive(false), 9200);
    return () => clearTimeout(timer);
  }, [active, burst]);
  // Warm the next local image after the first scene has rendered. No network service.
  useEffect(() => {
    if (route !== 'home') return;
    const image = new Image(); image.src = SCENES[nextScene(scene)].src;
    image.decode().catch(() => {});
  }, [route, scene]);
  function activate() {
    if (route === 'kids' || route === 'services' || route === 'tools') {
      const choices = route === 'kids' ? familyPicks() : pools[route];
      const draw = bags.current[route] ||= createDrawBag();
      const id = draw(choices.map(p => p.id));
      const pick = choices.find(p => p.id === id);
      if (!pick) return;
      setResult({ pick, draw: ++drawCount.current, route });
      setNotice((zh ? '这次抽到：' : 'Your pick: ') + pick.name[lang]);
      if (route === 'services') navigate(pageHref('services', pick.tab || 'home'));
      return;
    }
    if (route === 'home') {
      if (loading.current) return;
      loading.current = true;
      const token = generation.current;
      const next = nextScene(scene);
      const image = new Image(); image.src = SCENES[next].src;
      image.decode().then(() => {
        if (token !== generation.current) return;
        setScene(next); setNotice(''); loading.current = false;
      }).catch(() => {
        if (token !== generation.current) return;
        loading.current = false;
        setNotice(zh ? '风景暂未载入，请再拉一次' : 'Scene could not load. Pull again to retry');
      });
      return;
    }
    if (route === 'living') setSeason(value => nextSeason(value));
    setBurst(value => value + 1);
    setActive(!reduced);
  }
  const label = route === 'home' ? (zh ? '拉绳，切换下一段窗外风景' : 'Pull cord for the next view')
    : route === 'living' ? (zh ? '拉绳，切换下一个季节' : 'Pull cord for the next season')
    : route === 'kids' ? (zh ? '拉绳，抽一个亲子好去处' : 'Pull cord for a family outing')
    : route === 'services' ? (zh ? '拉绳，翻一翻便民黄页' : 'Pull cord to flip the directory')
    : route === 'tools' ? (zh ? '拉绳，打开生活小锦囊' : 'Pull cord for an everyday tip')
    : (zh ? '拉绳，让热气球升空' : 'Pull cord to launch hot air balloons');
  const status = notice || (route === 'home' ? (zh ? `窗外：${SCENES[scene].zh}` : `View: ${SCENES[scene].en}`)
    : route === 'living' ? (zh ? `当前季节：${SEASON_LABELS[season][0]}` : `Season: ${SEASON_LABELS[season][1]}`)
    : ['kids', 'services', 'tools'].includes(route) ? label
    : (burst ? (zh ? (reduced ? `热气球祝福已送达，第 ${burst} 次` : `热气球已升空，第 ${burst} 次`) : `Balloons ${reduced ? 'celebration' : 'launched'}, ${burst}`) : (zh ? '拉一下，让周末升空' : 'A little lift for the weekend')));
  return { scene, season, burst, active, reduced, activate, label, status: placeNames(status, lang), result: result?.route === route ? result : null, dismiss: () => setResult(null), badge: route === 'living' ? SEASON_LABELS[season][zh ? 0 : 1].slice(0, zh ? 1 : 2) : undefined };
}

const PALETTES = [ ['#d48852', '#efd9ac', '#9e5638'], ['#7d9c88', '#e4d8b7', '#3d695e'], ['#b9a575', '#f3e6c6', '#82724e'], ['#718b9a', '#dbd9c8', '#445d6c'], ['#bc7262', '#ecd2b7', '#854940'] ];
function Balloon({ index }: { index: number }) {
  const [base, light, shade] = PALETTES[index];
  return <svg viewBox="0 0 120 170" className="v21-balloon-art" focusable="false">
    <path d="M60 7C27 7 10 29 12 57c2 26 23 43 34 66h28c11-23 32-40 34-66C110 29 93 7 60 7Z" fill={base} stroke={shade} strokeWidth="1.5" />
    <path d="M60 7C38 14 29 40 33 66c3 21 13 38 20 57h14c7-19 17-36 20-57 4-26-5-52-27-59Z" fill={light} />
    <path d="M60 7C51 27 48 50 50 72l7 51h6l7-51c2-22-1-45-10-65Z" fill={base} opacity=".8" />
    <path d="M23 35c7-13 17-19 28-21" fill="none" stroke="#fff4d5" strokeOpacity=".45" strokeWidth="3" strokeLinecap="round" />
    <path d="M14 62c28 9 64 9 92 0M29 90c21 7 41 7 62 0" fill="none" stroke={shade} strokeOpacity=".3" />
    <path d="m47 122 5 22m21-22-5 22" stroke="#c4b99b" strokeWidth="2" />
    <path d="M48 144h24l-3 17H51Z" fill="#916646" stroke="#c9a47a" strokeWidth="1.5" />
    <path d="M52 150h16m-15 5h14m-9-9v13m6-13v13" stroke="#d5b38b" strokeOpacity=".45" />
  </svg>;
}
function FallingElement({ season, index }: { season: Season; index: number }) {
  if (season === 'summer') return <span className="v21-summer-light" />;
  if (season === 'winter') return <svg className="v22-snowflake" viewBox="0 0 32 32" focusable="false"><g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M16 2v28M4 9l24 14M4 23 28 9M12 5l4 4 4-4M12 27l4-4 4 4M5 14l6-1-2-6M27 18l-6 1 2 6M9 25l2-6-6-1M23 7l-2 6 6 1" /></g></svg>;
  return <svg viewBox="0 0 32 40" focusable="false">
    {season === 'autumn' ? <><path d="M16 35C-1 30 2 15 24 3c6 18 3 29-8 32Z" fill={['#bb7841', '#d5a359', '#a9643c', '#c99a68'][index % 4]} /><path d="M9 39 23 7M16 23l-8-3m12-7 4 1" fill="none" stroke="#634e30" strokeWidth="1" /></>
      : <><path d="M16 34C2 30 2 12 11 5l5 4 5-4c11 13 7 26-5 29Z" fill={index % 2 ? '#e4c3be' : '#edcfc5'} /><path d="M16 30V14" stroke="#c39491" strokeWidth="1" /></>}
  </svg>;
}
export function PageEffects({ route, season, active, burst }: { route: string; season: Season; active: boolean; burst: number }) {
  if (!active || (route !== 'living' && route !== 'weekend')) return null;
  const balloons = route === 'weekend';
  return <div key={`${route}-${burst}`} className={`v21-effects v21-${balloons ? 'balloons' : season}`} data-testid="page-effects" aria-hidden="true">
    {Array.from({ length: balloons ? 5 : 22 }, (_, i) => {
      const style = balloons ? {
        '--x': `${[8, 29, 50, 72, 87][i]}vw`, '--drift': `${[42, -52, 36, -42, 30][i]}px`, '--size': `${[146, 112, 172, 126, 102][i]}px`, '--duration': `${[8, 7.2, 8.4, 7.6, 7.1][i]}s`, '--delay': `${[0, .5, .15, .7, 1][i]}s`,
      } : {
        '--x': `${(i * 47 + 7) % 100}vw`, '--drift': `${(i % 2 ? -1 : 1) * (28 + i * 3)}px`, '--size': `${season === 'summer' ? 6 + i % 5 * 3 : season === 'winter' ? 12 + i % 5 * 5 : 14 + i % 4 * 4}px`, '--duration': `${6 + i % 4 * .6}s`, '--delay': `${i % 6 * .22}s`, '--spin': `${(i % 2 ? -1 : 1) * (130 + i * 11)}deg`,
      } as React.CSSProperties;
      return <div key={i} className={balloons ? 'v21-balloon' : 'v21-particle'} style={style}>{balloons ? <Balloon index={i} /> : <FallingElement season={season} index={i} />}</div>;
    })}
  </div>;
}
