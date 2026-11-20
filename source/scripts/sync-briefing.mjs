// Syncs hamilton-watch (latest.json) or hamilton-daily afternoon brief into src/data/briefing.json and rebuilds /feed.xml.
// Picks whichever source was generated later; keeps NZD-only currency normalization via src/currency.mjs.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeCurrency } from '../src/currency.mjs';
import { renderFeed } from '../src/feed.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(root, '..');
const DEFAULT_WATCH_PATH = 'F:\\Bo\\hamilton-watch\\out\\latest.json';
const DEFAULT_DAILY_DIR = 'F:\\Bo\\hamilton-daily';

const SECTION_SKIP = new Set(['明日天气']);

export function sourceLabel(url) {
  let host = '';
  try {
    host = new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
  if (host.includes('reddit.com')) {
    const m = url.match(/\/r\/([^/]+)\//);
    return m ? `r/${m[1]}` : 'Reddit';
  }
  return {
    'stuff.co.nz': 'Stuff',
    'nzherald.co.nz': 'NZ Herald',
    'waikatotimes.co.nz': 'Waikato Times',
    'rnz.co.nz': 'RNZ',
    '1news.co.nz': '1News',
    'hamilton.govt.nz': 'Hamilton City Council',
    'journeys.nzta.govt.nz': 'NZTA Journeys',
    'police.govt.nz': 'NZ Police',
    'skykiwi.com': '天维网',
  }[host] || host;
}

export function shortenAfternoonText(text) {
  let t = String(text || '').trim();
  t = t.replace(/^(?:今日|今天|日前|昨日|近日)?\s*[^，,]{1,15}报道[，,]\s*/, '');
  const postMatch = t.match(/^(?:有网友(?:在\s*r\/\w+\s*)?发帖|社区论坛有帖子)(?:称|提及|提到|询问|表示)?\s*/);
  const commentsMatch = t.match(/[，,]?该帖共(?:获得|有|收到)?\s*(\d+)\s*条评论[。.]?$/);
  if (commentsMatch) {
    t = t.slice(0, commentsMatch.index);
  }
  if (postMatch) {
    t = '网友热议：' + t.slice(postMatch[0].length);
  }
  t = t.replace(/[。.]+$/, '');
  if (commentsMatch) {
    t += `（${commentsMatch[1]} 条评论）`;
  }
  return t;
}

function categoryForAfternoonUrl(url) {
  let host = '';
  let pathname = '';
  try {
    const u = new URL(url);
    host = u.hostname.replace(/^www\./, '');
    pathname = u.pathname;
  } catch {
    return 'news';
  }
  if (host === 'hamilton.govt.nz') return 'council';
  if (host === 'journeys.nzta.govt.nz') return 'roads';
  if (host === 'police.govt.nz') return 'police';
  if (host.includes('metservice.com') || /\/news\/weather\//.test(pathname)) return 'weather';
  return 'news';
}

function buildSourceLookup(dailyJson) {
  const byUrl = new Map();
  const sources = dailyJson?.sources;
  if (!sources || typeof sources !== 'object') return byUrl;
  for (const [sourceKey, list] of Object.entries(sources)) {
    if (!Array.isArray(list)) continue;
    for (const entry of list) {
      if (!entry || typeof entry.url !== 'string' || !entry.url.trim()) continue;
      const isEnglishSource = sourceKey !== 'skykiwi_filtered';
      const rec = {
        title: isEnglishSource && typeof entry.title === 'string' ? entry.title.trim() : '',
        summary: isEnglishSource && typeof entry.summary === 'string' ? entry.summary.trim() : '',
      };
      const rawUrl = entry.url.trim();
      byUrl.set(rawUrl, rec);
      byUrl.set(rawUrl.replace(/\/+$/, ''), rec);
    }
  }
  return byUrl;
}

export function parseAfternoonBrief(mdText, dailyJson) {
  const generated = dailyJson?.generated;
  if (typeof generated !== 'string' || !Number.isFinite(Date.parse(generated))) {
    throw new Error('unexpected afternoon schema: missing generated timestamp');
  }
  const byUrl = buildSourceLookup(dailyJson);
  const items = [];
  const seenUrls = new Set();
  let section = '';

  for (const rawLine of String(mdText || '').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.startsWith('## ')) {
      section = line.slice(3).trim();
      continue;
    }
    if (SECTION_SKIP.has(section)) continue;
    const m = line.match(/^[-*]\s+(.*?)\s*\[[^\]]*\]\((https?:\/\/[^)\s]+)\)\s*[。.]?\s*$/);
    if (!m) continue;
    const rawBody = m[1].trim();
    const url = m[2].trim();
    if (!rawBody || !url || seenUrls.has(url)) continue;
    seenUrls.add(url);

    const srcMeta = byUrl.get(url) || byUrl.get(url.replace(/\/+$/, '')) || { title: '', summary: '' };
    const id = crypto.createHash('sha1').update(url).digest('hex').slice(0, 12);
    items.push({
      id,
      source: sourceLabel(url),
      title: srcMeta.title,
      url,
      published: generated,
      date_only: false,
      summary: srcMeta.summary,
      summary_zh: shortenAfternoonText(rawBody),
      category: categoryForAfternoonUrl(url),
      urgent: false,
    });
  }

  return { generated_at: generated, items };
}

export function normalizeBriefingData(data) {
  if (!data || !Array.isArray(data.items) || !data.generated_at) {
    throw new Error('unexpected schema');
  }
  return {
    ...data,
    items: data.items.map(item => ({
      ...item,
      summary_zh: typeof item.summary_zh === 'string' && item.summary_zh.trim()
        ? normalizeCurrency(item.summary_zh)
        : item.summary_zh,
    })),
  };
}

function loadWatchCandidate(watchPath) {
  if (!watchPath || !fs.existsSync(watchPath)) return null;
  const data = JSON.parse(fs.readFileSync(watchPath, 'utf8'));
  const ts = Date.parse(data?.generated_at);
  if (!Array.isArray(data?.items) || !Number.isFinite(ts)) {
    throw new Error(`unexpected schema in ${watchPath}`);
  }
  return { kind: 'watch', ts, sourcePath: watchPath, data };
}

function loadLatestDailyCandidate(dailyDir, dailyDate) {
  if (!dailyDir || !fs.existsSync(dailyDir)) return null;
  const dataDir = path.join(dailyDir, 'data');
  const outDir = path.join(dailyDir, 'out');
  if (!fs.existsSync(dataDir) || !fs.existsSync(outDir)) return null;

  const files = dailyDate
    ? [`${dailyDate}.json`]
    : fs.readdirSync(dataDir).filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();

  let best = null;
  for (const file of files) {
    const day = file.slice(0, 10);
    const jsonPath = path.join(dataDir, file);
    const mdPath = path.join(outDir, `${day}-brief.md`);
    if (!fs.existsSync(jsonPath) || !fs.existsSync(mdPath)) continue;
    const dailyJson = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const ts = Date.parse(dailyJson?.generated);
    if (!Number.isFinite(ts)) continue;
    const parsed = parseAfternoonBrief(fs.readFileSync(mdPath, 'utf8'), dailyJson);
    if (!parsed.items.length) continue;
    if (!best || ts > best.ts || (ts === best.ts && day > best.day)) {
      best = { kind: 'daily', ts, day, sourcePath: mdPath, data: parsed };
    }
  }
  return best;
}

export function selectNewestSource(watchPath, dailyDir, dailyDate) {
  const candidates = [];
  const watch = loadWatchCandidate(watchPath);
  if (watch) candidates.push(watch);
  const daily = loadLatestDailyCandidate(dailyDir, dailyDate);
  if (daily) candidates.push(daily);
  if (!candidates.length) {
    const err = new Error('source not found');
    err.code = 'ENOENT';
    throw err;
  }
  candidates.sort((a, b) => b.ts - a.ts || (a.kind === 'daily' ? -1 : 1));
  return candidates[0];
}

export function syncBriefing(
  sourcePath = process.argv[2] || process.env.BRIEFING_SOURCE || DEFAULT_WATCH_PATH,
  sourceRoot = root,
  deployRoot = repoRoot,
  options = {},
) {
  const envDaily = process.env.BRIEFING_DAILY_DIR;
  const dailyDir = options.dailyDir !== undefined
    ? options.dailyDir
    : (process.argv[3] ?? (envDaily !== undefined ? envDaily : DEFAULT_DAILY_DIR));
  const selected = selectNewestSource(sourcePath, dailyDir, options.dailyDate);
  const normalized = normalizeBriefingData(selected.data);
  const dest = path.join(sourceRoot, 'src', 'data', 'briefing.json');
  fs.writeFileSync(dest, JSON.stringify(normalized, null, 2) + '\n');

  const feedXml = renderFeed(sourceRoot);
  const distDir = path.join(sourceRoot, 'dist');
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'feed.xml'), feedXml);
  }
  fs.writeFileSync(path.join(deployRoot, 'feed.xml'), feedXml);
  return {
    count: normalized.items.length,
    generated_at: normalized.generated_at,
    kind: selected.kind,
    sourcePath: selected.sourcePath,
  };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  try {
    const res = syncBriefing();
    console.log(`sync:briefing: synced ${res.count} items (${res.generated_at}, ${res.kind}) from ${res.sourcePath} and rebuilt feed.xml`);
  } catch (e) {
    console.error('sync:briefing: skipped (' + (e.code === 'ENOENT' ? 'source not found' : e.message) + '); kept existing briefing.json');
    process.exitCode = 1;
  }
}
