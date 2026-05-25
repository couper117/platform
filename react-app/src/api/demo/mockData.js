/**
 * Demo dataset for the static showcase build (VITE_DEMO=true).
 * All data is fictional and self-contained — no backend or database required.
 * Shapes mirror what the API controllers return ({ data: [...] }, detail objects, etc.).
 */

const now = Date.now();
const days = (n) => new Date(now + n * 86400000).toISOString();
const hours = (n) => new Date(now + n * 3600000).toISOString();
const mins = (n) => new Date(now + n * 60000).toISOString();

// Stable remote images (Unsplash) keep the showcase looking real without local assets.
const img = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80`;

export const sports = [
  { id: 1, name: 'Football', icon: '⚽', slug: 'football', category: 'FIELD', sortOrder: 1 },
  { id: 2, name: 'Basketball', icon: '🏀', slug: 'basketball', category: 'COURT', sortOrder: 2 },
  { id: 3, name: 'Volleyball', icon: '🏐', slug: 'volleyball', category: 'COURT', sortOrder: 3 },
];

export const leagues = [
  { id: 1, name: 'Rwanda Premier League', slug: 'rpl', season: '2025/2026', gender: 'MALE', status: 'ACTIVE', level: 'NATIONAL', sport: sports[0], _count: { teams: 6 } },
  { id: 2, name: 'National Basketball League', slug: 'nbl', season: '2025/2026', gender: 'MALE', status: 'ACTIVE', level: 'NATIONAL', sport: sports[1], _count: { teams: 12 } },
  { id: 3, name: "Women's Volleyball League", slug: 'wvl', season: '2025/2026', gender: 'FEMALE', status: 'ACTIVE', level: 'NATIONAL', sport: sports[2], _count: { teams: 10 } },
  { id: 4, name: 'Kagame Cup Schools', slug: 'akc-cup', season: '2025/2026', gender: 'MIXED', status: 'UPCOMING', level: 'SCHOOL', sport: sports[0], _count: { teams: 24 } },
];

export const teams = [
  { id: 1, name: 'APR FC', shortName: 'APR', slug: 'apr-fc', city: 'Kigali', status: 'VERIFIED', logo: null, sport: sports[0] },
  { id: 2, name: 'Rayon Sports', shortName: 'RS', slug: 'rayon-sports', city: 'Nyanza', status: 'VERIFIED', logo: null, sport: sports[0] },
  { id: 3, name: 'Police FC', shortName: 'POL', slug: 'police-fc', city: 'Kigali', status: 'VERIFIED', logo: null, sport: sports[0] },
  { id: 4, name: 'AS Kigali', shortName: 'ASK', slug: 'as-kigali', city: 'Kigali', status: 'VERIFIED', logo: null, sport: sports[0] },
  { id: 5, name: 'Musanze FC', shortName: 'MUS', slug: 'musanze-fc', city: 'Musanze', status: 'PENDING', logo: null, sport: sports[0] },
  { id: 6, name: 'Gorilla FC', shortName: 'GOR', slug: 'gorilla-fc', city: 'Rubavu', status: 'VERIFIED', logo: null, sport: sports[0] },
];

const teamRef = (id) => {
  const team = teams.find((x) => x.id === id);
  return { id: team.id, name: team.name, shortName: team.shortName, logo: team.logo };
};

export const fixtures = [
  // Live
  { id: 101, homeTeamId: 2, awayTeamId: 1, status: 'LIVE', homeTeam: teamRef(2), awayTeam: teamRef(1), homeScore: 1, awayScore: 1, matchDate: hours(-1), venue: 'Amahoro Stadium', referee: 'P. Mukasine', league: { id: 1, name: 'Rwanda Premier League' } },
  { id: 102, homeTeamId: 3, awayTeamId: 4, status: 'LIVE', homeTeam: teamRef(3), awayTeam: teamRef(4), homeScore: 0, awayScore: 2, matchDate: hours(-0.5), venue: 'Kigali Pelé Stadium', referee: 'J. Habineza', league: { id: 1, name: 'Rwanda Premier League' } },
  // Scheduled / upcoming
  { id: 103, homeTeamId: 1, awayTeamId: 5, status: 'SCHEDULED', homeTeam: teamRef(1), awayTeam: teamRef(5), homeScore: null, awayScore: null, matchDate: days(2), venue: 'Huye Stadium', league: { id: 1, name: 'Rwanda Premier League' } },
  { id: 104, homeTeamId: 6, awayTeamId: 2, status: 'SCHEDULED', homeTeam: teamRef(6), awayTeam: teamRef(2), homeScore: null, awayScore: null, matchDate: days(3), venue: 'Umuganda Stadium', league: { id: 1, name: 'Rwanda Premier League' } },
  { id: 105, homeTeamId: 4, awayTeamId: 3, status: 'SCHEDULED', homeTeam: teamRef(4), awayTeam: teamRef(3), homeScore: null, awayScore: null, matchDate: days(5), venue: 'Kigali Arena Pitch', league: { id: 1, name: 'Rwanda Premier League' } },
  // Completed / results
  { id: 106, homeTeamId: 1, awayTeamId: 3, status: 'COMPLETED', homeTeam: teamRef(1), awayTeam: teamRef(3), homeScore: 2, awayScore: 0, matchDate: days(-3), venue: 'Amahoro Stadium', referee: 'P. Mukasine', league: { id: 1, name: 'Rwanda Premier League' } },
  { id: 107, homeTeamId: 5, awayTeamId: 6, status: 'COMPLETED', homeTeam: teamRef(5), awayTeam: teamRef(6), homeScore: 3, awayScore: 1, matchDate: days(-4), venue: 'Ubworoherane Stadium', league: { id: 1, name: 'Rwanda Premier League' } },
  { id: 108, homeTeamId: 2, awayTeamId: 4, status: 'COMPLETED', homeTeam: teamRef(2), awayTeam: teamRef(4), homeScore: 1, awayScore: 1, matchDate: days(-6), venue: 'Nyamirambo Stadium', league: { id: 1, name: 'Rwanda Premier League' } },
];

export const standings = [
  { id: 1, leagueId: 1, team: teamRef(1), teamId: 1, played: 12, won: 9, drawn: 2, lost: 1, goalsFor: 24, goalsAgainst: 8, points: 29, form: 'WWWDW' },
  { id: 2, leagueId: 1, team: teamRef(3), teamId: 3, played: 12, won: 8, drawn: 2, lost: 2, goalsFor: 20, goalsAgainst: 10, points: 26, form: 'WWLWW' },
  { id: 3, leagueId: 1, team: teamRef(2), teamId: 2, played: 12, won: 7, drawn: 3, lost: 2, goalsFor: 18, goalsAgainst: 11, points: 24, form: 'DWWDL' },
  { id: 4, leagueId: 1, team: teamRef(4), teamId: 4, played: 12, won: 5, drawn: 4, lost: 3, goalsFor: 15, goalsAgainst: 13, points: 19, form: 'DDWLW' },
  { id: 5, leagueId: 1, team: teamRef(5), teamId: 5, played: 12, won: 4, drawn: 3, lost: 5, goalsFor: 14, goalsAgainst: 16, points: 15, form: 'LWDLW' },
  { id: 6, leagueId: 1, team: teamRef(6), teamId: 6, played: 12, won: 2, drawn: 2, lost: 8, goalsFor: 9, goalsAgainst: 22, points: 8, form: 'LLDLL' },
];

export const topScorers = [
  { id: 1, player: { fullName: 'Innocent Nshuti' }, team: teamRef(1), goals: 14 },
  { id: 2, player: { fullName: 'Bonheur Mugiraneza' }, team: teamRef(3), goals: 11 },
  { id: 3, player: { fullName: 'Olivier Niyonzima' }, team: teamRef(2), goals: 9 },
  { id: 4, player: { fullName: 'Yannick Mukunzi' }, team: teamRef(4), goals: 7 },
  { id: 5, player: { fullName: 'Thierry Manzi' }, team: teamRef(5), goals: 6 },
];

// --- Players (national league registry) ---
const POSITIONS = ['Goalkeeper', 'Defender', 'Midfielder', 'Striker'];
const SKILLS = ['PROFESSIONAL', 'SEMI_PRO', 'AMATEUR'];
const FIRST = ['Innocent', 'Bonheur', 'Olivier', 'Yannick', 'Thierry', 'Eric', 'Patrick', 'Kevin', 'Jean', 'Fiston', 'Aimable', 'Samuel'];
const LAST = ['Nshuti', 'Mugiraneza', 'Niyonzima', 'Mukunzi', 'Manzi', 'Habimana', 'Ndayisaba', 'Bizimana', 'Hakizimana', 'Tuyishime', 'Rwema', 'Iradukunda'];

export const players = Array.from({ length: 18 }, (_, i) => {
  const team = teams[i % teams.length];
  return {
    id: i + 1,
    fullName: `${FIRST[i % FIRST.length]} ${LAST[i % LAST.length]}`,
    nationality: 'Rwanda',
    photo: null,
    team: { id: team.id, name: team.name },
    teamId: team.id,
    position: POSITIONS[i % POSITIONS.length],
    skillLevel: SKILLS[i % SKILLS.length],
    jerseyNumber: (i % 23) + 1,
    status: i % 4 === 0 ? 'PENDING' : 'VERIFIED',
  };
});

const DOC_TYPES = ['NATIONAL_ID', 'BIRTH_CERTIFICATE', 'MEDICAL_CLEARANCE'];

export const documents = players.slice(0, 10).map((p, i) => ({
  id: i + 1,
  player: { fullName: p.fullName, team: { name: p.team.name } },
  docType: DOC_TYPES[i % DOC_TYPES.length],
  originalName: `${p.fullName.toLowerCase().replace(/\s+/g, '_')}_${DOC_TYPES[i % DOC_TYPES.length].toLowerCase()}.pdf`,
  filename: `https://example.com/docs/${i + 1}.pdf`,
  uploadedAt: days(-(i + 1)),
  status: i % 3 === 0 ? 'PENDING' : i % 3 === 1 ? 'APPROVED' : 'REJECTED',
}));

// --- Activity logs (visitor analytics) ---
const PATHS = ['/', '/leagues', '/fixtures', '/amashuri', '/amashuri/standings', '/news', '/leagues/1', '/matches/101'];
const AGENTS = ['Chrome/Windows', 'Safari/iPhone', 'Chrome/Android', 'Firefox/macOS'];
export const activityLogs = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  createdAt: mins(-(i * 7 + 2)),
  user: i % 5 === 0 ? { fullName: 'Demo Administrator' } : null,
  action: i % 4 === 0 ? 'LOGIN' : 'PAGE_VIEW',
  ip: `41.74.${100 + (i % 50)}.${10 + i}`,
  userAgent: AGENTS[i % AGENTS.length],
  pagePath: PATHS[i % PATHS.length],
}));

export const news = [
  { id: 1, slug: 'apr-clinch-derby', title: 'APR Clinch the Kigali Derby in Style', category: 'Match Report', coverImage: img('1551958219-acbc608c6377'), createdAt: days(-1), author: { fullName: 'Eric Niyonzima' }, excerpt: 'A second-half surge sealed a memorable derby night at Amahoro Stadium.', body: 'A second-half surge sealed a memorable derby night at Amahoro Stadium, with the champions reasserting their dominance in front of a roaring home crowd.' },
  { id: 2, slug: 'rayon-sign-striker', title: 'Rayon Sports Complete Marquee Striker Signing', category: 'Transfers', coverImage: img('1431324155629-1a6deb1dec8d'), createdAt: days(-2), author: { fullName: 'Aline Uwase' }, excerpt: 'The Blues bolster their attack ahead of the title run-in.', body: 'The Blues have bolstered their attacking options ahead of a crucial title run-in, announcing the capture of one of the league\'s most prolific forwards.' },
  { id: 3, slug: 'kagame-cup-preview', title: 'Kagame Cup: Schools Gear Up for National Finals', category: 'Amashuri', coverImage: img('1459865264687-595d652de67e'), createdAt: days(-3), author: { fullName: 'Jean Damascene' }, excerpt: 'The road to the national schools championship reaches its climax.', body: 'The road to the national schools championship reaches its climax this month as district winners converge on Kigali for the final stages.' },
  { id: 4, slug: 'volleyball-league-roundup', title: "Women's Volleyball League Weekend Roundup", category: 'Roundup', coverImage: img('1612872087720-bb876e2e67d1'), createdAt: days(-5), author: { fullName: 'Claudine Mukamana' }, excerpt: 'Title contenders trade blows in a thrilling weekend of action.', body: 'Title contenders traded blows in a thrilling weekend of action, leaving the championship race finely poised heading into the final rounds.' },
];

// Flat ad list (admin) + position lookup (public banners).
export const adsList = [
  { id: 1, title: 'Inyange Summer Campaign', imageUrl: img('1550537687-c9107db4d4a5'), targetUrl: 'https://example.com', position: 'HOME_BANNER', active: true },
  { id: 2, title: 'BK Arena Events', imageUrl: img('1493711662062-fa541adb3fc8'), targetUrl: 'https://example.com', position: 'SPOTLIGHT_BANNER', active: true },
  { id: 3, title: 'MTN Rwanda Sponsorship', imageUrl: img('1574629810360-7efbbe195018'), targetUrl: 'https://example.com', position: 'SIDEBAR', active: true },
];

export const settings = {
  site_name: 'RwaSport',
  hero_title: 'The Heartbeat of Rwandan Sport',
  contact_email: 'info@rwasport.rw',
  support_phone: '+250 788 000 000',
};

// --- Amashuri Games (inter-school) ---
export const schools = [
  { id: 1, name: 'Kigali International School', code: 'KIS-001', category: 'SECONDARY', sector: 'Gasabo', logo: null, active: true },
  { id: 2, name: 'Lycee de Kigali', code: 'LDK-002', category: 'SECONDARY', sector: 'Nyarugenge', logo: null, active: true },
  { id: 3, name: 'Groupe Scolaire Officiel de Butare', code: 'GSOB-003', category: 'SECONDARY', sector: 'Huye', logo: null, active: true },
  { id: 4, name: 'Ecole des Sciences Byimana', code: 'ESB-004', category: 'SECONDARY', sector: 'Ruhango', logo: null, active: true },
  { id: 5, name: 'FAWE Girls School', code: 'FAWE-005', category: 'SECONDARY', sector: 'Gasabo', logo: null, active: true },
  { id: 6, name: 'IPRC Kigali', code: 'IPRC-006', category: 'TVET', sector: 'Kicukiro', logo: null, active: true },
];

const schoolRef = (id) => {
  const s = schools.find((x) => x.id === id);
  return { id: s.id, name: s.name, logo: s.logo, sector: s.sector };
};

// Each school fields a few teams; players keep the roster counts honest.
const akcPlayersFor = (teamId, n) => Array.from({ length: n }, (_, i) => ({
  id: teamId * 100 + i + 1,
  fullName: `${FIRST[(teamId + i) % FIRST.length]} ${LAST[(teamId * 2 + i) % LAST.length]}`,
  position: POSITIONS[i % POSITIONS.length],
  jersey: i + 1,
  docVerified: i % 3 !== 0,
}));

export const akcTeams = [
  { id: 1, schoolId: 1, school: schoolRef(1), sport: sports[0], gender: 'MALE', ageCategory: 'U17', coachName: 'Jean Damascene', players: akcPlayersFor(1, 11) },
  { id: 2, schoolId: 1, school: schoolRef(1), sport: sports[2], gender: 'FEMALE', ageCategory: 'U19', coachName: 'Grace Ingabire', players: akcPlayersFor(2, 9) },
  { id: 3, schoolId: 2, school: schoolRef(2), sport: sports[0], gender: 'MALE', ageCategory: 'U17', coachName: 'Patrick Habimana', players: akcPlayersFor(3, 11) },
  { id: 4, schoolId: 3, school: schoolRef(3), sport: sports[0], gender: 'MALE', ageCategory: 'U17', coachName: 'Eric Mutoni', players: akcPlayersFor(4, 10) },
  { id: 5, schoolId: 5, school: schoolRef(5), sport: sports[2], gender: 'FEMALE', ageCategory: 'U19', coachName: 'Claudine Uwera', players: akcPlayersFor(5, 12) },
];

export const akcCompetitions = [
  { id: 1, name: 'Kagame Cup Schools', edition: '2026 Edition', status: 'ONGOING', level: 'National', venue: 'Amahoro Stadium', startDate: days(-10), _count: { fixtures: 12, standings: 6 } },
  { id: 2, name: 'Genocide Memorial Tournament', edition: '2026 Edition', status: 'UPCOMING', level: 'Provincial', venue: 'Huye Stadium', startDate: days(14), _count: { fixtures: 8, standings: 8 } },
  { id: 3, name: 'Inter-District Basketball Championship', edition: '2025 Edition', status: 'COMPLETED', level: 'District', venue: 'BK Arena', startDate: days(-90), _count: { fixtures: 20, standings: 10 } },
];

export const akcStandings = [
  { id: 1, competitionId: 1, teamId: 1, team: { id: 1, school: schoolRef(1) }, played: 5, won: 5, drawn: 0, lost: 0, gf: 14, ga: 3, points: 15 },
  { id: 2, competitionId: 1, teamId: 2, team: { id: 2, school: schoolRef(2) }, played: 5, won: 3, drawn: 1, lost: 1, gf: 9, ga: 5, points: 10 },
  { id: 3, competitionId: 1, teamId: 3, team: { id: 3, school: schoolRef(3) }, played: 5, won: 3, drawn: 0, lost: 2, gf: 8, ga: 7, points: 9 },
  { id: 4, competitionId: 1, teamId: 4, team: { id: 4, school: schoolRef(4) }, played: 5, won: 2, drawn: 1, lost: 2, gf: 6, ga: 6, points: 7 },
  { id: 5, competitionId: 1, teamId: 5, team: { id: 5, school: schoolRef(5) }, played: 5, won: 1, drawn: 1, lost: 3, gf: 4, ga: 9, points: 4 },
  { id: 6, competitionId: 1, teamId: 6, team: { id: 6, school: schoolRef(6) }, played: 5, won: 0, drawn: 1, lost: 4, gf: 2, ga: 13, points: 1 },
];

const akcTeamSide = (schoolId, ageCategory, gender) => ({ schoolId, school: schoolRef(schoolId), ageCategory, gender });

export const akcFixtures = [
  { id: 201, competitionId: 1, competition: { id: 1, name: 'Kagame Cup Schools' }, status: 'COMPLETED', homeTeamId: 1, winnerTeamId: 1, isDraw: false, stage: 'GROUP_STAGE', round: 'Round 4', homeTeam: akcTeamSide(1, 'U17', 'MALE'), awayTeam: akcTeamSide(3, 'U17', 'MALE'), homeScore: 3, awayScore: 1, matchDate: days(-2), venue: 'Amahoro Stadium', notes: 'A commanding group-stage win sends Kigali International top of the table.' },
  { id: 202, competitionId: 1, competition: { id: 1, name: 'Kagame Cup Schools' }, status: 'ONGOING', homeTeamId: 2, stage: 'GROUP_STAGE', round: 'Round 5', homeTeam: akcTeamSide(2, 'U17', 'MALE'), awayTeam: akcTeamSide(4, 'U17', 'MALE'), homeScore: 1, awayScore: 1, matchDate: hours(-1), venue: 'Kigali Pelé Stadium' },
  { id: 203, competitionId: 1, competition: { id: 1, name: 'Kagame Cup Schools' }, status: 'SCHEDULED', homeTeamId: 5, stage: 'GROUP_STAGE', round: 'Round 5', homeTeam: akcTeamSide(5, 'U19', 'FEMALE'), awayTeam: akcTeamSide(6, 'U19', 'FEMALE'), homeScore: null, awayScore: null, matchDate: days(2), venue: 'Petit Stade' },
  { id: 204, competitionId: 1, competition: { id: 1, name: 'Kagame Cup Schools' }, status: 'SCHEDULED', homeTeamId: 1, stage: 'SEMI_FINAL', round: 'Semi-final', homeTeam: akcTeamSide(1, 'U17', 'MALE'), awayTeam: akcTeamSide(2, 'U17', 'MALE'), homeScore: null, awayScore: null, matchDate: days(4), venue: 'Amahoro Stadium' },
];

// Demo admin account surfaced on the login screen.
export const demoUser = {
  id: 1,
  username: 'admin',
  fullName: 'Demo Administrator',
  email: 'admin@rwasport.rw',
  role: 'SUPERADMIN',
  active: true,
  verified: true,
};

/**
 * Role-aware demo login: the username hints which portal to open, so every
 * area (admin, team, reporter) is reachable. Any password works.
 *   coach* / team* / manager*  → TEAM_MANAGER  (team portal)
 *   reporter*                  → MATCH_REPORTER (live reporting)
 *   league*                    → LEAGUE_ADMIN   (admin area)
 *   anything else (e.g. admin) → SUPERADMIN     (full admin area)
 */
export const loginUser = (username = '') => {
  const u = String(username).toLowerCase();
  if (/coach|team|manager/.test(u)) return { ...demoUser, id: 4, username, fullName: 'Demo Team Manager', role: 'TEAM_MANAGER' };
  if (/reporter/.test(u)) return { ...demoUser, id: 3, username, fullName: 'Demo Reporter', role: 'MATCH_REPORTER' };
  if (/league/.test(u)) return { ...demoUser, id: 2, username, fullName: 'Demo League Admin', role: 'LEAGUE_ADMIN' };
  return { ...demoUser, username: username || 'admin' };
};

// ---------- Detail builders (relations the detail screens expect) ----------

// League detail: teams as { team } wrappers + standings + top scorers.
export const buildLeagueDetail = (league) => ({
  ...league,
  teams: standings.map((s) => ({ team: s.team })),
  standings,
  topScorers,
});

// Fixture detail: match events + lineups for the timeline / lineups / stats tabs.
const lineupFor = (teamId) => players
  .filter((p) => p.teamId === teamId)
  .slice(0, 5)
  .map((p, i) => ({ id: teamId * 50 + i, teamId, jerseyNo: p.jerseyNumber, isCaptain: i === 0, position: p.position, player: { fullName: p.fullName } }));

export const buildFixtureDetail = (fx) => {
  const homePlayers = players.filter((p) => p.teamId === fx.homeTeamId);
  const awayPlayers = players.filter((p) => p.teamId === fx.awayTeamId);
  const events = [];
  if (fx.status === 'COMPLETED' || fx.status === 'LIVE') {
    for (let i = 0; i < (fx.homeScore || 0); i++) {
      events.push({ id: `${fx.id}-h-${i}`, eventType: 'GOAL', minute: 12 + i * 20, teamId: fx.homeTeamId, player: { fullName: homePlayers[i % homePlayers.length]?.fullName || 'Player' } });
    }
    for (let i = 0; i < (fx.awayScore || 0); i++) {
      events.push({ id: `${fx.id}-a-${i}`, eventType: 'GOAL', minute: 20 + i * 18, teamId: fx.awayTeamId, player: { fullName: awayPlayers[i % awayPlayers.length]?.fullName || 'Player' } });
    }
    events.push({ id: `${fx.id}-yc`, eventType: 'YELLOW_CARD', minute: 55, teamId: fx.awayTeamId, player: { fullName: awayPlayers[0]?.fullName || 'Player' } });
  }
  return {
    ...fx,
    referee: fx.referee || 'TBD',
    streamActive: false,
    events,
    lineups: [...lineupFor(fx.homeTeamId), ...lineupFor(fx.awayTeamId)],
  };
};

// "My team" dashboard: roster + per-player documents.
export const buildMyTeam = () => {
  const roster = players.filter((p) => p.teamId === 1).map((p) => ({
    ...p,
    documents: Array.from({ length: p.status === 'VERIFIED' ? 3 : 1 }, () => ({ status: 'APPROVED' })),
  }));
  return { ...teams[0], players: roster };
};

// School profile: school + its teams (with rosters).
export const buildSchoolDetail = (school) => ({
  ...school,
  teams: akcTeams.filter((tm) => tm.schoolId === school.id),
});
