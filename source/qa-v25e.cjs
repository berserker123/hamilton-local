const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4186';
const out = path.resolve(__dirname, '../out');
const shots = path.join(out, 'shots/v25e');
const chrome = 'F:/Bo/ms-playwright/chromium-1254/chrome-win64/chrome.exe';
const report = { checks: [], consoleErrors: [], pageErrors: [] };

(async () => {
  fs.mkdirSync(shots, { recursive: true });
  const browser = await chromium.launch({ executablePath: chrome, headless: true });
  let referenceServer;
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce' });
    page.setDefaultTimeout(10000);
    page.on('console', m => { if (m.type() === 'error') report.consoleErrors.push(m.text()); });
    page.on('pageerror', e => report.pageErrors.push(e.message));
    async function open(hash) {
      await page.goto(base + '/' + hash);
      await page.locator('#section-panel').waitFor();
      if (await page.locator('html').getAttribute('lang') !== 'zh-CN') await page.getByTestId('lang').click();
      assert.ok(await page.title());
    }
    async function shot(name, selector) {
      await page.locator(selector).first().evaluate(el => el.scrollIntoView({ block: 'start' }));
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(shots, name + '.png') });
    }
    await open('#/living?tab=upick');
    assert.equal(await page.getByTestId('tab-upick').getAttribute('aria-selected'), 'true');
    assert.equal(await page.locator('#upick [data-directory-id]').count(), require('./src/upick-v25.json').length);
    assert.deepEqual(await page.locator('.ia-tabs a').evaluateAll(es => es.map(e => e.id)), ['tab-grocers','tab-dining','tab-places','tab-upick','tab-stays','tab-pets']);
    await shot('upick', '#upick');
    await open('#/living?tab=places');
    assert.equal(await page.locator('#upick').count(), 0);
    assert.match(await page.locator('[data-place-id="hamilton-lake"] h3').innerText(), /Hamilton/);
    await open('#/living?tab=places&at=upick');
    assert.equal(await page.getByTestId('tab-upick').getAttribute('aria-selected'), 'true');
    report.checks.push('U-Pick sibling tab, order, farm count, old anchor compatibility; living names retained');

    await open('#/kids?tab=places');
    for (const id of ['hamilton-lake','hamilton-zoo','central-library']) {
      const card = page.locator(`[data-place-id="${id}"]`);
      assert.doesNotMatch(await card.locator('h3').innerText(), /Hamilton/);
      assert.match(await card.locator('.ia-secondary-name').innerText(), /Hamilton/);
    }
    await shot('kids-names', '.ia-place-grid');
    const library = page.locator('[data-place-id="central-library"]');
    assert.match(await library.locator('img').getAttribute('src'), /central-library-v25e.webp/);
    await library.locator('.ia-flip-front').click();
    assert.equal(await library.locator('.ia-flip').getAttribute('data-flipped'), 'true');
    assert.match(await library.locator('.ia-flip-copy').innerText(), /lumoplank/);
    assert.match(await library.locator('.ia-flip-copy').innerText(), /CC0/);
    await library.locator('.ia-flip-back-hit').click();
    await library.locator('.ia-place-actions a').click();
    assert.match(await page.locator('dialog[open] .ia-detail-credit').innerText(), /lumoplank.*CC0/);
    assert.doesNotMatch(await page.locator('#place-detail-title').innerText(), /Hamilton/);
    await shot('library', 'dialog[open]');
    await page.keyboard.press('Escape');
    await page.getByTestId('credits-btn').click();
    assert.match(await page.locator('dialog[open]').innerText(), /lumoplank/);
    await page.keyboard.press('Escape');
    report.checks.push('Kids Chinese title and separate English line; library flip, detail and footer credits');

    await open('#/living?tab=stays');
    const stays = require('./src/stays-v25.json');
    for (const item of stays) {
      const card = page.locator(`[data-directory-id="${item.id}"]`);
      assert.equal(await card.locator('.ia-flip, .ia-photo-pending').count(), 1);
      if (item.photo) {
        assert.ok(item.photoCredit && item.photoLicense && item.photoLicenseUrl && item.photoSource);
        assert.match(item.photoLicense, /^(CC0|CC BY(?:-SA)? )/);
        await card.locator('.ia-flip-front').click();
        assert.match(await card.locator('.ia-flip-copy').innerText(), new RegExp(item.photoCredit));
        await card.locator('.ia-flip-back-hit').click();
      } else assert.match(await card.locator('.ia-photo-pending').innerText(), /待补充/);
    }
    await shot('stays', '#stays');
    const stayOpener = page.locator('[data-directory-id]').first().locator('.ia-place-actions a').first();
    await stayOpener.click();
    await page.locator('dialog[open]').waitFor();
    assert.match(await page.locator('#stay-detail-title').innerText(), /Argent/);
    assert.equal(await page.locator('dialog[open] a').first().getAttribute('href'), stays[0].url);
    assert.match(await page.locator('dialog[open]').innerText(), /27 Lorne Street/);
    await page.keyboard.press('Escape');
    assert.equal(await stayOpener.evaluate(el => el === document.activeElement), true);
    report.checks.push('Every stay has exact-property verified image or explicit non-flipping placeholder; detail dialog, booking link, Escape and focus restoration');

    referenceServer = spawn(process.execPath, ['preview.cjs'], { cwd: 'F:/Bo/codex-work/hl-ia-v24/work', env: { ...process.env, PORT: '4187' }, windowsHide: true, stdio: 'ignore' });
    const reference = await browser.newPage({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce' });
    const geometry = el => {
      const s = getComputedStyle(el);
      return Object.fromEntries(['display','gridTemplateColumns','flexDirection','gap','padding','borderRadius','borderWidth','backgroundColor','textAlign','webkitLineClamp'].map(k => [k,s[k]]));
    };
    for (const [hash, name, selector] of [['#/weekend?tab=picks','weekend','.wa-row'],['#/weekend?tab=markets','markets','.wa-row'],['#/weekend?tab=festivals','festivals','.wa-row'],['#/kids?tab=parties','party','.pv-row']]) {
      await open(hash);
      await reference.goto('http://127.0.0.1:4187/' + hash);
      await reference.locator(selector).first().waitFor();
      await page.mouse.move(0, 0);
      await reference.mouse.move(0, 0);
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 1100 });
        await reference.setViewportSize({ width, height: 1100 });
        for (const part of [selector, '.wa-main', '.wa-tail', '.wa-sources', name === 'party' ? '.pv-details' : '.wa-market-rows, .wa-day-rows']) {
          assert.deepEqual(await page.locator(part).first().evaluate(geometry), await reference.locator(part).first().evaluate(geometry), `${name} ${width}: ${part} matches v24`);
        }
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), name + ' overflow');
      }
      await page.setViewportSize({ width: 1440, height: 1100 });
      if (name === 'weekend' || name === 'party') await shot(name, '.wa');
      if (name === 'party') {
        await page.locator('[data-party-region="all"]').click();
        for (const card of await page.locator('.pv-row').all()) {
          const english = await card.locator('.pv-english').innerText();
          assert.ok(english.length);
          assert.doesNotMatch(await card.locator('h4').innerText(), /汉密尔顿 Hamilton|剑桥 Cambridge|拉格伦 Raglan|怀卡托 Waikato/);
        }
        assert.ok(fs.readFileSync('src/party-venues.json','utf8').includes('滑索'));
      }
    }
    report.checks.push('Weekend picks, markets, festivals and parties match v24 computed styles at 1440/390; full text, Chinese names, 滑索 retained');
    for (const hash of ['#/living?tab=upick','#/living?tab=stays','#/kids?tab=places']) {
      await page.setViewportSize({ width: 390, height: 844 });
      await open(hash);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), hash + ' mobile overflow');
      await page.getByTestId('lang').click();
      assert.equal(await page.locator('html').getAttribute('lang'), 'en-NZ');
    }
    await page.goto(base);
    await page.locator('#guide-tab-living').click();
    await page.locator('.v25-preview-links a[href="#/living?tab=upick"]').click();
    assert.equal(await page.getByTestId('tab-upick').getAttribute('aria-selected'), 'true');
    report.checks.push('Mobile layout, English toggle and homepage U-Pick entry');
    assert.deepEqual(report.consoleErrors, []);
    assert.deepEqual(report.pageErrors, []);
    report.passed = true;
  } finally {
    await browser.close();
    referenceServer?.kill();
    fs.writeFileSync(path.join(out, 'qa-v25e.json'), JSON.stringify(report, null, 2));
  }
  console.log(JSON.stringify(report, null, 2));
})().catch(e => { console.error(e); process.exitCode = 1; });
