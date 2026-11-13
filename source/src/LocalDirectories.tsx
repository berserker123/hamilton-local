import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, BedDouble, Cherry, Info, MapPin, PawPrint, X } from 'lucide-react';
import { FeedbackLink, useFeedback } from './Feedback';
import STAYS from './stays-v25.json';
import PETS from './pets-v25.json';
import UPICK from './upick-v25.json';
import { CardKind } from './card-style';
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
function DirectoryCard({ item, t, label, kind, children, onDetails }: { item: Item; t: T; label?: string; official?: boolean; kind: CardKind; children?: React.ReactNode; onDetails?: () => void }) {
  const chinese = t('中', 'en') !== 'en';
  const Icon = kind === 'stay' ? BedDouble : kind === 'pet' ? PawPrint : Cherry;
  const pill = label ? `${label} · ${item.area}` : item.area;
  const mapHref = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(item.name + ' ' + item.address);
  return <article className="hl-spot" data-directory-id={item.id} data-card-kind={kind}>
    <div className="hl-spot-media">
      {item.photo ? <img src={'./photos/' + item.photo} alt={item.photoAlt || item.name} /> : <div className="hl-spot-fallback" aria-hidden="true"><Icon /></div>}
      <span className="hl-spot-pill">{pill}</span>
      {onDetails ? <button type="button" className="hl-spot-info" aria-label={t('查看住宿详情', 'View stay details')} onClick={() => onDetails()}><Info aria-hidden="true" /></button> : <a className="hl-spot-info" href={item.url} target="_blank" rel="noopener noreferrer" aria-label={t('查看来源', 'View source')}><Info aria-hidden="true" /></a>}
    </div>
    <div className="hl-spot-body">
      <h3 lang={chinese ? 'zh-CN' : 'en-NZ'}>{chinese ? item.zh : item.name}</h3>
      <p className="hl-spot-en" lang={chinese ? 'en-NZ' : 'zh-CN'}>{chinese ? item.name : item.zh}</p>
      <p className="hl-spot-copy">{t(item.introZh, item.introEn)}</p>
      {children}
      {item.phone && <p className="hl-spot-phone"><a href={'tel:' + item.phone.replace(/\s/g, '')}>{item.phone}</a></p>}
      <p className="hl-spot-address"><MapPin aria-hidden="true" /><span>{item.address}</span></p>
      <div className="hl-spot-tools">
        <a className="hl-spot-icon" href={mapHref} target="_blank" rel="noopener noreferrer" aria-label={t('地图 / 导航', 'Map / Directions')}><MapPin aria-hidden="true" /></a>
      </div>
      {onDetails ? <button type="button" className="hl-spot-cta" onClick={() => onDetails()}>{t('查看详情', 'View details')}<ArrowUpRight aria-hidden="true" /></button> : <a className="hl-spot-cta" href={item.url} target="_blank" rel="noopener noreferrer">{t('查看详情', 'View details')}<ArrowUpRight aria-hidden="true" /></a>}
      <FeedbackLink section={item.name} />
    </div>
  </article>;
}
export function Stays({ t }: { t: T }) {
  const [selected, setSelected] = useState<Item | null>(null);
  return <section id="stays" className="v25-directory"><div className="v25-directory-heading"><BilingualTitle as="h2" zh="精选住宿" en="Stays" t={t} /><p>{t('按区域找一处落脚点，房型、价格与空房请查看住宿页面。', 'Find a place to stay by area. Check the property page for rooms, prices and availability.')}</p></div><div className="hl-spot-grid" data-accent="living">{STAYS.map(item => <DirectoryCard key={item.id} item={item} label={item.type} kind="stay" t={t} onDetails={() => setSelected(item)} />)}</div>{selected && <StayDetail item={selected} t={t} close={() => setSelected(null)} />}</section>;
}
const PET_ORDER = ['shops', 'vets', 'dog-parks', 'boarding', 'grooming', 'daycare'];
const PET_PLACEHOLDERS = new Set(['boarding', 'grooming', 'daycare']);
export function Pets({ t }: { t: T }) {
  const { open } = useFeedback();
  const groups = PET_ORDER.map(id => PETS.find(group => group.id === id)).filter(Boolean);
  const listed = groups.filter(group => !PET_PLACEHOLDERS.has(group.id));
  const waiting = groups.filter(group => PET_PLACEHOLDERS.has(group.id));
  return <section id="pets" className="v25-directory">
    <DirectoryHeading eyebrow="PETS" zh={PETS_NAME.zh} en={PETS_NAME.en} introZh="用品、兽医和市政免牵引绳区域已列出。寄养、洗护美容与狗狗日托仍在招募商家。" introEn="Shops, vets and council off-leash areas are listed. Boarding, grooming and dog daycare are open to merchants." t={t} />
    <nav className="v25-subnav" aria-label={t('宠物类别', 'Pet categories')}>{groups.map(group => <a key={group.id} href={'#/services?tab=pets&at=pet-' + group.id}>{t(group.zh, group.en)}</a>)}</nav>
    {listed.map(group => <section key={group.id} id={'pet-' + group.id} className="v25-directory-group" data-pet-category={group.id}>
      <BilingualTitle as="h2" zh={group.zh} en={group.en} t={t} />
      <div className="hl-spot-grid" data-accent="services">{group.items.map(item => <DirectoryCard key={item.id} item={item} kind="pet" t={t} />)}</div>
      {group.id === 'dog-parks' && <p className="ia-section-note">{t('市政免牵引绳区域名录', 'Council off-leash directory')} · <a href="https://hamilton.govt.nz/dogs-and-other-animals/dogs/dog-exercise-areas" target="_blank" rel="noopener noreferrer">Hamilton City Council · Dog exercise areas</a></p>}
    </section>)}
    <div className="v25k-pet-grid">{waiting.map(group => <article key={group.id} id={'pet-' + group.id} className="sb-card v25k-pet-card" data-pet-category={group.id}>
      <PawPrint className="v25k-pet-icon" aria-hidden="true" />
      <h3 lang="zh-CN">{group.zh}</h3>
      <p className="v25k-pet-english" lang="en-NZ">{group.en}</p>
      <p className="v25k-pet-status">商家招募中 · Listings coming soon</p>
      <button type="button" className="v25k-pet-enquiry" aria-haspopup="dialog" onClick={e => open('宠物指南-' + group.zh, e.currentTarget, 'business', '宠物指南-' + group.zh + '：商家入驻 / 广告合作')}>商家入驻 / 广告合作<ArrowUpRight aria-hidden="true" /></button>
    </article>)}</div>
  </section>;
}
export function UPick({ t }: { t: T }) {
  return <section id="upick" className="v25-directory v25-directory-group"><div className="v25-directory-heading"><BilingualTitle as="h2" zh="季节采摘" en="U-Pick farms" t={t} /><p>{t('果季与开放日随天气、成熟度和余量变化；出发前请确认开放。未核实的月份标为「待确认」。', 'Seasons and opening days vary with weather, ripeness and availability. Confirm opening before visiting. Unverified months are marked Unconfirmed.')}</p></div><div className="hl-spot-grid" data-accent="living">{UPICK.map(item => <DirectoryCard key={item.id} item={item} t={t} kind="upick" official><p className="v25-season">{t(item.fruitZh, item.fruitEn)}<br />{t('采摘月份：', 'Picking months: ')}{t(item.seasonZh, item.seasonEn)}</p><p className="v25-confirm">{t('出发前请确认开放', 'Confirm opening before visiting')}</p></DirectoryCard>)}</div></section>;
}
