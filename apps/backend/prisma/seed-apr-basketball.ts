// APR Basketball Club Kigali — the 2026 roster, from the club's AfroBasket page.
//
//   https://basketball.afrobasket.com/team/APR-Basketball-Club-Kigali/22625/Roster
//
// The source lists height in a run-together form — "1956 '5''" — which is 195 cm
// followed by 6'5". Only the centimetres are stored; the imperial figure is the
// same measurement written twice and the UI derives it when it wants it.
//
// WHAT IS AND IS NOT HERE. Squad number, name, height, position, nationality, the
// year they joined and the club they came from are all on the source page and are
// stored. Ages are listed there too but a birth DATE is not, and the schema stores
// `dateOfBirth`, not an age — so nothing is written rather than back-computing a
// birthday nobody published. Per-game averages (points, rebounds, assists) are not
// on the roster page either: they belong to a box score this platform does not yet
// record, so the profile shows the facts it has instead of inventing three numbers.
//
// Idempotent — matched on squad number within the club, so re-running updates the
// same fifteen players rather than creating a second squad.
//
//   npx tsx prisma/seed-apr-basketball.ts
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Supplied by the client.
const LOGO = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSVVe2e0dHLoveGM8OYwNKz0aQYpZE8QVUxptL9WKDM81r93R-AZboGDnHT&s=10';

/**
 * The club's colours, taken from the crest rather than from the parent club.
 *
 * APR's football side plays in green and the whole APR family is seeded that way,
 * but the basketball club's mark is black and white — so a green band behind a
 * monochrome crest looked like two different clubs on one page. A soft charcoal
 * carries the crest without competing with it, with silver for the accent line.
 */
/**
 * The club's own channels. APR BBC is on X and Instagram as @APR_BBC and the
 * parent club runs aprfc.rw; anything the club later corrects is edited in the
 * admin (Teams -> the link icon), which writes the same `socials` column.
 */
const SOCIALS = {
  x: 'https://x.com/APR_BBC',
  instagram: 'https://www.instagram.com/apr_bbc/',
  facebook: 'https://www.facebook.com/APRBBC/',
};
const WEBSITE = 'https://aprfc.rw';

const PRIMARY = '#23262B';
const SECONDARY = '#D9DCE1';

// AfroBasket's position codes, written out. A squad list that says "PG" is fine for
// a fan who already follows the sport; a national platform is read by people who do
// not, and the full word costs nothing.
const POSITION: Record<string, string> = {
  PG: 'Point Guard',
  SG: 'Shooting Guard',
  G: 'Guard',
  F: 'Forward',
  C: 'Center',
};

/**
 * Headshots, hotlinked from EuroBasket at the client's direction.
 *
 * The file name is Surname_Firstname_N, and N is not always 1 — Teafale Lenard's
 * is _2 — so the whole file name is written out per player rather than derived.
 * Most are 110x150 PNGs with an alpha channel; Craig Randall's is a 55x75 JPEG on
 * white. The hero frames them all on a light card so a cut-out and a
 * white-background photo sit side by side without one looking like a mistake.
 *
 * These are EuroBasket's images on EuroBasket's servers. They are not licensed to
 * this platform and they break silently if the site reorganises — flagged to the
 * client, who asked for them anyway. The hero falls back to the monogram if one
 * fails to load, and swapping to hosted files later is a change to this map alone.
 */
const PHOTO = (file: string) => `https://www.eurobasket.com/photos/${file}`;

type Row = {
  no: number;
  name: string;
  /** Centimetres. Null where the source lists no height. */
  height: number | null;
  pos: keyof typeof POSITION | null;
  nationality: string;
  /** The year they joined APR, per the source's "from" column. */
  since: number;
  /** Where they came from: [club, country]. */
  from: [string, string] | null;
  /** EuroBasket's file name, where a photo exists. The index varies. */
  photo?: string;
};

const ROSTER: Row[] = [
  { no: 7, name: 'Adonis Filer-Jovon', height: 195, pos: 'PG', nationality: 'USA / Rwanda', since: 2024, from: ['REG', 'Rwanda'], photo: 'Filer_Adonis_1.png' },
  { no: 12, name: 'Craig Randall II', height: 193, pos: 'SG', nationality: 'USA', since: 2026, from: ['Tigers', 'Rwanda'], photo: 'Randall_Craig_1.jpg' },
  { no: 24, name: 'Teafale Lenard Jr.', height: 203, pos: 'F', nationality: 'USA', since: 2026, from: ['Tigers', 'Rwanda'], photo: 'Lenard_Teafale_2.png' },
  { no: 15, name: 'Ntore Habimana', height: 196, pos: 'F', nationality: 'Rwandan', since: 2026, from: ['Tigers', 'Rwanda'], photo: 'Habimana_Ntore_1.png' },
  { no: 34, name: 'Dieudonne Ndizeye', height: 201, pos: 'SG', nationality: 'Rwandan', since: 2026, from: ['Tigers', 'Rwanda'], photo: 'Ndizeye_Dieudonne_1.png' },
  { no: 31, name: 'Mouhamadou Diagne', height: 203, pos: 'F', nationality: 'Senegal / France', since: 2026, from: ['Chipola JC', 'USA'] },
  { no: 8, name: 'Jean-Victor Mukama', height: 203, pos: 'G', nationality: 'Rwandan', since: 2025, from: ['REG', 'Rwanda'], photo: 'Mukama_Jean-Victor_1.png' },
  { no: 6, name: 'William Robeyns', height: 192, pos: 'SG', nationality: 'Rwandan', since: 2025, from: ['APR', 'Rwanda'], photo: 'Robeyns_William_1.png' },
  { no: 11, name: 'Jean Nshobouzoua', height: 193, pos: 'G', nationality: 'Rwandan', since: 2024, from: ['REG', 'Rwanda'] },
  { no: 30, name: 'Justin Uwitonze', height: 191, pos: 'SG', nationality: 'Rwandan', since: 2025, from: ['REG', 'Rwanda'] },
  { no: 55, name: 'Osborn Shema', height: 213, pos: 'C', nationality: 'Rwandan', since: 2024, from: ['Iona', 'USA'], photo: 'Shema_Osborn_1.png' },
  { no: 2, name: 'Prince Twa', height: 193, pos: 'G', nationality: 'Rwandan', since: 2026, from: ['UT Tyler', 'USA'] },
  { no: 21, name: 'Axel Mpoyo', height: null, pos: null, nationality: 'Rwandan', since: 2026, from: null },
  { no: 3, name: 'Alvin Icyogere', height: 203, pos: 'G', nationality: 'Canada', since: 2026, from: ['Ottawa', 'Canada'] },
];

const main = async () => {
  const team = await prisma.team.findFirst({
    where: { name: { contains: 'APR', mode: 'insensitive' }, sportId: 2 },
  });
  if (!team) throw new Error('APR basketball team not found — seed the base data first.');

  await prisma.team.update({
    where: { id: team.id },
    data: { logo: LOGO, primaryColor: PRIMARY, secondaryColor: SECONDARY, socials: SOCIALS, website: WEBSITE },
  });
  console.log(`club: ${team.name} (#${team.id}) — logo and colours set`);

  let created = 0;
  let updated = 0;

  for (const r of ROSTER) {
    const data = {
      teamId: team.id,
      fullName: r.name,
      height: r.height,
      position: r.pos ? POSITION[r.pos] : null,
      jerseyNumber: r.no,
      nationality: r.nationality,
      photo: r.photo ? PHOTO(r.photo) : null,
      skillLevel: 'PROFESSIONAL' as const,
      status: 'VERIFIED' as const,
      verifiedAt: new Date(),
      active: true,
    };

    const existing = await prisma.player.findFirst({
      where: { teamId: team.id, jerseyNumber: r.no },
    });

    const player = existing
      ? (await prisma.player.update({ where: { id: existing.id }, data }), existing)
      : await prisma.player.create({ data });
    existing ? (updated += 1) : (created += 1);

    // Career: the club they came from, then APR. Rewritten each run so a correction
    // to the table above replaces the history rather than appending a second copy.
    await prisma.playerCareer.deleteMany({ where: { playerId: player.id } });
    await prisma.playerCareer.createMany({
      data: [
        ...(r.from
          ? [{ playerId: player.id, club: r.from[0], country: r.from[1], toYear: r.since, current: false }]
          : []),
        { playerId: player.id, club: team.name, country: 'Rwanda', fromYear: r.since, current: true },
      ],
    });
  }

  console.log(`players created: ${created}, updated: ${updated}`);
  console.log('note: ages are on the source page but birth dates are not, so none were written.');
};

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
