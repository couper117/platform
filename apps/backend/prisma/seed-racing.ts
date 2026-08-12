/**
 * Phase 3 seed — racing (cycling + athletics) and Amashuri enrichment.
 *
 * A RACING sport is not head-to-head: a race produces a ranked finish (time or
 * mark per athlete) and a series produces a classification (riders by cumulative
 * time, or clubs by a medal table). This seeds real Race rows (results as Json)
 * and a Classification for cycling (Tour du Rwanda) and athletics (National
 * Championship), plus fills in the school-sports sport tiles.
 *
 * Idempotent: it no-ops the racing block if races already exist, and upserts the
 * Amashuri competitions by name so re-runs don't duplicate.
 *
 * Run:  npx ts-node prisma/seed-racing.ts   (or: node -r ts-node/register ...)
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const now = Date.now();
const days = (d: number) => new Date(now + d * 86400000);
const hours = (h: number) => new Date(now + h * 3600000);

const secToTime = (s: number) =>
  `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// ── athlete / club pools (identification data, not trademarked artwork) ──────
const CYCLISTS = [
  { fullName: 'Moïse Mugisha', club: 'Team Rwanda' },
  { fullName: 'Éric Muhoza', club: 'Benediction Ignite CT' },
  { fullName: 'Jean Bosco Nsengimana', club: 'Java Cycling Team' },
  { fullName: 'Samuel Niyonkuru', club: 'Team Rwanda' },
  { fullName: 'Didier Munyaneza', club: 'ARCC Kigali' },
  { fullName: 'Renus Byiza Uhiriwe', club: 'Benediction Ignite CT' },
  { fullName: 'Patrick Byukusenge', club: 'Les Amis Sportif' },
  { fullName: 'Bonaventure Uwizeyimana', club: 'Java Cycling Team' },
  { fullName: 'Xavier Cyusa', club: 'ARCC Kigali' },
  { fullName: 'Vincent Muhire', club: 'Ejo Heza CT' },
  { fullName: 'Camera Hakuzimana', club: 'Team Rwanda' },
  { fullName: 'Joseph Areruya', club: 'Benediction Ignite CT' },
];
const ATHLETES = [
  { fullName: 'Yves Nimubona', club: 'APR Athletics' },
  { fullName: 'John Hakizimana', club: 'Police Athletics' },
  { fullName: 'Salomé Nyirarukundo', club: 'Rayon Sports AC' },
  { fullName: 'Marthe Yankurije', club: 'Amagaju AC' },
  { fullName: 'Noël Hitimana', club: 'APR Athletics' },
  { fullName: 'Claudette Mukasakindi', club: 'Police Athletics' },
  { fullName: 'Égide Ntwari', club: 'Rayon Sports AC' },
  { fullName: 'Alphonse Uwiragiye', club: 'Amagaju AC' },
];

const CYC_PTS = [25, 20, 16, 13, 10, 8, 6, 4, 2, 1];
const ATH_PTS = [8, 7, 6, 5, 4, 3, 2, 1];

const stageResult = (riders: any[], baseSec: number, spread: number) =>
  riders.slice(0, 10).map((r, i) => ({
    position: i + 1,
    athlete: { fullName: r.fullName },
    club: { name: r.club },
    time: secToTime(baseSec + i * spread + i * i),
    gap: i === 0 ? '—' : `+${i * spread + i * i}s`,
    points: CYC_PTS[i] || 1,
  }));

const eventResult = (athletes: any[], base: number, step: number, unit: 's' | 'm') =>
  athletes.slice(0, 8).map((a, i) => ({
    position: i + 1,
    athlete: { fullName: a.fullName },
    club: { name: a.club },
    mark: unit === 's' ? `${(base + i * step).toFixed(2)}` : `${(base - i * step).toFixed(2)} m`,
    points: ATH_PTS[i] || 0,
  }));

async function ensureLeague(sportId: number, name: string) {
  const existing = await prisma.league.findFirst({ where: { sportId, name } });
  if (existing) return existing;
  return prisma.league.create({
    data: { name, sportId, season: '2025/2026', status: 'ACTIVE', level: 'NATIONAL', active: true },
  });
}

async function seedRacing() {
  const raceCount = await prisma.race.count();
  if (raceCount > 0) {
    console.log(`↷ racing: ${raceCount} races already present — skipping race/classification seed`);
    return;
  }

  // ── CYCLING — Tour du Rwanda (UCI 2.1 stage race) ──
  const tour = await ensureLeague(9, 'Tour du Rwanda');
  const cyclingRaces = [
    { name: 'Stage 1 — Kigali City Circuit', discipline: 'Flat', distanceKm: 120, date: days(-2), status: 'COMPLETED', results: stageResult(CYCLISTS, 3 * 3600 + 2 * 60, 4) },
    { name: 'Stage 2 — Kigali → Musanze', discipline: 'Mountain', distanceKm: 142, date: days(-1), status: 'COMPLETED', results: stageResult([...CYCLISTS].reverse(), 3 * 3600 + 40 * 60, 6) },
    { name: 'Stage 3 — Musanze → Rubavu', discipline: 'Hilly', distanceKm: 138, date: hours(3), status: 'SCHEDULED', results: [] },
    { name: 'Stage 4 — Rubavu → Karongi', discipline: 'Mountain', distanceKm: 150, date: days(1), status: 'SCHEDULED', results: [] },
    { name: 'Stage 5 — Individual Time Trial', discipline: 'ITT', distanceKm: 32, date: days(2), status: 'SCHEDULED', results: [] },
    { name: 'Stage 6 — Kigali Finale', discipline: 'Flat', distanceKm: 98, date: days(3), status: 'SCHEDULED', results: [] },
  ];
  await prisma.race.createMany({
    data: cyclingRaces.map((r, i) => ({ ...r, sportId: 9, competitionId: tour.id, sortOrder: i })),
  });
  await prisma.classification.upsert({
    where: { competitionId: tour.id },
    update: {},
    create: {
      competitionId: tour.id,
      title: 'General Classification',
      identityLabel: 'Rider',
      valueColumns: ['Time', 'Gap'],
      rows: CYCLISTS.slice(0, 12).map((r, i) => ({
        rank: i + 1, name: r.fullName, sub: r.club,
        values: [secToTime(11 * 3600 + 41 * 60 + i * 23), i === 0 ? '—' : `+${i * 23}s`],
      })),
    },
  });

  // ── ATHLETICS — National Championship (track & field) ──
  const champ = await ensureLeague(13, 'National Athletics Championship');
  const athleticsRaces = [
    { name: 'Men 100m — Final', discipline: '100m', unit: 's', date: days(-1), status: 'COMPLETED', results: eventResult(ATHLETES, 10.24, 0.09, 's') },
    { name: 'Women 800m — Final', discipline: '800m', unit: 's', date: days(-1), status: 'COMPLETED', results: eventResult([...ATHLETES].reverse(), 124.5, 0.8, 's') },
    { name: 'Men Long Jump — Final', discipline: 'Long Jump', unit: 'm', date: hours(4), status: 'SCHEDULED', results: [] },
    { name: 'Men 1500m — Final', discipline: '1500m', unit: 's', date: days(1), status: 'SCHEDULED', results: [] },
    { name: 'Women Javelin — Final', discipline: 'Javelin', unit: 'm', date: days(2), status: 'SCHEDULED', results: [] },
  ];
  await prisma.race.createMany({
    data: athleticsRaces.map((r, i) => ({ ...r, sportId: 13, competitionId: champ.id, sortOrder: i })),
  });
  const clubs = ['APR Athletics', 'Police Athletics', 'Rayon Sports AC', 'Amagaju AC'];
  const medals = clubs
    .map((name, i) => { const g = [6, 4, 3, 2][i]; const s = [3, 5, 2, 4][i]; const b = [2, 3, 5, 3][i]; return { name, g, s, b, pts: g * 3 + s * 2 + b }; })
    .sort((a, b) => b.pts - a.pts);
  await prisma.classification.upsert({
    where: { competitionId: champ.id },
    update: {},
    create: {
      competitionId: champ.id,
      title: 'Medal Table',
      identityLabel: 'Club',
      valueColumns: ['G', 'S', 'B', 'Pts'],
      rows: medals.map((r, i) => ({ rank: i + 1, name: r.name, values: [r.g, r.s, r.b, r.pts] })),
    },
  });

  console.log(`✓ racing: seeded ${cyclingRaces.length + athleticsRaces.length} races + 2 classifications`);
}

async function seedAmashuriSports() {
  // The school hub's "Pick a sport" tiles are derived from AkcCompetition.sportId.
  // Give the one null-sport competition a home, then add a spread of school
  // championships across sports so the tiles read as a real ecosystem.
  await prisma.akcCompetition.updateMany({ where: { sportId: null }, data: { sportId: 2 } });

  const wanted = [
    { name: 'Rwanda Schools Volleyball League', sportId: 3, level: 'NATIONAL', status: 'ONGOING' },
    { name: 'Southern Province Schools Handball', sportId: 4, level: 'PROVINCE', status: 'ONGOING' },
    { name: 'National Schools Athletics Meet', sportId: 13, level: 'NATIONAL', status: 'UPCOMING' },
    { name: 'Kigali Schools Basketball League', sportId: 2, level: 'DISTRICT', status: 'ONGOING' },
    { name: 'Inter-School Rugby Sevens', sportId: 5, level: 'NATIONAL', status: 'UPCOMING' },
  ];
  let added = 0;
  for (const c of wanted) {
    const exists = await prisma.akcCompetition.findFirst({ where: { name: c.name } });
    if (exists) { if (exists.sportId == null) await prisma.akcCompetition.update({ where: { id: exists.id }, data: { sportId: c.sportId } }); continue; }
    await prisma.akcCompetition.create({ data: { name: c.name, sportId: c.sportId, level: c.level as any, status: c.status as any } });
    added += 1;
  }
  console.log(`✓ amashuri: sport tiles ready (+${added} competitions)`);
}

(async () => {
  try {
    await seedRacing();
    await seedAmashuriSports();
    console.log('Phase 3 seed complete.');
  } catch (e) {
    console.error('Phase 3 seed failed:', e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
