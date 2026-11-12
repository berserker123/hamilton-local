const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const esbuild = require('esbuild');

function load() {
  const result = esbuild.buildSync({ entryPoints: ['src/photo-flip.ts'], bundle: true, platform: 'node', format: 'cjs', write: false });
  const m = { exports: {} };
  new Function('module', 'exports', result.outputFiles[0].text)(m, m.exports);
  return m.exports;
}

test('flip toggles and only Enter or Space activate a focused photo', () => {
  const { toggleFlip, keyTogglesFlip } = load();
  assert.equal(toggleFlip(false), true);
  assert.equal(toggleFlip(true), false);
  assert.equal(keyTogglesFlip('Enter'), true);
  assert.equal(keyTogglesFlip(' '), true);
  assert.equal(keyTogglesFlip('Spacebar'), true);
  assert.equal(keyTogglesFlip('Tab'), false);
  assert.equal(keyTogglesFlip('Escape'), false);
});

test('a credit link click does not flip the photo', () => {
  const { clickTogglesFlip } = load();
  assert.equal(clickTogglesFlip(false), true);
  assert.equal(clickTogglesFlip(true), false);
});

test('photo cards use a 180deg flip that fades when motion is reduced', () => {
  const app = fs.readFileSync('src/App.tsx', 'utf8');
  const css = fs.readFileSync('src/styles.css', 'utf8');
  assert.match(app, /PhotoFlip/);
  assert.doesNotMatch(app, /ia-photo-credit/);
  assert.doesNotMatch(css, /\.ia-place-figure:hover \.ia-photo-credit/);
  const at = css.indexOf('.ia-flip.is-flipped .ia-flip-front');
  assert.ok(at > 0, 'flipped front face');
  const slice = css.slice(at, at + 2200);
  assert.match(slice, /rotateY\(180deg\)/);
  assert.match(slice, /0\.5s/);
  assert.match(slice, /prefers-reduced-motion:\s*reduce/);
  assert.match(slice, /\.ia-flip-back\s*\{[^}]*opacity:\s*0/);
});
