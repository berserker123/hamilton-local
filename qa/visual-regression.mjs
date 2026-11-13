// Screenshots every top-level page and sub-tab, then diffs them against qa/baseline.
// Usage from the repo root, with source/dist already built and nothing else on port 4179:
//   node qa/visual-regression.mjs baseline
//   node qa/visual-regression.mjs check
// Weekend is listed in qa/exclude.txt for a round that is allowed to change that page.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(resolve(fileURLToPath(import.meta.url), '../../source/package.json'));
const { chromium } = require('playwright');
const root = resolve(fileURLToPath(import.meta.url), '../..');
const mode = process.argv[2] || 'check';
const port = 4179;
const base = `http://127.0.0.1:${port}`;
const baselineDir = resolve(root, 'qa/baseline');
const currentDir = resolve(root, 'qa/last');
const outDir = mode === 'baseline' ? baselineDir : currentDir;

const tabs = {
  tools: ['bins', 'urgent', 'bus', 'pay', 'checklist', 'gst', 'units', 'seasonal', 'other'],
  living: ['grocers', 'dining', 'places', 'upick', 'stays'],
  weekend: ['picks', 'markets'],
  kids: ['map', 'places', 'parties'],
  services: ['home', 'trades', 'daily', 'pets'],
};
const views = [{ id: 'home', hash: '#/' }];
for (const [route, items] of Object.entries(tabs)) {
  for (const tab of items) views.push({ id: `${route}-${tab}`, hash: `#/${route}?tab=${tab}`, route, tab, footer: tab === items[0] });
}
views[0].footer = true;
views[0].route = 'home';

const viewports = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'mobile', width: 390, height: 844 },
];
const themes = ['day', 'night'];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function serve() {
  const child = spawn(process.execPath, ['preview.cjs'], {
    cwd: resolve(root, 'source'),
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const started = new Promise((resolvePromise, reject) => {
    const timer = setTimeout(() => reject(new Error('preview did not start')), 8000);
    child.stdout.on('data', () => { clearTimeout(timer); resolvePromise(); });
    child.on('exit', code => { clearTimeout(timer); reject(new Error('preview exited ' + code)); });
  });
  await started;
  return child;
}

async function shoot(page, file, footer) {
  if (footer) {
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await sleep(200);
  } else {
    await page.evaluate(() => window.scrollTo(0, 0));
  }
  await page.screenshot({ path: file, type: 'jpeg', quality: 60, animations: 'disabled' });
}

async function capture() {
  rmSync(outDir, { recursive: true, force: true });
  const browser = await chromium.launch({ headless: true });
  try {
    for (const theme of themes) {
      for (const viewport of viewports) {
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          deviceScaleFactor: 1,
          colorScheme: theme === 'night' ? 'dark' : 'light',
        });
        await context.addInitScript(value => {
          localStorage.setItem('hl-theme', value);
          localStorage.setItem('hl-lang', 'zh');
        }, theme);
        await context.route('**/*tile.openstreetmap.org/**', route => route.abort());
        const page = await context.newPage();
        for (const view of views) {
          await page.goto(base + '/' + view.hash, { waitUntil: 'domcontentloaded' });
          await page.waitForSelector('.ia-root', { timeout: 10000 });
          await page.addStyleTag({ content: '*,*::before,*::after{animation:none !important;transition:none !important;caret-color:transparent}' });
          await sleep(350);
          const dir = resolve(outDir, theme, viewport.name);
          mkdirSync(dir, { recursive: true });
          await shoot(page, resolve(dir, `${view.id}.jpg`), false);
          if (view.footer) await shoot(page, resolve(dir, `footer-${view.route}.jpg`), true);
        }
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
}

function diffReport() {
  const exclude = existsSync(resolve(root, 'qa/exclude.txt'))
    ? readFileSync(resolve(root, 'qa/exclude.txt'), 'utf8').split('\n').map(s => s.trim()).filter(Boolean)
    : [];
  const script = `
import sys
from pathlib import Path
from PIL import Image, ImageChops, ImageStat
baseline, current, exclude = Path(sys.argv[1]), Path(sys.argv[2]), sys.argv[3].split(',')
rows = []
for path in sorted(baseline.rglob('*.jpg')):
    rel = path.relative_to(baseline).as_posix()
    other = current / rel
    if not other.exists():
        rows.append((rel, 'missing', 999, False))
        continue
    a = Image.open(path).convert('RGB')
    b = Image.open(other).convert('RGB')
    if a.size != b.size:
        b = b.resize(a.size)
    diff = ImageChops.difference(a, b)
    mean = sum(ImageStat.Stat(diff).mean) / 3
    changed = mean > 1.6
    intended = any(part and part in rel for part in exclude)
    rows.append((rel, 'changed' if changed else 'same', round(mean, 2), intended))
unexpected = [r for r in rows if r[1] != 'same' and not r[3]]
print('SHOTS', len(rows))
print('SAME', sum(1 for r in rows if r[1]=='same'))
print('CHANGED', sum(1 for r in rows if r[1]=='changed'))
for rel, status, mean, intended in rows:
    if status != 'same':
        print(f'{status}\\t{mean}\\t{"intended" if intended else "UNEXPECTED"}\\t{rel}')
sys.exit(1 if unexpected else 0)
`;
  writeFileSync('/tmp/hl-visual-diff.py', script);
  const { spawnSync } = require('node:child_process');
  const result = spawnSync('python3', ['/tmp/hl-visual-diff.py', baselineDir, currentDir, exclude.join(',')], { encoding: 'utf8' });
  process.stdout.write(result.stdout || '');
  process.stderr.write(result.stderr || '');
  return result.status ?? 1;
}

const server = await serve();
try {
  await capture();
  if (mode === 'baseline') {
    console.log('BASELINE', outDir);
  } else {
    const code = diffReport();
    process.exitCode = code;
  }
} finally {
  server.kill('SIGTERM');
}
