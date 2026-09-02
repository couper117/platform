#!/usr/bin/env node
/**
 * Check a deployment's environment before it is deployed.
 *
 * Most of what goes wrong hosting this is a missing or wrong environment
 * variable, and every one of those failures looks like something else once it is
 * live: an offshore database returns 503 on every route, a macOS Prisma client
 * fails on the first query as though the database were down, and
 * STORAGE_DRIVER=local quietly loses every upload without erroring once.
 *
 *   node scripts/preflight-deploy.mjs                  # checks apps/backend/.env
 *   vercel env pull .env.production --environment=production
 *   node scripts/preflight-deploy.mjs .env.production
 *
 * Exit code 1 if anything would stop the deployment serving.
 */

import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const ROOT = resolve(new URL('..', import.meta.url).pathname);
const file = process.argv[2] || 'apps/backend/.env';
const path = resolve(ROOT, file);

if (!existsSync(path)) {
  console.error(`Cannot read ${file}. Pass the env file to check, or pull it:\n`
    + '  vercel env pull .env.production --environment=production');
  process.exit(1);
}

/** Parse without dotenv's side effect of mutating process.env. */
const env = {};
for (const line of readFileSync(path, 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}

const results = [];
const ok = (t, d) => results.push({ level: 'ok', t, d });
const warn = (t, d) => results.push({ level: 'warn', t, d });
const fail = (t, d) => results.push({ level: 'fail', t, d });

// ── the ones without which nothing runs ──
for (const key of ['DATABASE_URL', 'JWT_SECRET']) {
  if (!env[key]) fail(key, 'missing — the API will not boot');
}
if (env.JWT_SECRET && env.JWT_SECRET.length < 32) {
  fail('JWT_SECRET', `${env.JWT_SECRET.length} characters; at least 32 are required`);
} else if (env.JWT_SECRET) ok('JWT_SECRET', 'present and long enough');

if (!env.DIRECT_DATABASE_URL) {
  warn('DIRECT_DATABASE_URL', 'not set — prisma migrate cannot run through a transaction pooler');
} else if (env.DIRECT_DATABASE_URL === env.DATABASE_URL) {
  warn('DIRECT_DATABASE_URL', 'same as DATABASE_URL; on Supabase this should be the direct port 5432 connection');
} else ok('DIRECT_DATABASE_URL', 'distinct from the pooled URL');

// ── the one that decides whether it serves at all ──
try {
  const { assessResidency } = require(resolve(ROOT, 'apps/backend/src/services/dataResidency.service.ts'));
  const r = assessResidency({
    databaseUrl: env.DATABASE_URL,
    declared: env.DATA_RESIDENCY,
    certificate: env.NCSA_REGISTRATION_NUMBER,
    nodeEnv: 'production',
  });
  if (r.level === 'block') fail('DATA_RESIDENCY', r.messages.join(' '));
  else if (r.level === 'warn') warn('DATA_RESIDENCY', r.messages.join(' '));
  else ok('DATA_RESIDENCY', `${env.DATA_RESIDENCY || 'local database'} — permitted`);
} catch (e) {
  warn('DATA_RESIDENCY', `could not be assessed: ${e.message}`);
}

// ── the ones that fail silently rather than loudly ──
if (env.STORAGE_DRIVER === 'local') {
  fail('STORAGE_DRIVER', 'local writes to disk, and a serverless disk is discarded — every upload is lost. Use cloudinary, or host somewhere with persistent storage');
} else if (env.STORAGE_DRIVER === 'cloudinary') {
  const missing = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'].filter((k) => !env[k]);
  if (missing.length) fail('STORAGE_DRIVER', `cloudinary selected but ${missing.join(', ')} not set — uploads will fail`);
  else ok('STORAGE_DRIVER', 'cloudinary, fully configured');
} else warn('STORAGE_DRIVER', 'not set; defaults to cloudinary, which needs CLOUDINARY_* keys');

if (!env.PUSHER_KEY || !env.PUSHER_APP_ID) {
  warn('PUSHER_*', 'not set — live updates fall back to Server-Sent Events, which a serverless function cannot hold open. The live match page will stop updating on its own');
} else ok('PUSHER_*', 'configured — live updates will push');

if (!env.CRON_SECRET) {
  warn('CRON_SECRET', 'not set — the scheduled stalled-match sweep will refuse every invocation');
} else ok('CRON_SECRET', 'set');

if (!env.FRONTEND_URL) warn('FRONTEND_URL', 'not set — CORS will not allow the deployed web origin');
else ok('FRONTEND_URL', env.FRONTEND_URL);

// ── the binary that has to match the machine, not the developer ──
try {
  const schema = readFileSync(resolve(ROOT, 'apps/backend/prisma/schema.prisma'), 'utf8');
  if (/binaryTargets\s*=.*(rhel|linux)/.test(schema)) ok('Prisma engine', 'a Linux query engine is generated');
  else fail('Prisma engine', 'schema.prisma has no Linux binaryTarget; the client will fail on its first query in production');
} catch { /* checked above */ }

// ── report ──
const icon = { ok: '✓', warn: '!', fail: '✗' };
const order = { fail: 0, warn: 1, ok: 2 };
console.log(`\nPreflight — ${file}\n`);
for (const r of results.sort((a, b) => order[a.level] - order[b.level])) {
  console.log(`  ${icon[r.level]} ${r.t}${r.d ? `\n      ${r.d}` : ''}`);
}
const fails = results.filter((r) => r.level === 'fail').length;
const warns = results.filter((r) => r.level === 'warn').length;
console.log(`\n  ${fails} blocking, ${warns} worth knowing, ${results.length - fails - warns} fine\n`);
process.exit(fails ? 1 : 0);
