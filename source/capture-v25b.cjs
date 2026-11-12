const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4186';
const out = path.resolve(__dirname, '../out/shots/v25b');
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: 'F:/Bo/ms-playwright/chromium-1254/chrome-win64/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  async function ready() {
    await page.evaluate(() => Promise.all([...document.images].map(i => { i.loading = 'eager'; return i.decode().catch(() => {}); })));
    await page.waitForTimeout(400);
  }
  async function shot(style, name, hash, selector) {
    const mobile = name.endsWith('mobile.png');
    await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 });
    await page.goto(`${base}/?cards=${style}${hash}`);
    await page.locator(selector).first().waitFor();
    if (await page.locator('html').getAttribute('lang') !== 'zh-CN') await page.getByTestId('lang').click();
    await page.locator(selector).first().evaluate(el => el.scrollIntoView({ block: 'start' }));
    await ready();
    await page.screenshot({ path: path.join(out, name) });
    console.log('saved', name);
  }
  try {
    for (const style of ['a', 'b', 'c']) {
      await shot(style, `cards-${style}-places.png`, '#/living?tab=places', '#everyday-places [data-place-id]');
      await shot(style, `cards-${style}-playground.png`, '#/kids', '[data-playground-id]');
      await shot(style, `cards-${style}-mobile.png`, '#/living?tab=places', '#everyday-places [data-place-id]');
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
