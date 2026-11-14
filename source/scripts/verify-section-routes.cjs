// Run after npm run build and npm run preview. No remote browser service required.
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const base = process.env.SECTION_QA_URL || 'http://127.0.0.1:4179';
const shots = path.resolve(process.argv[2] || '../../shots');
const sections = ['home', 'living', 'weekend', 'kids', 'services', 'tools'];
const labels = ['首页', '本地生活', '周末活动', '亲子遛娃', '便民黄页', '实用工具'];
const report = {browser: 'Playwright with installed Chrome; Browser plugin not available', rawHtml: [], screenshots: [], legacyLinks: [], interactions: [], brokenLocalRequests: [], pageErrors: []};
const routePath = name => name === 'home' ? '/' : '/' + name + '/';

(async () => {
  fs.mkdirSync(shots, {recursive: true});
  for (const [i, name] of sections.entries()) {
    const route = routePath(name);
    const response = execFileSync('curl.exe', ['--fail', '--silent', '--show-error', '-w', '\n%{http_code}', base + route], {encoding: 'utf8'});
    assert.ok(response.endsWith('\n200'), route);
    const html = response.slice(0, -4);
    assert.ok(html.includes(`<title>${labels[i]} · Hamilton Local</title>`));
    assert.ok(html.includes(`rel="canonical" href="https://hamiltonlocal.nz${route}"`));
    assert.match(html, /<h1[^>]*>[^<]+<\/h1>/);
    assert.match(html, /<li[ >]/);
    for (const [, asset] of html.matchAll(/(?:src|href)="(\/(?:app\.(?:js|css)|photos\/[^"?]+|[^/"?]+\.(?:png|svg)))"/g)) {
      execFileSync('curl.exe', ['--fail', '--silent', '--show-error', '-o', 'NUL', base + asset]);
    }
    report.rawHtml.push({route, status: 200, title: labels[i], canonical: 'https://hamiltonlocal.nz' + route});
  }

  const browser = await chromium.launch({channel: 'chrome', headless: true});
  try {
    const context = await browser.newContext({viewport: {width: 1440, height: 1000}, deviceScaleFactor: 1, reducedMotion: 'reduce'});
    await context.addInitScript(() => { localStorage.setItem('hl-lang', 'zh'); localStorage.setItem('hl-theme', 'day'); });
    // Exclude external analytics and map services from local build verification.
    await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
    const page = await context.newPage();
    page.on('pageerror', error => report.pageErrors.push(error.message));
    page.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400) report.brokenLocalRequests.push({url: response.url(), status: response.status()}); });
    page.on('requestfailed', request => { if (request.url().startsWith(base)) report.brokenLocalRequests.push({url: request.url(), error: request.failure()?.errorText}); });

    for (const [i, name] of sections.entries()) {
      await page.goto(base + routePath(name));
      await page.locator('header .sb-nav[aria-current="page"]').waitFor();
      await page.waitForFunction(title => document.title === title, labels[i] + ' · Hamilton Local');
      assert.ok((await page.locator('main').innerText()).length > 100);
      assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://hamiltonlocal.nz' + routePath(name));
      await page.evaluate(async () => { await Promise.all([...document.images].map(img => { img.loading = 'eager'; return img.decode().catch(() => {}); })); });
      const broken = await page.locator('img').evaluateAll(images => images.filter(img => !img.complete || !img.naturalWidth).map(img => img.currentSrc));
      assert.deepEqual(broken.filter(url => url.startsWith(base)), [], name + ' broken image');
      assert.equal(await page.locator('a[href^="#/"]').count(), 0);
      for (const theme of ['day', 'night']) {
        await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
        await page.screenshot({path: path.join(shots, `${name}-${theme}.png`), fullPage: true});
        report.screenshots.push(`${name}-${theme}.png`);
      }
    }

    for (const [hash, want, tab] of [
      ['#/living', '/living/', 'grocers'],
      ['#/weekend', '/weekend/', 'picks'],
      ['#/kids?tab=parties', '/kids/?tab=parties', 'parties'],
      ['#/services', '/services/', 'home'],
      ['#/tools?tab=pay', '/tools/?tab=pay', 'pay'],
      ['#/living?tab=pets&at=pet-vets', '/services/?tab=pets&at=pet-vets', 'pets'],
      ['#tool-weather', '/tools/?tab=other&at=tool-weather', 'other'],
      ['#/tools?tab=transport', '/tools/?tab=bus&at=tool-transport', 'bus'],
      ['#/whatson', '/weekend/', 'picks'],
    ]) {
      await page.goto(base + '/' + hash);
      await page.waitForURL(base + want);
      await page.locator(`#tab-${tab}[aria-selected="true"]`).waitFor();
      await page.reload();
      await page.locator(`#tab-${tab}[aria-selected="true"]`).waitFor();
      report.legacyLinks.push({hash, path: want});
    }

    await page.goto(base + '/');
    await page.locator('header .sb-nav[aria-current="page"]').waitFor();
    await page.evaluate(() => window.__sectionQaMarker = true);
    await page.locator('header .sb-nav[href="/living/"]').click();
    await page.waitForURL(base + '/living/');
    assert.equal(await page.evaluate(() => window.__sectionQaMarker), true, 'Navigation must use History API');
    await page.locator('#tab-grocers[aria-selected="true"]').waitFor();
    await page.locator('#tab-places').click();
    await page.waitForURL(base + '/living/?tab=places');
    await page.locator('#tab-places[aria-selected="true"]').waitFor();
    await page.goBack();
    await page.locator('#tab-grocers[aria-selected="true"]').waitFor();
    await page.goForward();
    await page.locator('#tab-places[aria-selected="true"]').waitFor();
    await page.locator('#tab-places').focus();
    await page.keyboard.press('ArrowRight');
    await page.locator('#tab-upick[aria-selected="true"]').waitFor();
    await page.reload();
    await page.locator('#tab-upick[aria-selected="true"]').waitFor();
    report.interactions.push('History API navigation, query tabs, Back/Forward, keyboard tabs, direct reload');

    await page.setViewportSize({width: 390, height: 844});
    for (const name of sections) {
      await page.goto(base + routePath(name));
      await page.locator('header .sb-mnav[aria-current="page"]').waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, name + ' mobile overflow');
      await page.screenshot({path: path.join(shots, `${name}-mobile.png`), fullPage: true});
      report.screenshots.push(`${name}-mobile.png`);
    }
    assert.deepEqual(report.pageErrors, []);
    assert.deepEqual(report.brokenLocalRequests, []);
    console.log('SECTION_QA_OK: 6 raw HTML pages; 9 legacy links; History API, tabs, history, reload; 18 screenshots; no broken local assets or page errors');
  } finally {
    await browser.close();
    fs.writeFileSync(path.join(shots, 'verification.json'), JSON.stringify(report, null, 2));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
