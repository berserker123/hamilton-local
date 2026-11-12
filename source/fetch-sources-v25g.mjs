import fs from 'node:fs';
import crypto from 'node:crypto';
const sources = JSON.parse(fs.readFileSync('src/tool-sources.json', 'utf8'));
const out = '../out/sources-v25g';
fs.mkdirSync(out, { recursive: true });
const wanted = process.argv.slice(2);
const selected = wanted.length ? sources.filter(s => wanted.includes(s.id)) : sources;
const results = await Promise.all(selected.map(async source => {
  try {
    // Jina fetches the original official page; preserves its URL and original text.
    const response = await fetch('https://r.jina.ai/' + source.url, { signal: AbortSignal.timeout(55000) });
    const body = await response.text();
    const file = `${source.id}.txt`;
    fs.writeFileSync(`${out}/${file}`, body);
    const valid = response.ok && body.length > 800 && !/Title: (Access Denied|Request Rejected|Just a moment)/i.test(body) && body.includes('Markdown Content:');
    const result = { ...source, checked: '2026-11-12', method: 'official page fetched through Jina text proxy', httpStatus: response.status, valid, file, bytes: body.length, sha256: crypto.createHash('sha256').update(body).digest('hex') };
    console.log(source.id, response.status, body.length, valid ? 'OK' : 'REVIEW');
    return result;
  } catch (e) { console.log(source.id, e.message); return { ...source, valid:false, error:e.message }; }
}));
const indexPath = `${out}/fetch-index.json`;
const old = fs.existsSync(indexPath) ? JSON.parse(fs.readFileSync(indexPath, 'utf8')) : [];
fs.writeFileSync(indexPath, JSON.stringify([...old.filter(s => !results.some(r => r.id === s.id)), ...results], null, 2));
