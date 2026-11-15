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
  assert.equal(verdict({ ...item, salePrice: 100 }), '伪优惠');
  assert.equal(verdict({ ...item, raisedBeforeSale: true }), '伪优惠');
  assert.equal(verdict({ ...item, typicalPrice: null, lowestPrice90d: null, historyVerified: false }), '待核实');
  assert.equal(verdict({ ...item, lowestPrice90d: null }), '待核实');
  assert.equal(verdict({ ...item, salePrice: 95, lowestPrice90d: 95, regularPromo: true }), '一般');
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
  const { realDiscount, verdict } = load();
  assert.ok(data.length >= 20 && data.length <= 30);
  assert.equal(new Set(data.map(d => d.id)).size, data.length);
  for (const d of data) {
    assert.ok(d.name && d.nameZh && d.category && d.store && d.addedAt && d.historyNote);
    assert.ok(d.salePrice > 0 && /^2026-11-15/.test(d.checkedAt));
    assert.ok(d.sources.includes(d.productUrl));
    assert.match(d.productUrl, /^https:\/\//);
    if (d.priceSpyUrl) assert.match(d.priceSpyUrl, /^https:\/\/pricespy.co.nz\/product.php\?p=\d+/);
    if (!d.historyVerified) { assert.equal(d.typicalPrice, null); assert.equal(realDiscount(d), null); assert.equal(verdict(d), '待核实'); }
  }
});
