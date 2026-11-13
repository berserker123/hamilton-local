import React from 'react';
import HEADER from './weekend-photo.json';
import LIST from './weekend-list-photo.json';
function Credit({ photo, t }: { photo: typeof HEADER; t: (zh: string, en: string) => string }) {
  return <li data-photo-credit={photo.id}><h3>{t(photo.zh, photo.en)}</h3><p>{photo.author} · <a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer">{photo.license}</a></p><a href={photo.source} target="_blank" rel="noopener noreferrer">{t('原图与出处', 'Original photograph')}</a><p>{t(photo.changesZh, photo.changesEn)}</p></li>;
}
export function WeekendPhotoCredit({ t }: { t: (zh: string, en: string) => string }) {
  return <><Credit photo={HEADER} t={t} /><Credit photo={LIST} t={t} /></>;
}
