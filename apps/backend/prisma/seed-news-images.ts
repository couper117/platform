/**
 * Gives every news article a picture that actually loads.
 *
 * TWO THINGS WERE WRONG. Every article carried the SAME cover — one Unsplash
 * URL, repeated six times — so the news page showed one photograph beside itself
 * five times over. And it was remote, which is worse than repetitive: on a
 * Rwandan mobile network, or any connection that cannot reach images.unsplash.com,
 * every card renders a broken-image icon. On this machine none of the six loaded.
 *
 * The frontend already ships verified Rwandan sport photography in /public/hero
 * and /public/amashuri for exactly this reason — nothing on the public pages
 * needs the network. These are site-root paths into that set, matched to what
 * each story is about: a basketball result gets basketball, a schools story gets
 * the schools set, a transfer gets football.
 *
 * Matching is by keyword against the title, so it keeps working as the newsroom
 * adds stories rather than being a hard-coded list of six. Anything unmatched
 * falls back to the sport the article is filed under, then to football.
 *
 * Idempotent — run with `npm run seed:news-images`, folded into seed:all.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Sport slug → the photograph shipped for it. */
const BY_SPORT: Record<string, string> = {
  football: '/hero/football.jpg',
  basketball: '/hero/basketball.jpg',
  volleyball: '/hero/volleyball.jpg',
  athletics: '/hero/athletics.jpg',
  cycling: '/hero/cycling.jpg',
  handball: '/hero/handball.jpg',
  netball: '/hero/netball.jpg',
  swimming: '/hero/swimming.jpg',
  tennis: '/hero/tennis.jpg',
  judo: '/hero/judo.jpg',
  boxing: '/hero/boxing.jpg',
  chess: '/hero/chess.jpg',
};

/**
 * Keyword → photograph, most specific first. A story about the school games is
 * about schools whatever sport it names, so those patterns are tested before the
 * sport ones.
 */
const BY_KEYWORD: Array<[RegExp, string]> = [
  [/amashuri|school|inter-school|youth/i, '/amashuri/youth-basketball.jpg'],
  [/basketball|bbc\b|patriots|reg\b/i, '/hero/basketball.jpg'],
  [/volleyball|\bvc\b/i, '/hero/volleyball.jpg'],
  [/athletic|marathon|sprint|track/i, '/hero/athletics.jpg'],
  [/cycl|tour du rwanda|peloton/i, '/hero/cycling.jpg'],
  [/handball/i, '/hero/handball.jpg'],
  [/netball/i, '/hero/netball.jpg'],
  [/swim/i, '/hero/swimming.jpg'],
  [/tennis/i, '/hero/tennis.jpg'],
  [/judo|karate|taekwondo/i, '/hero/judo.jpg'],
  [/box|wrestl|kickbox/i, '/hero/boxing.jpg'],
  [/chess/i, '/hero/chess.jpg'],
  // Football last of the sports: "APR" and "Rayon" appear in basketball stories
  // too, so the more specific patterns above get first refusal.
  [/football|fc\b|apr|rayon|police|premier league|transfer|striker|midfield/i, '/hero/football.jpg'],
];

const pick = (title: string, sportSlug?: string | null) => {
  for (const [re, img] of BY_KEYWORD) if (re.test(title)) return img;
  if (sportSlug && BY_SPORT[sportSlug]) return BY_SPORT[sportSlug];
  return '/hero/football.jpg';
};

async function main() {
  const articles = await prisma.news.findMany({
    include: { league: { include: { sport: true } } },
  });

  let changed = 0;
  for (const a of articles) {
    const image = pick(a.title ?? '', a.league?.sport?.slug);
    if (a.coverImage === image) continue;
    await prisma.news.update({ where: { id: a.id }, data: { coverImage: image } });
    changed += 1;
    console.log(`  ${String(a.title).slice(0, 46).padEnd(48)} → ${image}`);
  }

  console.log(`✓ News covers: ${changed} of ${articles.length} article(s) repointed at local photography.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
