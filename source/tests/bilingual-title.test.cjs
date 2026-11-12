const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const esbuild = require('esbuild');

test('bilingual titles keep Chinese brands and English names on separate lines without location expansion', () => {
  assert.ok(fs.existsSync('src/BilingualTitle.tsx'), 'shared bilingual title renderer exists');
  const result = esbuild.buildSync({ entryPoints: ['src/BilingualTitle.tsx'], bundle: true, platform: 'node', format: 'cjs', external: ['react'], write: false });
  const m = { exports: {} };
  new Function('module', 'exports', 'require', result.outputFiles[0].text)(m, m.exports, require);
  const { BilingualTitle } = m.exports;
  assert.equal(m.exports.chineseCardName('花园广场观赛日文化活动 Garden Place match-day celebration'), '花园广场观赛日文化活动');
  assert.equal(m.exports.chineseCardName('Paws in the passenger seat'), '中文名称待确认');
  for (const [zh, en] of [['St. Kilda 草莓农场', 'St. Kilda Berry Farm'], ['Blueberry Country 蓝莓园', 'Blueberry Country — Ōhaupō Orchard'], ['汉密尔顿湖', 'Hamilton Lake']]) {
    const t = (zh, en) => zh.replace('汉密尔顿', '汉密尔顿 Hamilton');
    const html = renderToStaticMarkup(React.createElement(BilingualTitle, { zh, en, t }));
    assert.ok(html.includes('>' + zh + '</h3>'));
    assert.ok(html.includes('lang="en-NZ"'));
    assert.ok(html.includes('>' + en + '</p>'));
    const english = renderToStaticMarkup(React.createElement(BilingualTitle, { zh, en, t: (zh, en) => en }));
    assert.ok(english.includes('>' + en + '</h3>'));
    assert.ok(!english.includes('ia-secondary-name'));
  }
});

test('Abbots replaces Park View with official contacts, no scores and no unlicensed image', () => {
  const stays = require('../src/stays-v25.json');
  assert.ok(!stays.some(item => item.id === 'park-view-motor-lodge'));
  const item = stays.find(item => item.id === 'abbots-hamilton');
  assert.ok(item);
  assert.equal(item.name, 'Abbots Hamilton');
  assert.equal(item.address, '222 Ulster Street, Whitiora, Hamilton, Waikato, New Zealand');
  assert.equal(item.phone, '+64 7 8383299');
  assert.equal(item.mobile, '021 158 1119');
  assert.equal(item.url, 'https://www.abbotshamilton.co.nz/');
  assert.ok(item.sources.includes('https://www.abbotshamilton.co.nz/Contact.html'));
  assert.deepEqual(item.ratings, []);
  assert.ok(!item.photo);
});
