// Club crests for the teams the other seeders cannot supply.
//
// The basketball clubs get theirs from the RBL extraction, because AfroBasket
// publishes them. Nothing equivalent exists for Rwandan football, so these were
// found one club at a time, and each URL in the data file was verified to return
// HTTP 200 with an image content type before it was written down.
//
// FILLS GAPS ONLY. A club that already has a crest keeps it — the client chose
// APR BBC's, and seed-rbl-basketball wrote the rest. This seeder never overwrites.
//
// A CLUB WITHOUT A VERIFIED CREST IS LEFT ALONE, deliberately. The app draws an
// original shield from the club's initials and colours when `logo` is null
// (utils/crest.ts), which is a considered fallback rather than a gap — and a WRONG
// crest on a national sports platform is worse than a generated one.
//
//   npx tsx prisma/seed-team-logos.ts
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type Entry = {
  /** The team's name exactly as it appears in this database. */
  team: string;
  sportId: number;
  logo: string;
  /** Where it came from, so a broken link later can be traced. */
  source?: string;
  /** Set when the file is non-free (fair use) and the client accepted that. */
  licence?: string;
};

const main = async () => {
  const file = path.join(__dirname, 'data', 'team-logos.json');
  if (!fs.existsSync(file)) {
    console.log('no team-logos.json — nothing to do');
    return;
  }
  const entries: Entry[] = JSON.parse(fs.readFileSync(file, 'utf8'));

  let set = 0;
  let kept = 0;
  const missing: string[] = [];

  for (const e of entries) {
    const team = await prisma.team.findFirst({
      where: { name: e.team, sportId: e.sportId },
      select: { id: true, name: true, logo: true },
    });

    if (!team) {
      missing.push(e.team);
      continue;
    }
    if (team.logo) {
      kept += 1;
      continue;
    }

    await prisma.team.update({ where: { id: team.id }, data: { logo: e.logo } });
    set += 1;
  }

  console.log(`crests set: ${set}`);
  console.log(`clubs that already had one, left alone: ${kept}`);
  if (missing.length) console.log(`named in the file but not in the database: ${missing.join(', ')}`);

  const stillBare = await prisma.team.count({ where: { active: true, logo: null } });
  console.log(`active clubs still on a generated shield: ${stillBare}`);
};

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
