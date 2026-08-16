#!/usr/bin/env node
/**
 * Demo ↔ real drift guard.
 *
 * The standalone pitch demo (demo/app) mirrors a slice of the real app
 * (apps/frontend). Some of that mirror is a genuine shared source of truth —
 * design tokens, the Tailwind config, pure utilities — and if those silently
 * diverge, the demo stops representing the product. This check fails the build
 * when a "synced" file drifts, and warns (without failing) on files that are
 * allowed to differ for now.
 *
 * Run: `npm run check:drift`
 */
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const REAL = join(root, 'apps', 'frontend');
const DEMO = join(root, 'demo', 'app');

// MUST stay byte-identical. Divergence here is a real bug (design system / shared
// pure logic drifting between the two apps), so it fails the build.
const SYNCED = [
  'src/styles/tokens.css',
  'src/index.css',
  'tailwind.config.js',
  'src/utils/responsiveImage.js',
  'src/config/clubColors.js',
];

// SHOULD track each other but are already out of sync — reported as a warning so
// the divergence is visible, without blocking. Reconcile over time, then promote
// each into SYNCED above.
const WATCH = [
  'src/i18n/locales/en.json',
  'src/i18n/locales/rw.json',
  'src/i18n/locales/fr.json',
  'src/config/sportThemes.ts',
];

const hash = (p) => (existsSync(p) ? createHash('sha1').update(readFileSync(p)).digest('hex') : null);

const compare = (rel) => {
  const r = hash(join(REAL, rel));
  const d = hash(join(DEMO, rel));
  return { rel, identical: r != null && r === d, missing: r == null || d == null };
};

const mark = (c) => (c.missing ? '· only one side' : c.identical ? '✓' : '✗ DIFFERS');

console.log('Demo ↔ real drift check\n');
console.log('Must stay in sync (apps/frontend vs demo/app):');
for (const rel of SYNCED) {
  const c = compare(rel);
  console.log(`  ${mark(c).padEnd(15)} ${rel}`);
}

const warnings = WATCH.map(compare).filter((c) => !c.identical);
if (warnings.length) {
  console.log('\nWatch (drift allowed for now, reconcile over time):');
  for (const c of warnings) console.log(`  ${mark(c).padEnd(15)} ${c.rel}`);
}

const failures = SYNCED.map(compare).filter((c) => !c.identical);
if (failures.length) {
  console.error(`\n✗ ${failures.length} synced file(s) drifted between apps/frontend and demo/app:`);
  for (const c of failures) console.error(`   - ${c.rel}${c.missing ? ' (present in only one app)' : ''}`);
  console.error(
    '\nReconcile them (copy the canonical version to the other app). If the change\n' +
      'is intentional and both apps should keep separate copies, remove the file\n' +
      'from SYNCED in scripts/check-demo-drift.mjs.'
  );
  process.exit(1);
}

console.log(
  `\n✓ All ${SYNCED.length} synced files match.` +
    (warnings.length ? ` (${warnings.length} watch file(s) have drifted — see above.)` : '')
);
