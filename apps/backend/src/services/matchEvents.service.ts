/**
 * Deriving match state from its events.
 *
 * The score has always been computed from goal events rather than incremented,
 * which is the right call — but the recomputation only ever ran when an event was
 * *added*, so removing one left the stored score stale. Everything an event
 * touches is gathered here so adding and undoing go through the same path.
 *
 * The principle throughout: recompute from the events that remain, never adjust a
 * running total. A decrement is wrong the moment anything else has touched the
 * number; a recount cannot be.
 */

const prisma = require('../config/db');

const GOAL_TYPES = ['GOAL', 'PENALTY', 'OWN_GOAL'];

/** Period markers belong to the clock, not to the reporter's event list. */
const CLOCK_EVENTS = ['KICKOFF', 'HALFTIME', 'FULLTIME', 'EXTRA_TIME'];

/**
 * Recount the score from the fixture's goal events and store it.
 * An own goal counts for the opposing side, which is why this cannot be a
 * simple sum per team.
 */
const recomputeScore = async (fixtureId: number, fixture?: any) => {
  const f = fixture || (await prisma.fixture.findUnique({ where: { id: fixtureId } }));
  if (!f) return null;

  const goals = await prisma.matchEvent.findMany({
    where: { fixtureId, eventType: { in: GOAL_TYPES } },
  });

  let home = 0;
  let away = 0;
  for (const g of goals) {
    const forHome = g.eventType === 'OWN_GOAL'
      ? g.teamId != f.homeTeamId
      : g.teamId == f.homeTeamId;
    if (forHome) home += 1; else away += 1;
  }

  await prisma.fixture.update({ where: { id: fixtureId }, data: { homeScore: home, awayScore: away } });
  await prisma.liveMatchState.upsert({
    where: { fixtureId },
    update: { homeScore: home, awayScore: away },
    create: { fixtureId, homeScore: home, awayScore: away, status: 'live' },
  });

  return { home, away };
};

/**
 * Recount a player's league goals from the events that remain.
 *
 * An own goal is deliberately excluded: it changes the score but is not credited
 * to the scorer. If the player has no goals left, their row is removed rather
 * than left at zero cluttering the top-scorer table.
 */
const recomputeTopScorer = async (playerId: number, leagueId: number) => {
  if (!playerId || !leagueId) return null;

  const goals = await prisma.matchEvent.count({
    where: { playerId, eventType: { in: ['GOAL', 'PENALTY'] }, fixture: { leagueId } },
  });

  const existing = await prisma.topScorer.findUnique({ where: { playerId } });

  if (goals === 0) {
    if (existing) await prisma.topScorer.delete({ where: { playerId } });
    return { goals: 0 };
  }

  const player = await prisma.player.findUnique({ where: { id: playerId }, select: { teamId: true } });
  await prisma.topScorer.upsert({
    where: { playerId },
    update: { goals },
    create: { leagueId, playerId, teamId: player?.teamId ?? null, goals, assists: 0 },
  });
  return { goals };
};

/**
 * Undo the disciplinary consequence of a card that has been removed.
 *
 * A straight red always produced a suspension from this fixture, so that one goes.
 * A yellow only produced one if it completed an accumulation, so the count is
 * re-checked: the suspension is withdrawn only if the remaining yellows no longer
 * reach the threshold. A suspension that has already been partly served is left
 * alone — matches have been missed, and rewriting that is a decision for an
 * administrator, not a side effect of an undo.
 */
const reverseCardSuspension = async ({ fixtureId, playerId, eventType, leagueId }: any) => {
  if (!playerId || !['RED_CARD', 'YELLOW_CARD'].includes(eventType)) return null;

  const reason = eventType === 'RED_CARD' ? 'RED_CARD' : 'YELLOW_ACCUMULATION';
  const suspension = await prisma.suspension.findFirst({
    where: { playerId, originFixtureId: fixtureId, reason },
    orderBy: { id: 'desc' },
  });
  if (!suspension) return null;
  if (suspension.matchesServed > 0) return { kept: true, reason: 'already partly served' };

  if (eventType === 'YELLOW_CARD') {
    const { getRules } = require('./eligibility.service');
    const rules = await getRules().catch(() => ({}));
    const threshold = rules['rules.yellowAccumBan'] || 0;
    const remaining = await prisma.matchEvent.count({
      where: { playerId, eventType: 'YELLOW_CARD', fixture: { leagueId } },
    });
    // Still on a multiple of the threshold — the ban is still earned.
    if (threshold > 0 && remaining > 0 && remaining % threshold === 0) {
      return { kept: true, reason: 'accumulation still stands' };
    }
  }

  await prisma.suspension.delete({ where: { id: suspension.id } });
  return { removed: suspension.id };
};

/**
 * Remove one event and put back everything it changed.
 *
 * Returns { error } for a refusal the caller should surface, otherwise the new
 * score. Clock markers are refused: the clock owns them, and deleting one here
 * would leave the period and its timestamp disagreeing with the feed.
 */
const deleteEventAndRecompute = async (fixtureId: number, eventId: number) => {
  const event = await prisma.matchEvent.findUnique({ where: { id: eventId } });
  if (!event || event.fixtureId !== fixtureId) return { error: 'Event not found on this match.' };
  if (CLOCK_EVENTS.includes(event.eventType)) {
    return { error: `${event.eventType} is set by the match clock — use the clock controls instead.` };
  }

  const fixture = await prisma.fixture.findUnique({ where: { id: fixtureId } });

  await prisma.matchEvent.delete({ where: { id: eventId } });

  const score = await recomputeScore(fixtureId, fixture);

  if (event.playerId && GOAL_TYPES.includes(event.eventType)) {
    await recomputeTopScorer(event.playerId, fixture.leagueId);
  }
  const suspension = await reverseCardSuspension({
    fixtureId,
    playerId: event.playerId,
    eventType: event.eventType,
    leagueId: fixture.leagueId,
  });

  // The feed's newest remaining entry becomes the "last event" the live ticker shows.
  const latest = await prisma.matchEvent.findFirst({
    where: { fixtureId },
    orderBy: [{ minute: 'desc' }, { id: 'desc' }],
  });
  await prisma.liveMatchState.updateMany({
    where: { fixtureId },
    data: { lastEvent: latest ? (latest.description || latest.eventType) : null },
  });

  return { deleted: event, score, suspension };
};

module.exports = {
  GOAL_TYPES,
  CLOCK_EVENTS,
  recomputeScore,
  recomputeTopScorer,
  reverseCardSuspension,
  deleteEventAndRecompute,
};
