const app = require('./src/app');
const env = require('./src/config/env');
const { ensureRuleSettings } = require('./src/services/eligibility.service');
const { checkResidencyAtStartup } = require('./src/services/dataResidency.service');
const { prepareCalendar } = require('./src/services/umuganda.service');
const { endStalledMatches } = require('./src/services/staleMatches.service');

// Refuse to run a production deployment that stores personal data outside Rwanda
// without the NCSA certificate art. 50 requires. Runs before the port is bound.
checkResidencyAtStartup(env);

const PORT = env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 RNSP API running in ${env.NODE_ENV} mode on http://localhost:${PORT}`);
  // Seed configurable competition rules if missing (idempotent).
  ensureRuleSettings().catch((e) => console.log(`Rule seed skipped: ${e.message}`));
  // Prepare the Umuganda calendar a year ahead and reconcile the fixtures that
  // fall on it. Idempotent, never touches a date an administrator has
  // overridden, and never cancels a match.
  prepareCalendar()
    .then(({ created, flagged }) => {
      if (created.length || flagged) {
        console.log(`Umuganda calendar: ${created.length} date(s) added, ${flagged} fixture(s) flagged`);
      }
    })
    .catch((e) => console.log(`Umuganda calendar skipped: ${e.message}`));
});

/**
 * Close matches that were left live.
 *
 * A reporter who forgets to press full time leaves the match running for good —
 * it holds its place on the live-scores channel and the public page shows a
 * clock pinned at "90+15'". The rules are in services/staleMatches.logic.ts.
 *
 * Off unless AUTO_END_STALLED_MATCHES is set, deliberately. Ending a match is
 * publicly visible and hard to walk back, so it follows the same opt-in shape as
 * the retention purge, which needs --apply for the same reason. Turn it on in
 * production; check first with `npm run matches:end-stalled`, which reports
 * without changing anything.
 *
 * On a host where the API is not long-lived, run the script from a scheduler
 * instead — this timer needs a process that stays up.
 */
const SWEEP_MINUTES = 5;
if (env.AUTO_END_STALLED_MATCHES) {
  const sweep = () =>
    endStalledMatches()
      .then(({ closed }) => {
        for (const c of closed) console.log(`Auto-ended fixture ${c.fixtureId}: ${c.reason}`);
      })
      .catch((e) => console.log(`Stalled-match sweep skipped: ${e.message}`));

  const timer = setInterval(sweep, SWEEP_MINUTES * 60_000);
  // Never hold the process open for the sake of the timer.
  timer.unref?.();
  console.log(`Stalled-match sweep on, every ${SWEEP_MINUTES} minutes`);
} else {
  console.log('Stalled-match sweep off (set AUTO_END_STALLED_MATCHES=true to enable)');
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: any, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
