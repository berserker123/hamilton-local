import React from 'react';

const CAPTIONS = [
  '摄影师正在赶来的路上…',
  '这家太好逛，忘了拍照',
  '你来过？欢迎投稿照片',
  '图片更新中 · Photo coming soon',
  '照片还在 SH1 上堵车',
  '颜值太高，相机还在加载',
  '等你来拍第一张',
  '照片即将上线',
  '摄影师迷路了，马上就到',
  '玩得太开心，手机没顾上',
  '有好照片？发给我们吧',
  '相机电池充电中，稍等片刻',
  '照片被小朋友抢去玩了',
];

export function PhotoPlaceholderCaption({ id }: { id: string }) {
  // Namespaced FNV-1a keeps captions stable across filtering, routes and reloads.
  const key = 'photo-caption:' + id;
  let hash = 2166136261;
  for (let i = 0; i < key.length; i++) hash = Math.imul(hash ^ key.charCodeAt(i), 16777619);
  return <span className="hl-spot-caption" lang="zh-CN">{CAPTIONS[(hash >>> 0) % CAPTIONS.length]}</span>;
}
