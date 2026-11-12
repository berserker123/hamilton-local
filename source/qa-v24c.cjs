const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const places = require('./src/playgrounds.json');
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4186';
const out = path.resolve(__dirname, '../out');
const report = { url: base, browserPlugin: 'Browser skill unavailable; existing local Playwright', checks: [], consoleErrors: [], pageErrors: [], httpErrors: [] };
const unknowns = p => ['fenced', 'toilets', 'shade'].filter(k => p[k] == null).length + Number(/unconfirmed|unknown|\?{3}/i.test(p.ageEn));
(async () => {
  const protectedInputs = JSON.parse(fs.readFileSync(path.join(out, 'v24c-input-sha256.json'), 'utf8').replace(/^\uFEFF/, ''));
  for (const [file, hash] of Object.entries(protectedInputs)) {
    if (file === 'work/src/App.tsx') {
      // v25 intentionally extends PlaceGrid/Living. Preserve the entire Home/App implementation.
      const inherited = fs.readFileSync(path.join(out, 'input-v24c/App.tsx'), 'utf8');
      assert.equal(crypto.createHash('sha256').update(inherited).digest('hex').toUpperCase(), hash);
      const current = fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8');
      assert.equal(current.slice(current.indexOf('function Home(')), inherited.slice(inherited.indexOf('function Home(')));
      continue;
    }
    if (file === 'work/src/playgrounds.json') continue;
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname, '..', file))).digest('hex').toUpperCase(), hash, 'Protected input: ' + file);
  }
  report.checks.push('Original playground data, production key, draw data, Home/App implementation and place-name formatter unchanged; v25 PlaceGrid/Living extension allowed');
  const browser = await chromium.launch({ headless: true, executablePath: 'F:/Bo/ms-playwright/chromium-1254/chrome-win64/chrome.exe' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    const submissions = [];
    await page.route('https://api.web3forms.com/**', async route => {
      submissions.push(route.request().postDataJSON());
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
    });
    page.on('console', m => { if (m.type() === 'error') report.consoleErrors.push(m.text()); });
    page.on('pageerror', e => report.pageErrors.push(e.message));
    page.on('response', r => { if (r.status() >= 400) report.httpErrors.push({ url: r.url(), status: r.status() }); });
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
      for (const lang of ['zh', 'en']) {
        await page.goto(base + '/#/kids');
        await page.locator('[data-playground-id]').first().waitFor();
        if (await page.locator('html').getAttribute('lang') !== (lang === 'zh' ? 'zh-CN' : 'en-NZ')) await page.getByTestId('lang').click();
        const label = lang === 'zh' ? '来过？帮忙更新' : 'Been here? Help update';
        for (const p of places) {
          const card = page.locator(`[data-playground-id="${p.id}"]`);
          assert.equal(await card.locator('.pg-unknown').count(), unknowns(p), 'Each unknown field needs a chip: ' + p.id);
          const button = card.getByRole('button', { name: label, exact: true });
          assert.equal(await button.count(), Number(unknowns(p) > 0), 'Unknown card needs update button: ' + p.id);
          if (!unknowns(p)) continue;
          await button.click();
          await page.locator('dialog[open]').waitFor();
          assert.equal(await page.locator('input[name="type"]:checked').inputValue(), 'correction');
          const message = page.locator('#fb-message');
          const text = await message.inputValue();
          assert.ok(text.includes(p.name), 'English place name in prefill');
          assert.ok(text.includes(p.id), 'Place ID in prefill');
          if (lang === 'zh') assert.match(text, /^我来过「/);
          for (const [key, zh, en] of [['fenced', '围栏', 'Fenced'], ['toilets', '厕所', 'Toilets'], ['shade', '遮阳', 'Shade']]) {
            assert.equal(text.includes(lang === 'zh' ? zh : en), p[key] == null, 'Only unknown facilities in prefill');
          }
          if (/unconfirmed/i.test(p.ageEn)) assert.ok(text.includes(lang === 'zh' ? '适合年龄' : 'Ages'));
          assert.equal(await page.locator('input[name="page_url"]').inputValue(), base + '/#/kids');
          assert.deepEqual(await message.evaluate(e => [document.activeElement === e, e.selectionStart, e.selectionEnd]), [true, text.length, text.length]);
          assert.equal(submissions.length, 0, 'Opening never submits');
          await page.keyboard.press('Escape');
          await page.waitForFunction(id => document.activeElement?.closest('[data-playground-id]')?.getAttribute('data-playground-id') === id, p.id);
          assert.equal(await button.evaluate(e => document.activeElement === e), true, 'Focus returns to card');
        }
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow');
        const lake = page.locator('[data-playground-id="hamilton-lake-domain"]');
        await lake.getByRole('button', { name: lang === 'zh' ? '在地图查看' : 'Show on map', exact: true }).click();
        const popup = page.locator('.pg-popup');
        await popup.waitFor();
        assert.equal(await popup.locator('.pg-unknown').count(), 3);
        await popup.getByRole('button', { name: label, exact: true }).click();
        await page.locator('dialog[open]').waitFor();
        assert.match(await page.locator('#fb-message').inputValue(), /hamilton-lake-domain/);
        await page.keyboard.press('Escape');
        await page.locator('.leaflet-popup-close-button').click();
        if (width === 1440 && lang === 'zh') {
          await lake.scrollIntoViewIfNeeded();
          await page.screenshot({ path: path.join(out, 'shots/v24c-playground-card.png') });
          await lake.getByRole('button', { name: label, exact: true }).click();
          await page.screenshot({ path: path.join(out, 'shots/v24c-modal-prefilled.png') });
          await page.keyboard.press('Escape');
        }
        report.checks.push(`${width}px ${lang}: all unknown chips, all card prefills, popup prefill, cursor/focus, no auto-submit or overflow`);
      }
    }
    const button = page.locator('[data-playground-id="hamilton-lake-domain"]').getByRole('button', { name: 'Been here? Help update', exact: true });
    await button.click();
    const message = page.locator('#fb-message');
    const prefill = await message.inputValue();
    await page.keyboard.insertText('QA test contribution; intercepted only.');
    assert.equal(await message.inputValue(), prefill + 'QA test contribution; intercepted only.');
    await page.getByRole('button', { name: 'Send feedback', exact: true }).click();
    await page.getByRole('heading', { name: 'Received. Thanks for helping.' }).waitFor();
    assert.equal(submissions.length, 1);
    assert.equal(submissions[0].message, (prefill + 'QA test contribution; intercepted only.').trim());
    assert.equal(submissions[0].page_url, base + '/#/kids');
    assert.match(submissions[0].message, /hamilton-lake-domain/);
    assert.equal(submissions[0].type, 'Information correction');
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    await page.getByTestId('feedback-launcher').click();
    assert.equal(await page.locator('#fb-message').inputValue(), '', 'Generic feedback stays blank');
    await page.keyboard.press('Escape');
    report.checks.push('Edited prefill sent once through intercepted Web3Forms; page URL/place ID retained; generic modal blank');
    assert.deepEqual(report.consoleErrors, []);
    assert.deepEqual(report.pageErrors, []);
    assert.deepEqual(report.httpErrors, []);
    report.passed = true;
  } finally {
    await browser.close();
    fs.writeFileSync(path.join(out, 'qa-v24c.json'), JSON.stringify(report, null, 2));
  }
  console.log(JSON.stringify(report, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
