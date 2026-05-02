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