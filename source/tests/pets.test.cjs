const { test } = require('node:test');
const assert = require('node:assert/strict');
const esbuild = require('esbuild');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function renderPets(lang) {
  const result = esbuild.buildSync({
    stdin: { contents: `import React from 'react'; import { Pets } from './src/LocalDirectories'; import { FeedbackProvider } from './src/Feedback'; export default function View({lang}) { return <FeedbackProvider lang={lang} section="便民黄页"><Pets t={(zh,en)=>lang==='zh'?zh:en}/></FeedbackProvider>; }`, resolveDir: process.cwd(), loader: 'tsx' },
    bundle: true, platform: 'node', format: 'cjs', write: false, external: ['react', 'react-dom', 'react-dom/server'], metafile: true,
  });
  const m = { exports: {} };
  new Function('module', 'exports', 'require', result.outputFiles[0].text)(m, m.exports, require);
  return { html: renderToStaticMarkup(React.createElement(m.exports.default, { lang })), result };
}

test('pet guide renders six bilingual category cards without merchant details in either language', () => {
  for (const lang of ['zh', 'en']) {
    const { html } = renderPets(lang);
    assert.equal((html.match(/<article[^>]*data-pet-category=/g) || []).length, 6);
    for (const title of ['宠物用品', '寄养与猫舍', '洗护美容', '兽医与夜间急诊', '遛狗与放绳区', '狗狗日托']) assert.ok(html.includes(title));
    assert.equal((html.match(/商家招募中 · Listings coming soon/g) || []).length, 6);
    assert.equal((html.match(/商家入驻 \/ 广告合作/g) || []).length, 6);
    assert.doesNotMatch(html, /Pet Essentials|Raw Essentials|Newstead|data-directory-id=|href="tel:|maps\/search/);
  }
});

test('pet guide dependency graph contains no archived listings or merchant content', () => {
  const { result } = renderPets('zh');
  assert.ok(!Object.keys(result.metafile.inputs).some(file => file.includes('_hidden')));
  assert.doesNotMatch(result.outputFiles[0].text, /Pet Essentials|Raw Essentials|Newstead Lodge|Newstead Veterinary/);
});
