const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const esbuild = require('esbuild');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const DEALS = require('../src/data/blackfriday.json');
const KIT = require('../src/data/gta6-kit.json');

function bundle(entry, external = []) {
  const result = esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', external, write: false });
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', result.outputFiles[0].text)(mod, mod.exports, require);
  return mod.exports;
}
const kitModel = bundle('src/gta6-kit-model.ts');
const bfModel = bundle('src/blackfriday-model.ts');
const page = bundle('src/BlackFriday.tsx', ['react']);
const money = n => new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD' }).format(n);
const SLOT_IDS = ['controller', 'tv', 'ssd', 'network', 'snacks', 'dock', 'audio', 'lights'];
const byId = new Map(DEALS.map(d => [d.id, d]));

test('GTA6 kit config covers the eight gear slots and every deal id resolves', () => {
  assert.deepEqual(KIT.slots.map(s => s.id), SLOT_IDS);
  const used = KIT.slots.flatMap(s => s.dealIds);
  assert.equal(new Set(used).size, used.length, 'a deal is used once in the kit');
  for (const slot of KIT.slots) {
    assert.ok(slot.zh && slot.en && slot.noteZh && slot.noteEn, slot.id);
    assert.ok(slot.dealIds.length >= 1, slot.id);
    for (const id of slot.dealIds) assert.ok(byId.has(id), `${slot.id} -> ${id}`);
  }
  const resolved = kitModel.resolveKit(KIT.slots, DEALS);
  assert.equal(resolved.length, SLOT_IDS.length);
  assert.throws(() => kitModel.resolveKit([{ ...KIT.slots[0], dealIds: ['nope'] }], DEALS), /unknown deal nope/);
});

test('the kit reuses the existing controller, TV and snack deals and adds 2-3 SSD options', () => {
  const slot = id => KIT.slots.find(s => s.id === id);
  assert.deepEqual(slot('controller').dealIds, ['ps5-dualsense-black-jb']);
  assert.deepEqual(slot('tv').dealIds, ['lg-c6-65-oled-jb']);
  assert.deepEqual(slot('snacks').dealIds, ['ninja-crispi-jb']);
  assert.ok(slot('ssd').dealIds.length >= 2 && slot('ssd').dealIds.length <= 3);
  for (const id of slot('ssd').dealIds) assert.match(byId.get(id).name, /M\.2|NVMe/i, id);
});

test('each slot recommends its best-rated option, so the pick follows the data', () => {
  const resolved = kitModel.resolveKit(KIT.slots, DEALS);
  for (const slot of resolved) assert.ok(kitModel.pickIsBest(slot), `${slot.id} pick must not be worse than its alternatives`);
  const worse = { ...resolved[2], pick: resolved[2].alternatives.at(-1), alternatives: [resolved[2].pick] };
  assert.equal(kitModel.pickIsBest(worse), false, 'a worse pick is flagged');
});

test('kit summary is derived from the picks: total, good-deal count and check dates', () => {
  const resolved = kitModel.resolveKit(KIT.slots, DEALS);
  const summary = kitModel.kitSummary(resolved);
  const cents = KIT.slots.reduce((sum, s) => sum + Math.round(byId.get(s.dealIds[0]).salePrice * 100), 0);
  assert.equal(Math.round(summary.total * 100), cents);
  assert.equal(summary.slotCount, KIT.slots.length);
  assert.equal(summary.goodCount, KIT.slots.filter(s => bfModel.verdict(byId.get(s.dealIds[0])) === '真优惠').length);
  const dates = KIT.slots.map(s => byId.get(s.dealIds[0]).checkedAt.slice(0, 10)).sort();
  assert.equal(summary.firstChecked, dates[0]);
  assert.equal(summary.lastChecked, dates.at(-1));
  assert.equal(summary.hasPromoCode, KIT.slots.some(s => !!byId.get(s.dealIds[0]).offerNote));
  // the total moves with the data
  const cheaper = DEALS.map(d => d.id === 'lg-c6-65-oled-jb' ? { ...d, salePrice: d.salePrice - 100 } : d);
  assert.equal(Math.round(kitModel.kitSummary(kitModel.resolveKit(KIT.slots, cheaper)).total * 100), cents - 10000);
});

test('new kit deals carry a sourced NZ retailer page, PriceSpy NZ history and the same rating rules', () => {
  const fresh = DEALS.filter(d => d.addedAt === '2026-11-22');
  assert.ok(fresh.length >= 5, 'new items were added');
  for (const d of fresh) {
    assert.match(d.productUrl, /^https:\/\/(www\.pbtech\.co\.nz|www\.jbhifi\.co\.nz|www\.noelleeming\.co\.nz)\//, d.id);
    assert.match(d.priceSpyUrl, /^https:\/\/pricespy\.co\.nz\/product\.php\?p=\d+$/, d.id);
    assert.equal(d.historyVerified, true, d.id);
    assert.equal(d.historyScope, 'market', d.id);
    assert.equal(d.historyEvidence.windowStart, '2026-08-24', d.id);
    assert.equal(d.historyEvidence.windowEnd, '2026-11-21', d.id);
    assert.equal(d.historyEvidence.dayCount, 90, d.id);
    assert.equal(d.currentPriceRecheck.status, 'verified', d.id);
    assert.equal(d.currency, 'NZD', d.id);
    assert.equal(d.verdict, bfModel.verdict(d), d.id);
    assert.equal(d.discountPercent, bfModel.realDiscount(d), d.id);
    assert.equal(d.category, '数码', d.id);
  }
  const code = byId.get('ssd-kingston-fury-2tb-hs-pb');
  assert.match(code.offerNote, /GTA6SSD/);
  assert.match(code.offerNoteEn, /GTA6SSD/);
});

test('the rendered kit section lists every slot with derived prices, in both languages', () => {
  const resolved = kitModel.resolveKit(KIT.slots, DEALS);
  const summary = kitModel.kitSummary(resolved);
  for (const [lang, t] of [['zh', zh => zh], ['en', (_zh, en) => en]]) {
    const html = renderToStaticMarkup(React.createElement(page.BlackFriday, { t }));
    assert.equal((html.match(/data-testid="bf-gta6-kit"/g) || []).length, 1, lang);
    assert.equal((html.match(/data-kit-slot="/g) || []).length, SLOT_IDS.length, lang);
    const totalBlock = html.match(/data-testid="bf-kit-total"[\s\S]*?<\/div>/)[0];
    assert.ok(totalBlock.includes(money(summary.total)), `${lang} total`);
    const kitHtml = html.match(/<section class="bf-kit"[\s\S]*?<\/section>/)[0];
    for (const slot of resolved) {
      assert.ok(kitHtml.includes(`data-kit-slot="${slot.id}"`), slot.id);
      assert.ok(kitHtml.includes(money(slot.pick.salePrice)), `${lang} ${slot.id} pick price`);
      for (const alt of slot.alternatives) assert.ok(kitHtml.includes(money(alt.salePrice)) && kitHtml.includes(alt.productUrl), `${lang} ${slot.id} alternative ${alt.id}`);
    }
    assert.ok(kitHtml.includes('GTA6SSD'), `${lang} promo code is disclosed`);
    assert.ok(html.indexOf('class="bf-intro"') < html.indexOf('class="bf-kit"'));
    assert.ok(html.indexOf('class="bf-kit"') < html.indexOf('class="bf-filters"'));
    assert.ok(html.includes(`${DEALS.length} ${lang === 'zh' ? '件商品 / 共' : 'of'} ${DEALS.length}`) || html.includes(`${DEALS.length} of ${DEALS.length} listings`), `${lang} listing count follows the data`);
  }
  const zh = renderToStaticMarkup(React.createElement(page.BlackFriday, { t: zh => zh }));
  assert.ok(zh.includes('GTA6 装备清单'));
  assert.ok(zh.includes(`${summary.slotCount} 项推荐款合计`));
  assert.ok(zh.includes(`其中 ${summary.goodCount} 项为真优惠`));
  const en = renderToStaticMarkup(React.createElement(page.BlackFriday, { t: (_zh, en) => en }));
  assert.ok(en.includes('GTA6 Gear List'));
  assert.doesNotMatch(en.match(/<section class="bf-kit"[\s\S]*?<\/section>/)[0], /[\u4e00-\u9fff]/, 'English kit has no Chinese text');
});

test('no hardcoded totals or counts in the kit sources', () => {
  const total = kitModel.kitSummary(kitModel.resolveKit(KIT.slots, DEALS)).total;
  const sources = ['src/BlackFriday.tsx', 'src/gta6-kit-model.ts', 'src/data/gta6-kit.json'].map(f => fs.readFileSync(f, 'utf8')).join('\n');
  for (const needle of [String(total), money(total), total.toLocaleString('en-NZ')]) assert.ok(!sources.includes(needle), `source must not contain ${needle}`);
  assert.doesNotMatch(KIT.slots.map(s => s.noteZh + s.noteEn).join(' '), /NZ\$|\$\d/);
});

test('kit CSS uses theme tokens (day and night) and keeps type at 12px or more', () => {
  const css = fs.readFileSync('src/styles.css', 'utf8');
  const rules = css.split('\n').filter(line => /^\s*(\.bf-page )?\.bf-kit/.test(line));
  assert.ok(rules.length >= 20);
  for (const line of rules) {
    assert.doesNotMatch(line, /#[0-9a-fA-F]{3,8}\b|rgba?\(/, `kit rule must use theme tokens: ${line.trim().slice(0, 60)}`);
    for (const [, px] of line.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)) assert.ok(Number(px) >= 12, `font-size ${px}px >= 12px`);
  }
  assert.match(css, /\.bf-kit-grid \{[^}]*grid-template-columns: repeat\(3/);
  assert.match(css, /\.bf-kit-card-wide \{ grid-column: span 2;/);
  assert.match(css, /grid-auto-flow: dense/);
  assert.match(css, /\.bf-grid, \.bf-kit-grid \{ grid-template-columns: repeat\(2/);
  assert.match(css, /\.bf-kit-grid \{ grid-template-columns: minmax\(0, 1fr\)/);
});