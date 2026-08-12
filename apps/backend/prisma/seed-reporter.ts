/**
 * Phase 5 seed — a Match Reporter and their assignment.
 *
 * The reporter portal needs a MATCH_REPORTER user with at least one assigned
 * league so the live console has matches to report. Idempotent: upserts the user
 * by email and the league assignment by its unique (leagueId, userId).
 *
 * Login:  match.reporter@rwasport.rw  /  Manager@123
 * Run:    npx tsx prisma/seed-reporter.ts
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

(async () => {
  try {
    const password = await bcrypt.hash('Manager@123', 12);

    const reporter = await prisma.user.upsert({
      where: { email: 'match.reporter@rwasport.rw' },
      update: { role: 'MATCH_REPORTER', active: true, verified: true },
      create: {
        username: 'match_reporter',
        password,
        fullName: 'Match Reporter',
        email: 'match.reporter@rwasport.rw',
        role: 'MATCH_REPORTER',
        active: true,
        verified: true,
      },
    });

    // Assign to the primary football league so the console lists its fixtures.
    const league = await prisma.league.findFirst({ where: { sportId: 1 }, orderBy: { id: 'asc' } });
    if (league) {
      await prisma.reporterAssignment.upsert({
        where: { leagueId_userId: { leagueId: league.id, userId: reporter.id } },
        update: {},
        create: { leagueId: league.id, userId: reporter.id },
      });
      console.log(`✓ reporter assigned to league "${league.name}" (#${league.id})`);

      // Make sure there is at least one SCHEDULED fixture to kick off.
      const scheduled = await prisma.fixture.count({ where: { leagueId: league.id, status: 'SCHEDULED' } });
      console.log(`  ${scheduled} scheduled fixture(s) available to report in this league`);
    } else {
      console.log('! no football league found — assign the reporter manually');
    }

    console.log('✓ reporter ready — login: match.reporter@rwasport.rw / Manager@123');
  } catch (e) {
    console.error('Reporter seed failed:', e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
