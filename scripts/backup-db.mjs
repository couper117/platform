#!/usr/bin/env node
/**
 * Logical backup of the Postgres database — the "all data lives in one DB" risk
 * mitigation. Writes a compressed custom-format dump you can restore anywhere
 * (Supabase, RDS, a local cluster) with pg_restore.
 *
 *   Backup:   node scripts/backup-db.mjs [outDir]      (default: ./backups)
 *   Restore:  pg_restore --clean --no-owner -d "$DATABASE_URL" <file.dump>
 *
 * Requires the `pg_dump` binary on PATH (ships with the PostgreSQL client).
 * Uses DIRECT_DATABASE_URL when set (a dump should not go through a pooler).
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const url = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;
if (!url) {
  console.error('Set DATABASE_URL (or DIRECT_DATABASE_URL) in the environment.');
  process.exit(1);
}

const outDir = process.argv[2] || 'backups';
mkdirSync(outDir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const file = join(outDir, `rnsp-${stamp}.dump`);

try {
  execFileSync(
    'pg_dump',
    ['--format=custom', '--no-owner', '--no-privileges', '--file', file, url],
    { stdio: 'inherit' }
  );
  console.log(`✓ backup written: ${file}`);
} catch (err) {
  console.error('Backup failed. Is pg_dump installed and on PATH?');
  console.error(err.message);
  process.exit(1);
}
