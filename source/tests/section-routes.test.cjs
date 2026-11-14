const {test, before} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const esbuild = require('esbuild');
const sections = ['living', 'weekend', 'kids', 'services', 'tools'];

before(() => execFileSync(process.execPath, ['build.mjs'], {stdio: 'pipe'}));

test('build emits five useful section documents with independent metadata and root assets', () => {
  const records = ['New Save', 'Events Calendar', 'Magical Bridge', 'Home repairs', 'GST calculator'];
  const titles = ['本地生活', '周末活动', '亲子遛娃', '便民黄页', '实用工具'];
  for (const [i, section] of sections.entries()) {
    const file = path.join('dist', section, 'index.html');
    assert.ok(fs.existsSync(file), `Missing crawlable page: /${section}/`);
    const html = fs.readFileSync(file, 'utf8');
    assert.ok(html.includes(`<title>${titles[i]} · Hamilton Local</title>`));
    assert.ok(html.includes(`rel="canonical" href="https://hamiltonlocal.nz/${section}/"`));
    assert.ok(html.includes(`property="og:url" content="https://hamiltonlocal.nz/${section}/"`));
    assert.match(html, /<meta name="description" content="[^"]{30,}"/);
    assert.match(html, /<h1[^>]*>[^<]+<\/h1>/);
    assert.match(html, /<li[ >]/);
    assert.ok(html.includes(records[i]), `${section} lacks existing directory content`);
    assert.match(html, /src="\/app.js"/);
    assert.doesNotMatch(html, /(?:src|href)="\.\//);
    assert.doesNotMatch(html, /href="#\//);
  }
  assert.match(fs.readFileSync('dist/index.html', 'utf8'), /href="\/living\/"/);
});

test('sitemap contains exactly home and five emitted sections with content dates; fallback is excluded', () => {
  const xml = fs.readFileSync('dist/sitemap.xml', 'utf8');
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)];
  assert.deepEqual(urls.map(m => m[1]).sort(), ['https://hamiltonlocal.nz/', ...sections.map(s => `https://hamiltonlocal.nz/${s}/`)].sort());
  for (const m of urls) assert.ok(Number.isFinite(Date.parse(m[2])));
  const fallback = fs.readFileSync('dist/404.html', 'utf8');
  assert.match(fallback, /noindex/);
  assert.match(fallback, /href="\/"/);
});

test('route reader uses pathname and translates legacy aliases without losing query state', () => {
  const result = esbuild.buildSync({entryPoints: ['src/section-navigation.ts'], bundle: true, platform: 'node', format: 'cjs', write: false});
  const mod = {exports: {}};
  new Function('module', 'exports', 'require', result.outputFiles[0].text)(mod, mod.exports, require);
  const {routeUrl, sectionPath, legacyPath} = mod.exports;
  assert.equal(sectionPath('living'), '/living/');
  assert.equal(sectionPath('home'), '/');
  for (const [url, want] of [
    ['https://hamiltonlocal.nz/tools/?tab=pay', '/tools/?tab=pay'],
    ['https://hamiltonlocal.nz/living', '/living/'],
    ['https://hamiltonlocal.nz/kids/index.html?tab=parties', '/kids/?tab=parties'],
    ['https://hamiltonlocal.nz/#/kids?tab=parties&q=birthday', '/kids/?tab=parties&q=birthday'],
    ['https://hamiltonlocal.nz/?cards=b#/living?tab=pets', '/services/?cards=b&tab=pets'],
    ['https://hamiltonlocal.nz/#/whatson', '/weekend/'],
    ['https://hamiltonlocal.nz/#/tools?tab=transport', '/tools/?tab=bus&at=tool-transport'],
    ['https://hamiltonlocal.nz/#tool-weather', '/tools/?tab=other&at=tool-weather'],
    ['https://hamiltonlocal.nz/living/#details', '/living/#details'],
    ['https://hamiltonlocal.nz/living/#upick', '/living/#upick'],
    ['https://hamiltonlocal.nz/missing/', '/missing/'],
  ]) assert.equal(routeUrl(new URL(url)), want, url);
  assert.equal(legacyPath('#/tools?tab=units'), '/tools/?tab=units');
  assert.equal(legacyPath('#pet-vets'), '/services/?tab=pets&at=pet-vets');
  assert.equal(legacyPath('#details'), null);
});
