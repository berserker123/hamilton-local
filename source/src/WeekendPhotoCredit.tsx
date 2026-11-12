import React from 'react';
import PHOTO from './weekend-photo.json';
export function WeekendPhotoCredit({t}:{t:(zh:string,en:string)=>string}) {
  return <li data-photo-credit={PHOTO.id}><h3>{t(PHOTO.zh,PHOTO.en)}</h3><p>{PHOTO.author} · <a href={PHOTO.licenseUrl} target="_blank" rel="noopener noreferrer">{PHOTO.license}</a></p><a href={PHOTO.source} target="_blank" rel="noopener noreferrer">{t('原图与出处','Original photograph')}</a><p>{t(PHOTO.changesZh,PHOTO.changesEn)}</p></li>;
}
