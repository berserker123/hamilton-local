const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const base = 'http://127.0.0.1:4186';
const out = path.resolve(__dirname, '../out');
const shots = path.join(out, 'shots/v25k');
const categories = require('./src/pets-v25.json');
const merchants = require('./src/_hidden/pets-listings-v25.json').filter(g => g.id !== 'dog-parks').flatMap(g => g.items);
const terms = [...new Set(merchants.flatMap(i => [i.name, i.address, i.phone, i.url, i.introZh, i.introEn]).filter(Boolean))];
const report = { url: base, browser: 'Requested Chromium; Browser plugin not available', checks: [], errors: [], screenshots: [], leaks: [] };
function files(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap(f => f.isDirectory() ? files(path.join(dir, f.name)) : [path.join(dir, f.name)]); }
function decode(s) { return s.replace(/\\u([0-9a-f]{4})/gi, (_, h) => String.fromCharCode(parseInt(h, 16))); }
function audit(text, label) { for (const term of terms) if (decode(text).includes(term)) report.leaks.push({ label, term }); }
(async () => {
  fs.mkdirSync(shots, { recursive: true });
  for (const file of files(path.join(__dirname, 'dist'))) audit(fs.readFileSync(file, 'utf8'), path.relative(__dirname, file));
  assert.deepEqual(report.leaks, [], 'No archived pet merchant details in any dist file');
  report.checks.push('All dist files scanned for ' + terms.length + ' unique merchant names, addresses, phones, URLs and introductions: 0 hits');
  const browser = await chromium.launch({ headless: true, executablePath: 'F:/Bo/ms-playwright/chromium-1254/chrome-win64/chrome.exe' });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, reducedMotion: 'reduce' });
    page.on('pageerror', e => report.errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()); });
    async function open(route = '') {
      await page.goto(base + '/#/' + route);
      await page.locator('h1').waitFor();
      await page.evaluate(() => document.fonts.ready);
      assert.match(await page.title(), /Hamilton Local/);
      assert.ok((await page.locator('main').innerText()).length > 100);
      assert.equal(await page.locator('vite-error-overlay,nextjs-portal').count(), 0);
      audit(await page.content(), route);
    }
    for (const width of [1280, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const lang of ['zh', 'en']) {
        await open('services?tab=pets');
        if ((await page.locator('html').getAttribute('lang') === 'zh-CN') !== (lang === 'zh')) await page.getByTestId('lang').click();
        assert.equal(await page.locator('#tab-pets').getAttribute('aria-selected'), 'true');
        const cards = page.locator('[data-pet-category]');
        assert.equal(await cards.count(), 6);
        assert.equal(await page.locator('#pets [data-directory-id],#pets a').count(), 0);
        const boxes = await cards.evaluateAll(es => es.map(e => { const r = e.getBoundingClientRect(); return { width: r.width, height: r.height }; }));
        assert.ok(Math.max(...boxes.map(b => b.height)) - Math.min(...boxes.map(b => b.height)) < 1);
        assert.ok(Math.max(...boxes.map(b => b.width)) - Math.min(...boxes.map(b => b.width)) < 1);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        for (const group of categories) {
          const card = page.locator('#pet-' + group.id);
          assert.equal(await card.locator('h3').innerText(), group.zh);
          assert.equal(await card.locator('.v25k-pet-english').innerText(), group.en);
          assert.equal(await card.locator('.v25k-pet-status').innerText(), '商家招募中 · Listings coming soon');
          await card.hover();
          assert.equal(await card.evaluate(e => getComputedStyle(e).boxShadow), 'none');
          assert.equal(await card.evaluate(e => getComputedStyle(e, '::after').content), 'none');
          const button = card.getByRole('button', { name: '商家入驻 / 广告合作', exact: true });
          await button.click();
          await page.locator('.fb-dialog[open]').waitFor();
          assert.ok((await page.locator('input[name="section"]').inputValue()).includes('宠物指南-' + group.zh));
          assert.equal(await page.locator('input[name="type"]:checked').inputValue(), 'business');
          assert.equal(await page.locator('#fb-message').inputValue(), '宠物指南-' + group.zh + '：商家入驻 / 广告合作');
          await page.keyboard.press('Escape');
          // Feedback restores focus on the next animation frame after closing.
          await page.waitForFunction(element => element === document.activeElement, await button.elementHandle());
          assert.equal(await button.evaluate(e => e === document.activeElement), true);
        }
        report.checks.push(width + '/' + lang + ': six equal bilingual cards, no glow/overflow, all six feedback buttons prefilled, Escape restores focus');
      }
    }
    for (const route of ['', 'tools', 'services?tab=home', 'living?tab=upick']) {
      await open(route);
      await page.getByTestId('credits-btn').click();
      await page.locator('dialog[open]').waitFor();
      audit(await page.content(), route + '/credits');
      await page.keyboard.press('Escape');
    }
    await open();
    await page.locator('input[type="search"]').fill('宠物');
    await page.locator('.ia-hero-search button').click();
    await page.locator('#pets').waitFor();
    assert.match(page.url(), /services\?tab=pets/);
    audit(await page.content(), 'pet search results');
    await open('living?tab=pets&at=pet-vets');
    assert.match(page.url(), /services\?tab=pets/);
    assert.equal(await page.locator('#pet-vets').count(), 1);
    report.checks.push('Homepage, tool navigation, directory, orchard page, footer credits, search and legacy category anchor audited');
    for (const [width, name] of [[1280, 'pets-desktop.png'], [390, 'pets-mobile.png']]) {
      await page.setViewportSize({ width, height: 1000 });
      await open('services?tab=pets');
      if (await page.locator('html').getAttribute('lang') !== 'zh-CN') await page.getByTestId('lang').click();
      await page.locator('[role="tablist"]').evaluate(e => e.scrollIntoView({ block: 'start' }));
      await page.mouse.move(1, 1);
      await page.evaluate(() => document.activeElement?.blur());
      if (width === 390) await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: path.join(shots, name), fullPage: width === 390 });
      report.screenshots.push(path.join(shots, name));
    }
    assert.deepEqual(report.errors, []);
    assert.deepEqual(report.leaks, []);
    report.passed = true;
  } finally {
    await browser.close();
    fs.writeFileSync(path.join(out, 'qa-v25k.json'), JSON.stringify(report, null, 2));
  }
  console.log('PASS v25k: ' + report.checks.length + ' check groups; ' + terms.length + ' merchant details absent; 2 screenshots');
})().catch(e => { console.error(e); process.exitCode = 1; });
