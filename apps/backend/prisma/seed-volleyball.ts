// The Rwanda Volleyball League — the clubs of the FRVB Serie A.
//
// SOURCE: the federation's own fixture pages (frvb.rw), which name clubs only by
// abbreviation — REG, APR, PVC, EAU, RPN, KEP, GVC, KVC in the men's competition
// and WSD, RPH, RVC, RRA alongside some of those in the women's. Every full name in
// prisma/data/rwanda-volleyball.json was confirmed against the federation, the club
// itself or Rwandan national press before it was written down; an abbreviation
// expanded by guesswork is exactly the kind of plausible-looking error a national
// platform should never publish, so a club whose name could not be confirmed is
// absent rather than invented.
//
// Idempotent. A club already in the database is matched by `matchExisting` — an
// explicit name, never a fuzzy comparison — so re-running updates rather than
// creating a second copy.
//
//   npx tsx prisma/seed-volleyball.ts
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const VOLLEYBALL_SPORT_ID = 3;

type Club = {
  /** The federation's abbreviation, which becomes the club's short name. */
  code: string;
  name: string;
  city?: string | null;
  /** 'men', 'women' or 'both' — recorded in the description, not as a flag. */
  gender?: string;
  logo?: string | null;
  /** The exact name of a club already in this database that this one IS. */
  matchExisting?: string;
  source?: string;
};

const main = async () => {
  const file = path.join(__dirname, 'data', 'rwanda-volleyball.json');
  if (!fs.existsSync(file)) {
    console.log('no rwanda-volleyball.json — nothing to do');
    return;
  }
  const clubs: Club[] = JSON.parse(fs.readFileSync(file, 'utf8'));

  const league = await prisma.league.findFirst({
    where: { sportId: VOLLEYBALL_SPORT_ID, name: { contains: 'Volleyball League', mode: 'insensitive' } },
  });
  if (!league) throw new Error('Rwanda Volleyball League not found — seed the base data first.');

  let created = 0;
  let updated = 0;

  for (const c of clubs) {
    let team = await prisma.team.findFirst({
      where: { sportId: VOLLEYBALL_SPORT_ID, name: c.matchExisting ?? c.name },
    });

    if (!team) {
      team = await prisma.team.create({
        data: {
          name: c.name,
          shortName: c.code,
          sportId: VOLLEYBALL_SPORT_ID,
          city: c.city ?? null,
          logo: c.logo ?? null,
          status: 'VERIFIED',
          verifiedAt: new Date(),
          active: true,
        },
      });
      created += 1;
    } else {
      await prisma.team.update({
        where: { id: team.id },
        data: {
          // The confirmed name wins over whatever the base seed guessed, but a
          // crest already on file is never overwritten.
          name: c.name,
          shortName: c.code,
          city: c.city ?? team.city,
          ...(team.logo ? {} : { logo: c.logo ?? null }),
        },
      });
      updated += 1;
    }

    await prisma.leagueTeam.upsert({
      where: { leagueId_teamId: { leagueId: league.id, teamId: team.id } },
      update: {},
      create: { leagueId: league.id, teamId: team.id },
    });
  }

  const withCrest = clubs.filter((c) => c.logo).length;
  console.log(`clubs: ${created} created, ${updated} matched to existing`);
  console.log(`${withCrest} of ${clubs.length} have a verified crest; the rest draw a generated shield`);
};

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
