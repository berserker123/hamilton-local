const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const esbuild = require('esbuild');

function load(entry) {
  const r = esbuild.buildSync({
    entryPoints: [entry],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    external: ['react'],
    write: false,
    logLevel: 'silent',
  });
  const m = { exports: {} };
  new Function('module', 'exports', 'require', r.outputFiles[0].text)(m, m.exports, require);
  return m.exports;
}

function renderDirectory(name, lang) {
  const r = esbuild.buildSync({
    stdin: {
      contents: `import React from 'react'; import { ${name} } from './src/LocalDirectories'; import { FeedbackProvider } from './src/Feedback'; export default function View({lang}) { return <FeedbackProvider lang={lang} section="${name}"><${name} t={(zh,en)=>lang==='zh'?zh:en}/></FeedbackProvider>; }`,
      resolveDir: process.cwd(),
      loader: 'tsx',
    },
    bundle: true,
    platform: 'node',
    format: 'cjs',
    write: false,
    external: ['react', 'react-dom', 'react-dom/server'],
  });
  const m = { exports: {} };
  new Function('module', 'exports', 'require', r.outputFiles[0].text)(m, m.exports, require);
  return renderToStaticMarkup(React.createElement(m.exports.default, { lang }));
}

const EXPECTED = [
  { zh: '老板说先别乱用别人的图', en: "Boss said: no borrowing other people's photos" },
  { zh: '真身比照片好看，去现场看吧', en: 'Looks better in person, go see it' },
  { zh: '版权很贵，我们先画个图标', en: "Copyright is pricey, so here's an icon" },
  { zh: '欢迎店家投稿美照', en: 'Owners: send us your best shot' },
];

const tZh = (zh, _en) => zh;
const tEn = (_zh, en) => en;

test('PhotoPlaceholderCaption uses the exact 4 bilingual lines, rotating by card index', () => {
  const { PhotoPlaceholderCaption, PHOTO_PLACEHOLDER_CAPTIONS } = load('src/PhotoPlaceholderCaption.tsx');
  assert.deepEqual(PHOTO_PLACEHOLDER_CAPTIONS, EXPECTED);

  const zhRendered = [0, 1, 2, 3, 4].map(index =>
    renderToStaticMarkup(React.createElement(PhotoPlaceholderCaption, { id: `card-${index}`, index, t: tZh }))
  );
  const enRendered = [0, 1, 2, 3, 4].map(index =>
    renderToStaticMarkup(React.createElement(PhotoPlaceholderCaption, { id: `card-${index}`, index, t: tEn }))
  );

  for (let i = 0; i < 4; i++) {
    assert.ok(zhRendered[i].includes(EXPECTED[i].zh), `zh index ${i}`);
    assert.match(zhRendered[i], /lang="zh-CN"/);
    assert.ok(
      enRendered[i].includes(EXPECTED[i].en.replace(/'/g, '&#x27;')) || enRendered[i].includes(EXPECTED[i].en),
      `en index ${i}`
    );
    assert.match(enRendered[i], /lang="en-NZ"/);
  }
  assert.equal(zhRendered[4], zhRendered[0]);
  assert.equal(enRendered[4], enRendered[0]);
});

test('Stays, Pets and UPick rotate the 4 humorous captions across neighbouring cards in both languages', () => {
  for (const label of ['Stays', 'Pets', 'UPick']) {
    for (const lang of ['zh', 'en']) {
      const html = renderDirectory(label, lang);
      assert.doesNotMatch(html, /摄影师/, `${label} (${lang}) must not contain old placeholder`);
      const captions = [...html.matchAll(/<span class="hl-spot-caption"[^>]*>([^<]+)<\/span>/g)].map(m =>
        m[1].replace(/&#x27;/g, "'")
      );
      assert.ok(captions.length >= 3, `${label} (${lang}) should render placeholders`);
      for (let i = 1; i < captions.length; i++) {
        assert.notEqual(captions[i], captions[i - 1], `${label} (${lang}) neighbouring cards ${i - 1} and ${i} must differ`);
      }
      for (const c of captions) {
        assert.ok(EXPECTED.some(item => item[lang] === c), `${label} (${lang}) unexpected caption: ${c}`);
      }
    }
  }
});
