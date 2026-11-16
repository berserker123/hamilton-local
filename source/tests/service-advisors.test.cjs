const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const esbuild = require('esbuild');

function loadPlaceholders() {
  const result = esbuild.buildSync({
    entryPoints: ['src/service-placeholders.ts'],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    write: false,
  });
  const m = { exports: {} };
  new Function('module', 'exports', 'require', result.outputFiles[0].text)(m, m.exports, require);
  return m.exports;
}

test('service placeholder lines match the 5 exact bilingual lines and rotate without neighbouring duplicates', () => {
  const { SERVICE_PLACEHOLDER_LINES, servicePlaceholderLine } = loadPlaceholders();
  assert.deepEqual(SERVICE_PLACEHOLDER_LINES, [
    { zh: '这个位置空着，老板急得睡不着', en: "This spot is empty and the boss can't sleep" },
    { zh: '虚位以待，先到先得', en: 'Your name here, first come first served' },
    { zh: '我们在等一位靠谱的你', en: 'Waiting for someone reliable, maybe you' },
    { zh: '此处招商，比租铺面便宜多了', en: 'Cheaper than renting a shopfront' },
    { zh: '空着也是空着，不如放你的店', en: "It's empty anyway, why not your business" },
  ]);

  const seen = new Set();
  for (const [tab, count] of [['home', 3], ['trades', 3], ['daily', 3], ['pets', 3], ['advisors', 4]]) {
    let prev = null;
    for (let i = 0; i < count; i++) {
      const line = servicePlaceholderLine(tab, i);
      assert.notEqual(line.zh, prev, `${tab} index ${i} duplicates previous`);
      prev = line.zh;
      seen.add(line.zh);
    }
  }
  assert.equal(seen.size, 5);
});

test('App defines advisors tab after pets with the 4 required sub-groups and no real listings', () => {
  const app = fs.readFileSync('src/App.tsx', 'utf8');
  const { TABS } = require('../src/site-routes.mjs');
  assert.deepEqual(TABS.services.slice(-2).map(([id]) => id), ['pets', 'advisors']);
  for (const group of [
    "['金融服务 (贷款、保险、理财)', 'Financial Services']",
    "['移民中介', 'Immigration Advisers']",
    "['会计', 'Accountants']",
    "['律师', 'Lawyers']",
  ]) {
    assert.ok(app.includes(group), group);
  }
  assert.doesNotMatch(app, /内容整理中 · 暂无商家|Coming soon · No listings yet/);
});
