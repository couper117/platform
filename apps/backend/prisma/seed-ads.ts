/**
 * Seeds the advertising inventory.
 *
 * WHY THIS EXISTS. The public app declares fifteen page placements plus a gutter
 * takeover, each asking for a position by name — `home`, `home-lg`, `fixtures`,
 * `fixtures-rail`, `side-left` and so on. The base seed carried four ads under
 * the old `HOME_BANNER` / `SPOTLIGHT_BANNER` / `SIDEBAR` names, so against the
 * real API every slot in the app resolved empty and collapsed. The demo dataset
 * had the full book, which is why the two looked so different.
 *
 * A PLACEMENT IS A SHAPE, so each one gets the creative built for it:
 *   `-lg`  728x90 leaderboard above a desktop content column
 *   (bare) 320x100 mobile banner in a phone column
 *   `-mr`  300x250 rectangle in a desktop rail
 *   `-sk` / `-skn`  160x600 and 120x600 gutter skyscrapers
 * The files are produced by scripts/make-ad-creatives.mjs and served from the
 * frontend's /public/ads, so the paths here are site-root relative.
 *
 * THE SPONSOR ROTATES BY PLACEMENT. The same banner on fifteen screens reads as
 * a house ad rather than as sold space, so the book walks the advertiser list;
 * a page with both a leaderboard and a rail draws two different ones. The two
 * takeover advertisers sit outside that rotation entirely, because the gutter
 * pair is beside every page and would otherwise collide with a page banner.
 *
 * Idempotent: every row is upserted on its position, so re-running replaces the
 * booking rather than stacking duplicates. Run with `npm run seed:ads`.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SPONSORS = [
  { key: 'inyange', title: 'Inyange Industries — Official Hydration Partner' },
  { key: 'bk-arena', title: 'BK Arena — Matchday Experience' },
  { key: 'mtn', title: 'MTN Rwanda — Powering the League' },
  { key: 'bank-of-kigali', title: 'Bank of Kigali — Backing Rwandan Athletes' },
  { key: 'rwandair', title: 'RwandAir — Official Airline Partner' },
  { key: 'skol', title: 'Skol Brewery — Proud Sponsor' },
];

/** Takeover-only, so the gutter never carries the same brand as the page banner. */
const TAKEOVER = [
  { key: 'primus', title: 'Primus — The Beer of Rwandan Football' },
  { key: 'canal-plus', title: 'CANAL+ — Every Match, Live' },
];

/** `rail: true` also mints `<name>-rail`, for the screens with a desktop sidebar. */
const PLACEMENTS: Array<{ name: string; rail: boolean }> = [
  { name: 'home', rail: false },
  { name: 'fixtures', rail: true },
  { name: 'sports', rail: false },
  { name: 'sport', rail: true },
  { name: 'leagues', rail: false },
  { name: 'league', rail: false },
  { name: 'teams', rail: false },
  { name: 'club', rail: false },
  { name: 'news', rail: false },
  { name: 'article', rail: false },
  { name: 'match', rail: false },
  { name: 'player', rail: false },
  { name: 'calendar', rail: false },
  { name: 'amashuri', rail: true },
  { name: 'school', rail: false },
];

type Row = { position: string; title: string; imageUrl: string };

const book: Row[] = [];
PLACEMENTS.forEach((p, i) => {
  const sponsor = SPONSORS[i % SPONSORS.length];
  // The rail takes a different advertiser from the banner on the same screen.
  const railSponsor = SPONSORS[(i + 3) % SPONSORS.length];
  book.push({ position: p.name, title: sponsor.title, imageUrl: `/ads/${sponsor.key}-mb.jpg` });
  book.push({ position: `${p.name}-lg`, title: sponsor.title, imageUrl: `/ads/${sponsor.key}-lg.jpg` });
  if (p.rail) {
    book.push({ position: `${p.name}-rail`, title: railSponsor.title, imageUrl: `/ads/${railSponsor.key}-mr.jpg` });
  }
});

book.push(
  { position: 'side-left', title: TAKEOVER[0].title, imageUrl: `/ads/${TAKEOVER[0].key}-sk.jpg` },
  { position: 'side-right', title: TAKEOVER[1].title, imageUrl: `/ads/${TAKEOVER[1].key}-sk.jpg` },
  { position: 'side-left-narrow', title: TAKEOVER[0].title, imageUrl: `/ads/${TAKEOVER[0].key}-skn.jpg` },
  { position: 'side-right-narrow', title: TAKEOVER[1].title, imageUrl: `/ads/${TAKEOVER[1].key}-skn.jpg` },
);

async function main() {
  for (const row of book) {
    const existing = await prisma.ad.findFirst({ where: { position: row.position } });
    if (existing) {
      await prisma.ad.update({
        where: { id: existing.id },
        data: { ...row, targetUrl: 'https://example.com', active: true },
      });
    } else {
      await prisma.ad.create({
        data: { ...row, targetUrl: 'https://example.com', active: true },
      });
    }
  }
  const total = await prisma.ad.count();
  console.log(`✓ Ad inventory seeded: ${book.length} placement(s) booked, ${total} ad row(s) in total.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
