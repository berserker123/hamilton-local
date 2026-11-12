import React from 'react';

type T = (zh: string, en: string) => string;

export function chineseCardName(name: string): string {
  if (!/[\u3400-\u9fff]/.test(name)) return '中文名称待确认';
  // Existing records sometimes append an English translation to the Chinese field.
  // Preserve brand prefixes, but move the translated suffix to the English line.
  return name.replace(/([\u3400-\u9fff])\s+[A-Za-z0-9][^\u3400-\u9fff]*$/, '$1');
}

/** Names are already bilingual records; do not expand place names inside them. */
export function BilingualTitle({ zh, en, t, as: Heading = 'h3', className }: { zh: string; en: string; t: T; as?: 'h2' | 'h3' | 'h4'; className?: string }) {
  const chinese = t('中', 'en') !== 'en';
  const title = chinese ? chineseCardName(zh) : en;
  return <><Heading className={['ia-name-line', className].filter(Boolean).join(' ')} lang={chinese ? 'zh-CN' : 'en-NZ'} title={title}>{title}</Heading>{chinese && <p className="ia-secondary-name ia-name-line" lang="en-NZ" title={en}>{en}</p>}</>;
}

export function DirectoryHeading({ eyebrow, zh, en, introZh, introEn, t }: { eyebrow: string; zh: string; en: string; introZh: string; introEn: string; t: T }) {
  return <div className="v25-directory-heading"><p className="ia-kicker">AROUND HAMILTON · {eyebrow}</p><h2>{t(zh, en)}</h2><p>{t(introZh, introEn)}</p></div>;
}
