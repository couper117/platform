const prisma = require('../config/db');
const { sanitiseStats } = require('../config/playerStatSpec');

/**
 * A player's season and recent form, derived from what actually happened.
 *
 * WHY THIS EXISTS. `PlayerProfile` on the frontend has always been able to render
 * a season stat sheet and a recent-form list — the component drops any section
 * whose data is absent — but no endpoint ever produced them. So every player page
 * on the production API showed a name, a position and one line of nationality,
 * while the same component against the demo's mock data showed a full profile. The
 * gap was the API, not the UI.
 *
 * NOTHING HERE IS INVENTED. Appearances come from `Lineup` rows on fixtures that
 * have actually been played; goals and cards from `MatchEvent`; results from the
 * stored score. A statistic the schema cannot support is not returned at all —
 * there is no ASSIST event type, so assists are absent rather than zero, and there
 * are no substitution timings to add up, so minutes are absent rather than guessed
 * at ninety. The component drops absent entries, so an honest gap simply renders
 * as one fewer row.
 */

/**
 * An own goal moves the score but is not credited to the scorer — the same rule
 * `recomputeTopScorer` already applies, kept identical so a player's page and the
 * top-scorer table can never disagree about how many they have.
 */
const GOAL_CREDIT = ['GOAL', 'PENALTY'];

const TEAM_SELECT = { select: { id: true, name: true, shortName: true, logo: true } };

/** Clean sheets belong to whoever is asked to keep them. */
const isKeeper = (position?: string | null) => /keeper|goalie|\bgk\b/i.test(position || '');

/**
 * @param player the player row, with at least `id`, `teamId` and `position`
 * @returns `{ season, form }` — `season` carries only the keys that are real, and
 *          `form` is the five most recent completed matches, newest first.
 */
const getPlayerSeason = async (player) => {
  if (!player?.id) return { season: {}, form: [] };

  const [lineups, events, recorded] = await Promise.all([
    prisma.lineup.findMany({
      where: { playerId: player.id, fixture: { status: 'COMPLETED' } },
      select: {
        teamId: true,
        fixture: {
          select: {
            id: true, matchDate: true, homeScore: true, awayScore: true,
            homeTeamId: true, awayTeamId: true,
            homeTeam: TEAM_SELECT, awayTeam: TEAM_SELECT,
          },
        },
      },
      orderBy: { fixture: { matchDate: 'desc' } },
    }),
    prisma.matchEvent.findMany({
      where: { playerId: player.id, fixture: { status: 'COMPLETED' } },
      select: { fixtureId: true, eventType: true },
    }),
    // The most recent season somebody has actually recorded for this player.
    prisma.playerSeasonStat.findFirst({
      where: { playerId: player.id },
      orderBy: { season: 'desc' },
    }),
  ]);

  const entered = sanitiseStats(recorded?.stats);

  const count = (types: string[]) => events.filter((e) => types.includes(e.eventType)).length;
  const goalsIn = (fixtureId: number) =>
    events.filter((e) => e.fixtureId === fixtureId && GOAL_CREDIT.includes(e.eventType)).length;

  // A player with nothing derived AND nothing recorded has no season. Returning an
  // empty object rather than a set of zeros is what lets the profile hide the whole
  // block instead of leading with "0 goals, 0 assists".
  //
  // `entered` is checked too: a basketball player has no lineups and no goal events
  // by definition, so guarding on those alone threw away the only numbers they have.
  if (lineups.length === 0 && events.length === 0 && Object.keys(entered).length === 0) {
    return { season: {}, form: [], recordedSeason: null };
  }

  const season: Record<string, number> = {};
  if (lineups.length) season.appearances = lineups.length;

  const goals = count(GOAL_CREDIT);
  if (goals) season.goals = goals;

  const yellows = count(['YELLOW_CARD']);
  if (yellows) season.yellowCards = yellows;

  const reds = count(['RED_CARD']);
  if (reds) season.redCards = reds;

  if (isKeeper(player.position) && lineups.length) {
    // The lineup's own teamId says which end of the fixture they were defending;
    // fall back to the player's club when a team sheet predates that column.
    const concededIn = ({ teamId, fixture }) => {
      const side = teamId ?? player.teamId;
      return (side === fixture.homeTeamId ? fixture.awayScore : fixture.homeScore) ?? 0;
    };
    season.cleanSheets = lineups.filter((l) => concededIn(l) === 0).length;
    // A keeper's headline is appearances, clean sheets and goals conceded — the
    // three a fan would actually quote. Without this the sheet had only two
    // numbers to show, because goals and assists are an outfield player's story.
    season.conceded = lineups.reduce((n, l) => n + concededIn(l), 0);
  }

  const form = lineups.slice(0, 5).map(({ teamId, fixture }) => {
    const side = teamId ?? player.teamId;
    const home = side === fixture.homeTeamId;
    const own = home ? fixture.homeScore : fixture.awayScore;
    const other = home ? fixture.awayScore : fixture.homeScore;
    const scored = goalsIn(fixture.id);

    return {
      fixtureId: fixture.id,
      date: fixture.matchDate,
      home,
      opponent: home ? fixture.awayTeam : fixture.homeTeam,
      // Read from the player's side, so a 0-2 away win reads "W · 2-0".
      score: `${own ?? 0}-${other ?? 0}`,
      result: own === other ? 'D' : (own ?? 0) > (other ?? 0) ? 'W' : 'L',
      contribution: scored > 0 ? { label: 'goals', value: scored } : null,
    };
  });

  // ENTERED FIGURES WIN. An administrator correcting a total is the authority on
  // it; the derivation is what stands in when nobody has. Spreading `entered` last
  // also means a sport the platform records no events for — basketball — is carried
  // entirely by what was recorded.
  return {
    season: { ...season, ...entered },
    form,
    recordedSeason: recorded?.season ?? null,
  };
};

module.exports = { getPlayerSeason };
