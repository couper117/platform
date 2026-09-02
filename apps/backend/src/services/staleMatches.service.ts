/**
 * Closing matches that were left live.
 *
 * The rules live in staleMatches.logic.ts; this composes them with the database
 * and the realtime channels. A match is ended the way a reporter would end it —
 * the clock moves to FULL_TIME, a FULLTIME event is logged, the fixture becomes
 * COMPLETED — so the result is indistinguishable from a properly finished match
 * except for the note in the activity log saying who ended it and why.
 */

const prisma = require('../config/db');
const { assessLiveState } = require('./staleMatches.logic');
const { transition } = require('./matchClock.logic');
const { recomputeScore } = require('./matchEvents.service');
const { completeFixture } = require('./matchCompletion.service');
const logActivity = require('../utils/activityLogger');

/** Live states that could plausibly be abandoned, with their fixture. */
const candidates = async () =>
  prisma.liveMatchState.findMany({
    where: {
      period: { in: ['FIRST_HALF', 'HALF_TIME', 'SECOND_HALF'] },
      fixture: { status: 'LIVE' },
    },
    include: { fixture: { select: { id: true, leagueId: true, homeTeamId: true, awayTeamId: true } } },
  });

/**
 * Find and close abandoned matches.
 *
 * `dryRun` reports what would be closed without touching anything, which is how
 * this should be run the first time against real data — ending a match is
 * visible to the public, and a rule that misfires is worse than one that waits.
 */
const endStalledMatches = async ({ dryRun = false, now = new Date() } = {}) => {
  const rows = await candidates();
  const closed = [];

  for (const state of rows) {
    const verdict = assessLiveState(state, now);
    if (!verdict.stale) continue;

    closed.push({ fixtureId: state.fixtureId, reason: verdict.reason, minutesOver: verdict.minutesOver });
    if (dryRun) continue;

    const end = transition('fulltime', now);

    // The score is recounted from the events rather than trusted, because this
    // is the moment it stops being provisional and becomes the result.
    const score = await recomputeScore(state.fixtureId);

    await prisma.$transaction([
      prisma.liveMatchState.update({
        where: { fixtureId: state.fixtureId },
        data: {
          period: end.period,
          periodStartedAt: end.periodStartedAt,
          periodBaseMinute: end.periodBaseMinute,
          addedMinutes: end.addedMinutes,
          minute: end.minute,
          status: 'ended',
          lastEvent: 'Full time',
        },
      }),
      prisma.fixture.update({
        where: { id: state.fixtureId },
        data: { status: 'COMPLETED' },
      }),
      prisma.matchEvent.create({
        data: {
          fixtureId: state.fixtureId,
          eventType: 'FULLTIME',
          minute: end.minute,
          // Says plainly that nobody pressed the button, so the feed is not
          // misread as a reporter having ended it.
          description: `Full time (recorded automatically — ${verdict.reason})`,
        },
      }),
    ]);

    // Everything a reporter pressing full time would have triggered.
    //
    // Marking the fixture COMPLETED is only part of finishing a match: the
    // league table has to take the result in, and a one-match ban is served by
    // a match being played, so the bans of both squads advance. Ending the
    // fixture without these would leave a completed match missing from the
    // standings and a suspended player banned a match longer than they were
    // sentenced to.
    // The same finish as a reporter pressing full time — table, bans and the
    // people following. completeFixture never throws; it reports instead.
    const finished = await completeFixture(state.fixtureId, { recount: false });
    if (finished.errors.length) {
      console.log(`Auto-end follow-up incomplete for fixture ${state.fixtureId}: ${finished.errors.join('; ')}`);
    }

    await logActivity({
      action: 'Auto-ended Match',
      detail: `Fixture ${state.fixtureId} ${verdict.reason}. Final score ${score?.home ?? '?'}-${score?.away ?? '?'}.`,
      module: 'fixtures',
    });

    // Tell anyone watching, so a public page that is open does not sit on a
    // clock that has stopped meaning anything.
    try {
      const { emitMatchUpdate } = require('./realtime.service');
      emitMatchUpdate?.(state.fixtureId, {
        fixtureId: state.fixtureId,
        status: 'COMPLETED',
        homeScore: score?.home,
        awayScore: score?.away,
      });
    } catch {
      /* realtime is best-effort; the database is the record. */
    }
  }

  return { checked: rows.length, closed };
};

module.exports = { endStalledMatches, candidates };
