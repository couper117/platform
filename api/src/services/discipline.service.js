const prisma = require('../config/db');
const { getRules } = require('./eligibility.service');

// Record disciplinary consequences of a card. Straight red → N-match ban.
// Every Nth yellow accumulated in the same league → an automatic 1-match ban.
const handleCardEvent = async ({ fixtureId, leagueId, playerId, eventType }) => {
  if (!playerId) return null;
  const rules = await getRules();

  if (eventType === 'RED_CARD') {
    return prisma.suspension.create({
      data: {
        playerId,
        reason: 'RED_CARD',
        matches: rules['rules.redBanMatches'] || 1,
        originFixtureId: fixtureId,
        note: 'Straight red card',
      },
    });
  }

  if (eventType === 'YELLOW_CARD') {
    const threshold = rules['rules.yellowAccumBan'];
    if (threshold > 0) {
      const yellows = await prisma.matchEvent.count({
        where: { playerId, eventType: 'YELLOW_CARD', fixture: { leagueId } },
      });
      if (yellows > 0 && yellows % threshold === 0) {
        return prisma.suspension.create({
          data: {
            playerId,
            reason: 'YELLOW_ACCUMULATION',
            matches: 1,
            originFixtureId: fixtureId,
            note: `${yellows} yellow cards accumulated`,
          },
        });
      }
    }
  }
  return null;
};

// When a fixture is completed, advance every active ban for players of the two
// teams (except one issued in this very fixture) and clear the ones fully served.
const serveSuspensions = async (fixture) => {
  const players = await prisma.player.findMany({
    where: { teamId: { in: [fixture.homeTeamId, fixture.awayTeamId] } },
    select: { id: true },
  });
  const pids = players.map((p) => p.id);
  if (!pids.length) return;

  const active = await prisma.suspension.findMany({
    where: { playerId: { in: pids }, active: true, originFixtureId: { not: fixture.id } },
  });
  for (const s of active) {
    const served = s.matchesServed + 1;
    await prisma.suspension.update({
      where: { id: s.id },
      data: { matchesServed: served, active: served < s.matches },
    });
  }
};

// Is the player currently serving a ban?
const isPlayerSuspended = async (playerId) =>
  (await prisma.suspension.count({ where: { playerId, active: true } })) > 0;

module.exports = { handleCardEvent, serveSuspensions, isPlayerSuspended };
