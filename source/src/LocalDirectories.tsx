import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, BedDouble, MapPin, PawPrint, X } from 'lucide-react';
import { FeedbackLink, useFeedback } from './Feedback';
import STAYS from './stays-v25.json';
import PETS from './pets-v25.json';
import UPICK from './upick-v25.json';
import { CardKind } from './card-style';
import { CardBadge, CardMedia, CardQuick } from './CardFace';
import { PhotoFlip } from './PhotoFlip';

import { BilingualTitle, DirectoryHeading } from './BilingualTitle';

type T = (zh: string, en: string) => string;
// Rename this one constant to update both navigation and page headings.
export const PETS_NAME = { zh: '宠物指南', en: 'Pet Guide' };
type PhotoFields = { photo?: string; photoAlt?: string; photoCredit?: string; photoLicense?: string; photoLicenseUrl?: string; photoSource?: string };
type Item = PhotoFields & { id: string; name: string; zh: string; area: string; address: string; introZh: string; introEn: string; url: string; phone?: string; mobile?: string; fruitZh?: string; fruitEn?: string; seasonZh?: string; seasonEn?: string };
export const STAY_PHOTOS = (STAYS as Item[]).filter(item => item.photo);
export function DirectoryPhoto({ item, title, t }: { item: PhotoFields; title: string; t: T }) {
  return item.photo ? <PhotoFlip src={'./photos/' + item.photo} alt={item.photoAlt || title} author={item.photoCredit} license={item.photoLicense} licenseUrl={item.photoLicenseUrl} sourceUrl={item.photoSource} showLabel={t('查看照片作者与授权', 'Show photo credit')} hideLabel={t('翻回照片', 'Show photo')} authorLabel={t('作者', 'Author')} licenseLabel={t('授权', 'Licence')} sourceLabel={t('原图与出处', 'Original photograph')} /> : <div className="ia-photo-pending"><BedDouble aria-hidden="true" /><span className="caption-5">{t('实景照片待补充', 'Location photo pending')}</span></div>;
}
export function DirectoryPhotoCredit({ item, t }: { item: PhotoFields; t: T }) {
  return item.photo ? <figcaption className="ia-detail-credit">{t('照片', 'Photo')} · {item.photoCredit} · <a href={item.photoLicenseUrl} target="_blank" rel="noopener noreferrer">{item.photoLicense}</a> · <a href={item.photoSource} target="_blank" rel="noopener noreferrer">{t('原图与出处', 'Original photograph')}</a><span> · {t('缩放并转换为 WebP；卡片按比例裁剪。', 'Resized and converted to WebP; cropped to fit the card.')}</span></figcaption> : null;
}
function StayDetail({ item, t, close }: { item: Item; t: T; close: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef(document.activeElement as HTMLElement | null);
  useEffect(() => {
    const dialog = ref.current!;
    const old = document.body.style.overflow;
    dialog.showModal(); document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = old; dialog.close(); opener.current?.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={ref} className="sb-modal ia-dialog sb-dark ia-stay-detail" aria-labelledby="stay-detail-title" onCancel={e => { e.preventDefault(); close(); }}><div className="sb-modal-heading"><h2 id="stay-detail-title">{t(item.zh, item.name)}</h2><button autoFocus className="sb-action" aria-label={t('关闭', 'Close')} onClick={close}><X /></button></div><p className="ia-secondary-name">{item.name}</p>{item.photo && <figure className="ia-detail-photo"><img src={'./photos/' + item.photo} alt={item.photoAlt || item.name} /><DirectoryPhotoCredit item={item} t={t} /></figure>}<p>{t(item.introZh, item.introEn)}</p>{item.phone && <p><a href={"tel:" + item.phone.replace(/\s/g, "")}>{item.phone}</a>{item.mobile && <> · <a href={"tel:" + item.mobile.replace(/\s/g, "")}>{item.mobile}</a></>}</p>}<p className="sb-icon-line"><MapPin aria-hidden="true" />{item.address}</p><a className="sb-action" href={item.url} target="_blank" rel="noopener noreferrer">{t('住宿详情与预订', 'Property details & booking')}<ArrowUpRight aria-hidden="true" /></a><FeedbackLink section={item.name} /></dialog>;
}
function DirectoryCard({ item, t, label, official = false, kind, children, onDetails }: { item: Item; t: T; label?: string; official?: boolean; kind: CardKind; children?: React.ReactNode; onDetails?: () => void }) {
  const title = t('中', 'en') === 'en' ? item.name : item.zh;
  const chips = [label, item.area].filter(Boolean) as string[];
  const quick = [
    { key: 'area', text: item.area },
    ...(item.fruitZh ? [{ key: 'fruit', text: t(item.fruitZh, item.fruitEn || item.fruitZh) }] : []),
    ...(item.seasonZh ? [{ key: 'season', text: t(item.seasonZh, item.seasonEn || item.seasonZh) }] : []),
  ];
  return <article className="sb-card ia-directory-card" data-directory-id={item.id} data-card-kind={kind}>
    {kind === 'stay' ? <DirectoryPhoto item={item} title={title} t={t} /> : kind === 'pet' ? <div className="ia-photo-pending"><PawPrint aria-hidden="true" /><span className="caption-5">{t('实景照片待补充', 'Location photo pending')}</span></div> : <CardMedia kind={kind} title={title} chips={chips} />}
    <CardBadge kind={kind} />
    <p className="ia-kicker">{label ? label + ' · ' : ''}{item.area}</p>
    <BilingualTitle zh={item.zh} en={item.name} t={t} />
    <CardQuick items={quick} />
    <p className="ia-directory-intro">{t(item.introZh, item.introEn)}</p>
    {children}
    {item.phone && <p className="ia-directory-phone"><a href={"tel:" + item.phone.replace(/\s/g, "")}>{item.phone}</a></p>}
    <p className="sb-icon-line"><MapPin aria-hidden="true" /><span>{item.address}</span></p>
    <footer className="ia-place-footer"><div className="ia-place-actions">
      <a className="sb-action" href={item.url} target="_blank" rel="noopener noreferrer" aria-haspopup={onDetails ? 'dialog' : undefined} onClick={onDetails ? e => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return; e.preventDefault(); onDetails(); } : undefined}>{official ? t('官网', 'Website') : t('查看详情', 'View details')}<ArrowUpRight aria-hidden="true" /></a>
      <a className="sb-action" href={'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(item.name + ' ' + item.address)} target="_blank" rel="noopener noreferrer">{t('看地图', 'View map')}<MapPin aria-hidden="true" /></a>
    </div><FeedbackLink section={item.name} /></footer>
  </article>;
}
export function Stays({ t }: { t: T }) {
  const [selected, setSelected] = useState<Item | null>(null);
  return <section id="stays" className="v25-directory"><div className="v25-directory-heading"><BilingualTitle as="h2" zh="精选住宿" en="Stays" t={t} /><p>{t('按区域找一处落脚点，房型、价格与空房请查看住宿页面。', 'Find a place to stay by area. Check the property page for rooms, prices and availability.')}</p></div><div className="ia-place-grid">{STAYS.map(item => <DirectoryCard key={item.id} item={item} label={item.type} kind="stay" t={t} onDetails={() => setSelected(item)} />)}</div>{selected && <StayDetail item={selected} t={t} close={() => setSelected(null)} />}</section>;
}
export function Pets({ t }: { t: T }) {
  const { open } = useFeedback();
  return <section id="pets" className="v25-directory">
    <DirectoryHeading eyebrow="PETS" zh={PETS_NAME.zh} en={PETS_NAME.en} introZh="六类宠物服务，商家招募中。欢迎咨询入驻与广告合作。" introEn="Six pet service categories. Merchant listings and advertising enquiries are welcome." t={t} />
    <div className="v25k-pet-grid">{PETS.map(group => <article key={group.id} id={'pet-' + group.id} className="sb-card v25k-pet-card" data-pet-category={group.id}>
      <PawPrint className="v25k-pet-icon" aria-hidden="true" />
      <h3 lang="zh-CN">{group.zh}</h3>
      <p className="v25k-pet-english" lang="en-NZ">{group.en}</p>
      <p className="v25k-pet-status">商家招募中 · Listings coming soon</p>
      <button type="button" className="v25k-pet-enquiry" aria-haspopup="dialog" onClick={e => open('宠物指南-' + group.zh, e.currentTarget, 'business', '宠物指南-' + group.zh + '：商家入驻 / 广告合作')}>商家入驻 / 广告合作<ArrowUpRight aria-hidden="true" /></button>
    </article>)}</div>
  </section>;
}
export function UPick({ t }: { t: T }) {
  return <section id="upick" className="v25-directory v25-directory-group"><div className="v25-directory-heading"><BilingualTitle as="h2" zh="季节采摘" en="U-Pick farms" t={t} /><p>{t('果季与开放日随天气、成熟度和余量变化；出发前请确认开放。未核实的月份标为「待确认」。', 'Seasons and opening days vary with weather, ripeness and availability. Confirm opening before visiting. Unverified months are marked Unconfirmed.')}</p></div><div className="ia-place-grid">{UPICK.map(item => <DirectoryCard key={item.id} item={item} t={t} kind="upick" official><p className="v25-season">{t(item.fruitZh, item.fruitEn)}<br />{t('采摘月份：', 'Picking months: ')}{t(item.seasonZh, item.seasonEn)}</p><p className="v25-confirm">{t('出发前请确认开放', 'Confirm opening before visiting')}</p></DirectoryCard>)}</div></section>;
}
