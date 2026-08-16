/**
 * Pure league-table tally — no database, no IO.
 *
 * Given the registered team ids, the COMPLETED fixtures, and the points config,
 * returns one row per team. Extracted from standings.service so the scoring
 * maths can be unit-tested in isolation (see test/unit/standings.test.ts).
 */

type Points = { win: number; draw: number; loss: number };

const tallyStandings = (teamIds: any[], fixtures: any[], points: Points) => {
  const { win, draw, loss } = points;

  const stats = new Map<any, any>();
  const ensure = (tid: any) => {
    if (!stats.has(tid)) {
      stats.set(tid, {
        teamId: tid,
        played: 0, won: 0, drawn: 0, lost: 0,
        goalsFor: 0, goalsAgainst: 0, points: 0,
        results: [] as string[],
      });
    }
  };

  // Register every league team first so winless / unplayed teams still appear.
  for (const tid of teamIds) ensure(tid);

  for (const f of fixtures) {
    ensure(f.homeTeamId);
    ensure(f.awayTeamId);

    const h = stats.get(f.homeTeamId);
    const a = stats.get(f.awayTeamId);
    const hs = f.homeScore || 0;
    const as = f.awayScore || 0;

    h.played++; a.played++;
    h.goalsFor += hs; h.goalsAgainst += as;
    a.goalsFor += as; a.goalsAgainst += hs;

    if (hs > as) {
      h.won++; h.points += win; h.results.push('W');
      a.lost++; a.points += loss; a.results.push('L');
    } else if (hs < as) {
      a.won++; a.points += win; a.results.push('W');
      h.lost++; h.points += loss; h.results.push('L');
    } else {
      h.drawn++; h.points += draw; h.results.push('D');
      a.drawn++; a.points += draw; a.results.push('D');
    }
  }

  return Array.from(stats.values());
};

module.exports = { tallyStandings };
