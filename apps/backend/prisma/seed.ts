const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Find-or-create on a natural key. Several seeded models (League, Fixture,
// AkcSchool, AkcTeam, AkcPlayer, Ad) have no unique constraint to upsert
// against, so re-running the seed would otherwise duplicate rows.
const ensure = async (model, where, data) => {
  const existing = await prisma[model].findFirst({ where });
  if (existing) return existing;
  return prisma[model].create({ data: { ...where, ...data } });
};

async function main() {
  console.log('🌱 Starting Comprehensive Seeding...');

  const hashedPassword = await bcrypt.hash('Manager@123', 12);

  // 2. CREATE USERS (ONE FOR EACH ROLE)
  console.log('Creating Test Users...');
  const superadmin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', password: hashedPassword, fullName: 'System Admin', email: 'admin@rwasport.rw', role: 'SUPERADMIN', active: true, verified: true }
  });

  const leagueAdminUser = await prisma.user.upsert({
    where: { username: 'league_boss' },
    update: {},
    create: { username: 'league_boss', password: hashedPassword, fullName: 'League Administrator', email: 'league@rwasport.rw', role: 'LEAGUE_ADMIN', active: true, verified: true }
  });

  const reporterUser = await prisma.user.upsert({
    where: { username: 'reporter1' },
    update: {},
    create: { username: 'reporter1', password: hashedPassword, fullName: 'Pitch Reporter', email: 'reporter@rwasport.rw', role: 'MATCH_REPORTER', active: true, verified: true }
  });

  const teamManagerUser = await prisma.user.upsert({
    where: { username: 'coach1' },
    update: {},
    create: { username: 'coach1', password: hashedPassword, fullName: 'Head Coach', email: 'coach@rwasport.rw', role: 'TEAM_MANAGER', active: true, verified: true }
  });

  // School sport has its own administrator, and there was no account for one:
  // every AMASHURI_ADMIN route was reachable only by the super admin, so the
  // role could not be exercised or tested. Amashuri runs the school
  // competitions and approves athletes' documents; it is not the same job as
  // reporting a match, and it should not need the keys to the whole platform.
  // Likewise there was no FEDERATION_ADMIN account. That role is sport-scoped —
  // every query it makes is filtered to its federation's sport — and with nobody
  // holding it, none of that scoping was ever exercised. The federations
  // themselves are created by seed-federations.ts, which is also where this
  // account is attached to one.
  const federationAdminUser = await prisma.user.upsert({
    where: { username: 'federation_admin' },
    update: {},
    create: { username: 'federation_admin', password: hashedPassword, fullName: 'Football Federation Admin', email: 'federation@rwasport.rw', role: 'FEDERATION_ADMIN', active: true, verified: true }
  });

  const amashuriAdminUser = await prisma.user.upsert({
    where: { username: 'amashuri_admin' },
    update: {},
    create: { username: 'amashuri_admin', password: hashedPassword, fullName: 'Amashuri Administrator', email: 'amashuri@rwasport.rw', role: 'AMASHURI_ADMIN', active: true, verified: true }
  });

  // 3. SPORTS
  console.log('Creating Sports...');
  const football = await prisma.sport.upsert({
    where: { name: 'Football' },
    update: {},
    create: { name: 'Football', icon: '', slug: 'football', category: 'FIELD', sortOrder: 1 }
  });

  // 4. LEAGUES
  console.log('Creating Leagues...');
  const rpl = await ensure(
    'league',
    { slug: 'rpl' },
    { name: 'Rwanda Premier League', sportId: football.id, season: '2025/2026', gender: 'MALE', status: 'ACTIVE', level: 'NATIONAL' }
  );

  const akcCup = await ensure(
    'league',
    { slug: 'akc-cup' },
    { name: 'Kagame Cup Schools', sportId: football.id, season: '2025/2026', gender: 'MIXED', status: 'UPCOMING', level: 'SCHOOL' }
  );

  // 5. TEAMS
  console.log('Creating Teams...');
  const apr = await prisma.team.upsert({
    where: { slug: 'apr-fc' },
    update: {},
    create: {
      name: 'APR FC',
      shortName: 'APR',
      sportId: football.id,
      slug: 'apr-fc',
      city: 'Kigali',
      status: 'VERIFIED',
      managerUserId: teamManagerUser.id
    }
  });

  const rayon = await prisma.team.upsert({
    where: { slug: 'rayon-sports' },
    update: {},
    create: {
      name: 'Rayon Sports',
      shortName: 'RS',
      sportId: football.id,
      slug: 'rayon-sports',
      city: 'Nyanza',
      status: 'VERIFIED'
    }
  });

  // Assign teams to RPL
  await prisma.leagueTeam.upsert({
    where: { leagueId_teamId: { leagueId: rpl.id, teamId: apr.id } },
    update: {},
    create: { leagueId: rpl.id, teamId: apr.id }
  });

  await prisma.leagueTeam.upsert({
    where: { leagueId_teamId: { leagueId: rpl.id, teamId: rayon.id } },
    update: {},
    create: { leagueId: rpl.id, teamId: rayon.id }
  });

  // 6. FIXTURES
  console.log('Creating Fixtures...');
  // A Completed Match
  await ensure(
    'fixture',
    { leagueId: rpl.id, homeTeamId: apr.id, awayTeamId: rayon.id, venue: 'Amahoro Stadium' },
    { status: 'COMPLETED', homeScore: 2, awayScore: 1, matchDate: new Date('2026-05-20T15:00:00Z') }
  );

  // A Live Match
  const liveMatch = await ensure(
    'fixture',
    { leagueId: rpl.id, homeTeamId: rayon.id, awayTeamId: apr.id, venue: 'Kigali Arena Pitch' },
    { status: 'LIVE', homeScore: 0, awayScore: 0, matchDate: new Date() }
  );

  // An Upcoming Match
  await ensure(
    'fixture',
    { leagueId: rpl.id, homeTeamId: apr.id, awayTeamId: rayon.id, venue: 'Huye Stadium' },
    { status: 'SCHEDULED', matchDate: new Date('2026-06-01T18:00:00Z') }
  );

  // 7. ASSIGNMENTS
  console.log('Assigning Admin Roles...');
  // Assign League Admin to RPL
  await prisma.leagueAdminAssignment.upsert({
    where: { leagueId_userId: { leagueId: rpl.id, userId: leagueAdminUser.id } },
    update: {},
    create: { leagueId: rpl.id, userId: leagueAdminUser.id, assignedBy: superadmin.id }
  });

  // Assign Reporter to the Live Match
  await ensure(
    'reporterAssignment',
    { leagueId: rpl.id, fixtureId: liveMatch.id, userId: reporterUser.id },
    { assignedBy: leagueAdminUser.id }
  );

  // 8. AKC3 DATA
  console.log('Creating AKC3 Specific Data...');
  const school1 = await ensure(
    'akcSchool',
    { code: 'KIS-001' },
    { name: 'Kigali International School', category: 'SECONDARY', sector: 'Gasabo', active: true }
  );

  const akcTeam = await ensure(
    'akcTeam',
    { schoolId: school1.id, sportId: football.id, gender: 'MALE', ageCategory: 'U17' },
    { coachName: 'Jean Damascene' }
  );

  await ensure(
    'akcPlayer',
    { teamId: akcTeam.id, fullName: 'Mugisha Emmanuel' },
    { ageCategory: 'U17', position: 'Striker', jersey: 10, docVerified: true }
  );

  // 9. STANDINGS (Recalc for RPL)
  // Normally the service does this, but for seed we initialize
  await prisma.standing.upsert({
    where: { leagueId_teamId: { leagueId: rpl.id, teamId: apr.id } },
    update: {},
    create: { leagueId: rpl.id, teamId: apr.id, played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 2, goalsAgainst: 1, points: 3, form: 'W' }
  });

  await prisma.standing.upsert({
    where: { leagueId_teamId: { leagueId: rpl.id, teamId: rayon.id } },
    update: {},
    create: { leagueId: rpl.id, teamId: rayon.id, played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 1, goalsAgainst: 2, points: 0, form: 'L' }
  });

  // 10. ADVERTISING
  // No explicit id: forcing id:1 leaves the SERIAL sequence at 0, so the next
  // auto-id insert collides on the primary key.
  console.log('Creating Sample Ads...');
  await ensure(
    'ad',
    { title: 'Inyange Summer Campaign' },
    {
      imageUrl: 'https://images.unsplash.com/photo-1550537687-c9107db4d4a5?auto=format&fit=crop&w=1200&q=80',
      targetUrl: 'https://inyangeindustries.rw',
      position: 'HOME_BANNER',
      active: true
    }
  );

  console.log(`✅ Comprehensive Seeding Complete! (leagues: ${rpl.slug}, ${akcCup.slug})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
