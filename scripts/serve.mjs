// Tiny dependency-free static server used by `npm run dev` and `npm run preview`.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.map': 'application/json', '.woff2': 'font/woff2' };
const RELOAD = '<script>new EventSource("/__reload").onmessage=()=>location.reload()</script>';

export function serve(dir, port, { live = false } = {}) {
  const clients = new Set();
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    if (live && url.pathname === '/__reload') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' });
      res.write('\n');
      clients.add(res);
      req.on('close', () => clients.delete(res));
      return;
    }
    let p;
    try { p = decodeURIComponent(url.pathname); } catch { res.writeHead(400); return res.end('Bad request'); }
    const file = path.resolve(dir, '.' + (p.endsWith('/') ? p + 'index.html' : p));
    if (file !== path.resolve(dir) && !file.startsWith(path.resolve(dir) + path.sep)) { res.writeHead(403); return res.end('Forbidden'); } // no path traversal
    fs.readFile(file, (err, buf) => {
      if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); } // missing assets must be loud, not silently rewritten
      const ext = path.extname(file);
      const hashed = /\/assets\/.+-[A-Za-z0-9]{8,}\.(js|css)$/.test(file);
      const headers = { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': live ? 'no-store' : hashed ? 'public, max-age=31536000, immutable' : 'no-cache' };
      res.writeHead(200, headers);
      res.end(live && ext === '.html' ? buf.toString().replace('</body>', RELOAD + '</body>') : buf);
    });
  });
  server.listen(port, () => console.log(`Serving ${path.relative(process.cwd(), dir) || '.'} at http://localhost:${port}`));
  return { server, reload: () => clients.forEach((c) => c.write('data: reload\n\n')) };
}
