// Builds /feed.xml (RSS 2.0) from the site data files. Nothing is hardcoded.
import fs from 'node:fs';
import path from 'node:path';
import { normalizeCurrency } from './currency.mjs';
export const SITE = 'https://hamiltonlocal.nz';
export const FEED_CAP_BLACKFRIDAY = 20;
export const BRIEFING_CATEGORIES = ['breaking', 'police', 'council', 'roads', 'weather', 'civil_defence', 'news'];
const readJson = (root, rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const xmlEsc = v => String(v ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const both = (zh, en) => zh && en && zh !== en ? zh + ' / ' + en : (zh || en || '');

export function feedItems(root = '.') {
  const events = readJson(root, 'src/events-and-markets.json');
  const briefing = readJson(root, 'src/data/briefing.json');
  const deals = readJson(root, 'src/data/blackfriday.json');
  const items = [];
  for (const e of events.events_this_week || []) {
    const span = e.dates?.length ? e.dates[0] + (e.dates.length > 1 ? ' – ' + e.dates[e.dates.length - 1] : '') : '';
    items.push({
      source: 'events', guid: 'hl-event-' + e.id, title: both(e.title_zh, e.title_en), link: e.source_url || SITE + '/whatson/',
      description: [span, e.time, e.venue, e.price_zh].filter(Boolean).join(' · '), category: '周末活动',
    });
  }
  for (const b of (briefing.items || []).filter(i => BRIEFING_CATEGORIES.includes(i.category))) {
    items.push({
      source: 'briefing', guid: 'hl-briefing-' + b.id, title: both(normalizeCurrency(b.summary_zh), b.title), link: b.url || SITE + '/', pubDate: b.published,
      description: [b.source, b.summary_zh ? b.title : ''].filter(Boolean).join(' · '), category: '每日快讯',
    });
  }
  const discount = d => d.historyVerified && d.typicalPrice > 0 ? 1 - d.salePrice / d.typicalPrice : -Infinity;
  const top = [...deals].sort((a, b) => discount(b) - discount(a) || String(a.id).localeCompare(String(b.id))).slice(0, FEED_CAP_BLACKFRIDAY);
  for (const d of top) {
    items.push({
      source: 'blackfriday', guid: 'hl-blackfriday-' + d.id, title: both(d.nameZh, d.nameEn || d.name) + ' · NZ$' + d.salePrice, link: d.productUrl || SITE + '/living/blackfriday/', pubDate: d.checkedAt,
      description: [d.store, d.offerLabel].filter(Boolean).join(' · '), category: '黑五优惠',
    });
  }
  return items;
}

export function renderFeed(root = '.') {
  const items = feedItems(root);
  const dates = items.map(i => Date.parse(i.pubDate)).filter(Number.isFinite);
  const out = ['<?xml version="1.0" encoding="UTF-8"?>', '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">', '<channel>',
    '<title>Hamilton Local 汉密尔顿本地</title>', '<link>' + SITE + '/</link>',
    '<description>' + xmlEsc('汉密尔顿本地活动、每日快讯与黑五优惠 · Hamilton events, daily briefing and Black Friday deals') + '</description>',
    '<language>zh-CN</language>', '<atom:link href="' + SITE + '/feed.xml" rel="self" type="application/rss+xml"/>'];
  if (dates.length) out.push('<lastBuildDate>' + new Date(Math.max(...dates)).toUTCString() + '</lastBuildDate>');
  for (const i of items) {
    out.push('<item>', '<title>' + xmlEsc(i.title) + '</title>', '<link>' + xmlEsc(i.link) + '</link>',
      '<guid isPermaLink="false">' + xmlEsc(i.guid) + '</guid>');
    const t = Date.parse(i.pubDate);
    if (Number.isFinite(t)) out.push('<pubDate>' + new Date(t).toUTCString() + '</pubDate>');
    out.push('<category>' + xmlEsc(i.category) + '</category>');
    if (i.description) out.push('<description>' + xmlEsc(i.description) + '</description>');
    out.push('</item>');
  }
  out.push('</channel>', '</rss>', '');
  return out.join('\n');
}
