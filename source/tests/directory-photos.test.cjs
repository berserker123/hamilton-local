const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const esbuild = require('esbuild');
function load() {
  const r = esbuild.buildSync({ entryPoints: ['src/LocalDirectories.tsx'], bundle: true, platform: 'node', format: 'cjs', external: ['react'], write: false, logLevel: 'silent' });
  const m = { exports: {} };
  new Function('module', 'exports', 'require', r.outputFiles[0].text)(m, m.exports, require);
  return m.exports;
}
const t = (zh, en) => en;
test('stay without a verified photo renders a labelled, non-flipping placeholder', () => {
  const { DirectoryPhoto } = load();
  const html = renderToStaticMarkup(React.createElement(DirectoryPhoto, { item: {}, title: 'Test stay', t }));
  assert.match(html, /Location photo pending/);
  assert.doesNotMatch(html, /<img|ia-flip-front/);
});
test('verified photo metadata feeds both the flip and detail attribution', () => {
  const { DirectoryPhoto, DirectoryPhotoCredit } = load();
  const item = { photo: 'test.webp', photoAlt: 'Test property exterior', photoCredit: 'Test Author', photoLicense: 'CC BY-SA 4.0', photoLicenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', photoSource: 'https://commons.wikimedia.org/wiki/File:Test.webp' };
  const flip = renderToStaticMarkup(React.createElement(DirectoryPhoto, { item, title: 'Test stay', t }));
  const detail = renderToStaticMarkup(React.createElement(DirectoryPhotoCredit, { item, t }));
  for (const html of [flip, detail]) {
    assert.match(html, /Test Author/);
    assert.match(html, /CC BY-SA 4.0/);
    assert.ok(html.includes(item.photoSource));
    assert.ok(html.includes(item.photoLicenseUrl));
  }
  assert.match(flip, /ia-flip-front/);
  assert.match(flip, /src=".\/photos\/test.webp"/);
});
