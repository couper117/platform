/**
 * Minimal RFC 4180 CSV parser — no dependencies, no streaming.
 *
 * The bulk-import feature previously split on commas in the browser, which
 * corrupted any row containing a quoted comma ("Groupe Scolaire Officiel, Butare"
 * became two cells and shifted every later column). This handles the real format:
 * quoted fields, embedded commas/newlines, doubled "" escapes, CR/LF/CRLF line
 * endings and a UTF-8 BOM.
 *
 * Pure and IO-free so it can be unit-tested on its own (test/unit/csv.test.ts).
 */

// Excel writes a UTF-8 BOM; left in place it becomes part of the first header
// name and every lookup of that column silently misses.
const stripBom = (text: string) => (text.charCodeAt(0) === 0xfeff ? text.slice(1) : text);

// Split raw text into rows of cells, tracking each row's 1-based line number so
// the import report can point an admin at the exact line in their file.
const parseRows = (text: string) => {
  const rows: { line: number; cells: string[] }[] = [];
  let cells: string[] = [];
  let field = '';
  let inQuotes = false;
  let line = 1;
  let rowLine = 1;
  let i = 0;

  const endField = () => { cells.push(field); field = ''; };
  const endRow = () => { endField(); rows.push({ line: rowLine, cells }); cells = []; rowLine = line; };

  while (i < text.length) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; } // escaped quote
        inQuotes = false; i += 1; continue;
      }
      if (c === '\n') line += 1; // newlines inside quotes stay part of the value
      field += c; i += 1; continue;
    }

    if (c === '"' && field === '') { inQuotes = true; i += 1; continue; }
    if (c === ',') { endField(); i += 1; continue; }

    if (c === '\r' || c === '\n') {
      if (c === '\r' && text[i + 1] === '\n') i += 1; // CRLF counts once
      line += 1;
      endRow();
      i += 1;
      continue;
    }

    field += c;
    i += 1;
  }

  if (inQuotes) {
    throw new Error(`Unterminated quoted field starting near line ${rowLine} — check for a stray " in the file.`);
  }
  // Trailing row with no final newline. A file that ends in a newline leaves both
  // empty, so this adds no phantom row.
  if (field !== '' || cells.length > 0) endRow();

  return rows;
};

const isBlank = (row: { cells: string[] }) => row.cells.every((c) => c.trim() === '');

const isComment = (row: { cells: string[] }) => row.cells[0]?.trimStart().startsWith('#');

/**
 * Read the `# key: value` block a generated form carries above its headings.
 *
 * Only the leading block counts — a `#` further down the file is left alone, so a
 * value that happens to start with one is never mistaken for metadata.
 */
const parseMetaBlock = (rows: { cells: string[] }[]) => {
  const meta: Record<string, string> = {};
  let i = 0;
  for (; i < rows.length && isComment(rows[i]); i += 1) {
    // Re-join the cells: an unquoted value containing a comma was split earlier.
    const line = rows[i].cells.join(',').trimStart().replace(/^#+\s?/, '');
    const at = line.indexOf(':');
    if (at === -1) continue; // a prose instruction line, not a key
    const key = line.slice(0, at).trim();
    const value = line.slice(at + 1).trim();
    if (key && !(key in meta)) meta[key] = value;
  }
  return { meta, consumed: i };
};

/**
 * Parse CSV text into objects keyed by header name.
 *
 * Every returned row carries a non-enumerable-ish `__line` (the line number in the
 * source file) so per-row errors can be reported against what the admin actually
 * sees in their spreadsheet, not a re-indexed array position.
 *
 * A leading `# key: value` block — the header a generated roster form carries, naming
 * the school and team the rows belong to — is returned as `meta` and skipped.
 */
const parseCsv = (text: string) => {
  if (typeof text !== 'string' || text.trim() === '') {
    throw new Error('The file is empty.');
  }

  const all = parseRows(stripBom(text)).filter((r) => !isBlank(r));
  if (all.length === 0) throw new Error('The file is empty.');

  const { meta, consumed } = parseMetaBlock(all);
  const rows = all.slice(consumed);
  if (rows.length === 0) throw new Error('The file is empty.');

  const headers = rows[0].cells.map((h) => h.trim());
  if (headers.every((h) => h === '')) throw new Error('The first line must be a header row.');

  const dupes = headers.filter((h, idx) => h !== '' && headers.indexOf(h) !== idx);
  if (dupes.length) {
    throw new Error(`Duplicate column heading(s): ${[...new Set(dupes)].join(', ')}.`);
  }

  const data = rows.slice(1).map((row) => {
    const obj: any = { __line: row.line };
    headers.forEach((h, idx) => {
      if (h === '') return; // unnamed column — ignore rather than key on ''
      obj[h] = (row.cells[idx] ?? '').trim();
    });
    return obj;
  });

  return { headers, rows: data, meta };
};

module.exports = { parseCsv, parseRows, stripBom };
