const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Comprehensive Seeding...');

  // 1. CLEAR EXISTING DATA (Optional, but good for clean test)
  // console.log('Cleaning existing data...');
  // await prisma.$transaction([ ...delete operations... ]);

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

  // 3. SPORTS
  console.log('Creating Sports...');
  const football = await prisma.sport.upsert({
    where: { name: 'Football' },
    update: {},
    create: { name: 'Football', icon: '⚽', slug: 'football', category: 'FIELD', sortOrder: 1 }
  });

  // 4. LEAGUES
  console.log('Creating Leagues...');
  const rpl = await prisma.league.create({
    data: { name: 'Rwanda Premier League', slug: 'rpl', sportId: football.id, season: '2025/2026', gender: 'MALE', status: 'ACTIVE', level: 'NATIONAL' }
  });

  const akcCup = await prisma.league.create({
    data: { name: 'Kagame Cup Schools', slug: 'akc-cup', sportId: football.id, season: '2025/2026', gender: 'MIXED', status: 'UPCOMING', level: 'SCHOOL' }
  });

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
  await prisma.leagueTeam.createMany({
    data: [
      { leagueId: rpl.id, teamId: apr.id },
      { leagueId: rpl.id, teamId: rayon.id }
    ]
  });

  // 6. FIXTURES
  console.log('Creating Fixtures...');
  // A Completed Match
  await prisma.fixture.create({
    data: {
      leagueId: rpl.id, homeTeamId: apr.id, awayTeamId: rayon.id, status: 'COMPLETED',
      homeScore: 2, awayScore: 1, venue: 'Amahoro Stadium', matchDate: new Date('2026-05-20T15:00:00Z')
    }
  });

  // A Live Match
  const liveMatch = await prisma.fixture.create({
    data: {
      leagueId: rpl.id, homeTeamId: rayon.id, awayTeamId: apr.id, status: 'LIVE',
      homeScore: 0, awayScore: 0, venue: 'Kigali Arena Pitch', matchDate: new Date()
    }
  });

  // An Upcoming Match
  await prisma.fixture.create({
    data: {
      leagueId: rpl.id, homeTeamId: apr.id, awayTeamId: rayon.id, status: 'SCHEDULED',
      venue: 'Huye Stadium', matchDate: new Date('2026-06-01T18:00:00Z')
    }
  });

  // 7. ASSIGNMENTS
  console.log('Assigning Admin Roles...');
  // Assign League Admin to RPL
  await prisma.leagueAdminAssignment.create({
    data: { leagueId: rpl.id, userId: leagueAdminUser.id, assignedBy: superadmin.id }
  });

  // Assign Reporter to the Live Match
  await prisma.reporterAssignment.create({
    data: { leagueId: rpl.id, fixtureId: liveMatch.id, userId: reporterUser.id, assignedBy: leagueAdminUser.id }
  });

  // 8. AKC3 DATA
  console.log('Creating AKC3 Specific Data...');
  const school1 = await prisma.akcSchool.create({
    data: { name: 'Kigali International School', code: 'KIS-001', category: 'SECONDARY', sector: 'Gasabo', active: true }
  });

  const akcTeam = await prisma.akcTeam.create({
    data: { schoolId: school1.id, sportId: football.id, gender: 'MALE', ageCategory: 'U17', coachName: 'Jean Damascene' }
  });

  await prisma.akcPlayer.create({
    data: { teamId: akcTeam.id, fullName: 'Mugisha Emmanuel', ageCategory: 'U17', position: 'Striker', jersey: 10, docVerified: true }
  });

  // 9. STANDINGS (Recalc for RPL)
  // Normally the service does this, but for seed we initialize
  await prisma.standing.createMany({
    data: [
      { leagueId: rpl.id, teamId: apr.id, played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 2, goalsAgainst: 1, points: 3, form: 'W' },
      { leagueId: rpl.id, teamId: rayon.id, played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 1, goalsAgainst: 2, points: 0, form: 'L' }
    ]
  });

  // 10. ADVERTISING
  console.log('Creating Sample Ads...');
  await prisma.ad.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      title: 'Inyange Summer Campaign',
      imageUrl: 'https://images.unsplash.com/photo-1550537687-c9107db4d4a5?auto=format&fit=crop&w=1200&q=80',
      targetUrl: 'https://inyangeindustries.rw',
      position: 'HOME_BANNER',
      active: true
    }
  });

  console.log('✅ Comprehensive Seeding Complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
