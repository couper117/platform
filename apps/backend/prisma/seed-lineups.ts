// Seeds a full 11-a-side published lineup (both teams) for a showcase fixture so
// the Match Center formation pitch has real data to render. Idempotent: re-running
// tops up squads to a full complement and rewrites the team sheets in place.
//
//   npx tsx prisma/seed-lineups.ts
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// The showcase match is APR FC vs Rayon Sports in the Rwanda Premier League.
// Resolved by team, not by a hardcoded id: fixture ids depend on how many times
// the database has been seeded, so a fresh seed never lines up with a fixed number.
// FIXTURE_ID overrides it when you want a specific match.
const FIXTURE_ID = process.env.SHOWCASE_FIXTURE_ID ? parseInt(process.env.SHOWCASE_FIXTURE_ID, 10) : null;

// Prefer a match that has not been played yet — the seed flips it to LIVE.
const findShowcaseFixture = async () => {
  if (FIXTURE_ID) {
    return prisma.fixture.findUnique({
      where: { id: FIXTURE_ID },
      include: { homeTeam: true, awayTeam: true },
    });
  }
  const byName = {
    homeTeam: { name: { contains: 'APR', mode: 'insensitive' as const } },
    awayTeam: { name: { contains: 'Rayon', mode: 'insensitive' as const } },
  };
  return (
    (await prisma.fixture.findFirst({
      where: { ...byName, status: { in: ['SCHEDULED', 'LIVE'] } },
      include: { homeTeam: true, awayTeam: true },
      orderBy: { id: 'asc' },
    })) ||
    (await prisma.fixture.findFirst({
      where: byName,
      include: { homeTeam: true, awayTeam: true },
      orderBy: { id: 'asc' },
    }))
  );
};

type Cat = 'GK' | 'DEF' | 'MID' | 'FWD';

// Extra squad members to create when a team is short. Positions use the same
// full-word labels as the base seed so the pitch's role inference stays happy.
const FILLER: Record<number, { fullName: string; position: string; cat: Cat }[]> = {
  1: [ // APR FC top-up
    { fullName: 'Thierry Manzi', position: 'Defender', cat: 'DEF' },
    { fullName: 'Emmanuel Imanishimwe', position: 'Defender', cat: 'DEF' },
    { fullName: 'Djabel Manishimwe', position: 'Defender', cat: 'DEF' },
    { fullName: 'Victor Mbaoma', position: 'Midfielder', cat: 'MID' },
    { fullName: 'Gilbert Mugisha', position: 'Midfielder', cat: 'MID' },
    { fullName: 'Innocent Nshuti', position: 'Midfielder', cat: 'MID' },
    { fullName: 'Muhadjiri Hakizimana', position: 'Forward', cat: 'FWD' },
    { fullName: 'Clement Kwizera', position: 'Goalkeeper', cat: 'GK' },
  ],
  2: [ // Rayon Sports top-up
    { fullName: 'Fitina Omborenga', position: 'Goalkeeper', cat: 'GK' },
    { fullName: 'Emery Bayisenge', position: 'Defender', cat: 'DEF' },
    { fullName: 'Abdul Rwatubyaye', position: 'Defender', cat: 'DEF' },
    { fullName: 'Savio Nshuti', position: 'Defender', cat: 'DEF' },
    { fullName: 'Yannick Mukunzi', position: 'Midfielder', cat: 'MID' },
    { fullName: 'Lague Byiringiro', position: 'Midfielder', cat: 'MID' },
    { fullName: 'Kevin Sibomana', position: 'Midfielder', cat: 'MID' },
    { fullName: 'Julio Moromba', position: 'Forward', cat: 'FWD' },
  ],
};

const catOf = (position?: string | null): Cat => {
  const s = String(position || '').toLowerCase();
  if (/goal|keeper|gk/.test(s)) return 'GK';
  if (/def|back/.test(s)) return 'DEF';
  if (/for|strik|attack|wing/.test(s)) return 'FWD';
  return 'MID';
};

const parseLines = (formation: string) =>
  formation.split(/[^0-9]+/).map((n) => parseInt(n, 10)).filter((n) => n > 0);

async function ensureSquad(teamId: number) {
  const existing = await prisma.player.findMany({ where: { teamId }, orderBy: { jerseyNumber: 'asc' } });
  const usedJerseys = new Set(existing.map((p) => p.jerseyNumber ?? 0));
  let next = 1;
  const freeJersey = () => {
    while (usedJerseys.has(next)) next += 1;
    usedJerseys.add(next);
    return next;
  };

  // Which categories are already covered vs. what a full squad needs.
  const have: Record<Cat, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  existing.forEach((p) => { have[catOf(p.position)] += 1; });
  const need: Record<Cat, number> = { GK: 2, DEF: 5, MID: 5, FWD: 3 };

  for (const filler of FILLER[teamId] || []) {
    if (have[filler.cat] >= need[filler.cat]) continue;
    // Skip if a player with this exact name already exists (idempotency).
    if (existing.some((p) => p.fullName === filler.fullName)) continue;
    await prisma.player.create({
      data: {
        teamId,
        fullName: filler.fullName,
        position: filler.position,
        jerseyNumber: freeJersey(),
        nationality: 'Rwandan',
        active: true,
      },
    });
    have[filler.cat] += 1;
  }

  return prisma.player.findMany({ where: { teamId }, orderBy: { jerseyNumber: 'asc' } });
}

async function seedTeam(fixtureId: number, teamId: number, formation: string, coachName: string, captainCat: Cat) {
  const squad = await ensureSquad(teamId);
  const byCat = (c: Cat) => squad.filter((p) => catOf(p.position) === c);

  const lines = parseLines(formation);
  const defCount = lines[0];
  const fwdCount = lines[lines.length - 1];
  const midCount = 11 - 1 - defCount - fwdCount;

  const gk = byCat('GK').slice(0, 1);
  const def = byCat('DEF').slice(0, defCount);
  const mid = byCat('MID').slice(0, midCount);
  const fwd = byCat('FWD').slice(0, fwdCount);
  const startXI = [...gk, ...def, ...mid, ...fwd];

  const startIds = new Set(startXI.map((p) => p.id));
  const subs = squad.filter((p) => !startIds.has(p.id)).slice(0, 5);

  // Captain: first starter in the chosen category (fallback to first starter).
  const captain = startXI.find((p) => catOf(p.position) === captainCat) || startXI[0];

  // Rewrite the team sheet + this team's lineup rows (leave the other team's alone).
  await prisma.matchTeamSheet.deleteMany({ where: { fixtureId, teamId } });
  await prisma.lineup.deleteMany({ where: { fixtureId, teamId } });

  await prisma.matchTeamSheet.create({
    data: { fixtureId, teamId, formation, coachName, published: true },
  });

  const rows = [
    ...startXI.map((p) => ({ p, isStarter: true })),
    ...subs.map((p) => ({ p, isStarter: false })),
  ];
  for (const { p, isStarter } of rows) {
    await prisma.lineup.create({
      data: {
        fixtureId,
        teamId,
        playerId: p.id,
        position: p.position,
        jerseyNo: p.jerseyNumber,
        isStarter,
        isCaptain: isStarter && p.id === captain.id,
      },
    });
  }

  return { formation, coachName, starters: startXI.length, subs: subs.length, captain: captain.fullName };
}

// Baseline per-team stats so the Match Center Stats tab (and its live-push demo)
// has real numbers to render on a fresh seed.
async function seedStats(fixtureId: number, homeTeamId: number, awayTeamId: number) {
  const upsert = (teamId: number, d: Record<string, number>) =>
    prisma.matchStat.upsert({
      where: { fixtureId_teamId: { fixtureId, teamId } },
      update: d,
      create: { fixtureId, teamId, ...d },
    });
  await upsert(homeTeamId, { possession: 55, shots: 12, shotsOnTarget: 5, corners: 6, fouls: 8, xg: 1.4 });
  await upsert(awayTeamId, { possession: 45, shots: 9, shotsOnTarget: 3, corners: 4, fouls: 11, xg: 0.9 });
}

async function main() {
  const fixture = await findShowcaseFixture();
  if (!fixture) {
    console.log('No APR vs Rayon fixture found — skipping the showcase lineup seed.');
    return;
  }

  const home = await seedTeam(fixture.id, fixture.homeTeamId, '4-3-3', 'Adel Amrouche', 'FWD');
  const away = await seedTeam(fixture.id, fixture.awayTeamId, '4-2-3-1', 'Mecky Mexican', 'DEF');

  // Make the showcase a LIVE match with stats, so the formation pitch and the
  // real-time Stats tab both have something to show out of the box.
  await seedStats(fixture.id, fixture.homeTeamId, fixture.awayTeamId);
  await prisma.fixture.update({ where: { id: fixture.id }, data: { status: 'LIVE' } });

  console.log(`Seeded showcase fixture ${fixture.id} (LIVE): ${fixture.homeTeam.name} vs ${fixture.awayTeam.name}`);
  console.log(' home:', JSON.stringify(home));
  console.log(' away:', JSON.stringify(away));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
