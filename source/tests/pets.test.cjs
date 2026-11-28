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

test('pet guide lists shops, vets and off-leash areas, boarding, grooming and daycare', () => {
  const { html, result } = renderPets('zh');
  for (const title of ['宠物用品', '寄养与猫舍', '洗护美容', '兽医与夜间急诊', '免牵引绳区域', '狗狗日托']) assert.ok(html.includes(title), title);
  const order = ['shops', 'vets', 'dog-parks', 'boarding', 'grooming', 'daycare'].map(id => html.indexOf('data-pet-category="' + id + '"'));
  assert.deepEqual(order, [...order].sort((a, b) => a - b));
  for (const name of ['Pet Essentials Hamilton', 'Waikato After Hours Veterinary Hospital', 'Minogue Park dog exercise area', '围栏免牵引绳区域']) assert.ok(html.includes(name), name);
  for (const id of ['newstead-boarding', 'metro-boarding', 'hounds-grooming', 'metro-te-rapa-grooming', 'paws-daycare', 'newstead-daycare']) assert.ok(html.includes('data-directory-id="' + id + '"'), id);
  assert.doesNotMatch(html, /League of Pups|放绳区/);
  assert.ok(html.includes('hamilton.govt.nz/dogs-and-other-animals/dogs/dog-exercise-areas'));
  assert.doesNotMatch(html, /招商中|商家入驻/);
  const pets = require('../src/pets-v25.json');
  for (const id of ['boarding', 'grooming', 'daycare']) for (const item of pets.find(g => g.id === id).items) { assert.ok(item.phone, item.id); assert.match(item.verifiedAt, /^\d{4}-\d{2}-\d{2}$/, item.id); assert.ok(html.includes(item.phone), item.phone); }
  assert.ok(!Object.keys(result.metafile.inputs).some(file => file.includes('_hidden')));
  const english = renderPets('en').html;
  assert.ok(english.includes('Off-leash areas'));
  assert.ok(english.includes('Pet Essentials Hamilton'));
  assert.doesNotMatch(english, /Open for listings|List your business/);
});
