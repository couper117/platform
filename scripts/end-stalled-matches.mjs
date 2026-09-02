#!/usr/bin/env node
/**
 * Close matches that were left live.
 *
 * A reporter who forgets to press full time leaves the match running for good:
 * it keeps its place on the live-scores channel, the public page shows a clock
 * pinned at "90+15'", and the fixture never becomes a result. The clock has
 * detected this for a while — readClock() flags it `stalled` — but nothing ever
 * acted on the flag.
 *
 * The rules live in apps/backend/src/services/staleMatches.logic.ts so the
 * judgement is stated once and unit-tested; this script only runs it.
 *
 *   node scripts/end-stalled-matches.mjs            # show what would be closed
 *   node scripts/end-stalled-matches.mjs --apply    # close it
 *
 * Intended to run every few minutes. server.ts also runs it in-process on a
 * timer, which covers a long-running host; this script is for a platform where
 * the API is not long-lived, or for closing a backlog by hand.
 */

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { endStalledMatches } = require('../apps/backend/src/services/staleMatches.service.ts');

const apply = process.argv.includes('--apply');
const { checked, closed } = await endStalledMatches({ dryRun: !apply });

console.log(`${checked} live match${checked === 1 ? '' : 'es'} checked`);
if (!closed.length) {
  console.log('nothing to close');
} else {
  for (const c of closed) console.log(`  fixture ${c.fixtureId} — ${c.reason}`);
  console.log(apply ? `\nclosed ${closed.length}` : `\n${closed.length} would be closed — pass --apply to act`);
}
process.exit(0);
