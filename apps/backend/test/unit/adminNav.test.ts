/**
 * The admin navigation names capabilities. This checks they exist.
 *
 * apps/frontend/src/lib/adminAccess.ts gates each admin page on a capability
 * string. Nothing else would catch a typo or a rename there: an unknown
 * capability simply never matches, so the page quietly vanishes from every
 * sidebar — including the Super Admin's — and looks like a routing problem
 * rather than a one-character mistake.
 *
 * Reading the file as text is deliberate. The backend cannot import a frontend
 * ES module, and duplicating the list here to compare against would recreate
 * exactly the drift this whole capability layer exists to remove.
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { isKnown } = require('../../src/services/capabilities.rules');

const NAV = path.join(__dirname, '../../../frontend/src/lib/adminAccess.ts');

test('every capability named in the admin navigation exists', () => {
  const src = fs.readFileSync(NAV, 'utf8');
  const named = [...src.matchAll(/capability:\s*'([^']+)'/g)].map((m) => m[1]);

  assert.ok(named.length > 10, `expected the nav to name capabilities, found ${named.length}`);

  const unknown = [...new Set(named)].filter((c) => !isKnown(c) || c === '*');
  assert.deepEqual(unknown, [], 'admin nav names capabilities the server does not define');
});
