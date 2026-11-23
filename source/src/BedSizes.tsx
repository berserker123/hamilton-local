import React, { useState } from 'react';
import { BilingualTitle } from './BilingualTitle';
import { CN_BEDS, NZ_BEDS, beddingFit, closestBed } from './bed-sizes.mjs';

type T = (zh: string, en: string) => string;
type Bed = (typeof NZ_BEDS)[number];

const SOURCES = [
  { label: 'Beds4U', url: 'https://beds4u.co.nz/pages/bed-sizes' },
  { label: 'WiseMove', url: 'https://www.wisemove.co.nz/post/new-zealand-mattress-and-bed-size-guide' },
];
function diffText(dw: number, dl: number, side: 'nz' | 'cn', t: T) {
  const zhName = side === 'nz' ? '国内这款' : '新西兰这款';
  const enName = side === 'nz' ? 'The Chinese size' : 'The NZ size';
  if (!dw && !dl) return t(zhName + '和你的床一样大', enName + ' is the same as your bed');
  const zh = [dw ? (dw > 0 ? '宽 ' : '窄 ') + Math.abs(dw) + ' cm' : '', dl ? (dl > 0 ? '长 ' : '短 ') + Math.abs(dl) + ' cm' : ''].filter(Boolean).join('、');
  const en = [dw ? Math.abs(dw) + ' cm ' + (dw > 0 ? 'wider' : 'narrower') : '', dl ? Math.abs(dl) + ' cm ' + (dl > 0 ? 'longer' : 'shorter') : ''].filter(Boolean).join(' and ');
  return t(zhName + '比你的床' + zh, enName + ' is ' + en + ' than your bed');
}

function fitText(level: string, t: T) {
  if (level === 'same') return t('尺寸基本一样，床单和床笠可以通用。', 'Practically the same. Sheets and fitted sheets should work.');
  if (level === 'tight') return t('床笠可能偏紧，建议按床垫实际尺寸买。', 'A fitted sheet may be tight. Buy for the actual mattress size.');
  if (level === 'loose') return t('床笠会略松，一般能用。', 'A fitted sheet will be slightly loose but usually works.');
  return t('差得比较多，床笠不建议混用。被子可以按喜好选大一号。', 'Too different for a fitted sheet. A larger duvet can still work.');
}

export function BedSizeGuide({ t }: { t: T }) {
  const [side, setSide] = useState<'nz' | 'cn'>('nz');
  const [id, setId] = useState('nz-queen');
  const list: readonly Bed[] = side === 'nz' ? NZ_BEDS : CN_BEDS;
  const bed = list.find(item => item.id === id) || list[0];
  const match = closestBed(bed, side === 'nz' ? CN_BEDS : NZ_BEDS) as Bed;
  const fit = beddingFit(bed, match);
  const scale = 1.25;
  const label = (item: Bed) => t(item.zh, item.en);
  function choose(next: 'nz' | 'cn') {
    setSide(next);
    setId(next === 'nz' ? 'nz-queen' : 'cn-150-200');
  }
  return <section id="tool-beds" className="v25g-tools hl-beds">
    <div className="hl-beds-heading"><BilingualTitle as="h2" zh="床和床垫尺寸对照" en="Bed & Mattress Sizes" t={t} /><p>{t('从国内带床品，或在新西兰买床前，先看这张对照。', 'Compare New Zealand and Chinese sizes before buying or bringing bedding.')}</p></div>
    <div className="sb-card hl-beds-card">
      <div className="hl-beds-switch" role="group" aria-label={t('选择你的床', 'Choose your bed')}>
        <button type="button" aria-pressed={side === 'nz'} onClick={() => choose('nz')}>{t('我有新西兰的床', 'I have a NZ bed')}</button>
        <button type="button" aria-pressed={side === 'cn'} onClick={() => choose('cn')}>{t('我有国内的床', 'I have a Chinese bed')}</button>
      </div>
      <div className="hl-beds-options" role="group" aria-label={t('选择尺寸', 'Choose a size')}>
        {list.map(item => <button type="button" key={item.id} aria-pressed={item.id === bed.id} onClick={() => setId(item.id)}><strong>{label(item)}</strong><span>{item.w} × {item.l} cm</span></button>)}
      </div>
      <div className="hl-beds-result" aria-live="polite">
        <svg viewBox="0 0 280 280" role="img" aria-label={t(`${bed.w} 乘 ${bed.l} 厘米与 ${match.w} 乘 ${match.l} 厘米对比`, `${bed.w} by ${bed.l} cm compared with ${match.w} by ${match.l} cm`)}>
          <rect className="hl-beds-a" x={140 - bed.w * scale / 2} y={140 - bed.l * scale / 2} width={bed.w * scale} height={bed.l * scale} rx="6" />
          <rect className="hl-beds-b" x={140 - match.w * scale / 2} y={140 - match.l * scale / 2} width={match.w * scale} height={match.l * scale} rx="6" />
        </svg>
        <div>
          <p className="hl-beds-pair"><i className="hl-beds-key-a" />{t('你的床', 'Your bed')}：<strong>{label(bed)}</strong> {bed.w} × {bed.l} cm</p>
          <p className="hl-beds-pair"><i className="hl-beds-key-b" />{side === 'nz' ? t('国内最接近', 'Closest in China') : t('新西兰最接近', 'Closest in NZ')}：<strong>{label(match)}</strong> {match.w} × {match.l} cm</p>
          <p className="hl-beds-diff">{diffText(fit.dw, fit.dl, side, t)}</p>
          <p className="hl-beds-verdict">{fitText(fit.level, t)}</p>
        </div>
      </div>
      <p className="v25g-hint">{t('不同品牌会差几厘米，下单前请量床垫，并看商品页的实际尺寸。床架通常按本地尺寸做，换床垫时不要只看名字。', 'Brands can differ by a few centimetres. Measure your mattress and check the product page. Bed frames follow local sizes, so do not rely on the name alone.')}</p>
      <p className="hl-beds-sources">{t('新西兰尺寸参考：', 'NZ sizes: ')}{SOURCES.map((source, index) => <React.Fragment key={source.url}>{index > 0 && ' · '}<a href={source.url} target="_blank" rel="noopener noreferrer">{source.label} ↗</a></React.Fragment>)}{t('。国内没有统一规格，这里列的是常见尺寸。', '. China has no single standard, so these are common retail sizes.')}</p>
    </div>
  </section>;
}
