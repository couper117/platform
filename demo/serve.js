/**
 * Zero-dependency static server for the RwaSport showcase demo.
 *
 * Serves the pre-built static site in ./dist and falls back to index.html for
 * unknown paths so the single-page app's client-side routes (deep links,
 * refreshes) keep working. No npm install required — just Node.js.
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
