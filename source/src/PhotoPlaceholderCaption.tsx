import React from 'react';

type T = (zh: string, en: string) => string;

export const PHOTO_PLACEHOLDER_CAPTIONS = [
  {
    zh: '老板说先别乱用别人的图',
    en: "Boss said: no borrowing other people's photos",
  },
  {
    zh: '真身比照片好看，去现场看吧',
    en: 'Looks better in person, go see it',
  },
  {
    zh: '版权很贵，我们先画个图标',
    en: "Copyright is pricey, so here's an icon",
  },
  {
    zh: '欢迎店家投稿美照',
    en: 'Owners: send us your best shot',
  },
] as const;

function captionIndex(id: string, index?: number): number {
  if (typeof index === 'number' && Number.isFinite(index) && index >= 0) {
    return Math.floor(index) % PHOTO_PLACEHOLDER_CAPTIONS.length;
  }
  // Namespaced FNV-1a fallback keeps captions stable if no card index is passed.
  const key = 'photo-caption:' + id;
  let hash = 2166136261;
  for (let i = 0; i < key.length; i++) hash = Math.imul(hash ^ key.charCodeAt(i), 16777619);
  return (hash >>> 0) % PHOTO_PLACEHOLDER_CAPTIONS.length;
}

export function PhotoPlaceholderCaption({ id, index, t }: { id: string; index?: number; t?: T }) {
  const caption = PHOTO_PLACEHOLDER_CAPTIONS[captionIndex(id, index)];
  const chinese = t ? t('中', 'en') !== 'en' : true;
  const text = t ? t(caption.zh, caption.en) : caption.zh;
  return <span className="hl-spot-caption" lang={chinese ? 'zh-CN' : 'en-NZ'}>{text}</span>;
}
