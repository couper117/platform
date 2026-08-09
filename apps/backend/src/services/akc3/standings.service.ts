const prisma = require('../../config/db');

const recalcAkcStandings = async (competitionId) => {
  try {
    const fixtures = await prisma.akcFixture.findMany({
      where: { competitionId, status: 'COMPLETED' },
    });

    const stats = new Map();

    for (const f of fixtures) {
      for (const tid of [f.homeTeamId, f.awayTeamId]) {
        if (!stats.has(tid)) {
          stats.set(tid, { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 });
        }
      }

      const h = stats.get(f.homeTeamId);
      const a = stats.get(f.awayTeamId);
      const hs = f.homeScore || 0;
      const as = f.awayScore || 0;

      h.played++; a.played++;
      h.gf += hs; h.ga += as;
      a.gf += as; a.ga += hs;

      if (hs > as) {
        h.won++; h.points += 3; a.lost++;
      } else if (hs < as) {
        a.won++; a.points += 3; h.lost++;
      } else {
        h.drawn++; h.points += 1; a.drawn++; a.points += 1;
      }
    }

    await prisma.$transaction(
      Array.from(stats.entries()).map(([teamId, s]) =>
        prisma.akcStanding.upsert({
          where: { competitionId_teamId: { competitionId, teamId } },
          create: {
            competitionId,
            teamId,
            played: s.played,
            won: s.won,
            drawn: s.drawn,
            lost: s.lost,
            gf: s.gf,
            ga: s.ga,
            points: s.points,
          },
          update: {
            played: s.played,
            won: s.won,
            drawn: s.drawn,
            lost: s.lost,
            gf: s.gf,
            ga: s.ga,
            points: s.points,
          },
        })
      )
    );
  } catch (error) {
    console.error(`Failed to recalc AKC standings for competition ${competitionId}:`, error);
  }
};

module.exports = { recalcAkcStandings };
