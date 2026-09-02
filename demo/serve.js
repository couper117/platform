/**
 * Zero-dependency static server for the RwaSport showcase demo.
 *
 * Serves the pre-built static site in ./dist. No npm install required — just Node.
 *
 * The demo itself does not need this server: it routes on the hash, so every URL
 * the browser requests is just /index.html and any static host will do. The
 * index.html fallback below is kept anyway — it costs nothing and makes this
 * usable for the real app's path-routed build too.
 *
 *   node serve.js            → http://localhost:4173
 *   node serve.js 8080       → http://localhost:8080
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.argv[2]) || 4173;
const ROOT = path.join(__dirname, 'dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
};

if (!fs.existsSync(path.join(ROOT, 'index.html'))) {
  console.error('\n  ✗ dist/index.html not found. Did you copy the built site into ./dist?\n');
  process.exit(1);
}

const send = (res, status, body, type) => {
  res.writeHead(status, { 'Content-Type': type || 'text/plain; charset=utf-8' });
  res.end(body);
};

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';

  // Resolve and guard against path traversal outside ROOT.
  const filePath = path.normalize(path.join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT)) return send(res, 403, 'Forbidden');

  const ext = path.extname(filePath).toLowerCase();

  fs.readFile(filePath, (err, data) => {
    if (!err) {
      return send(res, 200, data, MIME[ext] || 'application/octet-stream');
    }

    // A missing asset must 404, not fall through to the shell. Returning
    // index.html for a stale /assets/*.js URL (e.g. a cached service worker
    // asking for a hash from a previous build) hands the browser HTML where it
    // expects a module, which fails silently as a blank page.
    if (ext && ext !== '.html') return send(res, 404, 'Not found');

    // SPA fallback: serve index.html for client-side routes only.
    fs.readFile(path.join(ROOT, 'index.html'), (e2, html) => {
      if (e2) return send(res, 404, 'Not found');
      send(res, 200, html, MIME['.html']);
    });
  });
});

server.listen(PORT, () => {
  console.log(`\n  🏆  RwaSport demo running at  http://localhost:${PORT}\n`);
  console.log('  Press Ctrl+C to stop.\n');
});
