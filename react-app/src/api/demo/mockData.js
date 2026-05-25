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