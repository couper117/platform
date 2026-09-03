// APR Basketball Club Kigali — the identity the CLIENT chose.
//
// The squad, the crests and the career histories for every RBL club now come from
// seed-rbl-basketball, which reads one extracted file. This seeder is what the
// client asked for on top of that and what the source cannot know: the crest they
// supplied, the club's own channels, and colours taken from that crest rather than
// from APR's football side — the basketball club's mark is black and white, so a
// green band behind it looked like two different clubs on one page.
//
// Runs AFTER seed-rbl-basketball so these choices win.
//
//   npx tsx prisma/seed-apr-basketball.ts
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Supplied by the client.
const LOGO = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSVVe2e0dHLoveGM8OYwNKz0aQYpZE8QVUxptL9WKDM81r93R-AZboGDnHT&s=10';

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

/**
 * The club's colours, taken from the crest rather than from the parent club.
 *
 * APR's football side plays in green and the whole APR family is seeded that way,
 * but the basketball club's mark is black and white — so a green band behind a
 * monochrome crest looked like two different clubs on one page. A soft charcoal
 * carries the crest without competing with it, with silver for the accent line.
 */
const PRIMARY = '#23262B';
const SECONDARY = '#D9DCE1';

const main = async () => {
  const team = await prisma.team.findFirst({
    where: { name: { contains: 'APR', mode: 'insensitive' }, sportId: 2 },
  });
  if (!team) throw new Error('APR basketball team not found — run seed-rbl-basketball first.');

  await prisma.team.update({
    where: { id: team.id },
    data: { logo: LOGO, primaryColor: PRIMARY, secondaryColor: SECONDARY, socials: SOCIALS, website: WEBSITE },
  });

  console.log(`${team.name} (#${team.id}): client crest, charcoal/silver colours and club channels applied`);
};

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
