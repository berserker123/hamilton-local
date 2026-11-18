// Syncs hamilton-watch scraper output into src/data/briefing.json and rebuilds /feed.xml.
// Keeps NZD-only currency normalization via src/currency.mjs; never modifies the source directory.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeCurrency } from '../src/currency.mjs';
import { renderFeed } from '../src/feed.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(root, '..');
const from = process.argv[2] || process.env.BRIEFING_SOURCE || 'F:\\Bo\\hamilton-watch\\out\\latest.json';
const to = path.join(root, 'src', 'data', 'briefing.json');

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

export function syncBriefing(sourcePath = from, sourceRoot = root, deployRoot = repoRoot) {
  const raw = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  const normalized = normalizeBriefingData(raw);
  const dest = path.join(sourceRoot, 'src', 'data', 'briefing.json');
  fs.writeFileSync(dest, JSON.stringify(normalized, null, 2) + '\n');

  const feedXml = renderFeed(sourceRoot);
  const distDir = path.join(sourceRoot, 'dist');
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'feed.xml'), feedXml);
  }
  fs.writeFileSync(path.join(deployRoot, 'feed.xml'), feedXml);
  return { count: normalized.items.length, generated_at: normalized.generated_at };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  try {
    const res = syncBriefing(from, root, repoRoot);
    console.log(`sync:briefing: synced ${res.count} items (${res.generated_at}) from ${from} and rebuilt feed.xml`);
  } catch (e) {
    console.error('sync:briefing: skipped (' + (e.code === 'ENOENT' ? 'source not found' : e.message) + '); kept existing briefing.json');
    process.exitCode = 1;
  }
}
