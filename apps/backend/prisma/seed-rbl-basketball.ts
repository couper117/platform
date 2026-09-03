// The Rwanda Basketball League — every club, their crests, and the squads that
// have been published for 2026.
//
// WHICH CLUBS ARE IN IT is the client's list, not the source's. AfroBasket's league
// page links twenty clubs, but that set includes sides that are not in the 2026
// competition — 30 Plus, Dar City, the three IPRCs, Rusizi, Shoot For The Stars,
// the two UR sides and Rivers Royal Hoopers — most of which had published nothing
// since 2020-2022. The competition is these nine, and prisma/data/rbl-2026.json
// holds exactly them.
//
// SOURCE: basketball.afrobasket.com, extracted once into prisma/data/rbl-2026.json.
// The seeder reads that file and never fetches: a seed that depends on a third
// party is a seed that fails on a bad day, and extracted data belongs in review
// like any other fixture data. Re-extract with scripts/extract-rbl.py.
//
// WHAT IS NOT HERE. Per-game statistics: those live behind a remapped font on the
// source's stats pages, and a guessed decode would put false figures under the
// ministry's name. They are entered through the admin instead.
//
// Idempotent. Clubs are matched to the four that already existed by an explicit
// alias, never by fuzzy name matching, so re-running updates rather than
// duplicating.
//
//   npx tsx prisma/seed-rbl-basketball.ts
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BASKETBALL_SPORT_ID = 2;
const LEAGUE_NAME = 'Rwanda Basketball League';

/**
 * AfroBasket's club name -> the name already in this database.
 *
 * Explicit, because fuzzy matching is how you end up with two Patriots. Anything
 * not listed here is a club the platform did not have and gets created.
 */
const ALIAS: Record<string, string> = {
  'APR Basketball Club Kigali': 'APR BBC',
  'Espoir BBC Kigali': 'Espoir BBC',
  'Patriots Basketball Club Kigali': 'Patriots BBC',
  'Rwanda Energy Group Kigali': 'REG BBC',
};

/** The city is in most club names; taking it from there beats inventing one. */
const CITIES = ['Kigali', 'Huye', 'Musanze', 'Cyangugu', 'Rusizi', 'Rubavu', 'Nyagatare'];
const cityOf = (name: string) => CITIES.find((c) => name.includes(c)) ?? null;

/** "Tigers BB Kigali" -> "TIG". Only used when a club is created. */
const shortNameOf = (name: string) =>
  name
    .replace(/[^A-Za-z0-9\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter((w) => w && !/^(BBC|BB|BC|Basketball|Club|Team|Kigali|Huye|Musanze|Cyangugu|The|Of|For)$/i.test(w))
    .map((w) => w[0])
    .join('')
    .slice(0, 4)
    .toUpperCase() || name.slice(0, 3).toUpperCase();

type SourcePlayer = {
  name: string;
  number: number | null;
  heightCm: number | null;
  position: string | null;
  nationality: string | null;
  fromYear: number | null;
  previousClub: string | null;
  previousCountry: string | null;
  photo: string | null;
};

type SourceTeam = {
  season: number | null;
  sourceId: string;
  name: string;
  logo: string | null;
  players: SourcePlayer[];
};

const main = async () => {
  const file = path.join(__dirname, 'data', 'rbl-2026.json');
  const teams: SourceTeam[] = JSON.parse(fs.readFileSync(file, 'utf8'));

  const league = await prisma.league.findFirst({
    where: { sportId: BASKETBALL_SPORT_ID, name: { contains: 'Basketball League', mode: 'insensitive' } },
  });
  if (!league) throw new Error(`${LEAGUE_NAME} not found — seed the base data first.`);

  let clubsCreated = 0;
  let clubsUpdated = 0;
  let playersCreated = 0;
  let playersUpdated = 0;
  let retired = 0;

  for (const src of teams) {
    const localName = ALIAS[src.name] ?? src.name;

    let team = await prisma.team.findFirst({
      where: { sportId: BASKETBALL_SPORT_ID, name: localName },
    });

    if (!team) {
      team = await prisma.team.create({
        data: {
          name: localName,
          shortName: shortNameOf(localName),
          sportId: BASKETBALL_SPORT_ID,
          city: cityOf(localName),
          logo: src.logo,
          status: 'VERIFIED',
          verifiedAt: new Date(),
          active: true,
        },
      });
      clubsCreated += 1;
    } else {
      // The crest only fills a gap. APR's was chosen by the client and must not be
      // replaced by the source's.
      if (!team.logo && src.logo) {
        team = await prisma.team.update({ where: { id: team.id }, data: { logo: src.logo } });
      }
      clubsUpdated += 1;
    }

    // In the league, so the club appears in the table and the fixture filters.
    await prisma.leagueTeam.upsert({
      where: { leagueId_teamId: { leagueId: league.id, teamId: team.id } },
      update: {},
      create: { leagueId: league.id, teamId: team.id },
    });

    if (src.players.length === 0) continue;

    const seededIds: number[] = [];

    for (const sp of src.players) {
      const data = {
        teamId: team.id,
        fullName: sp.name,
        height: sp.heightCm,
        position: sp.position,
        jerseyNumber: sp.number,
        nationality: sp.nationality || 'Rwandan',
        photo: sp.photo,
        skillLevel: 'PROFESSIONAL' as const,
        status: 'VERIFIED' as const,
        verifiedAt: new Date(),
        active: true,
      };

      // Matched on name within the club rather than on squad number: a number is
      // reassigned between seasons, a name is the person.
      const existing = await prisma.player.findFirst({
        where: { teamId: team.id, fullName: sp.name },
      });

      const player = existing
        ? await prisma.player.update({ where: { id: existing.id }, data })
        : await prisma.player.create({ data });
      existing ? (playersUpdated += 1) : (playersCreated += 1);
      seededIds.push(player.id);

      // Career: where they came from, then this club. Rewritten each run so a
      // correction at the source replaces the history rather than appending to it.
      await prisma.playerCareer.deleteMany({ where: { playerId: player.id } });
      await prisma.playerCareer.createMany({
        data: [
          ...(sp.previousClub
            ? [{
                playerId: player.id,
                club: sp.previousClub,
                country: sp.previousCountry,
                toYear: sp.fromYear,
                current: false,
              }]
            : []),
          {
            playerId: player.id,
            club: team.name,
            country: 'Rwanda',
            fromYear: sp.fromYear,
            current: true,
          },
        ],
      });
    }

    /**
     * Anyone left on this club who is not in the published squad is retired, not
     * deleted. These are the placeholder players the base seed invented, and a real
     * roster should replace them — but deleting cascades through the lineups and
     * match events that reference them, which would rewrite matches that have
     * already been played. Deactivating hides them from every public list while
     * leaving the record of who appeared where intact.
     */
    const stale = await prisma.player.updateMany({
      where: { teamId: team.id, active: true, id: { notIn: seededIds } },
      data: { active: false },
    });
    retired += stale.count;
  }

  const withSquad = teams.filter((t) => t.players.length > 0).length;
  console.log(`clubs: ${clubsCreated} created, ${clubsUpdated} matched to existing`);
  console.log(`players: ${playersCreated} created, ${playersUpdated} updated`);
  console.log(`placeholder players retired: ${retired}`);
  console.log(`${withSquad} of ${teams.length} clubs have a 2026 squad published; the rest have crests only.`);
};

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
