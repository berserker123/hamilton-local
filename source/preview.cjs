const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, 'dist');
const port = Number(process.env.PORT) || 4179;
const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.md': 'text/plain; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8', '.json': 'application/json; charset=utf-8',
};
function fileFor(urlPath) {
  const name = decodeURIComponent(urlPath);
  const rel = name === '/' ? '/index.html' : name;
  const direct = path.resolve(root, '.' + rel);
  if (!direct.startsWith(root + path.sep) && direct !== root) return null;
  if (fs.existsSync(direct) && fs.statSync(direct).isFile()) return direct;
  const index = path.resolve(root, '.' + (rel.endsWith('/') ? rel : rel + '/') + 'index.html');
  if (index.startsWith(root + path.sep) && fs.existsSync(index)) return index;
  return null;
}
http.createServer((req, res) => {
  let name;
  try { name = new URL(req.url, 'http://localhost').pathname; } catch { res.writeHead(400).end(); return; }
  const file = fileFor(name);
  const send = (status, bodyPath) => {
    fs.readFile(bodyPath, (err, data) => {
      if (err) { res.writeHead(500).end(); return; }
      res.setHeader('Content-Type', mime[path.extname(bodyPath)] || 'application/octet-stream');
      res.writeHead(status);
      res.end(data);
    });
  };
  if (file) { send(200, file); return; }
  const missing = path.join(root, '404.html');
  if (fs.existsSync(missing)) { send(404, missing); return; }
  res.writeHead(404).end('Not found');
}).listen(port, '127.0.0.1', () => console.log('Preview: http://127.0.0.1:' + port + ' (loopback only)'));
