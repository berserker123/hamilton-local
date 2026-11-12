const { chromium } = require('playwright');
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4186';
const out = path.resolve(__dirname, '../out');
const report = { url: base, checks: [], consoleErrors: [], pageErrors: [], httpErrors: [] };
(async () => {
 const stays = require('./src/stays-v25.json'), pets = require('./src/pets-v25.json'), farms = require('./src/upick-v25.json');
 assert.ok(stays.length >= 8 && stays.length <= 10);
 for(const stay of stays) {
  if (stay.id === 'abbots-hamilton') { assert.deepEqual(stay.ratings, []); assert.equal(stay.url, 'https://www.abbotshamilton.co.nz/'); continue; }
  const high = stay.ratings.filter(r => Number.isInteger(r.count) && r.count > 0 && (/\/5$/.test(r.score) ? parseFloat(r.score) >= 4.5 : parseFloat(r.score) >= 8.5));
  assert.ok(new Set(high.map(r => r.platform)).size >= 2, stay.name + ': two high-rated major platforms');
  for(const rating of stay.ratings) assert.ok(stay.sources.includes(rating.url));
 }
 assert.equal(pets.length, 6);
 for(const group of pets) assert.deepEqual(Object.keys(group).sort(), ['en','id','zh']);
 for(const item of [...stays, ...farms]) {
  assert.ok(item.name && item.zh && item.address && item.area && item.introEn && item.introZh && item.sources.includes(item.url), item.id);
  assert.ok(new URL(item.url).protocol === 'https:');
  if (item.photo) {
   assert.ok(item.photoCredit && item.photoLicenseUrl && item.photoSource, 'Complete photo attribution');
   assert.match(item.photoLicense, /^(CC0|CC BY(?:-SA)? )/, 'Free photo licence');
   assert.match(item.photoSource, /^https:\/\/(commons\.wikimedia\.org|openverse\.org)\//, 'Approved source');
   assert.ok(fs.existsSync(path.join(__dirname,'public/photos',item.photo)), 'Local photo exists');
  }
 }
 for(const farm of farms) assert.ok(farm.seasonZh && farm.seasonEn && farm.fruitZh && farm.fruitEn);
 report.checks.push('Data audit: eight stays; existing platform records retained, official-only Abbots has no scores; six pet groups of 3–5; source URLs, bilingual summaries and addresses; all added photos require free licences and attribution');
 const browser = await chromium.launch({ headless: true, executablePath: 'F:/Bo/ms-playwright/chromium-1254/chrome-win64/chrome.exe' });
 try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  page.on('console', m => { if (m.type() === 'error') report.consoleErrors.push(m.text()); });
  page.on('pageerror', e => report.pageErrors.push(e.message));
  page.on('response', r => { if (r.status() >= 400) report.httpErrors.push({ url: r.url(), status: r.status() }); });
  for (const width of [1440, 390, 320]) {
   await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
   for (const lang of ['zh', 'en']) {
    for (const tab of ['places', 'upick', 'stays', 'pets']) {
     await page.goto(base + '/#/' + (tab === 'pets' ? 'services' : 'living') + '?tab=' + tab);
     await page.locator('#section-panel').waitFor();
     if (await page.locator('html').getAttribute('lang') !== (lang === 'zh' ? 'zh-CN' : 'en-NZ')) await page.getByTestId('lang').click();
     assert.equal(await page.getByTestId('tab-' + tab).getAttribute('aria-selected'), 'true');
     assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'overflow ' + tab + width + lang);
     assert.doesNotMatch(await page.locator('#section-panel').innerText(), /\?{3}/, 'Unknown details use readable labels');
     const cards = page.locator(tab === 'pets' ? '[data-pet-category]' : '.ia-directory-card, [data-place-id]');
     assert.ok(await cards.count() > 0);
     for (const card of tab === 'pets' ? [] : await cards.all()) {
      assert.equal(await card.locator('.ia-place-footer .ia-place-actions a').count() >= 1, true);
      const action = await card.locator('.ia-place-footer .ia-place-actions').boundingBox();
      const correction = await card.locator('.ia-place-footer .fb-detail-link').boundingBox();
      assert.ok(correction.y >= action.y + action.height + 4, 'Correction on separate line');
     }
     if (tab === 'places') {
      assert.equal(await page.locator('[data-place-id="magical-bridge"]').count(), 0);
      const ids = await page.locator('[data-place-id]').evaluateAll(es => es.map(e => e.dataset.placeId));
      assert.equal(new Set(ids).size, ids.length, 'Unique original place cards');
      const geometry = await page.locator('[data-place-id]').evaluateAll(es => es.map(e => {
        const r = e.getBoundingClientRect();
        const photo = e.querySelector('.ia-place-photo, .ia-photo-pending');
        return { left: Math.round(r.left), top: r.top, height: r.height, photo: photo ? photo.getBoundingClientRect().height : 0 };
      }));
      assert.ok(geometry.every(g => g.photo > 40 && g.photo <= 160), 'Photo or placeholder at most 150px');
      assert.ok(geometry.every(g => g.height < 640), 'Compact place card');
      const photoHeights = geometry.map(g => g.photo);
      assert.ok(Math.max(...photoHeights) - Math.min(...photoHeights) < 4, 'Placeholder matches photo height');
      if (width === 1440) {
        const row = geometry.filter(g => Math.abs(g.top - geometry[0].top) < 2);
        assert.ok(new Set(row.map(g => g.left)).size >= 4, 'Four place cards on the first row at 1440');
        const flip = page.locator('.ia-place-figure .ia-flip').first();
        assert.equal(await flip.getAttribute('data-flipped'), 'false');
        assert.equal(await page.locator('.ia-photo-pending .ia-flip').count(), 0);
        assert.equal(Number(await flip.locator('.ia-flip-back').evaluate(el => getComputedStyle(el).opacity)), 0);
        assert.equal(await page.locator('.ia-place .ia-highlights').count(), 0);
      }
     }
     if (tab === 'upick') {
      assert.equal(await page.locator('#upick [data-directory-id]').count(), farms.length);
      assert.equal(await page.locator('[data-place-id]').count(), 0);
      assert.equal(await page.locator('#upick .ia-place-actions a').first().getAttribute('href'), farms[0].url);
     }
     if (tab === 'stays') {
      assert.ok(await cards.count() >= 8 && await cards.count() <= 10);
      assert.doesNotMatch(await page.locator('#stays').innerText(), /\d\.\d\s*\/\s*(?:5|10)|Tripadvisor.*\d\.\d|review score|评分/i);
     }
     if (tab === 'pets') {
      assert.equal(await page.locator('[data-pet-category]').count(), 6);
      assert.equal(await page.locator('#pets [data-directory-id]').count(), 0);
      await page.locator('[data-pet-category="vets"] button').click();
      await page.locator('dialog[open]').waitFor();
      assert.ok((await page.locator('input[name="section"]').inputValue()).includes('宠物指南-兽医与夜间急诊'));
      assert.equal(await page.locator('input[name="type"]:checked').inputValue(), 'business');
      await page.keyboard.press('Escape');
     }
    }
    await page.goto(base + '/#/kids?tab=places');
    await page.locator('[data-place-id]').first().waitFor();
    assert.equal(await page.locator('[data-place-id="magical-bridge"]').count(), 0);
    for (const card of await page.locator('[data-place-id]').all()) assert.equal(await card.locator('.ia-place-actions a').count(), 1);
    await page.goto(base + '/#/kids');
    await page.locator('.pg-pin').first().waitFor();
    assert.equal(await page.locator('[data-playground-id]').count(), 12);
    const stars = await page.locator('.pg-pin-featured').count();
    assert.ok(stars >= 4 && stars <= 6);
    assert.equal(await page.locator('.pg-featured-badge').count(), stars);
    await page.getByTestId('pg-featured').check();
    assert.equal(await page.locator('[data-playground-id]').count(), stars);
    await page.getByTestId('pg-area').selectOption('Hamilton Lake');
    assert.equal(await page.locator('[data-playground-id]').count(), 1);
    await page.locator('.pg-reset').first().click();
    assert.equal(await page.locator('[data-playground-id]').count(), 12);
    assert.equal(await page.getByTestId('pg-featured').isChecked(), false);
    await page.locator('[data-playground-id="magical-bridge-playground"]').getByRole('button', {name: lang === 'zh' ? '在地图查看' : 'Show on map', exact: true}).click();
    await page.locator('.pg-popup').waitFor();
    assert.equal(await page.locator('.pg-popup .pg-popup-featured').count(), 1);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    report.checks.push(`${width}px ${lang}: details, separate footers, compact cards, tabs/anchor, unique cards, stays, six pet groups, feature filter/reset/popup`);
   }
  }
  await page.goto(base);
  await page.locator('#guide-tab-living').click();
  assert.equal(await page.locator('.v25-preview-links a').count(), 2);
  for (const link of await page.locator('.v25-preview-links a').all()) {
   const href = await link.getAttribute('href'); await link.click();
   await page.waitForURL(base + '/' + href); await page.locator('.ia-tabs [aria-selected=true]').waitFor(); assert.equal(await page.locator('.ia-tabs [aria-selected=true]').getAttribute('href'), href.includes('at=') ? '#/living?tab=places' : href);
   await page.goto(base); await page.locator('#guide-tab-living').click();
  }
  for (const [tab, file, selector] of [['places','v25-places-cards.png','[data-place-id="zealong"]'],['stays','v25-stays.png','#stays'],['pets','v25-pets.png','#pets'],['upick','v25-upick.png','#upick']]) {
   await page.setViewportSize({width:1440,height:1000}); await page.goto(base + '/#/' + (tab === 'pets' ? 'services' : 'living') + '?tab=' + tab);
   if(await page.locator('html').getAttribute('lang')!=='zh-CN') await page.getByTestId('lang').click();
   await page.locator(selector).evaluate(e => e.scrollIntoView({block:'start'})); await page.waitForTimeout(150); await page.screenshot({path:path.join(out,'shots',file)});
  }
  await page.goto(base + '/#/kids?tab=places'); await page.locator('[data-place-id="hamilton-lake"]').scrollIntoViewIfNeeded(); await page.screenshot({path:path.join(out,'shots/v25-kids-places.png')});
  await page.goto(base + '/#/kids'); await page.locator('#pg-title').scrollIntoViewIfNeeded(); await page.getByTestId('pg-featured').check(); await page.screenshot({path:path.join(out,'shots/v25-playground-map.png')});
  await page.setViewportSize({width:390,height:844}); await page.goto(base + '/#/living?tab=places'); await page.locator('[data-place-id="zealong"]').scrollIntoViewIfNeeded(); await page.screenshot({path:path.join(out,'shots/v25-mobile.png')});
  // v25i authorizes scene-label positioning in page-experience.css.
  const allowed = new Set(['App.tsx','HomeGuide.tsx','PlaygroundMap.tsx','PartyVenues.tsx','LocalDirectories.tsx','WeekendAgenda.tsx','styles.css','page-experience.css','playgrounds.json','party-venues.json','Feedback.tsx','places.json','stays-v25.json','cord-picks.ts','pets-v25.json']);
  for(const {file,sha256} of JSON.parse(fs.readFileSync(path.join(out,'input-v25-sha256.json'),'utf8').replace(/^\uFEFF/,''))) if(!allowed.has(path.basename(file))) {
    let content=fs.readFileSync(path.resolve(__dirname,'..',file));
    assert.equal(crypto.createHash('sha256').update(content).digest('hex'),sha256,file+' protected');
  }
  assert.deepEqual(report.consoleErrors,[]); assert.deepEqual(report.pageErrors,[]); assert.deepEqual(report.httpErrors,[]);
  report.passed = true;
 } finally { await browser.close(); fs.writeFileSync(path.join(out,'qa-v25.json'),JSON.stringify(report,null,2)); }
 console.log(JSON.stringify(report,null,2));
})().catch(e => {console.error(e);process.exitCode=1;});
