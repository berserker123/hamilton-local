const { test } = require('node:test');
const assert = require('node:assert/strict');
const esbuild = require('esbuild');
function load() {
  const result = esbuild.buildSync({ entryPoints: ['src/blackfriday-model.ts'], bundle: true, platform: 'node', format: 'cjs', write: false });
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', result.outputFiles[0].text)(mod, mod.exports, require);
  return mod.exports;
}
const item = { id: 'test', salePrice: 80, typicalPrice: 100, lowestPrice90d: 80, historyVerified: true, category: '数码', store: 'Store A', addedAt: '2026-11-15', raisedBeforeSale: false };

test('price check exposes an isolated new-tab GET search between the intro and filters', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const result = esbuild.buildSync({ entryPoints: ['src/BlackFriday.tsx'], bundle: true, platform: 'node', format: 'cjs', external: ['react'], write: false });
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', result.outputFiles[0].text)(mod, mod.exports, require);
  const html = renderToStaticMarkup(React.createElement(mod.exports.BlackFriday, { t: zh => zh }));
  const form = html.match(/<form\b[^>]*>[\s\S]*?<\/form>/)?.[0];
  assert.ok(form, 'a product search form is rendered');
  assert.match(form, /action="https:\/\/pricespy.co.nz\/search"/);
  assert.match(form, /method="get"/);
  assert.match(form, /target="_blank"/);
  assert.match(form, /rel="noopener noreferrer"/);
  assert.match(form, /<input\b[^>]*name="query"[^>]*required=""/);
  assert.ok(html.indexOf('class="bf-intro"') < html.indexOf(form));
  assert.ok(html.indexOf(form) < html.indexOf('class="bf-filters"'));
});
test('discount uses verified typical price, preserves increases and refuses unknown history', () => {
  const { realDiscount } = load();
  assert.equal(realDiscount(item), 20);
  assert.equal(realDiscount({ ...item, salePrice: 110 }), -10);
  for (const patch of [{ typicalPrice: null }, { typicalPrice: 0 }, { historyVerified: false }]) assert.equal(realDiscount({ ...item, ...patch }), null);
});
test('verdict requires historical evidence and applies fair comparison boundaries', () => {
  const { verdict } = load();
  assert.equal(verdict(item), '真优惠');
  assert.equal(verdict({ ...item, salePrice: 95 }), '一般');
  assert.equal(verdict({ ...item, salePrice: 100 }), '先别急');
  assert.equal(verdict({ ...item, raisedBeforeSale: true }), '真优惠');
  assert.equal(verdict({ ...item, typicalPrice: null, lowestPrice90d: null, historyVerified: false }), '待核实');
  assert.equal(verdict({ ...item, lowestPrice90d: null }), '待核实');
  assert.equal(verdict({ ...item, salePrice: 95, lowestPrice90d: 95, regularPromo: true }), '真优惠');
});
test('round two uses a one-dollar low tolerance and requires a pre-sale rise to end near typical', () => {
  const { verdict } = load();
  assert.equal(verdict({ ...item, salePrice: 81 }), '真优惠');
  assert.equal(verdict({ ...item, salePrice: 81.01 }), '一般');
  assert.equal(verdict({ ...item, salePrice: 90, raisedBeforeSale: true }), '一般');
  assert.equal(verdict({ ...item, salePrice: 99, raisedBeforeSale: true }), '先别急');
  assert.equal(verdict({ ...item, salePrice: 98.99, raisedBeforeSale: true }), '一般');
  assert.equal(verdict({ ...item, salePrice: 101 }), '先别急');
});
test('filters combine and all sorts handle unknown discounts without mutating data', () => {
  const { selectDeals } = load();
  const deals = [item, { ...item, id: 'unknown', historyVerified: false, salePrice: 1, category: '家电', addedAt: '2026-11-16' }, { ...item, id: 'other', store: 'Store B', salePrice: 90 }];
  assert.deepEqual(selectDeals(deals, '家电', 'Store B', 'discount'), []);
  assert.deepEqual(selectDeals(deals, 'all', 'all', 'discount').map(d => d.id), ['test', 'other', 'unknown']);
  assert.equal(selectDeals(deals, 'all', 'all', 'price')[0].id, 'unknown');
  assert.equal(selectDeals(deals, 'all', 'all', 'newest')[0].id, 'unknown');
  assert.equal(selectDeals(deals, '数码', 'Store A', 'price').length, 1);
  assert.equal(deals[0], item);
});
test('preview data has real source URLs and never substitutes list price for historical evidence', () => {
  const data = require('../src/data/blackfriday.json');
  const { realDiscount, verdict, CATEGORIES } = load();
  const validCategories = new Set(CATEGORIES.map(([zh]) => zh));
  assert.ok(data.length >= 45);
  assert.equal(new Set(data.map(d => d.id)).size, data.length);
  for (const d of data) {
    assert.ok(d.name && d.nameZh && d.category && d.store && d.addedAt && d.historyNote);
    assert.ok(validCategories.has(d.category), `unexpected category ${d.category} on ${d.id}`);
    assert.ok(d.salePrice > 0 && /^2026-11-(15|16|17|18|19)/.test(d.checkedAt), d.id);
    assert.ok(d.sources.includes(d.productUrl));
    assert.match(d.productUrl, /^https:\/\//);
    if (d.priceSpyUrl) assert.match(d.priceSpyUrl, /^https:\/\/(pricespy\.co\.nz\/product\.php\?p=\d+|www\.priceme\.co\.nz\/[^/]+\/p-\d+\.aspx)/);
    if (!d.historyVerified) { assert.equal(d.typicalPrice, null); assert.equal(realDiscount(d), null); assert.equal(verdict(d), '待核实'); }
  }
});
test('round three retains eight updated categories and records reproducible exact-variant history', () => {
  const data = require('../src/data/blackfriday.json');
  const { realDiscount, verdict, CATEGORIES } = load();
  assert.deepEqual(CATEGORIES.map(([zh]) => zh), ['数码', '家电', '家居家具', '美妆个护', '母婴玩具', '收藏潮玩', '户外运动', '其他']);
  assert.equal(new Set(data.map(d => d.category)).size, 8);
  assert.ok(data.filter(d => d.historyVerified).length >= 36);
  assert.ok(data.filter(d => d.category === '收藏潮玩').length >= 8);
  assert.ok(data.filter(d => d.category === '家居家具').length >= 3);
  assert.ok(data.filter(d => d.category === '母婴玩具').length >= 1);
  assert.ok(data.filter(d => d.category === '其他').length >= 2);
  for (const d of data) {
    assert.equal(d.verdict, verdict(d), d.id);
    assert.equal(d.discountPercent, realDiscount(d), d.id);
    if (!d.historyVerified) continue;
    assert.equal(d.historyEvidence.exactVariant, true, d.id);
    const validWindow =
      (d.historyEvidence.dayCount === 90 && (
        (d.historyEvidence.windowStart === '2026-08-17' && d.historyEvidence.windowEnd === '2026-11-14') ||
        (d.historyEvidence.windowStart === '2026-08-18' && d.historyEvidence.windowEnd === '2026-11-15') ||
        (d.historyEvidence.windowStart === '2026-08-18' && d.historyEvidence.windowEnd === '2026-11-16') ||
        (d.historyEvidence.windowStart === '2026-08-20' && d.historyEvidence.windowEnd === '2026-11-17')
      )) ||
      (['apple-airpods5-jb', 'apple-iphone18-pro-256-jb', 'apple-iphone18-promax-256-jb'].includes(d.id) && d.historyEvidence.windowStart === '2026-09-10' && (
        (d.historyEvidence.windowEnd === '2026-11-15' && d.historyEvidence.dayCount === 67) ||
        (d.historyEvidence.windowEnd === '2026-11-17' && d.historyEvidence.dayCount === 69)
      ));
    assert.ok(validWindow, `unexpected 90d window on ${d.id}: ${d.historyEvidence.windowStart}..${d.historyEvidence.windowEnd}`);
    assert.ok(d.sources.includes(d.priceSpyUrl), d.id);
    assert.ok(d.lowestPrice90d > 0 && d.lowestPrice90d <= d.typicalPrice, d.id);
    assert.ok(['market', 'retailer'].includes(d.historyScope), d.id);
    assert.match(d.historyEvidence.method, /Median of 90/, d.id);
  }
});
test('refresh 2026-11-19: counts, dates, retailer filters (including Bunnings & Mitre 10) and note states come from the data', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const data = require('../src/data/blackfriday.json');
  const { selectDeals } = load();
  const result = esbuild.buildSync({ entryPoints: ['src/BlackFriday.tsx'], bundle: true, platform: 'node', format: 'cjs', external: ['react'], write: false });
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', result.outputFiles[0].text)(mod, mod.exports, require);
  const html = renderToStaticMarkup(React.createElement(mod.exports.BlackFriday, { t: zh => zh }));
  assert.ok(html.includes(`${data.length} 件商品 / 共 ${data.length} 件`));
  const dates = [...new Set(data.map(d => d.checkedAt.slice(0, 10)))].sort();
  assert.ok(html.includes(`${dates[0]} – ${dates[dates.length - 1]}`));
  assert.equal(dates.at(-1), '2026-11-19');
  const blocked = data.filter(d => d.currentPriceRecheck?.status === 'domain-blocked').length;
  assert.equal((html.match(/保留早前记录/g) || []).length, blocked);
  const spyConfirmed = data.filter(d => d.currentPriceRecheck?.status === 'pricespy-offer').length;
  assert.equal((html.match(/按 PriceSpy 当日同店报价核对/g) || []).length, spyConfirmed);
  for (const store of ['Bunnings', 'Mitre 10']) {
    const storeDeals = data.filter(d => d.store === store);
    assert.ok(storeDeals.length >= 5, `expected at least 5 ${store} items`);
    assert.ok(html.includes(`<option>${store}</option>`), `store filter includes ${store}`);
    assert.equal(selectDeals(data, 'all', store, 'discount').length, storeDeals.length);
  }
  for (const d of data) assert.ok(['真优惠', '一般', '先别急', '待核实'].includes(d.verdict), d.id);
});
test('unverified items render alternating bilingual humorous labels without exposing 待核实 in UI', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const result = esbuild.buildSync({ entryPoints: ['src/BlackFriday.tsx'], bundle: true, platform: 'node', format: 'cjs', external: ['react'], write: false });
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', result.outputFiles[0].text)(mod, mod.exports, require);
  const { BlackFriday, UNVERIFIED_LABELS } = mod.exports;
  for (const [lang, t] of [['zh', zh => zh], ['en', (_zh, en) => en]]) {
    const html = renderToStaticMarkup(React.createElement(BlackFriday, { t }));
    assert.doesNotMatch(html, /待核实/, `${lang} UI must not show 待核实`);
    assert.doesNotMatch(html, /History unverified/, `${lang} UI must not show History unverified`);
    const badges = [...html.matchAll(/<span class="bf-verdict bf-verdict-unverified"[^>]*>([^<]+)<\/span>/g)].map(m => m[1]);
    const unverifiedCount = require('../src/data/blackfriday.json').filter(d => d.verdict === '待核实').length;
    assert.ok(unverifiedCount > 0);
    // 2 in legend + one per unverified card, derived from the data
    assert.equal(badges.length, 2 + unverifiedCount, `${lang} badge count`);
    const cardBadges = badges.slice(2);
    for (let i = 1; i < cardBadges.length; i++) {
      assert.notEqual(cardBadges[i], cardBadges[i - 1], `${lang} neighbouring unverified cards ${i - 1} and ${i} must alternate`);
    }
    for (const item of UNVERIFIED_LABELS) {
      assert.ok(html.includes(lang === 'zh' ? item.zh : item.en), `${lang} label ${item.zh}`);
      const note = lang === 'zh' ? item.noteZh : item.noteEn.replace(/'/g, '&#x27;');
      assert.ok(html.includes(note), `${lang} note for ${item.zh}`);
    }
  }
});
test('apple flagship items include verified airport tax-free tips without affecting GST-inclusive verdicts', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const data = require('../src/data/blackfriday.json');
  const { realDiscount, verdict } = load();
  const result = esbuild.buildSync({ entryPoints: ['src/BlackFriday.tsx'], bundle: true, platform: 'node', format: 'cjs', external: ['react'], write: false });
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', result.outputFiles[0].text)(mod, mod.exports, require);
  const taxFreeDeals = data.filter(d => d.taxFreeOffer);
  assert.ok(taxFreeDeals.length >= 6, 'at least 6 Apple flagship deals carry verified airport tax-free tips');
  for (const d of taxFreeDeals) {
    assert.ok(d.taxFreeOffer.price > 0 && d.taxFreeOffer.price < d.salePrice, `tax-free price lower than GST-inclusive price on ${d.id}`);
    assert.match(d.taxFreeOffer.url, /^https:\/\//, d.id);
    assert.ok(d.sources.includes(d.taxFreeOffer.url), `tax-free source recorded on ${d.id}`);
    // Verdict and discount remain strictly based on normal GST-inclusive price
    assert.equal(realDiscount(d), realDiscount({ ...d, taxFreeOffer: undefined }), d.id);
    assert.equal(verdict(d), verdict({ ...d, taxFreeOffer: undefined }), d.id);
  }
  const htmlZh = renderToStaticMarkup(React.createElement(mod.exports.BlackFriday, { t: zh => zh }));
  const htmlEn = renderToStaticMarkup(React.createElement(mod.exports.BlackFriday, { t: (_zh, en) => en }));
  assert.equal((htmlZh.match(/data-testid="bf-taxfree-tip"/g) || []).length, taxFreeDeals.length);
  assert.equal((htmlEn.match(/data-testid="bf-taxfree-tip"/g) || []).length, taxFreeDeals.length);
  assert.ok(htmlZh.includes('超级省钱妙招 · 机场免税'));
  assert.ok(htmlZh.includes('仅限3个月内乘国际航班离境新西兰的旅客'));
  assert.ok(htmlEn.includes('Money-saving tip · Airport tax-free'));
  assert.ok(htmlEn.includes('flying out of NZ within 3 months'));
  // Store filter options and counts remain derived from data
  const stores = [...new Set(data.map(d => d.store))].sort();
  for (const store of stores) assert.ok(htmlZh.includes(`<option>${store}</option>`));
});
