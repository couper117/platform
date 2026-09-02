// Gives every completed football fixture a real team sheet, and attributes its
// goals to real players in it.
//
// WHY. `seed-lineups.ts` builds one showcase match (APR vs Rayon) in full detail
// so the Match Centre's formation pitch has something to draw. Everything else was
// left bare: of 26 completed fixtures only 20 had any lineup at all, whole clubs
// (Amagaju FC among them) had none, and there were 23 goal events across the entire
// league — so /players/:id showed a name and a nationality for almost everybody,
// because appearances and goals are derived from exactly these two tables.
//
// This is squad and match data, not statistics: the seeder never writes a "goals"
// total anywhere. It writes who played and who scored, and the API counts them.
// The scores it distributes are the ones already stored on the fixture, so the sum
// of a match's goal events always equals its scoreline.
//
// Deterministic (a fixture's id seeds its own shuffle) and idempotent: a fixture
// that already has a team sheet, or already has goal events, is left alone. So it
// is safe after seed-lineups, and re-running changes nothing.
//
//   npx tsx prisma/seed-appearances.ts
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SQUAD_SIZE = 11;

/** An own goal moves the score but is credited to nobody, so it is never seeded. */
const isKeeper = (position?: string | null) => /keeper|goalie|\bgk\b/i.test(position || '');

/**
 * A small deterministic PRNG. Seeded from the fixture id so the same match always
 * produces the same team sheet and the same scorers — re-running the seeder after
 * a schema change must not silently rewrite everyone's history.
 */
const rng = (seed: number) => {
  let s = seed * 2654435761 % 2147483647;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
};

const pickSquad = (players: any[], next: () => number) => {
  // One goalkeeper if the club has one, then ten outfielders. A team sheet without
  // a keeper would hand every clean sheet to nobody.
  const keepers = players.filter((p) => isKeeper(p.position));
  const others = players.filter((p) => !isKeeper(p.position));

  const shuffled = [...others].sort(() => next() - 0.5);
  const sheet = keepers.length ? [keepers[0], ...shuffled] : shuffled;
  return sheet.slice(0, Math.min(SQUAD_SIZE, sheet.length));
};

const main = async () => {
  // FOOTBALL ONLY. A `GOAL` MatchEvent and a score recomputed by counting them are
  // football's semantics; run over every sport, an 80-75 basketball result became
  // 155 goal events and put a Small Forward top of the scoring charts with 33.
  // Basketball's box score is points/rebounds/assists and has no table here yet, so
  // this seeder stays out of it rather than inventing a shape for it.
  const fixtures = await prisma.fixture.findMany({
    where: { status: 'COMPLETED', league: { sportId: 1 } },
    select: {
      id: true, leagueId: true, matchDate: true,
      homeTeamId: true, awayTeamId: true, homeScore: true, awayScore: true,
    },
    orderBy: { id: 'asc' },
  });

  // One query for every squad involved, rather than two per fixture.
  const teamIds = [...new Set(fixtures.flatMap((f) => [f.homeTeamId, f.awayTeamId]))].filter(Boolean) as number[];
  const players = await prisma.player.findMany({
    where: { teamId: { in: teamIds }, active: true },
    select: { id: true, teamId: true, position: true, jerseyNumber: true },
    orderBy: { jerseyNumber: 'asc' },
  });
  const squads = new Map<number, any[]>();
  players.forEach((p) => {
    if (!p.teamId) return;
    if (!squads.has(p.teamId)) squads.set(p.teamId, []);
    squads.get(p.teamId)!.push(p);
  });

  let sheets = 0;
  let goals = 0;
  let skipped = 0;

  for (const f of fixtures) {
    const next = rng(f.id);

    const existingLineups = await prisma.lineup.count({ where: { fixtureId: f.id } });
    const existingGoals = await prisma.matchEvent.count({
      where: { fixtureId: f.id, eventType: { in: ['GOAL', 'PENALTY', 'OWN_GOAL'] } },
    });

    if (existingLineups > 0 && existingGoals > 0) {
      skipped += 1;
      continue;
    }

    const home = pickSquad(squads.get(f.homeTeamId!) ?? [], next);
    const away = pickSquad(squads.get(f.awayTeamId!) ?? [], next);
    if (home.length === 0 || away.length === 0) {
      skipped += 1;
      continue;
    }

    if (existingLineups === 0) {
      await prisma.lineup.createMany({
        data: [
          ...home.map((p) => ({ fixtureId: f.id, teamId: f.homeTeamId!, playerId: p.id, position: p.position, jerseyNo: p.jerseyNumber, isStarter: true })),
          ...away.map((p) => ({ fixtureId: f.id, teamId: f.awayTeamId!, playerId: p.id, position: p.position, jerseyNo: p.jerseyNumber, isStarter: true })),
        ],
        skipDuplicates: true,
      });
      sheets += 1;
    }

    if (existingGoals === 0) {
      // SCORERS COME OFF THE TEAM SHEET THAT IS ACTUALLY THERE. Picking them from
      // the full squad instead credited goals to players who had not been named for
      // that match — a forward ended up with nine goals in two appearances, because
      // fixtures seeded by seed-lineups already had a sheet this pass did not read.
      const named = await prisma.lineup.findMany({
        where: { fixtureId: f.id },
        select: { teamId: true, player: { select: { id: true, position: true } } },
      });
      const onPitch = (teamId: number) => named
        .filter((l) => l.teamId === teamId)
        .map((l) => l.player);

      // Distribute the stored scoreline across the players who were on the pitch,
      // weighted so a forward outscores a defender and the keeper never scores.
      const scorersFor = (sheet: any[], howMany: number, teamId: number) => {
        const eligible = sheet.filter((p) => !isKeeper(p.position));
        if (!eligible.length) return [];
        const weight = (p: any) => (/forward|striker|winger/i.test(p.position || '') ? 5
          : /mid/i.test(p.position || '') ? 3 : 1);
        const pool = eligible.flatMap((p) => Array(weight(p)).fill(p));
        return Array.from({ length: howMany }, () => {
          const p = pool[Math.floor(next() * pool.length)];
          return {
            fixtureId: f.id,
            playerId: p.id,
            teamId,
            eventType: 'GOAL' as const,
            minute: 1 + Math.floor(next() * 89),
          };
        });
      };

      const data = [
        ...scorersFor(onPitch(f.homeTeamId!), f.homeScore ?? 0, f.homeTeamId!),
        ...scorersFor(onPitch(f.awayTeamId!), f.awayScore ?? 0, f.awayTeamId!),
      ];
      if (data.length) {
        await prisma.matchEvent.createMany({ data });
        goals += data.length;
      }
    }
  }

  // A SCORER MUST HAVE PLAYED. The base seed wrote goal events for ten players it
  // never named on the corresponding team sheet, which is how a forward came to
  // show nine goals in two appearances — the goals were counted from events and the
  // appearances from lineups, and the two disagreed. Naming them fixes the source
  // rather than papering over it in the query.
  const scorers = await prisma.matchEvent.findMany({
    where: { eventType: { in: ['GOAL', 'PENALTY'] }, playerId: { not: null }, fixture: { league: { sportId: 1 } } },
    select: { fixtureId: true, playerId: true, teamId: true, player: { select: { teamId: true, position: true, jerseyNumber: true } } },
  });
  let named = 0;
  for (const e of scorers) {
    const already = await prisma.lineup.count({ where: { fixtureId: e.fixtureId, playerId: e.playerId! } });
    if (already) continue;
    await prisma.lineup.create({
      data: {
        fixtureId: e.fixtureId,
        teamId: e.teamId ?? e.player!.teamId!,
        playerId: e.playerId!,
        position: e.player!.position,
        jerseyNo: e.player!.jerseyNumber,
        isStarter: true,
      },
    });
    named += 1;
  }

  // Keep the top-scorer table in step with the events just written — the app
  // recomputes it from events on every change, so a seeder that adds goals without
  // recounting would leave the league table and the player pages disagreeing.
  const leagues = [...new Set(fixtures.map((f) => f.leagueId))].filter(Boolean) as number[];
  let scorerRows = 0;
  for (const leagueId of leagues) {
    const tally = await prisma.matchEvent.groupBy({
      by: ['playerId'],
      where: { playerId: { not: null }, eventType: { in: ['GOAL', 'PENALTY'] }, fixture: { leagueId } },
      _count: { _all: true },
    });
    for (const row of tally) {
      const player = await prisma.player.findUnique({ where: { id: row.playerId! }, select: { teamId: true } });
      await prisma.topScorer.upsert({
        where: { playerId: row.playerId! },
        update: { goals: row._count._all },
        create: { leagueId, playerId: row.playerId!, teamId: player?.teamId ?? null, goals: row._count._all, assists: 0 },
      });
      scorerRows += 1;
    }
  }

  console.log(`team sheets written: ${sheets}`);
  console.log(`scorers added to a sheet they were missing from: ${named}`);
  console.log(`goal events written: ${goals}`);
  console.log(`fixtures skipped (already had both, or an empty squad): ${skipped}`);
  console.log(`top-scorer rows recomputed: ${scorerRows}`);
};

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
