const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const base = 'http://127.0.0.1:4186';
const origin = 'https://hamiltonlocal.nz/';
const dist = path.join(__dirname, 'dist');
const report = { browser: 'Browser plugin not available; local Playwright Chromium used', url: base, checks: [] };
function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(f => f.isDirectory() ? files(path.join(dir, f.name)) : [path.join(dir, f.name)]);
}
(async () => {
  for (const name of ['robots.txt', 'sitemap.xml', 'og-image.jpg', 'favicon.svg']) assert.ok(fs.existsSync(path.join(dist, name)), name + ' included in build');
  for (const file of files(dist)) {
    const text = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(text, /noindex/i, path.relative(dist, file));
    assert.doesNotMatch(text, /Pet Essentials|Raw Essentials|Newstead/, path.relative(dist, file) + ' pet grep');
  }
  const robots = fs.readFileSync(path.join(dist, 'robots.txt'), 'utf8');
  assert.match(robots, /^User-agent: \*$/m);
  assert.match(robots, /^Allow: \/$/m);
  assert.match(robots, /^Sitemap: https:\/\/hamiltonlocal\.nz\/sitemap\.xml$/m);
  assert.doesNotMatch(robots, /^Disallow:\s*\//m);
  report.checks.push('Build includes crawl assets and favicon; robots allows all; no noindex; all three pet grep terms have zero hits');
  const browser = await chromium.launch({ headless: true, executablePath: 'F:/Bo/ms-playwright/chromium-1254/chrome-win64/chrome.exe' });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    const response = await page.request.get(base + '/');
    assert.equal(response.status(), 200);
    const html = await response.text();
    const metadata = await page.evaluate(html => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      return {
        lang: doc.documentElement.lang, title: doc.title,
        canonical: [...doc.querySelectorAll('link[rel="canonical"]')].map(e => e.getAttribute('href')),
        meta: Object.fromEntries([...doc.querySelectorAll('meta[property],meta[name]')].map(e => [e.getAttribute('property') || e.name, e.content])),
        schemas: [...doc.querySelectorAll('script[type="application/ld+json"]')].map(e => JSON.parse(e.textContent)),
      };
    }, html);
    assert.match(metadata.lang, /^zh-(CN|Hans)$/);
    assert.equal(metadata.title, '首页 · Hamilton Local');
    assert.deepEqual(metadata.canonical, [origin]);
    assert.equal(metadata.meta.description, 'Hamilton Local：汉密尔顿本地生活、周末活动、亲子遛娃、便民黄页与实用工具箱。独立整理的本地生活指南。');
    const expected = {
      'og:title': metadata.title, 'og:description': metadata.meta.description,
      'og:url': origin, 'og:type': 'website', 'og:site_name': 'Hamilton Local', 'og:locale': 'zh_CN',
      'og:image': origin + 'og-image.jpg', 'og:image:width': '1200', 'og:image:height': '630',
      'og:image:type': 'image/jpeg', 'twitter:card': 'summary_large_image',
      'twitter:title': metadata.title, 'twitter:description': metadata.meta.description,
      'twitter:image': origin + 'og-image.jpg',
    };
    for (const [key, value] of Object.entries(expected)) assert.equal(metadata.meta[key], value, key);
    assert.deepEqual(metadata.schemas, [{ '@context': 'https://schema.org', '@type': 'WebSite', name: 'Hamilton Local', alternateName: '汉密尔顿生活指南', url: origin, inLanguage: ['zh-Hans', 'en-NZ'] }]);
    report.checks.push('Static HTML preserves title/description and contains canonical, social metadata and valid WebSite JSON-LD');
    for (const [name, type] of [['robots.txt', 'text/plain'], ['sitemap.xml', 'application/xml'], ['og-image.jpg', 'image/jpeg'], ['favicon.svg', 'image/svg+xml']]) {
      const asset = await page.request.get(base + '/' + name);
      assert.equal(asset.status(), 200, name);
      assert.ok(asset.headers()['content-type'].startsWith(type), name + ' MIME type');
    }
    const sitemap = await page.evaluate(xml => {
      const doc = new DOMParser().parseFromString(xml, 'application/xml');
      return { errors: doc.querySelectorAll('parsererror').length, namespace: doc.documentElement.namespaceURI, urls: [...doc.querySelectorAll('url > loc')].map(e => e.textContent) };
    }, fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8'));
    assert.deepEqual(sitemap, { errors: 0, namespace: 'http://www.sitemaps.org/schemas/sitemap/0.9', urls: [origin] });
    await page.goto(base);
    await page.locator('h1').waitFor();
    assert.ok((await page.locator('main').innerText()).length > 100);
    assert.equal(await page.locator('vite-error-overlay,nextjs-portal').count(), 0);
    const dimensions = await page.evaluate(async () => {
      const response = await fetch('/og-image.jpg');
      const bitmap = await createImageBitmap(await response.blob());
      return [bitmap.width, bitmap.height];
    });
    assert.deepEqual(dimensions, [1200, 630]);
    const homeTitle = await page.title();
    await page.goto(base + '/#/tools?tab=gst');
    await page.locator('[data-testid="tab-gst"][aria-selected="true"]').waitFor();
    assert.notEqual(await page.title(), homeTitle);
    assert.match(await page.title(), /Hamilton Local/);
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), origin);
    assert.deepEqual(errors, []);
    report.checks.push('Sitemap is valid homepage-only XML; image decodes at 1200x630; assets return 200 with correct MIME types');
    report.checks.push('Homepage renders; hash navigation keeps per-view titles and canonical; no console/page errors');
    report.passed = true;
  } finally { await browser.close(); }
})().catch(e => { report.passed = false; report.error = e.stack; process.exitCode = 1; }).finally(() => {
  fs.writeFileSync(path.join(__dirname, '../out/qa-v25l.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
});
