import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath, pathToFileURL} from 'node:url';

const defaultSourceDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'https://hamiltonlocal.nz';
const escapeXml = value => value.replace(/[<>&"']/g, char => ({'<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;'}[char]));

function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)]
    .map(([, key, double, single, bare]) => [key.toLowerCase(), double ?? single ?? bare]));
}

function htmlFiles(directory, prefix = '') {
  return fs.readdirSync(directory, {withFileTypes: true}).sort((a, b) => a.name.localeCompare(b.name, 'en'))
    .flatMap(entry => {
      const name = path.posix.join(prefix, entry.name);
      if (entry.isDirectory()) return htmlFiles(path.join(directory, entry.name), name);
      return entry.isFile() && /\.html?$/i.test(name) && !/^404\.html?$/i.test(entry.name) ? [name] : [];
    });
}

export function generateSitemap({siteDir, sourceDir = defaultSourceDir}) {
  const entries = [];
  for (const name of htmlFiles(siteDir)) {
    const html = fs.readFileSync(path.join(siteDir, name), 'utf8');
    const tags = [...html.matchAll(/<(?:meta|link)\b[^>]*>/gi)].map(([tag]) => attributes(tag));
    if (tags.some(tag => /^(robots|googlebot)$/i.test(tag.name || '') && /\b(noindex|none)\b/i.test(tag.content || ''))) continue;
    const pathname = '/' + name.split('/').map(encodeURIComponent).join('/').replace(/(^|\/)index\.html?$/i, '$1');
    const loc = origin + pathname;
    const canonical = tags.find(tag => (tag.rel || '').toLowerCase().split(/\s+/).includes('canonical'))?.href;
    if (canonical && new URL(canonical, loc).href !== loc) continue;
    // Hash routes and directory cards are not separate HTTP documents.
    // Git content dates survive cloning and do not change on every rebuild.
    const inputs = name === 'index.html'
      ? ['index.html', 'src', 'public', ':(exclude)public/sitemap.xml', ':(exclude)public/robots.txt']
      : ['public/' + name];
    const modified = execFileSync('git', ['log', '-1', '--format=%cI', '--', ...inputs], {cwd: sourceDir, encoding: 'utf8'}).trim();
    if (!modified) throw new Error(`No Git content date for ${name}; track its source before building.`);
    const lastmod = new Date(modified).toISOString();
    entries.push(`  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`);
  }
  if (!entries.length) throw new Error('No crawlable HTML documents found.');
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + entries.join('\n') + '\n</urlset>\n';
}

export function writeSitemap(siteDir = path.join(defaultSourceDir, 'dist')) {
  const xml = generateSitemap({siteDir});
  fs.writeFileSync(path.join(siteDir, 'sitemap.xml'), xml);
  fs.writeFileSync(path.join(defaultSourceDir, 'public', 'sitemap.xml'), xml);
  console.log(`SITEMAP_OK: ${(xml.match(/<url>/g) || []).length} crawlable URL(s)`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) writeSitemap();
