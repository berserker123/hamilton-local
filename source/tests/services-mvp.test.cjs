const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require('esbuild');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

// Leaflet touches `window` at import time; the Services view never uses it.
const STUB_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'leaflet-stub-'));
const LEAFLET_STUB = path.join(STUB_DIR, 'leaflet.js');
fs.writeFileSync(LEAFLET_STUB, 'module.exports = {};');

function bundle(contents) {
  const result = esbuild.buildSync({
    stdin: { contents, resolveDir: process.cwd(), loader: 'tsx' },
    bundle: true, platform: 'node', format: 'cjs', write: false,
    external: ['react', 'react-dom', 'react-dom/server'],
    alias: { leaflet: LEAFLET_STUB },
    loader: { '.json': 'json', '.css': 'empty', '.webp': 'dataurl', '.png': 'dataurl', '.jpg': 'dataurl', '.svg': 'dataurl' },
  });
  const m = { exports: {} };
  new Function('module', 'exports', 'require', result.outputFiles[0].text)(m, m.exports, require);
  return m.exports;
}

const view = bundle(`import React from 'react'; import { Services, SERVICE_CATS } from './src/App'; import { FeedbackProvider } from './src/Feedback';
export const cats = SERVICE_CATS;
export default function View({tab, lang}) { return <FeedbackProvider lang={lang} section="services"><Services tab={tab} t={(zh,en)=>lang==='zh'?zh:en} /></FeedbackProvider>; }`);
const render = (tab, lang = 'zh') => renderToStaticMarkup(React.createElement(view.default, { tab, lang }));
const buttons = html => html.match(/<a [^>]*data-services-join[^>]*>/g) || [];

test('placeVisibility boundaries: 89/90 fresh, 91/120 stale, 121 hidden', () => {
  const { placeVisibility, STALE_DAYS, HIDE_AFTER_STALE_DAYS, machineTranslatedLabel } = bundle(`export * from './src/place-status';`);
  assert.equal(STALE_DAYS, 90);
  assert.equal(HIDE_AFTER_STALE_DAYS, 30);
  assert.deepEqual(machineTranslatedLabel, { zh: '机器翻译', en: 'Machine translated' });
  const now = new Date('2026-11-18T00:00:00Z');
  const ago = d => new Date(now.getTime() - d * 86400000).toISOString();
  assert.equal(placeVisibility(ago(89), now), 'fresh');
  assert.equal(placeVisibility(ago(90), now), 'fresh');
  assert.equal(placeVisibility(ago(91), now), 'stale');
  assert.equal(placeVisibility(ago(120), now), 'stale');
  assert.equal(placeVisibility(ago(121), now), 'hidden');
});

test('every empty category on Services home and advisors has a join button (+1 for the join card)', () => {
  for (const tab of ['home', 'advisors']) {
    const expected = view.cats[tab].length;
    assert.ok(expected > 0);
    for (const lang of ['zh', 'en']) {
      const html = render(tab, lang);
      assert.equal((html.match(/class="sb-card ia-category"/g) || []).length, expected, tab);
      assert.equal(buttons(html).length, expected + 1, `${tab}/${lang}`);
    }
    assert.ok(render(tab, 'zh').includes('免费入驻已开放：填表提交，我们核实后上线。'));
    assert.ok(render(tab, 'en').includes('Free listings are open: submit the form and we&#x27;ll list you once verified.'));
  }
});

test('join buttons open the Google Form in a new tab with rel=noopener', () => {
  const cfg = bundle(`export * from './src/services-config';`);
  assert.match(cfg.SERVICES_FORM_URL, /^https:\/\/docs\.google\.com\/forms\/d\/e\/[\w-]+\/viewform$/);
  assert.equal(cfg.SERVICES_CONTACT_EMAIL, 'adminhamiltonlocal@gmail.com');
  const found = buttons(render('home'));
  assert.ok(found.length > 0);
  for (const b of found) {
    assert.ok(b.includes('href="' + cfg.SERVICES_FORM_URL + '"'), b);
    assert.ok(b.includes('target="_blank"') && b.includes('noopener'), b);
  }
});

test('with an empty form URL the join link falls back to mailto', () => {
  const src = fs.readFileSync('src/services-config.ts', 'utf8').replace(/SERVICES_FORM_URL = '[^']*'/, "SERVICES_FORM_URL = ''");
  const file = path.join(STUB_DIR, 'services-config.ts');
  fs.writeFileSync(file, src);
  const cfg = bundle(`export * from ${JSON.stringify(file.split(path.sep).join('/'))};`);
  assert.equal(cfg.servicesJoinHref(), 'mailto:adminhamiltonlocal@gmail.com');
  assert.equal(cfg.servicesJoinIsExternal(), false);
});
test('rendered pages and home stats no longer say "content being prepared" / "coming soon"', () => {
  const stale = /内容整理中|即将开放|Coming soon|coming soon/;
  for (const tab of ['home', 'trades', 'daily', 'advisors']) for (const lang of ['zh', 'en']) {
    assert.doesNotMatch(render(tab, lang), stale, `${tab}/${lang}`);
  }
  const { guideStats } = bundle(`export * from './src/home-guide-data';`);
  const note = guideStats(13).find(s => s.id === 'categories').note;
  assert.deepEqual(note, { zh: '招商中 · 免费入驻', en: 'Open for listings · Free' });
  assert.doesNotMatch(JSON.stringify(guideStats(13)), stale);
});
