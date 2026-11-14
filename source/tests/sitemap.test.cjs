const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {execFileSync} = require('node:child_process');

test('published sitemap includes a content modification date for the crawlable homepage', () => {
  const xml = fs.readFileSync('../sitemap.xml', 'utf8');
  assert.match(xml, /<loc>https:\/\/hamiltonlocal\.nz\/<\/loc>\s*<lastmod>\d{4}-\d\d-\d\dT[^<]+<\/lastmod>/);
  assert.doesNotMatch(xml, /<loc>[^<]*#/);
});

test('generator discovers real HTML, excludes aliases and noindex, and preserves Git dates across rebuilds', async t => {
  const {generateSitemap} = await import('../scripts/generate-sitemap.mjs');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hl-sitemap-'));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  const sourceDir = path.join(root, 'source');
  const siteDir = path.join(sourceDir, 'dist');
  fs.mkdirSync(path.join(sourceDir, 'src'), {recursive: true});
  fs.mkdirSync(path.join(sourceDir, 'public'), {recursive: true});
  fs.mkdirSync(siteDir);
  const pages = {
    'index.html': '<link rel="canonical" href="https://hamiltonlocal.nz/">',
    'guide & tips.html': '<h1>Guide</h1>',
    'nested/index.html': '<h1>Nested guide</h1>',
    '404.html': '<h1>Not found</h1>',
    'private.html': "<meta content='noindex, follow' name='robots'>",
    'alias.html': '<link href="https://hamiltonlocal.nz/" rel="canonical">',
  };
  for (const [name, html] of Object.entries(pages)) {
    for (const base of [siteDir, name === 'index.html' ? sourceDir : path.join(sourceDir, 'public')]) {
      const file = path.join(base, name);
      fs.mkdirSync(path.dirname(file), {recursive: true});
      fs.writeFileSync(file, html);
    }
  }
  fs.writeFileSync(path.join(sourceDir, 'src', 'data.json'), '["initial content"]');
  const git = (...args) => execFileSync('git', args, {cwd: root, encoding: 'utf8', env: {...process.env, GIT_AUTHOR_DATE: '2026-11-01T12:00:00Z', GIT_COMMITTER_DATE: '2026-11-01T12:00:00Z'}}).trim();
  git('init', '--quiet');
  git('add', 'source/index.html', 'source/src', 'source/public');
  git('-c', 'user.name=Sitemap test', '-c', 'user.email=sitemap@example.invalid', 'commit', '--quiet', '-m', 'Initial content');
  const xml = generateSitemap({siteDir, sourceDir});
  assert.equal((xml.match(/<url>/g) || []).length, 3);
  assert.match(xml, /https:\/\/hamiltonlocal\.nz\/guide%20%26%20tips\.html/);
  assert.match(xml, /https:\/\/hamiltonlocal\.nz\/nested\//);
  assert.doesNotMatch(xml, /404|private|alias|#/);
  assert.equal((xml.match(/<lastmod>2026-11-01T12:00:00.000Z<\/lastmod>/g) || []).length, 3);
  fs.utimesSync(path.join(siteDir, 'index.html'), new Date(), new Date());
  fs.writeFileSync(path.join(sourceDir, 'public', 'sitemap.xml'), 'Regenerated sitemap');
  git('add', 'source/public/sitemap.xml');
  execFileSync('git', ['-c', 'user.name=Sitemap test', '-c', 'user.email=sitemap@example.invalid', 'commit', '--quiet', '-m', 'Sitemap only'], {cwd: root, env: {...process.env, GIT_AUTHOR_DATE: '2026-11-02T12:00:00Z', GIT_COMMITTER_DATE: '2026-11-02T12:00:00Z'}});
  assert.equal(generateSitemap({siteDir, sourceDir}), xml);
  fs.writeFileSync(path.join(sourceDir, 'src', 'data.json'), '["updated content"]');
  git('add', 'source/src/data.json');
  execFileSync('git', ['-c', 'user.name=Sitemap test', '-c', 'user.email=sitemap@example.invalid', 'commit', '--quiet', '-m', 'Content update'], {cwd: root, env: {...process.env, GIT_AUTHOR_DATE: '2026-11-03T12:00:00Z', GIT_COMMITTER_DATE: '2026-11-03T12:00:00Z'}});
  assert.match(generateSitemap({siteDir, sourceDir}), /<loc>https:\/\/hamiltonlocal\.nz\/<\/loc>\s*<lastmod>2026-11-03T12:00:00.000Z<\/lastmod>/);
});
