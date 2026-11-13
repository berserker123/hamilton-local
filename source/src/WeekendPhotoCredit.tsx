import React from 'react';
import PHOTOS from './section-photos.json';
export function WeekendPhotoCredit({ t }: { t: (zh: string, en: string) => string }) {
  return <>{PHOTOS.map(photo => <li key={photo.id} data-photo-credit={photo.id}><h3>{t(photo.zh, photo.en)}</h3><p>{photo.author} · <a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer">{photo.license}</a></p><a href={photo.source} target="_blank" rel="noopener noreferrer">{t('原图与出处', 'Original photograph')}</a><p>{t(photo.changesZh, photo.changesEn)}</p></li>)}</>;
}
