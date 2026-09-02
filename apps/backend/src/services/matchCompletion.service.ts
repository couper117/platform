/**
 * Finishing a match, in one place.
 *
 * A fixture can end three ways — a reporter pressing full time on the console, an
 * administrator saving a result, or the stalled-match sweep closing one nobody
 * ended — and each had grown its own idea of what "finished" means. Saving a
 * result recalculated the table and advanced suspensions; the console's full-time
 * button only changed the status, so a match reported live never reached the
 * standings and a one-match ban was never served. The sweep did neither until it
 * was pointed at this.
 *
 * Finishing a match means all of it: the score settled from the events, the table
 * brought up to date, bans advanced, and the people following told.
 */

const prisma = require('../config/db');
const { recomputeScore } = require('./matchEvents.service');
const { recalcStandings } = require('./standings.service');
const { serveSuspensions } = require('./discipline.service');
const { notifyResult } = require('./notifications.service');

/**
 * Everything that must happen once a fixture is over.
 *
 * `recount` re-derives the score from the logged events — right when a reporter
 * ends a live match, wrong when an administrator has just typed a final score by
 * hand, which is why the caller decides.
 *
 * Never throws: the match is already over, and a failure to update the table must
 * not leave it un-ended. What did and did not happen is returned instead.
 */
const completeFixture = async (fixtureId, { recount = true, notify = true } = {}) => {
  const done = { score: null, standings: false, suspensions: false, notified: 0, errors: [] };

  const fixture = await prisma.fixture.findUnique({
    where: { id: Number(fixtureId) },
    include: { homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } },
  });
  if (!fixture) return { ...done, errors: ['fixture not found'] };

  if (recount) {
    // Only when there is something to recount from.
    //
    // recomputeScore() derives the score from goal events, which is right for a
    // match somebody reported — and destructive for one whose score arrived any
    // other way. A fixture with a stored 1-1 and no logged goals is not a 0-0; it
    // is a result that was entered rather than reported, and recounting it would
    // quietly erase the scoreline.
    const goals = await prisma.matchEvent.count({
      where: { fixtureId: fixture.id, eventType: { in: ['GOAL', 'PENALTY', 'OWN_GOAL'] } },
    });
    if (goals > 0) {
      try {
        done.score = await recomputeScore(fixture.id, fixture);
      } catch (e) { done.errors.push(`score: ${e.message}`); }
    } else {
      done.score = { home: fixture.homeScore ?? 0, away: fixture.awayScore ?? 0, recounted: false };
    }
  }

  try {
    await recalcStandings(fixture.leagueId);
    done.standings = true;
  } catch (e) { done.errors.push(`standings: ${e.message}`); }

  try {
    await serveSuspensions(fixture);
    done.suspensions = true;
  } catch (e) { done.errors.push(`suspensions: ${e.message}`); }

  if (notify) {
    try {
      // Re-read so the announced score is the settled one, not the one the
      // fixture carried before the recount above.
      const settled = await prisma.fixture.findUnique({
        where: { id: fixture.id },
        include: { homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } },
      });
      const { sent } = await notifyResult(settled || fixture);
      done.notified = sent;
    } catch (e) { done.errors.push(`notify: ${e.message}`); }
  }

  return done;
};

module.exports = { completeFixture };
