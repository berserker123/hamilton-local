const { test } = require('node:test');
const assert = require('node:assert/strict');
const esbuild = require('esbuild');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function load(entry) {
  const r = esbuild.buildSync({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', write: false,
    external: ['react', 'react-dom', 'lucide-react'], loader: { '.json': 'json' },
  });
  const m = { exports: {} };
  new Function('module', 'exports', 'require', r.outputFiles[0].text)(m, m.exports, require);
  return m.exports;
}

const search = load('src/search.ts');
const { SearchResults } = load('src/SearchResults.tsx');

test('GP / 家庭医生 / doctor route to search results linking both urgent care and arrival checklist', () => {
  for (const q of ['GP', 'gp', '家庭医生', 'doctor']) {
    const target = search.resolveSearch(q);
    assert.ok(target.startsWith('/search/?q='), `${q} -> ${target}`);
    const matches = search.searchMatches(q);
    assert.equal(matches.length, 2, `${q} should have 2 matches`);
    assert.ok(matches.some(m => m.href.startsWith('/tools/urgent/')), `${q} links urgent care`);
    assert.ok(matches.some(m => m.href.startsWith('/tools/checklist/')), `${q} links arrival checklist`);
  }
  const htmlZh = renderToStaticMarkup(React.createElement(SearchResults, { query: 'GP', t: zh => zh }));
  const htmlEn = renderToStaticMarkup(React.createElement(SearchResults, { query: 'GP', t: (_zh, en) => en }));
  assert.match(htmlZh, /data-testid="search-results"/);
  assert.match(htmlZh, /\/tools\/urgent\//);
  assert.match(htmlZh, /\/tools\/checklist\//);
  assert.match(htmlZh, /登记家庭医生/);
  assert.match(htmlEn, /Urgent care/);
  assert.match(htmlEn, /Enrol with a GP/);
});

test('Dyson / 戴森 and other Black Friday products/brands route to Black Friday page', () => {
  for (const q of ['Dyson', '戴森', 'iPhone', 'AirPods', 'Sony', '乐高', 'MacBook', 'Weber']) {
    const target = search.resolveSearch(q);
    assert.equal(target, '/living/blackfriday/?q=' + encodeURIComponent(q), `${q} -> ${target}`);
  }
  assert.equal(search.resolveSearch('黑五'), '/living/blackfriday/');
  assert.equal(search.resolveSearch('Black Friday'), '/living/blackfriday/');
});

test('游乐场 / playground route to dedicated Playground map page', () => {
  for (const q of ['游乐场', 'playground', 'Playground', 'Magical Bridge']) {
    assert.equal(search.resolveSearch(q), '/kids/map/', q);
  }
});

test('gibberish routes to no-results page and NEVER defaults to Asian grocers', () => {
  for (const q of ['asdfghjkl', 'zxqvbnm123', '不存在的奇怪词xyz']) {
    const target = search.resolveSearch(q);
    assert.ok(target.startsWith('/search/?q='), `${q} -> ${target}`);
    assert.ok(!target.includes('/living/grocers'), `${q} must not default to grocers`);
    assert.deepEqual(search.searchMatches(q), []);
  }
  const htmlZh = renderToStaticMarkup(React.createElement(SearchResults, { query: 'asdfghjkl', t: zh => zh }));
  const htmlEn = renderToStaticMarkup(React.createElement(SearchResults, { query: 'asdfghjkl', t: (_zh, en) => en }));
  assert.match(htmlZh, /data-testid="search-no-results"/);
  assert.match(htmlZh, /没找到，可以试试这些/);
  assert.match(htmlEn, /No results, try these/);
  assert.doesNotMatch(htmlZh, /没有匹配的门店/);
  assert.ok(htmlZh.includes('/tools/bins/'));
  assert.ok(htmlZh.includes('/living/blackfriday/'));
  assert.ok(htmlZh.includes('/kids/map/'));
});

test('actual supermarket queries still route to Asian grocers', () => {
  assert.equal(search.resolveSearch('New Save'), '/living/grocers/?q=New+Save');
  assert.equal(search.resolveSearch('Frankton'), '/living/grocers/?q=Frankton');
  assert.equal(search.resolveSearch('亚超'), '/living/grocers/');
});
