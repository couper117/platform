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

/**
 * What each scoring event is worth.
 *
 * THE SCORE WAS A COUNT OF EVENTS, which is only correct in a sport where every
 * score is worth one. Basketball has three values and rugby four, so a game
 * reported honestly still finished with the wrong number on it — a 58-61
 * basketball match came out 24-27, because the arithmetic counted baskets.
 *
 * The principle is unchanged: recount from the events that remain, never adjust
 * a running total. It is now a weighted sum rather than a length.
 *
 * Volleyball is scored in SETS on this platform (`homeScore` is sets won, which
 * is what the fixtures actually store), so SET_WON is the scoring event and a
 * rally point is deliberately not one — logging points would produce a number
 * that is neither the set score nor the point score.
 */
const EVENT_POINTS = {
  // Football, handball: one apiece.
  GOAL: 1,
  PENALTY: 1,
  OWN_GOAL: 1,
  SEVEN_METRE: 1,
  // Basketball.
  FREE_THROW: 1,
  TWO_POINTER: 2,
  DUNK: 2,
  THREE_POINTER: 3,
  // Volleyball, by the set.
  SET_WON: 1,
  // Rugby.
  CONVERSION: 2,
  PENALTY_KICK: 3,
  DROP_GOAL: 3,
  TRY: 5,
};

/**
 * The event types that move the score.
 *
 * Derived from the weights rather than listed again, so a value can never be
 * added to one and forgotten in the other — which is exactly how a scoring event
 * ends up silently worth nothing.
 */
const GOAL_TYPES = Object.keys(EVENT_POINTS);

/** An own goal is the only event credited to the side that did not commit it. */
const isCreditedToOpponent = (eventType: string) => eventType === 'OWN_GOAL';

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
    const forHome = isCreditedToOpponent(g.eventType)
      ? g.teamId != f.homeTeamId
      : g.teamId == f.homeTeamId;
    const points = EVENT_POINTS[g.eventType] ?? 1;
    if (forHome) home += points; else away += points;
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
 * Recount what a player has scored across the league, from the events that remain.
 *
 * An own goal is deliberately excluded: it changes the score but is not credited
 * to the scorer. If nothing is left, their row is removed rather than left at
 * zero cluttering the table.
 *
 * IT COUNTS POINTS, NOT EVENTS. `TopScorer.goals` is a football name for "what
 * this player has put on the board", and counting rows made a basketball player
 * with eight three-pointers rank below one with nine free throws. The same
 * weights the score uses apply here, so the two can never disagree about what a
 * player contributed.
 */
const recomputeTopScorer = async (playerId: number, leagueId: number) => {
  if (!playerId || !leagueId) return null;

  const scored = await prisma.matchEvent.findMany({
    where: {
      playerId,
      // Every scoring type except the own goal, which belongs to nobody.
      eventType: { in: GOAL_TYPES.filter((t) => !isCreditedToOpponent(t)) },
      fixture: { leagueId },
    },
    select: { eventType: true },
  });
  const goals = scored.reduce((sum, e) => sum + (EVENT_POINTS[e.eventType] ?? 1), 0);

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
  EVENT_POINTS,
  GOAL_TYPES,
  CLOCK_EVENTS,
  recomputeScore,
  recomputeTopScorer,
  reverseCardSuspension,
  deleteEventAndRecompute,
};
