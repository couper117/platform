const prisma = require('../config/db');

const recalcStandings = async (leagueId) => {
  try {
    // Get all completed fixtures for this league
    const fixtures = await prisma.fixture.findMany({
      where: { leagueId, status: 'COMPLETED' },
    });

    const stats = new Map();

    for (const f of fixtures) {
      for (const tid of [f.homeTeamId, f.awayTeamId]) {
        if (!stats.has(tid)) {
          stats.set(tid, { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, results: [] });
        }
      }

      const h = stats.get(f.homeTeamId);
      const a = stats.get(f.awayTeamId);
      const hs = f.homeScore || 0;
      const as = f.awayScore || 0;

      h.played++; a.played++;
      h.goalsFor += hs; h.goalsAgainst += as;
      a.goalsFor += as; a.goalsAgainst += hs;

      if (hs > as) {
        h.won++; h.points += 3; h.results.push('W');
        a.lost++; a.results.push('L');
      } else if (hs < as) {
        a.won++; a.points += 3; a.results.push('W');
        h.lost++; h.results.push('L');
      } else {
        h.drawn++; h.points += 1; h.results.push('D');
        a.drawn++; a.points += 1; a.results.push('D');
      }
    }