/**
 * Seed known club primary colours into the database (Team.primaryColor).
 *
 * These values previously lived only in the frontend stopgap
 * (apps/frontend/src/config/clubColors.js). Moving them into the DB is the
 * migration that stopgap was always waiting for: clubColor() already prefers
 * Team.primaryColor when present, so once a team is coloured here the hardcoded
 * map is no longer consulted for it.
 *
 * Idempotent: only fills teams that have NO colour yet (never overwrites a
 * colour an admin has set), matched by a case-insensitive name fragment.
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const COLORS = [
  { match: 'Rayon', color: '#1D4ED8' },    // Rayon Sports — blue & white
  { match: 'APR', color: '#0B6E3F' },      // APR FC / APR BBC — green & white
  { match: 'Kiyovu', color: '#0F7A3D' },   // Kiyovu Sports — green & white
  { match: 'Police', color: '#12386E' },   // Police FC — dark blue
  { match: 'Patriots', color: '#1D4ED8' }, // Patriots BBC — blue
];

async function main() {
  console.log('Seeding known club colours…');
  let updated = 0;
  for (const { match, color } of COLORS) {
    const res = await prisma.team.updateMany({
      where: { name: { contains: match, mode: 'insensitive' }, primaryColor: null },
      data: { primaryColor: color },
    });
    if (res.count) {
      updated += res.count;
      console.log(`  ${match} → ${color}  (${res.count} team${res.count > 1 ? 's' : ''})`);
    }
  }
  console.log(`✓ Club colours seeded: ${updated} team(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
