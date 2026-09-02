/**
 * A demonstrable fixture for every sport.
 *
 * Football and basketball had squads and team sheets; the other eighteen sports
 * had no clubs, no players and no fixtures, so every court, mat and start list
 * the platform can draw was unreachable. A surface nobody can look at is a
 * surface nobody can check, which is how a basketball court went on rendering as
 * a football pitch for as long as it did.
 *
 * The squad sizes and position names here mirror
 * apps/frontend/src/config/playingSurfaces.ts deliberately: seeding eleven for a
 * sport the view seats five would put the two back out of step, which is the
 * fault this is meant to make visible.
 *
 * Idempotent — a sport that already has a fixture is left exactly as it is, so
 * this never touches football or anything an administrator has since edited.
 *
 *   npx tsx prisma/seed-showcases.ts
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const FIRST = ['Eric', 'Jean', 'Olivier', 'Pacifique', 'Thierry', 'Kevin', 'Dieudonne', 'Aime',
  'Fiston', 'Emmanuel', 'Claude', 'Innocent', 'Yves', 'Patrick', 'Samuel'];
const LAST = ['Mugisha', 'Habimana', 'Niyonzima', 'Uwase', 'Iradukunda', 'Nkurunziza', 'Bizimana',
  'Mutesi', 'Ndayisaba', 'Rwema', 'Gatete', 'Mucyo', 'Ishimwe', 'Kagabo', 'Nshuti'];

/**
 * Per sport: the clubs, how many take the field, and what those places are
 * called. Positions are left empty where the sport does not name fixed ones.
 */
const SHOWCASE = [
  { slug: 'volleyball', league: 'Rwanda Volleyball League', venue: 'Amahoro Indoor Arena',
    clubs: ['Rwanda Revenue Authority VC', 'Kigali Volleyball Club'], starters: 6,
    positions: ['Outside Hitter', 'Setter', 'Opposite', 'Middle Blocker', 'Libero', 'Outside Hitter'] },

  { slug: 'handball', league: 'Rwanda Handball League', venue: 'Petit Stade',
    clubs: ['APR Handball Club', 'Police Handball Club'], starters: 7,
    positions: ['Goalkeeper', 'Left Wing', 'Left Back', 'Centre Back', 'Pivot', 'Right Back', 'Right Wing'] },

  { slug: 'rugby', league: 'Rwanda Rugby Championship', venue: 'Kicukiro Oval',
    clubs: ['Resilience RFC', 'Silverbacks RFC'], starters: 15, positions: [] },

  { slug: 'netball', league: 'Rwanda Netball League', venue: 'Amahoro Indoor Arena',
    clubs: ['Rwanda Energy Group NC', 'Kigali Netball Club'], starters: 7,
    positions: ['GS', 'GA', 'WA', 'C', 'WD', 'GD', 'GK'] },

  { slug: 'cricket', league: 'Rwanda Cricket League', venue: 'Gahanga Cricket Stadium',
    clubs: ['Challengers Cricket Club', 'Right Guard Cricket Club'], starters: 11, positions: [] },

  { slug: 'tennis', league: 'Rwanda Tennis Circuit', venue: 'Cercle Sportif de Kigali',
    clubs: ['Kigali Tennis Club', 'Huye Tennis Club'], starters: 2, positions: ['Singles', 'Doubles'] },

  { slug: 'badminton', league: 'Rwanda Badminton League', venue: 'Amahoro Indoor Arena',
    clubs: ['Kigali Badminton Club', 'Musanze Badminton Club'], starters: 2, positions: ['Singles', 'Doubles'] },

  { slug: 'table-tennis', league: 'Rwanda Table Tennis League', venue: 'Petit Stade',
    clubs: ['Kigali Table Tennis Club', 'Rubavu Table Tennis Club'], starters: 2, positions: ['Singles', 'Doubles'] },

  // No surface: a board order rather than a court.
  { slug: 'chess', league: 'Rwanda Chess Championship', venue: 'Kigali Public Library',
    clubs: ['Kigali Chess Club', 'Huye Chess Club'], starters: 4,
    positions: ['Board 1', 'Board 2', 'Board 3', 'Board 4'] },

  // No surface: bouts in weight classes. The squads are the entered athletes.
  ...['judo', 'karate', 'taekwondo', 'boxing', 'wrestling', 'kickboxing'].map((slug) => ({
    slug,
    league: `Rwanda ${slug[0].toUpperCase()}${slug.slice(1)} Championship`,
    venue: 'Petit Stade',
    clubs: [`APR ${slug[0].toUpperCase()}${slug.slice(1)} Club`, `Police ${slug[0].toUpperCase()}${slug.slice(1)} Club`],
    starters: 5,
    positions: ['-60kg', '-66kg', '-73kg', '-81kg', '-90kg'],
  })),

  // No surface: athletes start together rather than taking up positions.
  ...['cycling', 'athletics', 'swimming'].map((slug) => ({
    slug,
    league: slug === 'cycling' ? 'Tour du Rwanda' : `Rwanda ${slug[0].toUpperCase()}${slug.slice(1)} Championship`,
    venue: slug === 'swimming' ? 'Amahoro Aquatic Centre' : 'Kigali',
    clubs: [`Team Rwanda ${slug[0].toUpperCase()}${slug.slice(1)}`, `Benediction ${slug[0].toUpperCase()}${slug.slice(1)}`],
    starters: 5,
    positions: [],
  })),
];

const pick = (arr, i) => arr[i % arr.length];

async function seedSport(spec, index) {
  const sport = await prisma.sport.findFirst({ where: { slug: spec.slug } });
  if (!sport) return `${spec.slug}: no such sport`;

  // Never disturb a sport that already has a match.
  const existing = await prisma.fixture.findFirst({ where: { league: { sportId: sport.id } } });
  if (existing) return `${spec.slug}: already has fixture ${existing.id}`;

  let league = await prisma.league.findFirst({ where: { sportId: sport.id } });
  if (!league) {
    league = await prisma.league.create({
      data: { name: spec.league, sportId: sport.id, season: '2025/2026', status: 'ACTIVE' },
    });
  }

  const teams = [];
  for (const [i, name] of spec.clubs.entries()) {
    let team = await prisma.team.findFirst({ where: { name } });
    if (!team) {
      team = await prisma.team.create({
        data: {
          name, shortName: name.split(' ').map((w) => w[0]).join('').slice(0, 4).toUpperCase(),
          sportId: sport.id, status: 'VERIFIED', active: true, city: 'Kigali',
          primaryColor: i === 0 ? '#0B6E3F' : '#12386E',
        },
      });
    }
    await prisma.leagueTeam.upsert({
      where: { leagueId_teamId: { leagueId: league.id, teamId: team.id } },
      update: {}, create: { leagueId: league.id, teamId: team.id },
    });
    teams.push(team);
  }

  const fixture = await prisma.fixture.create({
    data: {
      leagueId: league.id, homeTeamId: teams[0].id, awayTeamId: teams[1].id,
      matchDate: new Date(Date.now() + (index + 2) * 86400000),
      status: 'SCHEDULED', venue: spec.venue,
    },
  });

  for (const [ti, team] of teams.entries()) {
    const squad = await prisma.player.findMany({ where: { teamId: team.id }, take: spec.starters });
    for (let i = squad.length; i < spec.starters; i += 1) {
      squad.push(await prisma.player.create({
        data: {
          fullName: `${pick(FIRST, i * 3 + ti * 5)} ${pick(LAST, i * 5 + ti * 3)}`,
          teamId: team.id,
          position: spec.positions[i] || null,
          jerseyNumber: i + 1,
        },
      }));
    }
    await prisma.matchTeamSheet.upsert({
      where: { fixtureId_teamId: { fixtureId: fixture.id, teamId: team.id } },
      update: { published: true },
      create: { fixtureId: fixture.id, teamId: team.id, published: true },
    });
    await prisma.lineup.createMany({
      data: squad.slice(0, spec.starters).map((p, i) => ({
        fixtureId: fixture.id, teamId: team.id, playerId: p.id,
        position: spec.positions[i] || null, jerseyNo: i + 1, isStarter: true,
      })),
    });
  }

  return `${spec.slug}: fixture ${fixture.id}, ${spec.starters} a side — ${teams[0].name} v ${teams[1].name}`;
}

async function main() {
  console.log('Seeding a showcase fixture for every sport that has none…');
  for (const [i, spec] of SHOWCASE.entries()) {
    try {
      console.log('  ' + await seedSport(spec, i));
    } catch (e) {
      console.log(`  ${spec.slug}: FAILED — ${e.message.split('\n').filter(Boolean).pop()}`);
    }
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
