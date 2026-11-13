import React from 'react';
import LIST from './weekend-list-photo.json';
export function WeekendPhotoCredit({ t }: { t: (zh: string, en: string) => string }) {
  return <li data-photo-credit={LIST.id}><h3>{t(LIST.zh, LIST.en)}</h3><p>{LIST.author} · <a href={LIST.licenseUrl} target="_blank" rel="noopener noreferrer">{LIST.license}</a></p><a href={LIST.source} target="_blank" rel="noopener noreferrer">{t('原图与出处', 'Original photograph')}</a><p>{t(LIST.changesZh, LIST.changesEn)}</p></li>;
}
