const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4186';
const shots = path.resolve(__dirname, '../out/shots/v25d');
const chrome = 'F:/Bo/ms-playwright/chromium-1254/chrome-win64/chrome.exe';

function turnedAround(transform) {
  if (!transform.startsWith('matrix3d(')) return false;
  const n = transform.slice(9, -1).split(',').map(Number);
  return n[0] < -0.9 && Math.abs(n[5] - 1) < 0.15;
}

(async () => {
  fs.mkdirSync(shots, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: chrome });
  const report = { checks: [], consoleErrors: [], pageErrors: [], httpErrors: [] };
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
    page.on('pageerror', error => report.pageErrors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) report.httpErrors.push({ url: response.url(), status: response.status() }); });

    async function openPlaces(target, hash) {
      await target.goto(base + '/' + hash);
      await target.locator('#section-panel').waitFor();
      if (await target.locator('html').getAttribute('lang') !== 'zh-CN') await target.getByTestId('lang').click();
    }
    async function assertPhotoCards(target) {
      const rows = await target.locator('[data-place-id]').evaluateAll(els => els.map(el => ({
        photo: !!el.querySelector('.ia-place-photo'),
        pending: !!el.querySelector('.ia-photo-pending'),
        flip: el.querySelectorAll('.ia-flip').length,
        hint: el.querySelectorAll('.ia-flip-hint').length,
      })));
      assert.ok(rows.some(row => row.photo), 'a photo card exists');
      for (const row of rows) {
        if (row.photo) {
          assert.equal(row.flip, 1);
          assert.equal(row.hint, 1);
          assert.equal(row.pending, false);
        }
        if (row.pending) assert.equal(row.flip, 0);
      }
    }

    await openPlaces(page, '#/living?tab=places');
    await assertPhotoCards(page);
    assert.ok(await page.locator('#everyday-places .ia-photo-pending').count() > 0, 'placeholder exists');
    const card = page.locator('[data-place-id="hamilton-gardens"]');
    await card.scrollIntoViewIfNeeded();
    assert.equal(await card.locator('.ia-flip').getAttribute('data-flipped'), 'false');
    assert.equal(await card.locator('.ia-flip-hint').innerText(), 'i');
    await page.screenshot({ path: path.join(shots, 'flip-front.png') });

    await card.locator('.ia-flip-front').click();
    await page.waitForTimeout(600);
    assert.equal(await page.locator('dialog[open]').count(), 0, 'photo click does not open details');
    assert.equal(await card.locator('.ia-flip').getAttribute('data-flipped'), 'true');
    const backText = await card.locator('.ia-flip-copy').innerText();
    assert.match(backText, /作者/);
    assert.match(backText, /Daderot/);
    assert.match(backText, /授权/);
    assert.match(backText, /CC0/);
    assert.equal(await card.locator('.ia-flip-copy a').nth(0).getAttribute('href'), 'https://creativecommons.org/publicdomain/zero/1.0/');
    assert.equal(await card.locator('.ia-flip-copy a').nth(1).getAttribute('href'), 'https://commons.wikimedia.org/wiki/File:Italian_Renaissance_Garden_-_Hamilton_Gardens_-_Hamilton,_NZ_-_DSC06549.jpg');
    const size = await card.locator('.ia-flip').evaluate(el => {
      const front = el.querySelector('.ia-flip-front').getBoundingClientRect();
      const back = el.querySelector('.ia-flip-back').getBoundingClientRect();
      const photo = el.getBoundingClientRect();
      return { front, back, photo };
    });
    assert.ok(Math.abs(size.front.width - size.back.width) < 2 && Math.abs(size.front.height - size.back.height) < 2, 'back face matches the photo');
    assert.ok(Math.abs(size.photo.height - size.back.height) < 2);
    const motion = await card.locator('.ia-flip-front').evaluate(el => ({ transform: getComputedStyle(el).transform, duration: getComputedStyle(el).transitionDuration }));
    assert.ok(turnedAround(motion.transform), motion.transform);
    assert.equal(motion.duration, '0.5s');
    await page.screenshot({ path: path.join(shots, 'flip-back.png') });
    report.checks.push('Click flips the first photo to author, linked licence and source at the same size');

    const opened = [];
    page.context().on('request', request => { if (/creativecommons\.org/.test(request.url())) opened.push(request.url()); });
    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      card.locator('.ia-flip-copy a').nth(0).click(),
    ]);
    await popup.waitForLoadState('commit', { timeout: 15000 }).catch(() => {});
    const licenceUrl = popup.url() || opened[0] || '';
    assert.match(licenceUrl, /creativecommons\.org/);
    if (!popup.isClosed()) await popup.close();
    assert.equal(await card.locator('.ia-flip').getAttribute('data-flipped'), 'true', 'licence link keeps the back face open');
    await card.locator('.ia-flip-back-hit').click();
    assert.equal(await card.locator('.ia-flip').getAttribute('data-flipped'), 'false');
    report.checks.push('Licence link opens; clicking the back face flips to the photo');

    const zoo = page.locator('[data-place-id="hamilton-zoo"]');
    await zoo.locator('.ia-flip-front').focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.querySelector('[data-place-id="hamilton-zoo"] .ia-flip')?.getAttribute('data-flipped') === 'true');
    assert.match(await page.evaluate(() => document.activeElement.className), /ia-flip-back-hit/);
    await page.keyboard.press(' ');
    await page.waitForFunction(() => document.querySelector('[data-place-id="hamilton-zoo"] .ia-flip')?.getAttribute('data-flipped') === 'false');
    report.checks.push('Enter and Space flip a focused photo');

    await card.locator('.ia-place-actions a').click();
    await page.locator('dialog[open] .ia-detail-credit').waitFor();
    assert.match(await page.locator('dialog[open] .ia-detail-credit').innerText(), /Daderot/);
    assert.match(await page.locator('dialog[open] .ia-detail-credit').innerText(), /CC0/);
    await page.keyboard.press('Escape');
    await page.getByTestId('credits-btn').click();
    await page.locator('dialog[open]').waitFor();
    assert.match(await page.locator('dialog[open]').innerText(), /图片来源/);
    await page.keyboard.press('Escape');
    report.checks.push('Detail credit and footer photo-credit list stay');

    await openPlaces(page, '#/kids?tab=places');
    await assertPhotoCards(page);
    report.checks.push('Family photo cards flip; placeholders do not');

    const reduce = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    reduce.on('pageerror', error => report.pageErrors.push(error.message));
    await openPlaces(reduce, '#/living?tab=places');
    const gardens = reduce.locator('[data-place-id="hamilton-gardens"]');
    await gardens.locator('.ia-flip-front').click();
    await reduce.waitForTimeout(700);
    const faded = await gardens.locator('.ia-flip').evaluate(el => {
      const front = getComputedStyle(el.querySelector('.ia-flip-front'));
      const back = getComputedStyle(el.querySelector('.ia-flip-back'));
      return { frontTransform: front.transform, frontOpacity: front.opacity, backOpacity: back.opacity, transition: front.transitionProperty };
    });
    assert.equal(faded.frontTransform, 'none');
    assert.equal(faded.frontOpacity, '0');
    assert.equal(faded.backOpacity, '1');
    assert.match(faded.transition, /opacity/);
    await reduce.close();
    report.checks.push('Reduced motion fades instead of rotating');

    assert.deepEqual(report.consoleErrors, []);
    assert.deepEqual(report.pageErrors, []);
    assert.deepEqual(report.httpErrors, []);
    report.passed = true;
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
