#!/usr/bin/env node
/**
 * Delete personal data whose purpose has been served.
 *
 * Law N° 058/2021 art. 52: personal data is kept until the purpose of the
 * processing is fulfilled. Nothing in this platform expired on its own before
 * this existed — page-view rows carry a visitor's IP address and were kept
 * indefinitely, which is exactly what art. 52 forbids.
 *
 * The retention periods live in apps/backend/src/services/privacy.service.ts so
 * the schedule is stated once and this script only enforces it.
 *
 *   node scripts/purge-expired-data.mjs            # show what would be deleted
 *   node scripts/purge-expired-data.mjs --apply    # delete it
 *
 * Intended to run daily. Competition records — athletes and players — are
 * deliberately not touched: they belong to the seasons they were part of and are
 * removed through an erasure request (art. 23), not a timer.
 */

import { createRequire } from 'node:module';
import { PrismaClient } from '@prisma/client';

const require = createRequire(import.meta.url);
const { RETENTION_DAYS } = require('../apps/backend/src/services/privacy.service.ts');

const prisma = new PrismaClient();
const apply = process.argv.includes('--apply');

const cutoff = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

// Each rule names the model, the reason it expires, and the rows it covers.
const RULES = [
  {
    label: 'Page views (visitor tracking)',
    days: RETENTION_DAYS.visitorLogs,
    model: 'activityLog',
    where: (before) => ({ module: 'VISITOR_TRACKING', createdAt: { lt: before } }),
    note: 'Carries an IP address; only recent data is useful for audience figures.',
  },
  {
    label: 'Administrative audit log',
    days: RETENTION_DAYS.activityLogs,
    model: 'activityLog',
    where: (before) => ({ module: { not: 'VISITOR_TRACKING' }, createdAt: { lt: before } }),
    note: 'Evidence for disputes over a result or a registration.',
  },
  {
    label: 'Expired refresh tokens',
    days: RETENTION_DAYS.refreshTokens,
    model: 'refreshToken',
    where: (before) => ({ expiresAt: { lt: before } }),
    note: 'Serve no purpose once past expiry.',
  },
  {
    label: 'Handled contact messages',
    days: RETENTION_DAYS.contactMessages,
    model: 'contact',
    where: (before) => ({ createdAt: { lt: before } }),
    note: 'Enquiries kept only while they may still need follow-up.',
  },
  {
    label: 'Closed data-subject requests',
    days: RETENTION_DAYS.dataSubjectRequests,
    model: 'dataSubjectRequest',
    where: (before) => ({ closedAt: { not: null, lt: before } }),
    note: 'Kept as proof the request was honoured, then removed.',
  },
];

const run = async () => {
  console.log(`Retention purge — ${apply ? 'APPLYING' : 'dry run (pass --apply to delete)'}`);
  console.log('Law N° 058/2021 art. 52\n');

  let total = 0;

  for (const rule of RULES) {
    const before = cutoff(rule.days);
    const where = rule.where(before);

    let count;
    try {
      count = await prisma[rule.model].count({ where });
    } catch (error) {
      // A model that isn't in this deployment's schema shouldn't stop the rest.
      console.log(`  ${rule.label}: skipped (${error.message.split('\n')[0]})`);
      continue;
    }

    console.log(`  ${rule.label}`);
    console.log(`    keep ${rule.days} days · older than ${before.toISOString().slice(0, 10)} · ${count} row(s)`);
    console.log(`    ${rule.note}`);

    if (apply && count > 0) {
      const { count: deleted } = await prisma[rule.model].deleteMany({ where });
      console.log(`    deleted ${deleted}`);
    }
    total += count;
    console.log('');
  }

  console.log(apply ? `Done. ${total} row(s) removed.` : `Dry run. ${total} row(s) are past their retention period.`);
};

run()
  .catch((error) => {
    console.error('Purge failed:', error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
