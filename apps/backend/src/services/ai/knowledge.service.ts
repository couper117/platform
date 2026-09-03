/**
 * What the assistant is allowed to know — assembled from this platform's own
 * database, every time it is asked something.
 *
 * ── Why retrieval and not fine-tuning, prompts full of facts, or a vector store ──
 * The requirement is that the assistant uses the application's real data and
 * never invents. A language model with no records in front of it will produce a
 * fluent, plausible league table, which is the worst possible failure for a
 * national sports register. So every request is answered against rows read
 * seconds earlier: a standing snapshot of the platform, plus targeted lookups
 * driven by the words in the question. Embeddings would buy semantic matching
 * over a corpus this does not have — the content is structured records with
 * names, and `contains` over indexed name columns finds them.
 *
 * ── The privacy line, and where it is drawn ──
 * Text sent to an AI provider leaves Rwanda unless the provider is self-hosted.
 * Law N° 058/2021 governs what may make that trip, so the context is built from
 * what the public site already publishes and nothing else:
 *
 *   INCLUDED  club and school names, fixtures, scores, standings, venues,
 *             competitions, published news, senior players' sporting details
 *             (name, position, shirt number, club, nationality).
 *   EXCLUDED  national ID and licence numbers, dates of birth, telephone
 *             numbers, e-mail addresses, home addresses, user accounts,
 *             documents, payments, contact-form messages, activity logs, and
 *             every field of a data-subject request.
 *   EXCLUDED, DELIBERATELY, EVEN THOUGH IT IS PUBLISHED  the Amashuri school
 *             athletes. They are children (art. 9), and "our own site shows it"
 *             is not the same permission as "a third-party processor abroad may
 *             be sent it". The assistant is given counts and directed to the
 *             athlete directory instead, which is the answer a person needs
 *             anyway.
 *
 * ── Cost ──
 * The standing snapshot is the same for everyone and changes slowly, so it is
 * cached for a minute; the per-question lookups are not cached and are bounded
 * by `take`. One question costs roughly a dozen indexed reads.
 */

const prisma = require('../../config/db');

// ── Formatting helpers ──────────────────────────────────────────────────────

/**
 * Dates go out as `YYYY-MM-DD HH:mm` in Kigali time with the offset stated.
 * A bare ISO-UTC string makes a model answer "19:00" for a 21:00 kick-off, and
 * nobody reading the reply can tell it was wrong.
 */
const KIGALI_OFFSET_MS = 2 * 60 * 60 * 1000; // UTC+2, no daylight saving

const when = (date) => {
  if (!date) return 'date TBC';
  const shifted = new Date(new Date(date).getTime() + KIGALI_OFFSET_MS);
  return `${shifted.toISOString().slice(0, 10)} ${shifted.toISOString().slice(11, 16)} (Kigali)`;
};

const day = (date) => (date ? new Date(new Date(date).getTime() + KIGALI_OFFSET_MS).toISOString().slice(0, 10) : 'TBC');

const list = (items) => items.filter(Boolean).join('\n');

const section = (title, body) => (body && body.trim() ? `\n## ${title}\n${body.trim()}` : '');

const scoreLine = (f) =>
  f.homeScore === null || f.homeScore === undefined ? 'vs' : `${f.homeScore}-${f.awayScore}`;

// ── The standing snapshot ───────────────────────────────────────────────────

let cache = { at: 0, text: '' };
const CACHE_MS = 60_000;

/**
 * What is true about the platform right now, regardless of what was asked.
 *
 * This is what lets the assistant answer "what's on this week" or "which sports
 * do you cover" without a lookup, and — more importantly — what stops it
 * answering those from imagination when the targeted search finds nothing.
 */
const buildSnapshot = async () => {
  const now = new Date();
  const soon = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);

  const [
    counts,
    sports,
    leagues,
    live,
    upcoming,
    recent,
    news,
    venues,
    akcCompetitions,
    akcUpcoming,
    races,
  ] = await Promise.all([
    Promise.all([
      prisma.sport.count({ where: { active: true } }),
      prisma.federation.count({ where: { active: true } }),
      prisma.league.count({ where: { active: true } }),
      prisma.team.count({ where: { active: true } }),
      prisma.team.count({ where: { status: 'VERIFIED', active: true } }),
      prisma.player.count({ where: { active: true } }),
      prisma.venue.count({ where: { active: true } }),
      prisma.akcSchool.count({ where: { active: true } }),
      prisma.akcTeam.count({ where: { active: true } }),
      prisma.akcPlayer.count({ where: { active: true } }),
      prisma.fixture.count(),
      prisma.news.count({ where: { published: true } }),
    ]),

    prisma.sport.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
      select: { name: true, slug: true, category: true, type: true, description: true },
    }),

    prisma.league.findMany({
      where: { active: true, status: { in: ['ACTIVE', 'UPCOMING'] } },
      orderBy: { id: 'asc' },
      take: 25,
      select: {
        id: true, name: true, season: true, gender: true, ageCategory: true,
        level: true, format: true, status: true,
        sport: { select: { name: true } },
        federation: { select: { name: true, abbreviation: true } },
        _count: { select: { teams: true } },
      },
    }),

    prisma.fixture.findMany({
      where: { status: 'LIVE' },
      take: 10,
      select: {
        id: true, matchDate: true, venue: true, homeScore: true, awayScore: true, status: true,
        homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } },
        league: { select: { name: true } },
      },
    }),

    prisma.fixture.findMany({
      where: { matchDate: { gte: now, lte: soon }, status: { in: ['SCHEDULED', 'CONFIRMED', 'RESCHEDULED'] } },
      orderBy: { matchDate: 'asc' },
      take: 15,
      select: {
        id: true, matchDate: true, venue: true, status: true, matchday: true,
        homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } },
        league: { select: { name: true, sport: { select: { name: true } } } },
      },
    }),

    prisma.fixture.findMany({
      where: { status: 'COMPLETED' },
      orderBy: { matchDate: 'desc' },
      take: 12,
      select: {
        id: true, matchDate: true, homeScore: true, awayScore: true,
        homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } },
        league: { select: { name: true } },
      },
    }),

    prisma.news.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { title: true, slug: true, excerpt: true, category: true, createdAt: true },
    }),

    prisma.venue.findMany({
      where: { active: true },
      take: 25,
      select: { name: true, city: true, province: true, capacity: true, surface: true },
    }),

    prisma.akcCompetition.findMany({
      where: { status: { in: ['UPCOMING', 'ONGOING'] } },
      orderBy: { startDate: 'asc' },
      take: 10,
      select: { name: true, edition: true, level: true, gender: true, ageCategory: true, venue: true, startDate: true, endDate: true, status: true },
    }),

    prisma.akcFixture.findMany({
      where: { matchDate: { gte: now }, status: { in: ['SCHEDULED', 'ONGOING'] } },
      orderBy: { matchDate: 'asc' },
      take: 10,
      select: {
        id: true, matchDate: true, venue: true, round: true, stage: true, status: true,
        homeTeam: { select: { school: { select: { name: true } } } },
        awayTeam: { select: { school: { select: { name: true } } } },
        competition: { select: { name: true } },
      },
    }),

    prisma.race.findMany({
      where: { status: { in: ['SCHEDULED', 'ONGOING'] } },
      orderBy: { date: 'asc' },
      take: 8,
      select: { name: true, discipline: true, distanceKm: true, date: true, status: true, sport: { select: { name: true } } },
    }),
  ]);

  const [
    sportCount, federationCount, leagueCount, teamCount, verifiedTeamCount,
    playerCount, venueCount, schoolCount, schoolTeamCount, schoolAthleteCount,
    fixtureCount, newsCount,
  ] = counts;

  // Standings for the handful of leagues that have them — the top of the table
  // is what people ask for, and the whole table for every league would crowd out
  // everything else.
  const rankedLeagueIds = leagues.filter((l) => l.status === 'ACTIVE').slice(0, 5).map((l) => l.id);
  const standings = rankedLeagueIds.length
    ? await prisma.standing.findMany({
        where: { leagueId: { in: rankedLeagueIds } },
        orderBy: [{ leagueId: 'asc' }, { points: 'desc' }, { goalsFor: 'desc' }],
        select: {
          leagueId: true, played: true, won: true, drawn: true, lost: true,
          goalsFor: true, goalsAgainst: true, points: true, form: true,
          team: { select: { name: true } },
        },
      })
    : [];

  const standingsByLeague = new Map();
  standings.forEach((row) => {
    if (!standingsByLeague.has(row.leagueId)) standingsByLeague.set(row.leagueId, []);
    standingsByLeague.get(row.leagueId).push(row);
  });

  return list([
    section('Platform totals (live counts)', list([
      `- Sports: ${sportCount}`,
      `- Federations: ${federationCount}`,
      `- Leagues and competitions: ${leagueCount}`,
      `- Clubs registered: ${teamCount} (${verifiedTeamCount} verified)`,
      `- Registered players: ${playerCount}`,
      `- Venues: ${venueCount}`,
      `- Fixtures on record: ${fixtureCount}`,
      `- Published news articles: ${newsCount}`,
      `- Amashuri (school sport): ${schoolCount} schools, ${schoolTeamCount} school teams, ${schoolAthleteCount} registered athletes`,
    ])),

    section('Sports covered', list(sports.map((s) =>
      `- **${s.name}** (/sports/${s.slug || ''}) — ${s.category.toLowerCase()} sport, run as ${s.type.toLowerCase()}${s.description ? `. ${String(s.description).slice(0, 160)}` : ''}`,
    ))),

    section('Leagues and competitions', list(leagues.map((l) =>
      `- **${l.name}** — ${l.sport?.name || 'sport n/a'}, ${l.season}, ${l.gender.toLowerCase()} ${l.ageCategory}, ${l.level.toLowerCase()} level, format ${l.format}, status ${l.status}, ${l._count.teams} teams${l.federation ? `, run by ${l.federation.abbreviation || l.federation.name}` : ''} (/leagues/${l.id})`,
    ))),

    section('Matches in progress right now', live.length
      ? list(live.map((f) => `- ${f.league?.name}: **${f.homeTeam?.name} ${scoreLine(f)} ${f.awayTeam?.name}** — LIVE${f.venue ? ` at ${f.venue}` : ''} (/matches/${f.id})`))
      : 'No matches are live at the moment.'),

    section('Upcoming fixtures (next 21 days)', upcoming.length
      ? list(upcoming.map((f) => `- ${when(f.matchDate)} — **${f.homeTeam?.name} vs ${f.awayTeam?.name}**, ${f.league?.name}${f.venue ? `, ${f.venue}` : ''} (matchday ${f.matchday}, /matches/${f.id})`))
      : 'No fixtures are scheduled in the next three weeks.'),

    section('Latest results', recent.length
      ? list(recent.map((f) => `- ${day(f.matchDate)} — ${f.league?.name}: **${f.homeTeam?.name} ${f.homeScore}-${f.awayScore} ${f.awayTeam?.name}** (/matches/${f.id})`))
      : 'No completed matches on record yet.'),

    section('Current standings (top of each active league)',
      list(rankedLeagueIds.map((leagueId) => {
        const league = leagues.find((l) => l.id === leagueId);
        const rows = (standingsByLeague.get(leagueId) || []).slice(0, 6);
        if (!rows.length) return null;
        return `**${league?.name}**\n${rows.map((r, i) =>
          `  ${i + 1}. ${r.team?.name} — ${r.points} pts (P${r.played} W${r.won} D${r.drawn} L${r.lost}, GF${r.goalsFor} GA${r.goalsAgainst}${r.form ? `, form ${r.form}` : ''})`,
        ).join('\n')}`;
      }))),

    section('Racing and individual events', races.length
      ? list(races.map((r) => `- **${r.name}** — ${r.sport?.name}${r.discipline ? `, ${r.discipline}` : ''}${r.distanceKm ? `, ${r.distanceKm} km` : ''}, ${day(r.date)}, ${r.status}`))
      : ''),

    section('Amashuri Games — school competitions', list([
      ...akcCompetitions.map((c) =>
        `- **${c.name}**${c.edition ? ` (${c.edition})` : ''} — ${c.level.toLowerCase()} level, ${c.gender}, ${c.ageCategory}, ${day(c.startDate)} to ${day(c.endDate)}${c.venue ? `, at ${c.venue}` : ''}, ${c.status}`),
      ...akcUpcoming.map((f) =>
        `- Fixture ${when(f.matchDate)}: **${f.homeTeam?.school?.name} vs ${f.awayTeam?.school?.name}**${f.competition ? `, ${f.competition.name}` : ''}${f.round ? `, ${f.round}` : ''} (${f.stage}) (/amashuri/matches/${f.id})`),
    ])),

    section('Venues', list(venues.map((v) =>
      `- **${v.name}**${v.city ? ` — ${v.city}` : ''}${v.province ? `, ${v.province}` : ''}${v.capacity ? `, capacity ${v.capacity}` : ''}${v.surface ? `, ${v.surface}` : ''}`,
    ))),

    section('Recent news on the platform', list(news.map((n) =>
      `- **${n.title}** (${n.category}, ${day(n.createdAt)}) — ${String(n.excerpt || '').slice(0, 180)} (/news/${n.slug || ''})`,
    ))),
  ]);
};

const snapshot = async () => {
  if (cache.text && Date.now() - cache.at < CACHE_MS) return cache.text;
  const text = await buildSnapshot();
  cache = { at: Date.now(), text };
  return text;
};

/** Drop the cache when the underlying data is known to have changed. */
const invalidateSnapshot = () => { cache = { at: 0, text: '' }; };

// ── Question-driven lookup ──────────────────────────────────────────────────

/**
 * Words too common to be worth a database round trip. Kept short on purpose: it
 * only has to remove the words that would match half the table, not every
 * function word in English.
 */
const STOPWORDS = new Set([
  'the', 'and', 'for', 'are', 'was', 'were', 'what', 'when', 'where', 'which', 'who', 'whom', 'how', 'why',
  'about', 'into', 'from', 'with', 'that', 'this', 'these', 'those', 'there', 'their', 'they', 'them',
  'can', 'you', 'your', 'our', 'his', 'her', 'its', 'have', 'has', 'had', 'will', 'would', 'should',
  'could', 'does', 'did', 'not', 'but', 'all', 'any', 'many', 'much', 'more', 'most', 'some', 'each',
  'tell', 'show', 'give', 'find', 'list', 'please', 'thanks', 'hello', 'hey', 'want', 'need', 'know',
  'match', 'matches', 'game', 'games', 'team', 'teams', 'club', 'clubs', 'player', 'players', 'sport', 'sports',
  'league', 'leagues', 'fixture', 'fixtures', 'result', 'results', 'standing', 'standings', 'news',
  'next', 'last', 'today', 'tomorrow', 'week', 'month', 'year', 'season', 'now', 'current', 'upcoming',
  'rwanda', 'rwandan', 'rwasport', 'platform', 'system', 'app', 'website', 'information', 'data',
]);

/**
 * The nouns worth searching for.
 *
 * Generic sport vocabulary is stripped, because "show me the football fixtures"
 * searching for "fixtures" returns nothing useful and costs six queries. What
 * survives is names — APR, Rayon, Kigali, Amahoro — which is exactly what the
 * targeted lookup is for.
 */
const searchTerms = (question) => {
  const words = String(question || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s'-]/gu, ' ')
    .split(/\s+/)
    .map((w) => w.replace(/^['-]+|['-]+$/g, ''))
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));

  return [...new Set(words)].slice(0, 6);
};

const anyName = (terms, field = 'name') => ({
  OR: terms.map((t) => ({ [field]: { contains: t, mode: 'insensitive' } })),
});

/**
 * Records that match the words in the question, with the detail a person would
 * actually want next.
 *
 * A club is never returned as a bare row: whoever asked about it wants its
 * league position, its next match and its last result in the same breath, and
 * fetching those here is what stops the model filling the gap itself.
 */
const searchEntities = async (question) => {
  const terms = searchTerms(question);
  if (!terms.length) return '';

  const [teams, players, leagues, schools, venues, news, sports] = await Promise.all([
    prisma.team.findMany({
      where: { active: true, ...anyName(terms) },
      take: 5,
      select: {
        id: true, name: true, shortName: true, slug: true, city: true, district: true, province: true,
        foundedYear: true, homeVenue: true, status: true, description: true, website: true,
        sport: { select: { name: true } },
        _count: { select: { players: true } },
      },
    }),

    // Sporting details only. Identity documents, dates of birth and contact
    // details are never sent off the platform — see the file header.
    prisma.player.findMany({
      where: { active: true, ...anyName(terms, 'fullName') },
      take: 6,
      select: {
        id: true, fullName: true, position: true, jerseyNumber: true, nationality: true,
        skillLevel: true, status: true,
        team: { select: { name: true, sport: { select: { name: true } } } },
      },
    }),

    prisma.league.findMany({
      where: { active: true, ...anyName(terms) },
      take: 4,
      select: {
        id: true, name: true, season: true, status: true, format: true, level: true,
        gender: true, ageCategory: true, description: true, startDate: true, endDate: true,
        sport: { select: { name: true } },
        _count: { select: { teams: true, fixtures: true } },
      },
    }),

    prisma.akcSchool.findMany({
      where: { active: true, ...anyName(terms) },
      take: 5,
      select: {
        id: true, name: true, shortName: true, category: true, sector: true,
        _count: { select: { teams: true } },
      },
    }),

    prisma.venue.findMany({
      where: { active: true, ...anyName(terms) },
      take: 4,
      select: { name: true, city: true, province: true, capacity: true, surface: true },
    }),

    prisma.news.findMany({
      where: { published: true, OR: [anyName(terms, 'title'), anyName(terms, 'excerpt')] },
      orderBy: { createdAt: 'desc' },
      take: 4,
      select: { title: true, slug: true, excerpt: true, body: true, category: true, createdAt: true },
    }),

    prisma.sport.findMany({
      where: { active: true, ...anyName(terms) },
      take: 3,
      select: { name: true, slug: true, description: true, category: true, type: true },
    }),
  ]);

  // Depth for the clubs that matched: table position, next match, last result.
  const teamIds = teams.map((t) => t.id);
  const [teamStandings, teamFixtures] = teamIds.length
    ? await Promise.all([
        prisma.standing.findMany({
          where: { teamId: { in: teamIds } },
          select: {
            teamId: true, played: true, won: true, drawn: true, lost: true,
            goalsFor: true, goalsAgainst: true, points: true, form: true,
            league: { select: { id: true, name: true, season: true } },
          },
        }),
        prisma.fixture.findMany({
          where: { OR: [{ homeTeamId: { in: teamIds } }, { awayTeamId: { in: teamIds } }] },
          orderBy: { matchDate: 'desc' },
          take: 40,
          select: {
            id: true, matchDate: true, status: true, venue: true, homeScore: true, awayScore: true,
            homeTeamId: true, awayTeamId: true,
            homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } },
            league: { select: { name: true } },
          },
        }),
      ])
    : [[], []];

  const fixturesFor = (teamId) => teamFixtures.filter((f) => f.homeTeamId === teamId || f.awayTeamId === teamId);

  return list([
    section('Clubs matching the question', list(teams.map((t) => {
      const standing = teamStandings.find((s) => s.teamId === t.id);
      const own = fixturesFor(t.id);
      const played = own.filter((f) => f.status === 'COMPLETED').slice(0, 3);
      const next = own.filter((f) => ['SCHEDULED', 'CONFIRMED', 'RESCHEDULED', 'LIVE'].includes(f.status))
        .sort((a, b) => new Date(a.matchDate || 0).getTime() - new Date(b.matchDate || 0).getTime())
        .slice(0, 3);

      return list([
        `**${t.name}**${t.shortName ? ` (${t.shortName})` : ''} — ${t.sport?.name || 'sport n/a'}, ${t.status.toLowerCase()}${t.city ? `, based in ${t.city}` : ''}${t.province ? `, ${t.province} province` : ''}${t.foundedYear ? `, founded ${t.foundedYear}` : ''}. Squad of ${t._count.players}. Page: /teams/${t.id}`,
        t.homeVenue ? `  - Home venue: ${t.homeVenue}` : null,
        t.description ? `  - About: ${String(t.description).slice(0, 300)}` : null,
        standing ? `  - ${standing.league?.name} ${standing.league?.season}: ${standing.points} pts from ${standing.played} played (W${standing.won} D${standing.drawn} L${standing.lost}, GF${standing.goalsFor} GA${standing.goalsAgainst}${standing.form ? `, form ${standing.form}` : ''})` : null,
        next.length ? `  - Next: ${next.map((f) => `${f.homeTeam?.name} vs ${f.awayTeam?.name} on ${when(f.matchDate)} (${f.league?.name}, /matches/${f.id})`).join('; ')}` : null,
        played.length ? `  - Recent: ${played.map((f) => `${f.homeTeam?.name} ${f.homeScore}-${f.awayScore} ${f.awayTeam?.name} (${day(f.matchDate)})`).join('; ')}` : null,
      ]);
    }))),

    section('Players matching the question', list(players.map((p) =>
      `- **${p.fullName}** — ${p.team?.name || 'no club'}${p.team?.sport?.name ? ` (${p.team.sport.name})` : ''}${p.position ? `, ${p.position}` : ''}${p.jerseyNumber ? `, shirt ${p.jerseyNumber}` : ''}, ${p.nationality}, ${p.skillLevel.toLowerCase()}, registration ${p.status.toLowerCase()} (/players/${p.id})`,
    ))),

    section('Competitions matching the question', list(leagues.map((l) =>
      `- **${l.name}** — ${l.sport?.name}, ${l.season}, ${l.gender.toLowerCase()} ${l.ageCategory}, ${l.level.toLowerCase()}, ${l.format}, ${l.status}. ${l._count.teams} teams, ${l._count.fixtures} fixtures. ${l.startDate ? `Runs ${day(l.startDate)} to ${day(l.endDate)}. ` : ''}${l.description ? String(l.description).slice(0, 240) : ''} (/leagues/${l.id})`,
    ))),

    section('Sports matching the question', list(sports.map((s) =>
      `- **${s.name}** — ${s.category.toLowerCase()}, ${s.type.toLowerCase()}. ${s.description ? String(s.description).slice(0, 300) : ''} (/sports/${s.slug || ''})`,
    ))),

    section('Schools matching the question', list(schools.map((s) =>
      `- **${s.name}**${s.shortName ? ` (${s.shortName})` : ''} — ${s.category.toLowerCase()}${s.sector ? `, ${s.sector} sector` : ''}, ${s._count.teams} school teams (/amashuri/schools/${s.id})`,
    ))),

    section('Venues matching the question', list(venues.map((v) =>
      `- **${v.name}**${v.city ? ` — ${v.city}` : ''}${v.province ? `, ${v.province}` : ''}${v.capacity ? `, capacity ${v.capacity}` : ''}${v.surface ? `, ${v.surface} surface` : ''}`,
    ))),

    section('News matching the question', list(news.map((n) =>
      `- **${n.title}** (${n.category}, ${day(n.createdAt)}): ${String(n.excerpt || n.body || '').slice(0, 500)} (/news/${n.slug || ''})`,
    ))),
  ]);
};

// ── How the platform itself works ───────────────────────────────────────────

/**
 * The part of the answer that is not in any table: what the sections are, who
 * the accounts are for, and how a club or a school actually gets on.
 *
 * Written from the routes and capabilities that exist rather than from a
 * brochure, so it cannot describe a feature the app does not have.
 */
const PLATFORM_GUIDE = `
## What this platform is
RwaSport — the Rwanda National Sports Platform (RNSP), a one-stop centre digitising Rwandan sport end to end:
professional leagues, national federations, a live Match Centre, the Amashuri inter-school competitions
(including the Kagame Cup), and racing events (cycling, athletics). Available in English, Kinyarwanda and French,
and installable as a mobile app.

## Where things are on the site
- \`/\` — choose your sport, then that sport's home
- \`/sports\` and \`/sports/:slug\` — every sport, with its own overview, matches, teams, standings and news tabs
- \`/leagues\`, \`/leagues/:id\` — competitions and their tables
- \`/fixtures\`, \`/live\`, \`/results\`, \`/calendar\` — the match calendar in its three states
- \`/matches/:id\` — a single match: scoreboard, timeline, line-ups, comments
- \`/teams\`, \`/teams/:id\` — club directory and club pages (overview, matches, record, stats, players)
- \`/players/:id\` — a player's profile and season statistics
- \`/news\`, \`/news/:slug\` — news and announcements
- \`/amashuri\` — the school Games: championships, school directory, fixtures, results, standings
- \`/amashuri/schools/:id\`, \`/amashuri/teams/:id\`, \`/amashuri/athletes/:id\` — school, school team, athlete
- \`/contact\` — contact the platform team
- \`/auth/login\` — sign in; \`/auth/team/register\` — register a club

## Accounts and what each one can do
- **Super Admin (Ministry)** — runs the whole platform: sports, federations, users, roles, settings, compliance.
- **Federation Admin** — runs one sport end to end: its competitions, clubs, players, fixtures and news.
- **League Admin** — runs the competitions they are assigned: fixtures, results, standings, transfers,
  suspensions, competition entries, and assigning reporters.
- **Match Reporter** — reports assigned matches live: the clock, events, score and statistics.
- **Team Manager** — runs one club: its profile, players, documents and team sheets.
- **Amashuri Admin** — runs school sport across all schools; **School Coordinator** registers athletes for
  one school only, through the school portal.

## How to join
- **A club**: register at \`/auth/team/register\`. The club is created as PENDING; a federation or platform
  administrator reviews and verifies it. Once verified, the club can be entered into a league, and its
  manager can add players and upload the documents each player needs.
- **A player**: players are added by their club's manager or by a league/federation administrator, then
  verified once their documents are approved.
- **A school**: schools are added by the Amashuri administrators; the school's coordinator then registers
  its teams and athletes through the school portal.
- **An organisation asking to join the platform**: there is a join-request route reviewed by administrators.

## Things worth knowing
- Fixtures are Umuganda-aware: matches that clash with a national Umuganda morning are flagged and rescheduled.
- Club subscriptions and payments run through the platform, in Rwandan francs.
- The platform is built to Rwanda's data-protection law (N° 058/2021): personal data is held under stated
  retention rules and people can exercise their rights over it through the platform.
`.trim();

// ── Assembly ────────────────────────────────────────────────────────────────

const DEPTH_LIMITS = { lean: 6_000, standard: 14_000, rich: 26_000 };

/**
 * Everything the model is given for one question.
 *
 * Order matters: the guide first (it is short and always relevant), then the
 * records that match what was asked, then the standing snapshot. If the budget
 * has to bite, it bites the snapshot — the general picture — rather than the
 * specific records that were looked up because of this question.
 */
const buildContext = async (question, { depth = 'standard' } = {}) => {
  const budget = DEPTH_LIMITS[depth] || DEPTH_LIMITS.standard;

  const [general, specific] = await Promise.all([snapshot(), searchEntities(question)]);

  const head = `${PLATFORM_GUIDE}\n${specific ? `\n# Records matching this question\n${specific}` : ''}`;
  const tail = `\n# Current platform snapshot\n${general}`;

  const remaining = Math.max(0, budget - head.length);
  return `${head}${tail.slice(0, remaining)}`;
};

module.exports = {
  buildContext,
  snapshot,
  invalidateSnapshot,
  searchEntities,
  searchTerms,
  PLATFORM_GUIDE,
};
