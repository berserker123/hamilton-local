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

test('pet guide restores v25j listings and keeps grooming and daycare as merchant cards', () => {
  const { html, result } = renderPets('zh');
  for (const title of ['宠物用品', '寄养与猫舍', '洗护美容', '兽医与夜间急诊', '遛狗与放绳区', '狗狗日托']) assert.ok(html.includes(title), title);
  for (const name of ['Pet Essentials Hamilton', 'Newstead Lodge Boarding Kennels and Cattery', 'Waikato After Hours Veterinary Hospital', 'Minogue Park dog exercise area']) assert.ok(html.includes(name), name);
  assert.ok(html.includes('hamilton.govt.nz/dogs-and-other-animals/dogs/dog-exercise-areas'));
  assert.equal((html.match(/商家招募中 · Listings coming soon/g) || []).length, 2);
  assert.equal((html.match(/data-pet-category="grooming"/g) || []).length, 1);
  assert.equal((html.match(/data-pet-category="daycare"/g) || []).length, 1);
  assert.doesNotMatch(html, /data-directory-id="hounds-grooming"|data-directory-id="paws-daycare"/);
  assert.ok(!Object.keys(result.metafile.inputs).some(file => file.includes('_hidden')));
  const english = renderPets('en').html;
  assert.ok(english.includes('after-hours care'));
  assert.ok(english.includes('Pet Essentials Hamilton'));
});
