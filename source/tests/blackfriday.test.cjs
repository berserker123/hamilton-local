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
  assert.ok(data.length >= 30 && data.length <= 60);
  assert.equal(new Set(data.map(d => d.id)).size, data.length);
  for (const d of data) {
    assert.ok(d.name && d.nameZh && d.category && d.store && d.addedAt && d.historyNote);
    assert.ok(validCategories.has(d.category), `unexpected category ${d.category} on ${d.id}`);
    assert.ok(d.salePrice > 0 && /^2026-11-(15|16)/.test(d.checkedAt), d.id);
    assert.ok(d.sources.includes(d.productUrl));
    assert.match(d.productUrl, /^https:\/\//);
    if (d.priceSpyUrl) assert.match(d.priceSpyUrl, /^https:\/\/pricespy.co.nz\/product.php\?p=\d+/);
    if (!d.historyVerified) { assert.equal(d.typicalPrice, null); assert.equal(realDiscount(d), null); assert.equal(verdict(d), '待核实'); }
  }
});
test('round three retains eight updated categories and records reproducible exact-variant history', () => {
  const data = require('../src/data/blackfriday.json');
  const { realDiscount, verdict, CATEGORIES } = load();
  assert.deepEqual(CATEGORIES.map(([zh]) => zh), ['数码', '家电', '家居家具', '美妆个护', '母婴玩具', '收藏潮玩', '户外运动', '其他']);
  assert.equal(new Set(data.map(d => d.category)).size, 7);
  assert.ok(data.filter(d => d.historyVerified).length >= 28);
  assert.ok(data.filter(d => d.category === '收藏潮玩').length >= 8);
  assert.ok(data.filter(d => d.category === '母婴玩具').length >= 1);
  assert.ok(data.filter(d => d.category === '其他').length >= 1);
  for (const d of data) {
    assert.equal(d.verdict, verdict(d), d.id);
    assert.equal(d.discountPercent, realDiscount(d), d.id);
    if (!d.historyVerified) continue;
    assert.equal(d.historyEvidence.exactVariant, true, d.id);
    assert.equal(d.historyEvidence.dayCount, 90, d.id);
    const validWindow =
      (d.historyEvidence.windowStart === '2026-08-17' && d.historyEvidence.windowEnd === '2026-11-14') ||
      (d.historyEvidence.windowStart === '2026-08-18' && d.historyEvidence.windowEnd === '2026-11-15');
    assert.ok(validWindow, `unexpected 90d window on ${d.id}: ${d.historyEvidence.windowStart}..${d.historyEvidence.windowEnd}`);
    assert.ok(d.sources.includes(d.priceSpyUrl), d.id);
    assert.ok(d.lowestPrice90d > 0 && d.lowestPrice90d <= d.typicalPrice, d.id);
    assert.ok(['market', 'retailer'].includes(d.historyScope), d.id);
    assert.match(d.historyEvidence.method, /Median of 90/, d.id);
  }
});
