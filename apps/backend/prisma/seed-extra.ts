/**
 * Additive sample-data seed. Idempotent: guarded by a marker Setting
 * (`seed_extra_v1`), so re-running is a no-op. Builds on top of prisma/seed.js
 * (does not modify or duplicate the base users/teams — it looks them up).
 *
 * Run:  node prisma/seed-extra.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MARKER = 'seed_extra_v1';
const daysFromNow = (d) => new Date(Date.now() + d * 86400000);

// Deterministic pseudo-score so re-seeds (and reviews) are reproducible.
const seededScore = (n) => [[2, 1], [0, 0], [3, 2], [1, 1], [2, 0], [1, 3], [4, 1], [0, 2], [2, 2], [3, 0]][n % 10];

async function recomputeStandings(leagueId) {
  const teams = await prisma.leagueTeam.findMany({ where: { leagueId }, select: { teamId: true } });
  const fixtures = await prisma.fixture.findMany({
    where: { leagueId, status: 'COMPLETED', homeScore: { not: null }, awayScore: { not: null } },
    orderBy: { matchDate: 'asc' },
  });
  const table = {};
  for (const { teamId } of teams) table[teamId] = { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, form: [] };
  for (const f of fixtures) {
    const h = table[f.homeTeamId], a = table[f.awayTeamId];
    if (!h || !a) continue;
    h.played++; a.played++;
    h.goalsFor += f.homeScore; h.goalsAgainst += f.awayScore;
    a.goalsFor += f.awayScore; a.goalsAgainst += f.homeScore;
    if (f.homeScore > f.awayScore) { h.won++; h.points += 3; h.form.push('W'); a.lost++; a.form.push('L'); }
    else if (f.homeScore < f.awayScore) { a.won++; a.points += 3; a.form.push('W'); h.lost++; h.form.push('L'); }
    else { h.drawn++; a.drawn++; h.points++; a.points++; h.form.push('D'); a.form.push('D'); }
  }
  for (const teamId of Object.keys(table)) {
    const t = table[teamId];
    const row = { played: t.played, won: t.won, drawn: t.drawn, lost: t.lost, goalsFor: t.goalsFor, goalsAgainst: t.goalsAgainst, points: t.points, form: t.form.slice(-5).join('') };
    await prisma.standing.upsert({
      where: { leagueId_teamId: { leagueId, teamId: Number(teamId) } },
      update: row,
      create: { leagueId, teamId: Number(teamId), ...row },
    });
  }
}

async function main() {
  const done = await prisma.setting.findUnique({ where: { skey: MARKER } }).catch(() => null);
  if (done) {
    console.log('⏩ seed-extra already applied (marker present) — nothing to do.');
    return;
  }
  console.log('🌱 Seeding EXTRA sample data...');

  const admin = await prisma.user.findUnique({ where: { username: 'admin' } });
  const authorId = admin?.id ?? null;

  // ── SPORTS ────────────────────────────────────────────────────────────
  console.log('  • sports');
  const sportDefs = [
    { name: 'Football', icon: '', slug: 'football', category: 'FIELD', sortOrder: 1 },
    { name: 'Basketball', icon: '', slug: 'basketball', category: 'COURT', sortOrder: 2 },
    { name: 'Volleyball', icon: '', slug: 'volleyball', category: 'COURT', sortOrder: 3 },
    { name: 'Handball', icon: '', slug: 'handball', category: 'COURT', sortOrder: 4 },
    { name: 'Rugby', icon: '', slug: 'rugby', category: 'FIELD', sortOrder: 5 },
  ];
  const sports: any = {};
  for (const s of sportDefs) sports[s.slug] = await prisma.sport.upsert({ where: { name: s.name }, update: {}, create: s });

  // ── FEDERATIONS ───────────────────────────────────────────────────────
  console.log('  • federations');
  const fedDefs = [
    { name: 'Rwanda Football Federation', abbreviation: 'FERWAFA', sportId: sports.football.id, website: 'https://ferwafa.rw' },
    { name: 'Rwanda Basketball Federation', abbreviation: 'FERWABA', sportId: sports.basketball.id },
    { name: 'Rwanda Volleyball Federation', abbreviation: 'FRVB', sportId: sports.volleyball.id },
  ];
  const feds: any = {};
  for (const f of fedDefs) {
    const found = await prisma.federation.findFirst({ where: { abbreviation: f.abbreviation } });
    feds[f.abbreviation] = found || await prisma.federation.create({ data: f });
  }

  // ── VENUES ────────────────────────────────────────────────────────────
  console.log('  • venues');
  const venueDefs = [
    { name: 'Amahoro National Stadium', city: 'Kigali', province: 'Kigali', capacity: 30000, surface: 'Grass' },
    { name: 'Kigali Pele Stadium', city: 'Kigali', province: 'Kigali', capacity: 10000, surface: 'Grass' },
    { name: 'Huye Stadium', city: 'Huye', province: 'South', capacity: 8000, surface: 'Grass' },
    { name: 'Umuganda Stadium', city: 'Rubavu', province: 'West', capacity: 7000, surface: 'Grass' },
    { name: 'Kigali Arena', city: 'Kigali', province: 'Kigali', capacity: 10000, surface: 'Hardwood' },
  ];
  for (const v of venueDefs) {
    const exists = await prisma.venue.findFirst({ where: { name: v.name } });
    if (!exists) await prisma.venue.create({ data: v });
  }

  // ── FOOTBALL TEAMS (Rwanda Premier League) ─────────────────────────────
  console.log('  • football teams');
  const teamDefs = [
    { name: 'APR FC', shortName: 'APR', slug: 'apr-fc', city: 'Kigali', province: 'Kigali', foundedYear: 1993, homeVenue: 'Kigali Pele Stadium' },
    { name: 'Rayon Sports', shortName: 'RYN', slug: 'rayon-sports', city: 'Nyanza', province: 'South', foundedYear: 1965, homeVenue: 'Nyanza Stadium' },
    { name: 'Police FC', shortName: 'POL', slug: 'police-fc', city: 'Kigali', province: 'Kigali', foundedYear: 2001, homeVenue: 'Kigali Pele Stadium' },
    { name: 'AS Kigali', shortName: 'ASK', slug: 'as-kigali', city: 'Kigali', province: 'Kigali', foundedYear: 2002, homeVenue: 'Kigali Pele Stadium' },
    { name: 'Musanze FC', shortName: 'MUS', slug: 'musanze-fc', city: 'Musanze', province: 'North', foundedYear: 2010, homeVenue: 'Ubworoherane Stadium' },
    { name: 'Mukura Victory Sports', shortName: 'MUK', slug: 'mukura-vs', city: 'Huye', province: 'South', foundedYear: 1966, homeVenue: 'Huye Stadium' },
    { name: 'Gorilla FC', shortName: 'GOR', slug: 'gorilla-fc', city: 'Kigali', province: 'Kigali', foundedYear: 2020, homeVenue: 'Kigali Pele Stadium' },
    { name: 'Etincelles FC', shortName: 'ETI', slug: 'etincelles-fc', city: 'Rubavu', province: 'West', foundedYear: 1978, homeVenue: 'Umuganda Stadium' },
  ];
  const teams = [];
  for (const t of teamDefs) {
    teams.push(await prisma.team.upsert({
      where: { slug: t.slug },
      update: {},
      create: { ...t, sportId: sports.football.id, status: 'VERIFIED', verifiedAt: new Date(), active: true },
    }));
  }

  // Find or create the Rwanda Premier League and attach FERWAFA
  let rpl = await prisma.league.findFirst({ where: { name: 'Rwanda Premier League' } });
  if (!rpl) {
    rpl = await prisma.league.create({
      data: { name: 'Rwanda Premier League', slug: 'rpl', sportId: sports.football.id, season: '2025/2026', gender: 'MALE', status: 'ACTIVE', level: 'NATIONAL', federationId: feds.FERWAFA.id },
    });
  } else if (!rpl.federationId) {
    rpl = await prisma.league.update({ where: { id: rpl.id }, data: { federationId: feds.FERWAFA.id, status: 'ACTIVE' } });
  }

  // Attach all teams to RPL
  for (const t of teams) {
    await prisma.leagueTeam.upsert({
      where: { leagueId_teamId: { leagueId: rpl.id, teamId: t.id } },
      update: {},
      create: { leagueId: rpl.id, teamId: t.id },
    });
  }

  // ── PLAYERS ───────────────────────────────────────────────────────────
  console.log('  • players');
  const firstNames = ['Emmanuel', 'Jean', 'Eric', 'Olivier', 'Fiston', 'Yannick', 'Bonfils', 'Djihad', 'Kevin', 'Thierry', 'Muhadjiri', 'Innocent', 'Savio', 'Aristote', 'Prince'];
  const lastNames = ['Mugisha', 'Niyonzima', 'Ndayishimiye', 'Habimana', 'Bizimana', 'Nshuti', 'Rutanga', 'Kagame', 'Manzi', 'Iradukunda', 'Hakizimana', 'Tuyisenge', 'Ngaruye', 'Mfizi', 'Rukundo'];
  const layout = [
    { position: 'Goalkeeper', skillLevel: 'PROFESSIONAL' },
    { position: 'Defender', skillLevel: 'PROFESSIONAL' },
    { position: 'Defender', skillLevel: 'SEMI_PROFESSIONAL' },
    { position: 'Midfielder', skillLevel: 'PROFESSIONAL' },
    { position: 'Midfielder', skillLevel: 'SEMI_PROFESSIONAL' },
    { position: 'Forward', skillLevel: 'ELITE' },
    { position: 'Forward', skillLevel: 'PROFESSIONAL' },
  ];
  const playersByTeam = {};
  let pIdx = 0;
  for (const team of teams) {
    playersByTeam[team.id] = [];
    const existing = await prisma.player.count({ where: { teamId: team.id } });
    if (existing > 0) { // keep base seed's players if any; skip to stay idempotent-ish
      playersByTeam[team.id] = await prisma.player.findMany({ where: { teamId: team.id } });
      continue;
    }
    for (let i = 0; i < layout.length; i++) {
      const fullName = `${firstNames[pIdx % firstNames.length]} ${lastNames[(pIdx * 3) % lastNames.length]}`;
      const p = await prisma.player.create({
        data: {
          teamId: team.id,
          fullName,
          position: layout[i].position,
          jerseyNumber: i + 1,
          skillLevel: layout[i].skillLevel,
          gender: 'MALE',
          nationality: 'Rwandan',
          status: 'VERIFIED',
          verifiedAt: new Date(),
          dateOfBirth: new Date(1998 + (i % 8), (pIdx % 12), ((pIdx % 27) + 1)),
        },
      });
      playersByTeam[team.id].push(p);
      pIdx++;
    }
  }

  // ── FIXTURES (single round-robin over the 8 teams) ─────────────────────
  console.log('  • fixtures');
  const existingRplFixtures = await prisma.fixture.count({ where: { leagueId: rpl.id } });
  const createdFixtures = [];
  // Only generate the round-robin once (base seed adds ≤3; we add the bulk here).
  // Guard so a re-run never duplicates the generated fixtures.
  if (existingRplFixtures <= 3) {
    let md = 1, n = 0;
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const home = teams[i], away = teams[j];
        // ~55% completed, then a couple live, rest scheduled
        let status = 'SCHEDULED', homeScore = null, awayScore = null, matchDate = daysFromNow(7 + n);
        if (n % 9 === 4 || n % 9 === 8) {
          status = 'LIVE'; [homeScore, awayScore] = [1, 1]; matchDate = new Date();
        } else if (n % 2 === 0) {
          status = 'COMPLETED'; [homeScore, awayScore] = seededScore(n); matchDate = daysFromNow(-30 + n);
        }
        const fx = await prisma.fixture.create({
          data: {
            leagueId: rpl.id, homeTeamId: home.id, awayTeamId: away.id, matchday: md,
            status, homeScore, awayScore, venue: home.homeVenue, matchDate,
            referee: 'Ref. J. Nsengimana', attendance: status === 'COMPLETED' ? 3000 + (n * 137) % 9000 : null,
          },
        });
        createdFixtures.push(fx);
        n++; if (n % 4 === 0) md++;
      }
    }
  } else {
    console.log('    (round-robin already present — skipping fixture generation)');
  }

  // Match events (goals) for a handful of completed fixtures → richer match pages
  console.log('  • match events');
  for (const fx of createdFixtures.filter((f) => f.status === 'COMPLETED').slice(0, 6)) {
    const homePlayers = playersByTeam[fx.homeTeamId] || [];
    const awayPlayers = playersByTeam[fx.awayTeamId] || [];
    const scorers = [];
    for (let g = 0; g < (fx.homeScore || 0); g++) scorers.push({ team: fx.homeTeamId, players: homePlayers });
    for (let g = 0; g < (fx.awayScore || 0); g++) scorers.push({ team: fx.awayTeamId, players: awayPlayers });
    let minute = 12;
    for (const s of scorers) {
      const scorer = s.players.find((p) => p.position === 'Forward') || s.players[0];
      if (!scorer) continue;
      await prisma.matchEvent.create({
        data: { fixtureId: fx.id, teamId: s.team, playerId: scorer.id, eventType: 'GOAL', minute, description: `Goal by ${scorer.fullName}` },
      });
      minute += 17;
    }
  }

  // Standings computed from all completed RPL fixtures
  console.log('  • standings (recomputed)');
  await recomputeStandings(rpl.id);

  // Top scorers
  console.log('  • top scorers');
  const topForwards = teams.slice(0, 5).map((t) => (playersByTeam[t.id] || []).find((p) => p.position === 'Forward')).filter(Boolean);
  let goals = 11;
  for (const p of topForwards) {
    await prisma.topScorer.upsert({
      where: { playerId: p.id },
      update: { goals, assists: goals % 5 },
      create: { leagueId: rpl.id, playerId: p.id, teamId: p.teamId, goals, assists: goals % 5 },
    });
    goals -= 2;
  }

  // ── BASKETBALL LEAGUE (lighter) ────────────────────────────────────────
  console.log('  • basketball league');
  let rbl = await prisma.league.findFirst({ where: { name: 'Rwanda Basketball League' } });
  if (!rbl) {
    rbl = await prisma.league.create({
      data: { name: 'Rwanda Basketball League', slug: 'rbl', sportId: sports.basketball.id, season: '2025/2026', gender: 'MALE', status: 'ACTIVE', level: 'NATIONAL', federationId: feds.FERWABA.id },
    });
  }
  const bballDefs = [
    { name: 'Patriots BBC', shortName: 'PAT', slug: 'patriots-bbc', city: 'Kigali' },
    { name: 'REG BBC', shortName: 'REG', slug: 'reg-bbc', city: 'Kigali' },
    { name: 'Espoir BBC', shortName: 'ESP', slug: 'espoir-bbc', city: 'Kigali' },
    { name: 'APR BBC', shortName: 'APRb', slug: 'apr-bbc', city: 'Kigali' },
  ];
  const bballTeams = [];
  for (const t of bballDefs) {
    const team = await prisma.team.upsert({ where: { slug: t.slug }, update: {}, create: { ...t, sportId: sports.basketball.id, status: 'VERIFIED', verifiedAt: new Date() } });
    bballTeams.push(team);
    await prisma.leagueTeam.upsert({ where: { leagueId_teamId: { leagueId: rbl.id, teamId: team.id } }, update: {}, create: { leagueId: rbl.id, teamId: team.id } });
  }
  const existingRblFixtures = await prisma.fixture.count({ where: { leagueId: rbl.id } });
  if (existingRblFixtures === 0) {
    const bScores = [[82, 75], [90, 88], [70, 79], [101, 66]];
    let bn = 0;
    for (let i = 0; i < bballTeams.length; i++) {
      for (let j = i + 1; j < bballTeams.length; j++) {
        const completed = bn % 2 === 0;
        await prisma.fixture.create({
          data: {
            leagueId: rbl.id, homeTeamId: bballTeams[i].id, awayTeamId: bballTeams[j].id, matchday: 1,
            status: completed ? 'COMPLETED' : 'SCHEDULED',
            homeScore: completed ? bScores[bn % 4][0] : null, awayScore: completed ? bScores[bn % 4][1] : null,
            venue: 'Kigali Arena', matchDate: completed ? daysFromNow(-10 + bn) : daysFromNow(5 + bn),
          },
        });
        bn++;
      }
    }
  }
  await recomputeStandings(rbl.id);

  // ── NEWS ──────────────────────────────────────────────────────────────
  console.log('  • news');
  const newsDefs = [
    { title: 'APR FC extend lead at the top of the table', category: 'RESULT', featured: true, excerpt: 'The military side continue their dominant run in the Rwanda Premier League.' },
    { title: 'Rayon Sports sign promising young midfielder', category: 'TRANSFER', excerpt: 'The Blues bolster their midfield ahead of the second leg.' },
    { title: 'Amashuri Games 2026: registration now open', category: 'ANNOUNCEMENT', featured: true, excerpt: 'Schools across all provinces can now register their teams for the Kagame Cup.' },
    { title: 'Patriots BBC edge REG in a thriller', category: 'RESULT', excerpt: 'An 82-75 win keeps Patriots unbeaten in the basketball league.' },
    { title: 'Musanze FC striker ruled out for three weeks', category: 'INJURY', excerpt: 'The forward picked up a hamstring strain in training.' },
    { title: 'National federation announces new youth development plan', category: 'NEWS', excerpt: 'FERWAFA unveils a five-year roadmap for grassroots football.' },
  ];
  for (const nws of newsDefs) {
    const slug = nws.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const exists = await prisma.news.findFirst({ where: { title: nws.title } });
    if (!exists) {
      await prisma.news.create({
        data: {
          title: nws.title, slug, category: nws.category, featured: !!nws.featured, published: true,
          excerpt: nws.excerpt, body: `<p>${nws.excerpt}</p><p>Full coverage and analysis from the RwaSport newsroom.</p>`,
          sportId: sports.football.id, leagueId: rpl.id, authorId,
          views: Math.floor(200 + (slug.length * 37) % 1500),
          coverImage: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
        },
      });
    }
  }

  // ── CONTACTS ──────────────────────────────────────────────────────────
  console.log('  • contact messages');
  const contactDefs = [
    { name: 'Alice Uwase', email: 'alice@example.rw', subject: 'Partnership inquiry', message: 'We would like to sponsor the upcoming season.', status: 'NEW' },
    { name: 'Bosco Habimana', email: 'bosco@example.rw', subject: 'Team registration help', message: 'How do I register my team for the league?', status: 'READ' },
    { name: 'Claudine M.', phone: '+250788000000', subject: 'Ticketing', message: 'Are tickets available for the derby?', status: 'REPLIED' },
  ];
  for (const c of contactDefs) {
    const exists = await prisma.contact.findFirst({ where: { name: c.name, subject: c.subject } });
    if (!exists) await prisma.contact.create({ data: c });
  }

  // ── TRANSFERS + REGISTRATIONS ─────────────────────────────────────────
  console.log('  • transfers & registrations');
  const rayon = teams.find((t) => t.slug === 'rayon-sports');
  const apr = teams.find((t) => t.slug === 'apr-fc');
  const movingPlayer = (playersByTeam[rayon.id] || [])[5];
  if (movingPlayer) {
    const already = await prisma.transfer.findFirst({ where: { playerId: movingPlayer.id } });
    if (!already) await prisma.transfer.create({ data: { playerId: movingPlayer.id, fromTeamId: rayon.id, toTeamId: apr.id, transferType: 'PERMANENT', fee: 5000000, transferDate: daysFromNow(-15), notes: 'Big-money move' } });
  }
  const musanze = teams.find((t) => t.slug === 'musanze-fc');
  await prisma.teamRegistration.upsert({
    where: { teamId_leagueId: { teamId: musanze.id, leagueId: rpl.id } },
    update: {},
    create: { teamId: musanze.id, leagueId: rpl.id, status: 'PENDING', notes: 'Awaiting document review' },
  });

  // ── AKC (Amashuri Games) ──────────────────────────────────────────────
  console.log('  • amashuri (AKC) schools, teams, players');
  const schoolDefs = [
    { name: 'Groupe Scolaire Officiel de Butare', shortName: 'GSOB', code: 'GSOB-01', sector: 'Ngoma', category: 'SECONDARY' },
    { name: 'Lycee de Kigali', shortName: 'LDK', code: 'LDK-02', sector: 'Nyarugenge', category: 'SECONDARY' },
    { name: 'FAWE Girls School', shortName: 'FAWE', code: 'FAWE-03', sector: 'Gasabo', category: 'SECONDARY' },
    { name: 'Ecole des Sciences Byimana', shortName: 'ESB', code: 'ESB-04', sector: 'Ruli', category: 'SECONDARY' },
    { name: 'IPRC Kigali (TVET)', shortName: 'IPRC', code: 'IPRC-05', sector: 'Kicukiro', category: 'TVET' },
  ];
  const schools = [];
  for (const s of schoolDefs) {
    const exists = await prisma.akcSchool.findFirst({ where: { code: s.code } });
    schools.push(exists || await prisma.akcSchool.create({ data: { ...s, active: true, coordinator: 'School Sports Coordinator', coordPhone: '+250789000000' } }));
  }
  const akcTeams = [];
  for (const school of schools) {
    let t = await prisma.akcTeam.findFirst({ where: { schoolId: school.id, sportId: sports.football.id, ageCategory: 'U17' } });
    if (!t) t = await prisma.akcTeam.create({ data: { schoolId: school.id, sportId: sports.football.id, gender: 'MALE', ageCategory: 'U17', level: 'NATIONAL', coachName: 'Coach ' + school.shortName } });
    akcTeams.push(t);
    const pc = await prisma.akcPlayer.count({ where: { teamId: t.id } });
    if (pc === 0) {
      for (let i = 0; i < 5; i++) {
        await prisma.akcPlayer.create({ data: { teamId: t.id, fullName: `${firstNames[(i * 2) % firstNames.length]} ${lastNames[(i * 5) % lastNames.length]}`, ageCategory: 'U17', position: layout[i].position, jersey: i + 1, docVerified: i < 3, idType: 'BIRTH_CERT' } });
      }
    }
  }

  console.log('  • amashuri competition, fixtures, standings, announcements');
  let comp = await prisma.akcCompetition.findFirst({ where: { name: 'Amashuri Kagame Cup' } });
  if (!comp) comp = await prisma.akcCompetition.create({ data: { name: 'Amashuri Kagame Cup', edition: '2026', sportId: sports.football.id, gender: 'male', ageCategory: 'U17', level: 'NATIONAL', status: 'ONGOING', venue: 'Amahoro National Stadium', startDate: daysFromNow(-20), endDate: daysFromNow(20), description: 'National inter-school football championship.' } });

  const akcExisting = await prisma.akcFixture.count({ where: { competitionId: comp.id } });
  if (akcExisting === 0) {
    let an = 0;
    for (let i = 0; i < akcTeams.length; i++) {
      for (let j = i + 1; j < akcTeams.length; j++) {
        const completed = an % 2 === 0;
        const [hs, as_] = seededScore(an);
        await prisma.akcFixture.create({
          data: {
            competitionId: comp.id, homeTeamId: akcTeams[i].id, awayTeamId: akcTeams[j].id,
            stage: 'GROUP', round: 'Group A', venue: 'Amahoro National Stadium',
            status: completed ? 'COMPLETED' : 'SCHEDULED',
            homeScore: completed ? hs : null, awayScore: completed ? as_ : null,
            isDraw: completed && hs === as_,
            winnerTeamId: completed && hs !== as_ ? (hs > as_ ? akcTeams[i].id : akcTeams[j].id) : null,
            matchDate: completed ? daysFromNow(-15 + an) : daysFromNow(3 + an),
          },
        });
        an++;
      }
    }
    // AKC standings from completed fixtures
    const akcFx = await prisma.akcFixture.findMany({ where: { competitionId: comp.id, status: 'COMPLETED' } });
    const tbl = {};
    for (const t of akcTeams) tbl[t.id] = { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 };
    for (const f of akcFx) {
      const h = tbl[f.homeTeamId], a = tbl[f.awayTeamId];
      h.played++; a.played++; h.gf += f.homeScore; h.ga += f.awayScore; a.gf += f.awayScore; a.ga += f.homeScore;
      if (f.homeScore > f.awayScore) { h.won++; h.points += 3; a.lost++; }
      else if (f.homeScore < f.awayScore) { a.won++; a.points += 3; h.lost++; }
      else { h.drawn++; a.drawn++; h.points++; a.points++; }
    }
    for (const teamId of Object.keys(tbl)) {
      await prisma.akcStanding.upsert({
        where: { competitionId_teamId: { competitionId: comp.id, teamId: Number(teamId) } },
        update: tbl[teamId], create: { competitionId: comp.id, teamId: Number(teamId), ...tbl[teamId] },
      });
    }
  }

  const annDefs = [
    { title: 'Kagame Cup 2026 kicks off next week', body: 'The national inter-school championship begins with 16 schools.', category: 'COMPETITION', pinned: true },
    { title: 'Player eligibility documents due Friday', body: 'All schools must upload player birth certificates before the deadline.', category: 'REGISTRATION' },
    { title: 'Group stage results published', body: 'Check the standings page for the latest group tables.', category: 'RESULTS' },
  ];
  for (const a of annDefs) {
    const exists = await prisma.akcAnnouncement.findFirst({ where: { title: a.title } });
    if (!exists) await prisma.akcAnnouncement.create({ data: { ...a, published: true, authorId } });
  }

  // ── MORE ADS ──────────────────────────────────────────────────────────
  console.log('  • ads');
  // Base seed forced Ad id:1, which left the Postgres sequence behind — realign
  // it to MAX(id) so autoincrement inserts don't collide.
  await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Ad"', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM "Ad"), 1))`);
  const adDefs = [
    { title: 'MTN Rwanda — Score Big', targetUrl: 'https://mtn.rw', position: 'SIDEBAR', imageUrl: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=800&q=80' },
    { title: 'Skol Beer — Official Partner', targetUrl: 'https://skol.rw', position: 'HOME_BANNER', imageUrl: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=1200&q=80' },
    { title: 'BK Bank — Back the Team', targetUrl: 'https://bk.rw', position: 'MATCH_PAGE', imageUrl: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=800&q=80' },
  ];
  for (const a of adDefs) {
    const exists = await prisma.ad.findFirst({ where: { title: a.title } });
    if (!exists) await prisma.ad.create({ data: { ...a, active: true } });
  }

  // ── MARKER ────────────────────────────────────────────────────────────
  await prisma.setting.create({ data: { skey: MARKER, sval: new Date().toISOString(), label: 'Extra sample data applied', grp: 'system' } });

  // Summary
  const counts = {
    sports: await prisma.sport.count(), federations: await prisma.federation.count(), venues: await prisma.venue.count(),
    teams: await prisma.team.count(), players: await prisma.player.count(), leagues: await prisma.league.count(),
    fixtures: await prisma.fixture.count(), standings: await prisma.standing.count(), topScorers: await prisma.topScorer.count(),
    news: await prisma.news.count(), contacts: await prisma.contact.count(), transfers: await prisma.transfer.count(),
    akcSchools: await prisma.akcSchool.count(), akcTeams: await prisma.akcTeam.count(), akcPlayers: await prisma.akcPlayer.count(),
    akcFixtures: await prisma.akcFixture.count(), akcAnnouncements: await prisma.akcAnnouncement.count(), ads: await prisma.ad.count(),
  };
  console.log('✅ Extra seeding complete. Totals:', JSON.stringify(counts, null, 2));
}

main()
  .catch((e) => { console.error('❌ seed-extra failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
