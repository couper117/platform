#!/usr/bin/env node
/**
 * Render a Markdown document in docs/ as a print-ready PDF.
 *
 *   node scripts/docs-to-pdf.mjs docs/DATA_PROTECTION.md
 *
 * The data-protection record is the document a regulator asks for, and it will be
 * printed, filed and cited — so it needs to exist on paper, not only as Markdown
 * in a repository. Generating it from the source file rather than keeping a
 * separate copy is the point: the PDF cannot drift from the document it states.
 *
 * Uses the Chromium that Playwright already installs for the browser tests, so it
 * adds no dependency. Handles the constructs these documents actually use —
 * headings, bold, italic, inline code, links, bullets, pipe tables, rules and
 * fenced code — rather than pulling in a Markdown library for a handful of files.
 */

import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { chromium } from 'playwright';

// Flags are filtered out of the positional arguments — otherwise `--keep-html`
// is read as the output filename and the PDF is written to a file called that.
const argv = process.argv.slice(2);
const flags = argv.filter((a) => a.startsWith('--'));
const [input, outArg] = argv.filter((a) => !a.startsWith('--'));

if (!input) {
  console.error('usage: node scripts/docs-to-pdf.mjs <file.md> [out.pdf] [--keep-html]');
  process.exit(1);
}
const output = outArg || input.replace(/\.md$/i, '.pdf');
const keepHtml = flags.includes('--keep-html');

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Inline spans. Code is lifted out first so its contents are never re-parsed —
 * asterisks inside backticks are a glob, not emphasis.
 */
function inline(text) {
  const codes = [];
  let t = text.replace(/`([^`\n]+)`/g, (_, c) => `${codes.push(c) - 1}`);
  t = esc(t);
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/(?<!\*)\*(?!\*)([^*\n]+)\*(?!\*)/g, '<em>$1</em>');
  return t.replace(/(\d+)/g, (_, i) => `<code>${esc(codes[Number(i)])}</code>`);
}

function toHtml(md) {
  const lines = md.split('\n');
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const ln = lines[i];

    if (ln.startsWith('```')) {
      i += 1;
      const buf = [];
      while (i < lines.length && !lines[i].startsWith('```')) buf.push(esc(lines[i++]));
      out.push(`<pre><code>${buf.join('\n')}</code></pre>`);
      i += 1;
      continue;
    }
    if (/^---+\s*$/.test(ln)) { out.push('<hr>'); i += 1; continue; }

    const h = ln.match(/^(#{1,6}) +(.*)$/);
    if (h) { out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); i += 1; continue; }

    if (ln.trimStart().startsWith('|')) {
      const rows = [];
      while (i < lines.length && lines[i].trimStart().startsWith('|')) rows.push(lines[i++].trim());
      const cells = rows.map((r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
      // The |---|---| separator row is layout, not data.
      const body = cells.filter((r) => !r.every((c) => /^:?-{2,}:?$/.test(c || '')));
      const [head, ...rest] = body;
      out.push(
        '<table><thead><tr>' + head.map((c) => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>'
        + rest.map((r) => '<tr>' + r.map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>').join('')
        + '</tbody></table>'
      );
      continue;
    }

    if (/^\s*[-*] +/.test(ln)) {
      const items = [];
      while (i < lines.length && /^\s*[-*] +/.test(lines[i])) {
        items.push(lines[i++].replace(/^\s*[-*] +/, ''));
        // A wrapped continuation line belongs to the item above it.
        while (i < lines.length && lines[i].startsWith('  ') && lines[i].trim() && !/^\s*[-*] +/.test(lines[i])) {
          items[items.length - 1] += ' ' + lines[i++].trim();
        }
      }
      out.push('<ul>' + items.map((x) => `<li>${inline(x)}</li>`).join('') + '</ul>');
      continue;
    }

    if (!ln.trim()) { i += 1; continue; }

    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,6} |\||```|---+\s*$|\s*[-*] )/.test(lines[i])) {
      para.push(lines[i++].trim());
    }
    out.push(`<p>${inline(para.join(' '))}</p>`);
  }
  return out.join('\n');
}

/**
 * Set to be read on paper: a measure that does not tire the eye, tables and code
 * that never split across a page, and a printed date so a copy in a drawer can be
 * checked against the current one.
 */
const CSS = `
@page { size: A4; margin: 20mm 18mm 18mm; }
body { font: 10.5pt/1.55 "Charter","Georgia","Times New Roman",serif; color:#1a1a1a; margin:0;
  -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.mast { border-bottom:2.5pt solid #0B6E3F; padding-bottom:8pt; margin-bottom:18pt; }
.mast .org { font:700 8pt/1 "Helvetica Neue",Arial,sans-serif; letter-spacing:.18em;
  text-transform:uppercase; color:#0B6E3F; }
.mast .meta { font:8pt/1.4 "Helvetica Neue",Arial,sans-serif; color:#666; margin-top:3pt; }
h1 { font:700 20pt/1.2 "Helvetica Neue",Arial,sans-serif; margin:0 0 4pt; letter-spacing:-.01em; }
h2 { font:700 12.5pt/1.3 "Helvetica Neue",Arial,sans-serif; margin:20pt 0 6pt; padding-top:8pt;
  border-top:.5pt solid #d8d8d8; break-after:avoid; page-break-after:avoid; }
h3 { font:700 10.5pt/1.35 "Helvetica Neue",Arial,sans-serif; margin:14pt 0 4pt;
  break-after:avoid; page-break-after:avoid; }
p { margin:0 0 7pt; orphans:3; widows:3; }
ul { margin:0 0 8pt; padding-left:15pt; } li { margin-bottom:3pt; }
a { color:#0B6E3F; text-decoration:none; border-bottom:.4pt solid #b9d6c6; }
code { font:9pt/1 "SF Mono","Menlo","Consolas",monospace; background:#f2f3f2; padding:.5pt 3pt; border-radius:2pt; }
pre { background:#f7f8f7; border-left:2.5pt solid #0B6E3F; padding:8pt 10pt; margin:0 0 10pt;
  break-inside:avoid; page-break-inside:avoid; }
pre code { background:none; padding:0; font-size:8.5pt; line-height:1.45; }
table { width:100%; border-collapse:collapse; margin:4pt 0 12pt; font-size:9pt;
  break-inside:avoid; page-break-inside:avoid; }
th { text-align:left; background:#0B6E3F; color:#fff; padding:5pt 7pt;
  font:700 8pt/1.3 "Helvetica Neue",Arial,sans-serif; letter-spacing:.04em; text-transform:uppercase; }
td { padding:5pt 7pt; border-bottom:.4pt solid #e2e2e2; vertical-align:top; }
tbody tr:nth-child(even) { background:#fafbfa; }
hr { border:0; border-top:.5pt solid #ddd; margin:16pt 0; }
`;

const md = readFileSync(input, 'utf8');
const title = (md.match(/^#\s+(.*)$/m) || [, basename(input)])[1];
const printed = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>${esc(title)} — RwaSport</title><style>${CSS}</style></head><body>
<div class="mast">
  <div class="org">RwaSport · Ministry of Sport, Rwanda</div>
  <div class="meta">Law N° 058/2021 of 13/10/2021 relating to the protection of personal data and privacy · Printed ${printed}</div>
</div>
${toHtml(md)}
</body></html>`;

const tmp = resolve(output.replace(/\.pdf$/i, '.tmp.html'));
writeFileSync(tmp, html, 'utf8');

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('file://' + tmp, { waitUntil: 'networkidle' });
await page.pdf({
  path: output, format: 'A4', printBackground: true,
  margin: { top: '20mm', bottom: '18mm', left: '18mm', right: '18mm' },
  displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate: `<div style="width:100%;font:8pt 'Helvetica Neue',Arial,sans-serif;color:#888;padding:0 18mm;display:flex;justify-content:space-between;">
    <span>${esc(title)}</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>`,
});
await browser.close();

// --keep-html leaves the intermediate file next to the PDF. Useful when a
// document renders wrongly and the question is whether the fault is in the
// conversion or the print styling.
if (keepHtml) {
  console.log(`${tmp} kept`);
} else {
  unlinkSync(tmp);
}

console.log(`${output} written`);
