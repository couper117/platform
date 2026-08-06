/**
 * Seeds the real sports and national federations overseen by the Ministry of
 * Sports (MINISPORT) so the platform mirrors https://www.minisports.gov.rw.
 *
 * Idempotent by design — pure upserts keyed on Sport.name and Federation
 * abbreviation, so it is safe to re-run at any time (it only fills gaps and
 * never duplicates or overwrites existing records).
 *
 * Run:  node prisma/seed-federations.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// slug → sport definition. sortOrder keeps the popular team sports first; new
// sports continue from 9 so existing ordering is preserved.
const SPORTS = [
  { slug: 'football', name: 'Football', icon: '⚽', category: 'FIELD', sortOrder: 1 },
  { slug: 'basketball', name: 'Basketball', icon: '🏀', category: 'COURT', sortOrder: 2 },
  { slug: 'volleyball', name: 'Volleyball', icon: '🏐', category: 'COURT', sortOrder: 3 },
  { slug: 'cycling', name: 'Cycling', icon: '🚴', category: 'OTHER', sortOrder: 4 },
  { slug: 'cricket', name: 'Cricket', icon: '🏏', category: 'FIELD', sortOrder: 5 },
  { slug: 'rugby', name: 'Rugby', icon: '🏉', category: 'FIELD', sortOrder: 6 },
  { slug: 'handball', name: 'Handball', icon: '🤾', category: 'COURT', sortOrder: 7 },
  { slug: 'athletics', name: 'Athletics', icon: '🏃', category: 'TRACK', sortOrder: 8 },
  { slug: 'swimming', name: 'Swimming', icon: '🏊', category: 'WATER', sortOrder: 9 },
  { slug: 'tennis', name: 'Tennis', icon: '🎾', category: 'RACKET', sortOrder: 10 },
  { slug: 'table-tennis', name: 'Table Tennis', icon: '🏓', category: 'RACKET', sortOrder: 11 },
  { slug: 'badminton', name: 'Badminton', icon: '🏸', category: 'RACKET', sortOrder: 12 },
  { slug: 'judo', name: 'Judo', icon: '🥋', category: 'COMBAT', sortOrder: 13 },
  { slug: 'karate', name: 'Karate', icon: '🥋', category: 'COMBAT', sortOrder: 14 },
  { slug: 'taekwondo', name: 'Taekwondo', icon: '🥋', category: 'COMBAT', sortOrder: 15 },
  { slug: 'boxing', name: 'Boxing', icon: '🥊', category: 'COMBAT', sortOrder: 16 },
  { slug: 'wrestling', name: 'Wrestling', icon: '🤼', category: 'COMBAT', sortOrder: 17 },
  { slug: 'kickboxing', name: 'Kickboxing', icon: '🥊', category: 'COMBAT', sortOrder: 18 },
  { slug: 'netball', name: 'Netball', icon: '🏐', category: 'COURT', sortOrder: 19 },
  { slug: 'chess', name: 'Chess', icon: '♟️', category: 'OTHER', sortOrder: 20 },
];

// Federations & national sports bodies. sport = slug (null for umbrella bodies
// that don't map to one sport, e.g. Olympic/Paralympic committees).
const FEDERATIONS = [
  { abbr: 'FERWAFA', name: 'Rwanda Football Federation', sport: 'football', website: 'https://ferwafa.rw' },
  { abbr: 'FERWABA', name: 'Rwanda Basketball Federation', sport: 'basketball' },
  { abbr: 'FRVB', name: 'Rwanda Volleyball Federation', sport: 'volleyball' },
  { abbr: 'FERWACY', name: 'Rwanda Cycling Federation', sport: 'cycling', website: 'https://ferwacy.rw' },
  { abbr: 'RCA', name: 'Rwanda Cricket Association', sport: 'cricket' },
  { abbr: 'FRR', name: 'Rwanda Rugby Federation', sport: 'rugby' },
  { abbr: 'FRHF', name: 'Rwanda Handball Federation', sport: 'handball' },
  { abbr: 'RAF', name: 'Rwanda Athletics Federation', sport: 'athletics' },
  { abbr: 'RSF', name: 'Rwanda Swimming Federation', sport: 'swimming' },
  { abbr: 'FRT', name: 'Rwanda Tennis Federation', sport: 'tennis' },
  { abbr: 'RTTF', name: 'Rwanda Table Tennis Federation', sport: 'table-tennis' },
  { abbr: 'RBDF', name: 'Rwanda Badminton Federation', sport: 'badminton' },
  { abbr: 'FRJ', name: 'Rwanda Judo Federation', sport: 'judo' },
  { abbr: 'FERWAKA', name: 'Rwanda Karate Federation', sport: 'karate' },
  { abbr: 'RTF', name: 'Rwanda Taekwondo Federation', sport: 'taekwondo' },
  { abbr: 'FRB', name: 'Rwanda Boxing Federation', sport: 'boxing' },
  { abbr: 'RWF', name: 'Rwanda Wrestling Federation', sport: 'wrestling' },
  { abbr: 'RKF', name: 'Rwanda Kickboxing Federation', sport: 'kickboxing' },
  { abbr: 'RNF', name: 'Rwanda Netball Federation', sport: 'netball' },
  { abbr: 'RCF', name: 'Rwanda Chess Federation', sport: 'chess' },
  { abbr: 'RNOSC', name: 'Rwanda National Olympic and Sports Committee', sport: null },
  { abbr: 'NPC', name: 'National Paralympic Committee of Rwanda', sport: null },
  { abbr: 'SOR', name: 'Special Olympics Rwanda', sport: null },
  { abbr: 'FRSS', name: 'Rwanda School Sports Federation', sport: null },
];

async function main() {
  console.log('🌱 Seeding MINISPORT sports & federations...');

  // ── Sports (upsert by unique name) ──
  const bySlug = {};
  let sportsCreated = 0;
  for (const s of SPORTS) {
    const existing = await prisma.sport.findUnique({ where: { name: s.name } });
    const row = await prisma.sport.upsert({
      where: { name: s.name },
      update: {}, // never clobber curated existing data (coverImage, sortOrder, etc.)
      create: { name: s.name, slug: s.slug, icon: s.icon, category: s.category, sortOrder: s.sortOrder, active: true },
    });
    if (!existing) sportsCreated++;
    bySlug[s.slug] = row;
  }

  // ── Federations (find by abbreviation, create if missing, link sport if absent) ──
  let fedsCreated = 0;
  let fedsLinked = 0;
  for (const f of FEDERATIONS) {
    const sportId = f.sport ? bySlug[f.sport]?.id ?? null : null;
    const found = await prisma.federation.findFirst({ where: { abbreviation: f.abbr } });
    if (!found) {
      await prisma.federation.create({
        data: { name: f.name, abbreviation: f.abbr, sportId, website: f.website || null, active: true },
      });
      fedsCreated++;
    } else if (sportId && !found.sportId) {
      await prisma.federation.update({ where: { id: found.id }, data: { sportId } });
      fedsLinked++;
    }
  }

  const totals = {
    sports: await prisma.sport.count(),
    federations: await prisma.federation.count(),
  };
  console.log(`   sports: +${sportsCreated} new  •  federations: +${fedsCreated} new, ${fedsLinked} re-linked`);
  console.log('✅ Done. Totals:', JSON.stringify(totals));
}

main()
  .catch((e) => { console.error('❌ seed-federations failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
