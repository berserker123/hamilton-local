const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const out = path.resolve(__dirname, '../out');
const shots = path.join(out, 'shots/v25f');
const report = { checks: [], consoleErrors: [], pageErrors: [], httpErrors: [] };
(async () => {
  fs.mkdirSync(shots, { recursive: true });
  const browser = await chromium.launch({ executablePath: 'F:/Bo/ms-playwright/chromium-1254/chrome-win64/chrome.exe', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce' });
    page.on('console', m => { if (m.type() === 'error') report.consoleErrors.push(m.text()); });
    page.on('pageerror', e => report.pageErrors.push(e.message));
    page.on('response', r => { if (r.status() >= 400) report.httpErrors.push(r.url() + ': ' + r.status()); });
    async function open(hash) {
      await page.goto('http://127.0.0.1:4186/' + hash);
      await page.locator('#section-panel').waitFor();
      if (await page.locator('html').getAttribute('lang') !== 'zh-CN') await page.getByTestId('lang').click();
      await page.evaluate(() => document.fonts.ready);
      assert.match(await page.title(), /Hamilton/);
      assert.equal(await page.locator('vite-error-overlay, nextjs-portal').count(), 0);
    }
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: width === 1440 ? 1100 : 844 });
      for (const [tab, title] of [['grocers', '亚超与杂货'], ['places', '日常好去处'], ['dining', '美食探索'], ['upick', '季节采摘'], ['stays', '精选住宿'], ['pets', '宠物指南']]) {
        await open('#/' + (tab === 'pets' ? 'services' : 'living') + '?tab=' + tab);
        assert.equal(await page.locator('.v25-directory-heading h2').innerText(), title);
        assert.match(await page.locator('.v25-directory-heading .ia-kicker').innerText(), /^AROUND HAMILTON · /);
        if (tab !== 'pets') assert.equal(await page.locator('#tab-upick').innerText(), '季节采摘');
        assert.equal(await page.locator('#tab-pets').count(), Number(tab === 'pets'));
        assert.equal(await page.locator('.sb-brand-sub').innerText(), '汉密尔顿生活指南');
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${tab} ${width}: no horizontal overflow`);
        const errors = await page.locator('[data-directory-id], [data-market-id], [data-place-id]').evaluateAll(cards => cards.flatMap(card => {
          const zh = card.querySelector('h2.ia-name-line, h3.ia-name-line');
          const en = card.querySelector('p.ia-secondary-name');
          if (!zh || !en || card.querySelectorAll('p.ia-secondary-name').length !== 1) return [card.dataset.directoryId || card.dataset.marketId || card.dataset.placeId];
          const z = zh.getBoundingClientRect(), e = en.getBoundingClientRect();
          return e.top < z.bottom - 1 || getComputedStyle(zh).whiteSpace !== 'nowrap' || getComputedStyle(en).whiteSpace !== 'nowrap' ? [zh.textContent] : [];
        }));
        assert.deepEqual(errors, [], `${tab} ${width}: Chinese and English occupy separate single lines`);
        if (tab === 'pets') {
          const groups = await page.locator('[data-pet-category] .ia-place-grid').evaluateAll(grids => grids.map(grid => [...grid.children].map(card => {
            const r = card.getBoundingClientRect(), media = card.querySelector('.ia-photo-pending');
            return { top: Math.round(r.top), height: r.height, media: media?.getBoundingClientRect().height || 0, clamp: getComputedStyle(card.querySelector('.ia-directory-intro')).webkitLineClamp };
          })));
          for (const cards of groups) for (const card of cards) {
            assert.equal(card.media, 150, 'consistent pet placeholder');
            assert.equal(card.clamp, '2');
            for (const sibling of cards.filter(other => other.top === card.top)) assert.ok(Math.abs(sibling.height - card.height) < 1, 'equal pet heights per row');
          }
        }
        if (width === 1440 && tab !== 'dining') {
          await page.locator('.v25-directory-heading').evaluate(el => scrollTo(0, scrollY + el.getBoundingClientRect().top - 130));
          await page.screenshot({ path: path.join(shots, (tab === 'grocers' ? 'grocery' : tab) + '.png') });
        }
        await page.getByTestId('lang').click();
        assert.equal(await page.locator('html').getAttribute('lang'), 'en-NZ');
        assert.equal(await page.locator('#section-panel .ia-secondary-name').count(), 0);
      }
    }
    await page.setViewportSize({ width: 1440, height: 1100 });
    await open('#/living?tab=stays');
    assert.equal(await page.locator('[data-directory-id="park-view-motor-lodge"]').count(), 0);
    const abbots = page.locator('[data-directory-id="abbots-hamilton"]');
    assert.match(await abbots.innerText(), /Abbots Hamilton/);
    await abbots.locator('.ia-place-actions a').first().click();
    assert.match(await page.locator('dialog[open]').innerText(), /222 Ulster Street/);
    assert.equal(await page.locator('dialog[open] a[href="tel:+6478383299"]').count(), 1);
    await page.keyboard.press('Escape');
    for (const hash of ['#/kids?tab=places', '#/kids?tab=map', '#/kids?tab=parties', '#/weekend?tab=picks', '#/weekend?tab=markets', '#/weekend?tab=festivals', '#/services?tab=home', '#/tools?tab=bins', '#/tools?tab=urgent']) {
      await open(hash);
      const titles = page.locator('#section-panel h2.ia-name-line, #section-panel h3.ia-name-line, #section-panel h4.ia-name-line');
      assert.ok(await titles.count() > 0, hash);
      for (const title of await titles.all()) assert.equal(await title.evaluate(el => el.nextElementSibling?.matches('p.ia-secondary-name')), true);
      for (const width of [1440, 390, 320]) {
        await page.setViewportSize({ width, height: width === 1440 ? 1100 : 844 });
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), hash + ' overflow at ' + width);
      }
    }
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.goto('http://127.0.0.1:4186/');
    await page.locator('.sb-brand').waitFor();
    await page.screenshot({ path: path.join(shots, 'header.png') });
    await page.locator('#guide-tab-living').click();
    assert.deepEqual(await page.locator('.v25-preview-links a').allTextContents(), ['季节采摘', '精选住宿']);
    await page.locator('.v25-preview-links a').first().click();
    assert.equal(await page.getByTestId('tab-upick').getAttribute('aria-selected'), 'true');
    await open('#/weekend?tab=picks');
    assert.equal(await page.locator('.ia-section-media img').getAttribute('src'), './photos/band-weekend-nightglow.webp');
    assert.deepEqual(report.consoleErrors, []);
    assert.deepEqual(report.pageErrors, []);
    assert.deepEqual(report.httpErrors, []);
    report.checks.push('1440/390/320: six living headings, separate title lines, labels, brand, equal pet rows and 150px media, English toggle, no overflow', 'Abbots official phone/detail interaction; Park View removed', 'Kids, playground, party, weekend, service, tools and clinic title coverage', 'Homepage entries and U-Pick interaction', 'Weekend background uses supplied Nightglow candidate 2; no app errors');
    report.passed = true;
  } finally {
    await browser.close();
    fs.writeFileSync(path.join(out, 'qa-v25f.json'), JSON.stringify(report, null, 2));
  }
  console.log(JSON.stringify(report, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
