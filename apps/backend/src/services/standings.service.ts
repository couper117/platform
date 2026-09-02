const prisma = require('../config/db');
const { getRules } = require('./eligibility.service');
const { tallyStandings } = require('./standings.logic');

const recalcStandings = async (leagueId) => {
  try {
    const rules = await getRules();
    const PW = rules['rules.pointsWin'];
    const PD = rules['rules.pointsDraw'];
    const PL = rules['rules.pointsLoss'];

    // Include every registered team so winless / unplayed teams still appear.
    const leagueTeams = await prisma.leagueTeam.findMany({
      where: { leagueId },
      select: { teamId: true },
    });
    const fixtures = await prisma.fixture.findMany({
      where: { leagueId, status: 'COMPLETED' },
    });

    // Pure scoring maths (unit-tested in test/unit/standings.test.ts).
    const rows = tallyStandings(
      leagueTeams.map((lt) => lt.teamId),
      fixtures,
      { win: PW, draw: PD, loss: PL }
    );

    // Upsert standings in a transaction
    await prisma.$transaction(
      rows.map((s) =>
        prisma.standing.upsert({
          where: { leagueId_teamId: { leagueId, teamId: s.teamId } },
          create: {
            leagueId,
            teamId: s.teamId,
            played: s.played,
            won: s.won,
            drawn: s.drawn,
            lost: s.lost,
            goalsFor: s.goalsFor,
            goalsAgainst: s.goalsAgainst,
            points: s.points,
            form: s.results.slice(-5).join(''),
          },
          update: {
            played: s.played,
            won: s.won,
            drawn: s.drawn,
            lost: s.lost,
            goalsFor: s.goalsFor,
            goalsAgainst: s.goalsAgainst,
            points: s.points,
            form: s.results.slice(-5).join(''),
          },
        })
      )
    );

    // Drop rows for teams no longer in this competition.
    //
    // The upsert above can add and update but never remove, so a team withdrawn
    // from a league kept its place in the table indefinitely — still ranked,
    // still counted, with a points total nobody could change. A standings table
    // is the list of who is in the competition, so it has to be able to shrink.
    const teamIds = leagueTeams.map((lt) => lt.teamId);
    await prisma.standing.deleteMany({
      where: { leagueId, ...(teamIds.length ? { teamId: { notIn: teamIds } } : {}) },
    });
  } catch (error) {
    console.error(`Failed to recalculate standings for league ${leagueId}:`, error);
  }
};

module.exports = { recalcStandings };
