/**
 * Demo dataset for the static showcase build (VITE_DEMO=true).
 *
 * Self-contained: no backend, no database, no network. Every image is an
 * original SVG produced by ./assets (offline, no trademarked artwork). Data uses
 * real Rwandan clubs, schools, venues and names so the platform reads as a live
 * national system to the Ministry, while every record is illustrative.
 *
 * Shapes mirror what the API controllers return: list endpoints as { data: [...] },
 * detail endpoints as the object with its relations.
 */

// Imported from the package, not src/i18n: mockData loads through the top-level
// await import() in api/client, and reaching back into the app's own i18n module
// closes a cycle across that await and stalls the entry graph. Same singleton.
import i18n from 'i18next';
import { crest, avatar, cover } from './assets';

const now = Date.now();
/**
 * `n` days from now, at a REAL KICK-OFF TIME.
 *
 * This used to carry the current clock forward, so every upcoming fixture in the
 * demo showed whatever time the page happened to be opened — a whole schedule
 * reading "21:10", which looks broken rather than scheduled. Kick-offs now land on
 * the hours Rwandan football and basketball actually play, varied by the day so a
 * matchday has a shape.
 */
const KICKOFFS = [16, 19, 18, 20, 15, 17];
const days = (n, hour?) => {
  const d = new Date(now + n * 86400000);
  d.setHours(hour ?? KICKOFFS[Math.abs(n) % KICKOFFS.length], (Math.abs(n) % 2) * 30, 0, 0);
  return d.toISOString();
};
const hours = (n) => new Date(now + n * 3600000).toISOString();
const mins = (n) => new Date(now + n * 60000).toISOString();
const yearsAgo = (n) => new Date(now - n * 365.25 * 86400000).toISOString();

/* ── name pools (authentic Rwandan names) ──────────────────────────────── */
const FIRST = ['Innocent', 'Bonheur', 'Olivier', 'Yannick', 'Thierry', 'Eric', 'Patrick', 'Kevin', 'Jean', 'Fiston', 'Aimable', 'Samuel', 'Emmanuel', 'Gilbert', 'Hussein', 'Blaise', 'Prince', 'Claude', 'Ernest', 'Faustin', 'Herve', 'Ismael', 'Kennedy', 'Landry', 'Moise', 'Norbert', 'Djihad', 'Muhadjiri', 'Lague', 'Abeddy'];
const LAST = ['Nshuti', 'Mugiraneza', 'Niyonzima', 'Mukunzi', 'Manzi', 'Habimana', 'Ndayisaba', 'Bizimana', 'Hakizimana', 'Tuyishime', 'Rwema', 'Iradukunda', 'Nsanzimana', 'Uwimana', 'Bukuru', 'Mucyo', 'Kagabo', 'Rutsindura', 'Sibomana', 'Mvuyekure', 'Ntwari', 'Ishimwe', 'Gatete', 'Munyaneza'];
const FIRST_F = ['Grace', 'Claudine', 'Aline', 'Divine', 'Peace', 'Yvette', 'Sandrine', 'Josiane', 'Chantal', 'Ines', 'Vestine', 'Gisele', 'Ange', 'Solange'];

const nameAt = (seed, female = false) => {
  const f = (female ? FIRST_F : FIRST)[seed % (female ? FIRST_F.length : FIRST.length)];
  const l = LAST[(seed * 7 + 3) % LAST.length];
  return `${f} ${l}`;
};

const FB_POS = ['Goalkeeper', 'Right-Back', 'Centre-Back', 'Centre-Back', 'Left-Back', 'Defensive Midfield', 'Central Midfield', 'Attacking Midfield', 'Right Wing', 'Left Wing', 'Striker', 'Striker', 'Central Midfield', 'Centre-Back', 'Goalkeeper', 'Right Wing', 'Striker', 'Left-Back'];
const BB_POS = ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'];
const VB_POS = ['Setter', 'Outside Hitter', 'Middle Blocker', 'Opposite', 'Libero'];
const HB_POS = ['Goalkeeper', 'Left Wing', 'Left Back', 'Centre Back', 'Pivot', 'Right Back', 'Right Wing'];
const CYC_ROLES = ['Climber', 'Sprinter', 'Rouleur', 'Domestique', 'Time-trialist', 'All-rounder'];
const ATH_EVENTS = ['100m', '200m', '400m', '800m', '1500m', '5000m', 'Long Jump', 'High Jump', 'Javelin', 'Shot Put'];
const SKILLS = ['PROFESSIONAL', 'PROFESSIONAL', 'SEMI_PROFESSIONAL', 'AMATEUR'];

/* ── sports ────────────────────────────────────────────────────────────── */
export const sports = [
  { id: 1, name: 'Football', icon: '⚽', slug: 'football', category: 'FIELD', type: 'TEAM', sortOrder: 1, active: true, coverImage: cover('football', '#0B6E3F'), description: 'The national game — 16 clubs across the Rwanda Premier League.', _count: { teams: 48, leagues: 18, matches: 142 } },
  { id: 2, name: 'Basketball', icon: '🏀', slug: 'basketball', category: 'COURT', type: 'TEAM', sortOrder: 2, active: true, coverImage: cover('basketball', '#C81E1E'), description: 'Home of the BAL — the Rwanda Basketball League at BK Arena.', _count: { teams: 24, leagues: 6, matches: 48 } },
  { id: 3, name: 'Volleyball', icon: '🏐', slug: 'volleyball', category: 'COURT', type: 'TEAM', sortOrder: 3, active: true, coverImage: cover('volleyball', '#1D4ED8'), description: 'Men’s and women’s national leagues.', _count: { teams: 20, leagues: 4, matches: 31 } },
  { id: 4, name: 'Cycling', icon: '🚴', slug: 'cycling', category: 'TRACK', type: 'RACING', sortOrder: 4, active: true, coverImage: cover('cycling', '#F59E0B'), description: 'The Tour du Rwanda and the national road calendar.', _count: { teams: 8, leagues: 2, matches: 8 } },
  { id: 5, name: 'Athletics', icon: '🏃', slug: 'athletics', category: 'TRACK', type: 'RACING', sortOrder: 5, active: true, coverImage: cover('athletics', '#7C3AED'), description: 'Track, field and road running.', _count: { teams: 40, leagues: 3, matches: 12 } },
  { id: 6, name: 'Handball', icon: '🤾', slug: 'handball', category: 'COURT', type: 'TEAM', sortOrder: 6, active: true, coverImage: cover('handball', '#0D9488'), description: 'National handball championship.', _count: { teams: 44, leagues: 3, matches: 22 } },
  { id: 7, name: 'Netball', icon: 'ð', slug: 'netball', category: 'COURT', type: 'TEAM', sortOrder: 7, active: true, coverImage: null, description: 'The national netball league, played across Kigali and the provinces.', _count: { teams: 16, leagues: 2, matches: 26 } },
  { id: 8, name: 'Swimming', icon: 'ð', slug: 'swimming', category: 'AQUATIC', type: 'RACING', sortOrder: 8, active: true, coverImage: null, description: 'National championships and age-group galas.', _count: { teams: 12, leagues: 2, matches: 9 } },
  { id: 9, name: 'Tennis', icon: 'ð¾', slug: 'tennis', category: 'COURT', type: 'TEAM', sortOrder: 9, active: true, coverImage: null, description: 'The Rwanda Tennis Federation circuit.', _count: { teams: 10, leagues: 2, matches: 14 } },
  { id: 10, name: 'Judo', icon: 'ð¥', slug: 'judo', category: 'COMBAT', type: 'RACING', sortOrder: 10, active: true, coverImage: null, description: 'National judo championships and continental qualifiers.', _count: { teams: 9, leagues: 1, matches: 7 } },
  { id: 11, name: 'Boxing', icon: 'ð¥', slug: 'boxing', category: 'COMBAT', type: 'RACING', sortOrder: 11, active: true, coverImage: null, description: 'Amateur and elite national boxing cards.', _count: { teams: 11, leagues: 1, matches: 8 } },
  { id: 12, name: 'Chess', icon: 'â', slug: 'chess', category: 'INDOOR', type: 'TEAM', sortOrder: 12, active: true, coverImage: null, description: 'The national chess championship and school olympiads.', _count: { teams: 18, leagues: 2, matches: 21 } },
];
const sportRef = (id) => { const s = sports.find((x) => x.id === id); return { id: s.id, name: s.name, slug: s.slug, icon: s.icon }; };

/* ── federations ───────────────────────────────────────────────────────── */
export const federations = [
  { id: 1, name: 'Rwanda Football Federation', abbreviation: 'FERWAFA', sportId: 1, sport: sportRef(1), logo: crest('FERWAFA', '#0B6E3F', '#FFD200'), website: 'ferwafa.rw', email: 'info@ferwafa.rw', active: true, description: 'Governing body for football in Rwanda.', _count: { leagues: 3 } },
  { id: 2, name: 'Rwanda Basketball Federation', abbreviation: 'FERWABA', sportId: 2, sport: sportRef(2), logo: crest('FERWABA', '#C81E1E', '#FFFFFF'), website: 'ferwaba.rw', email: 'info@ferwaba.rw', active: true, description: 'Governing body for basketball in Rwanda.', _count: { leagues: 2 } },
  { id: 3, name: 'Rwanda Volleyball Federation', abbreviation: 'FRVB', sportId: 3, sport: sportRef(3), logo: crest('FRVB', '#1D4ED8', '#FFD200'), website: 'frvb.rw', email: 'info@frvb.rw', active: true, description: 'Governing body for volleyball in Rwanda.', _count: { leagues: 2 } },
  { id: 4, name: 'Rwanda Cycling Federation', abbreviation: 'FERWACY', sportId: 4, sport: sportRef(4), logo: crest('FERWACY', '#F59E0B', '#0B6E3F'), website: 'ferwacy.rw', email: 'info@ferwacy.rw', active: true, description: 'Organiser of the Tour du Rwanda.', _count: { leagues: 1 } },
  { id: 5, name: 'Rwanda Athletics Federation', abbreviation: 'RAF', sportId: 5, sport: sportRef(5), logo: crest('RAF', '#7C3AED', '#FFD200'), website: 'athletics.rw', email: 'info@athletics.rw', active: true, description: 'Governing body for athletics in Rwanda.', _count: { leagues: 1 } },
];

/* ── venues ────────────────────────────────────────────────────────────── */
export const venues = [
  { id: 1, name: 'Amahoro National Stadium', city: 'Kigali', province: 'Kigali City', capacity: 45000, surface: 'Grass', active: true },
  { id: 2, name: 'BK Arena', city: 'Kigali', province: 'Kigali City', capacity: 10000, surface: 'Hardwood', active: true },
  { id: 3, name: 'Kigali Pelé Stadium', city: 'Kigali', province: 'Kigali City', capacity: 22000, surface: 'Artificial turf', active: true },
  { id: 4, name: 'Huye Stadium', city: 'Huye', province: 'Southern', capacity: 12000, surface: 'Grass', active: true },
  { id: 5, name: 'Umuganda Stadium', city: 'Rubavu', province: 'Western', capacity: 8000, surface: 'Grass', active: true },
  { id: 6, name: 'Ubworoherane Stadium', city: 'Musanze', province: 'Northern', capacity: 6000, surface: 'Grass', active: true },
  { id: 7, name: 'Nyanza Stadium', city: 'Nyanza', province: 'Southern', capacity: 5000, surface: 'Grass', active: true },
  { id: 8, name: 'Petit Stade Remera', city: 'Kigali', province: 'Kigali City', capacity: 3000, surface: 'Artificial turf', active: true },
];

/* ── teams ─────────────────────────────────────────────────────────────── */
const T = (id, name, shortName, sportId, primary, secondary, opts: any = {}) => ({
  id, name, shortName, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
  sportId, sport: sportRef(sportId),
  primaryColor: primary, secondaryColor: secondary,
  logo: crest(shortName, primary, secondary, opts.foundedYear),
  city: opts.city || 'Kigali', district: opts.district || 'Gasabo', province: opts.province || 'Kigali City',
  foundedYear: opts.foundedYear || 2005, homeVenue: opts.homeVenue || 'Kigali Pelé Stadium',
  registrationNo: `RW-CLB-${1000 + id}`,
  status: opts.status || 'VERIFIED', verifiedAt: opts.status === 'PENDING' ? null : days(-120),
  email: `info@${name.toLowerCase().replace(/[^a-z0-9]+/g, '')}.rw`, phone: `+250 78${(2 + (id % 7))} ${100 + id} ${200 + id}`,
  website: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '')}.rw`,
  subscriptionActive: opts.status !== 'PENDING', subscriptionUntil: days(180),
  description: opts.description || `${name} — competing in Rwanda’s national competitions.`,
  active: true,
  _count: { players: opts.squad || 24 },
});

export const teams = [
  // Football — Rwanda Premier League
  T(1, 'APR FC', 'APR', 1, '#0B6E3F', '#FFD200', { city: 'Kigali', foundedYear: 1993, homeVenue: 'Kigali Pelé Stadium', description: 'Record national champions, backed by the Rwanda Defence Force.' }),
  T(2, 'Rayon Sports', 'RAY', 1, '#1D4ED8', '#FFFFFF', { city: 'Nyanza', district: 'Nyanza', province: 'Southern', foundedYear: 1965, homeVenue: 'Nyanza Stadium', description: 'One of Rwanda’s oldest and best-supported clubs.' }),
  T(3, 'Police FC', 'POL', 1, '#12386E', '#C81E1E', { city: 'Kigali', foundedYear: 2013, homeVenue: 'Kigali Pelé Stadium' }),
  T(4, 'AS Kigali', 'ASK', 1, '#C81E1E', '#FFFFFF', { city: 'Kigali', foundedYear: 2002, homeVenue: 'Kigali Pelé Stadium' }),
  T(5, 'Mukura Victory Sports', 'MVS', 1, '#1E40AF', '#FFD200', { city: 'Huye', district: 'Huye', province: 'Southern', foundedYear: 1965, homeVenue: 'Huye Stadium' }),
  T(6, 'Kiyovu Sports', 'KIY', 1, '#0F7A3D', '#FFFFFF', { city: 'Kigali', foundedYear: 1972 }),
  T(7, 'Musanze FC', 'MUS', 1, '#15803D', '#FFFFFF', { city: 'Musanze', district: 'Musanze', province: 'Northern', foundedYear: 2005, homeVenue: 'Ubworoherane Stadium', status: 'PENDING' }),
  T(8, 'Gasogi United', 'GAS', 1, '#7C3AED', '#FFD200', { city: 'Kigali', foundedYear: 2016 }),
  T(9, 'Etincelles FC', 'ETC', 1, '#EA580C', '#0B6E3F', { city: 'Rubavu', district: 'Rubavu', province: 'Western', foundedYear: 1998, homeVenue: 'Umuganda Stadium' }),
  T(10, 'Bugesera FC', 'BUG', 1, '#0D9488', '#FFFFFF', { city: 'Nyamata', district: 'Bugesera', province: 'Eastern', foundedYear: 2013 }),
  T(11, 'Marines FC', 'MAR', 1, '#0369A1', '#FFD200', { city: 'Rubavu', district: 'Rubavu', province: 'Western', foundedYear: 2011, homeVenue: 'Umuganda Stadium' }),
  T(12, 'Gorilla FC', 'GOR', 1, '#334155', '#F59E0B', { city: 'Rubavu', district: 'Rubavu', province: 'Western', foundedYear: 2015, homeVenue: 'Umuganda Stadium', status: 'PENDING' }),
  // Basketball — Rwanda Basketball League
  T(20, 'Patriots BBC', 'PAT', 2, '#1D4ED8', '#FFD200', { foundedYear: 2005, homeVenue: 'BK Arena', squad: 14 }),
  T(21, 'REG BBC', 'REG', 2, '#0B6E3F', '#FFD200', { foundedYear: 2015, homeVenue: 'BK Arena', squad: 14 }),
  T(22, 'APR BBC', 'APR', 2, '#0B6E3F', '#FFFFFF', { foundedYear: 1993, homeVenue: 'BK Arena', squad: 14 }),
  T(23, 'Espoir BBC', 'ESP', 2, '#F59E0B', '#12386E', { foundedYear: 1978, homeVenue: 'BK Arena', squad: 14 }),
  // Volleyball — Women's Volleyball League
  T(30, 'APR VC', 'APR', 3, '#0B6E3F', '#FFD200', { foundedYear: 1996, squad: 14 }),
  T(31, 'REG VC', 'REG', 3, '#0B6E3F', '#1D4ED8', { foundedYear: 2015, squad: 14 }),
  T(32, 'Gisagara VC', 'GIS', 3, '#1D4ED8', '#FFFFFF', { city: 'Gisagara', province: 'Southern', foundedYear: 2010, squad: 14 }),
  T(33, 'UTB VC', 'UTB', 3, '#7C3AED', '#FFD200', { foundedYear: 2012, squad: 14 }),
  T(34, 'Police VC', 'POL', 3, '#12386E', '#C81E1E', { foundedYear: 2013, squad: 14 }),
  T(35, 'Rwanda Revenue VC', 'RRA', 3, '#0369A1', '#FFD200', { foundedYear: 2008, squad: 14 }),
  // Basketball — extra clubs
  T(24, 'IPRC BBC', 'IPR', 2, '#0D9488', '#FFFFFF', { foundedYear: 2010, homeVenue: 'BK Arena', squad: 14 }),
  T(25, 'UGB BBC', 'UGB', 2, '#C81E1E', '#FFD200', { city: 'Huye', province: 'Southern', foundedYear: 2004, homeVenue: 'BK Arena', squad: 14 }),
  // Handball — National Handball League
  T(60, 'APR Handball', 'APR', 6, '#0B6E3F', '#FFD200', { foundedYear: 1996, homeVenue: 'Amahoro Indoor Arena', squad: 16 }),
  T(61, 'Police Handball', 'POL', 6, '#12386E', '#C81E1E', { foundedYear: 2013, homeVenue: 'Amahoro Indoor Arena', squad: 16 }),
  T(62, 'Espoir Handball', 'ESP', 6, '#F59E0B', '#0B6E3F', { foundedYear: 1998, homeVenue: 'Petit Stade Remera', squad: 16 }),
  T(63, 'UR Handball', 'UR', 6, '#1D4ED8', '#FFFFFF', { city: 'Huye', province: 'Southern', foundedYear: 2005, homeVenue: 'Huye Sports Hall', squad: 16 }),
  // Cycling — national teams (Tour du Rwanda)
  T(40, 'Team Rwanda', 'RWA', 4, '#0B6E3F', '#FFD200', { foundedYear: 2007, homeVenue: 'Africa Rising Cycling Centre', squad: 8 }),
  T(41, 'Benediction Ignite CT', 'BEN', 4, '#C81E1E', '#0B6E3F', { foundedYear: 2019, squad: 8 }),
  T(42, 'Amterre Cycling Team', 'AMT', 4, '#1D4ED8', '#FFD200', { foundedYear: 2021, squad: 8 }),
  T(43, 'Java Inganzo Rwanda', 'JAV', 4, '#7C3AED', '#FFFFFF', { foundedYear: 2022, squad: 8 }),
  // Athletics — regional clubs
  T(50, 'Kigali Athletics Club', 'KAC', 5, '#0B6E3F', '#FFD200', { foundedYear: 2000, homeVenue: 'Amahoro National Stadium', squad: 12 }),
  T(51, 'Huye Athletics Club', 'HAC', 5, '#C81E1E', '#FFFFFF', { city: 'Huye', province: 'Southern', foundedYear: 2002, homeVenue: 'Huye Stadium', squad: 12 }),
  T(52, 'Musanze Athletics Club', 'MAC', 5, '#1D4ED8', '#FFD200', { city: 'Musanze', province: 'Northern', foundedYear: 2004, homeVenue: 'Ubworoherane Stadium', squad: 12 }),
  T(53, 'Rubavu Athletics Club', 'RAC', 5, '#F59E0B', '#0B6E3F', { city: 'Rubavu', province: 'Western', foundedYear: 2006, homeVenue: 'Umuganda Stadium', squad: 12 }),
];
const teamRef = (id) => { const t = teams.find((x) => x.id === id); return { id: t.id, name: t.name, shortName: t.shortName, slug: t.slug, logo: t.logo, primaryColor: t.primaryColor }; };
const footballTeams = teams.filter((t) => t.sportId === 1);

/* ── players (full rosters) ────────────────────────────────────────────── */
let PID = 0;
const rosterFor = (team, size, posPool, female = false) => Array.from({ length: size }, (_, i) => {
  PID += 1;
  const fullName = nameAt(team.id * 13 + i, female);
  const age = 18 + ((team.id * 3 + i * 5) % 17);
  return {
    id: PID,
    fullName,
    photo: avatar(fullName),
    nationality: (i % 9 === 0) ? ['Cameroon', 'Ghana', 'Uganda', 'Burundi', 'DR Congo'][(team.id + i) % 5] : 'Rwanda',
    team: { id: team.id, name: team.name, logo: team.logo }, teamId: team.id,
    position: posPool[i % posPool.length],
    jerseyNumber: i + 1,
    dateOfBirth: yearsAgo(age),
    height: 168 + ((team.id + i * 3) % 26),
    weight: 62 + ((team.id * 2 + i) % 26),
    licenseNo: `RW-${team.sportId === 2 ? 'BBL' : team.sportId === 3 ? 'VBL' : 'FBL'}-${2400 + PID}`,
    idNumber: `1${1990 + (age % 9)}8${String(70000 + PID).slice(0, 7)}`,
    skillLevel: SKILLS[i % SKILLS.length],
    gender: female ? 'FEMALE' : 'MALE',
    status: i % 11 === 0 ? 'PENDING' : 'VERIFIED',
    active: true,
  };
});

export const players = [
  ...footballTeams.flatMap((t) => rosterFor(t, 16, FB_POS)),
  ...teams.filter((t) => t.sportId === 2).flatMap((t) => rosterFor(t, 12, BB_POS)),
  ...teams.filter((t) => t.sportId === 3).flatMap((t) => rosterFor(t, 12, VB_POS, true)),
  ...teams.filter((t) => t.sportId === 6).flatMap((t) => rosterFor(t, 14, HB_POS)),
  ...teams.filter((t) => t.sportId === 4).flatMap((t) => rosterFor(t, 8, CYC_ROLES)),
  ...teams.filter((t) => t.sportId === 5).flatMap((t) => rosterFor(t, 10, ATH_EVENTS)),
];
const playersOf = (teamId) => players.filter((p) => p.teamId === teamId);

/* ── team officials ────────────────────────────────────────────────────── */
const OFFICIAL_ROLES = ['PRESIDENT', 'MANAGER', 'HEAD_COACH', 'ASSISTANT_COACH', 'TEAM_DOCTOR'];
export const officials = teams.flatMap((t) => OFFICIAL_ROLES.map((role, i) => ({
  id: t.id * 10 + i,
  teamId: t.id, team: { id: t.id, name: t.name },
  role,
  fullName: nameAt(t.id * 5 + i + 100),
  phone: `+250 78${2 + (i % 7)} ${300 + t.id} ${400 + i}`,
  email: `${role.toLowerCase()}@${t.name.toLowerCase().replace(/[^a-z0-9]+/g, '')}.rw`,
})));
const coachOf = (teamId) => officials.find((o) => o.teamId === teamId && o.role === 'HEAD_COACH')?.fullName || 'Head Coach';

/* ── leagues ───────────────────────────────────────────────────────────── */
export const leagues = [
  { id: 1, name: 'Rwanda Premier League', slug: 'rpl', season: '2025/2026', gender: 'MALE', ageCategory: 'SENIOR', status: 'ACTIVE', level: 'NATIONAL', format: 'LEAGUE', maxTeams: 16, sport: sportRef(1), federation: { id: 1, name: 'FERWAFA' }, startDate: days(-120), endDate: days(120), description: 'Rwanda’s top flight, contested by 16 clubs.', _count: { teams: 12, fixtures: 240 } },
  { id: 2, name: 'Rwanda Basketball League', slug: 'nbl', season: '2025/2026', gender: 'MALE', ageCategory: 'SENIOR', status: 'ACTIVE', level: 'NATIONAL', format: 'LEAGUE', maxTeams: 12, sport: sportRef(2), federation: { id: 2, name: 'FERWABA' }, startDate: days(-60), endDate: days(90), description: 'The men’s national basketball championship at BK Arena.', _count: { teams: 4, fixtures: 90 } },
  { id: 3, name: "Women's Volleyball League", slug: 'wvl', season: '2025/2026', gender: 'FEMALE', ageCategory: 'SENIOR', status: 'ACTIVE', level: 'NATIONAL', format: 'LEAGUE', maxTeams: 10, sport: sportRef(3), federation: { id: 3, name: 'FRVB' }, startDate: days(-40), endDate: days(100), description: 'The women’s national volleyball league.', _count: { teams: 4, fixtures: 60 } },
  { id: 4, name: 'Peace Cup', slug: 'peace-cup', season: '2025/2026', gender: 'MALE', ageCategory: 'SENIOR', status: 'UPCOMING', level: 'NATIONAL', format: 'KNOCKOUT', maxTeams: 32, sport: sportRef(1), federation: { id: 1, name: 'FERWAFA' }, startDate: days(30), description: 'The national football knockout cup.', _count: { teams: 32, fixtures: 31 } },
  { id: 5, name: 'Second Division', slug: 'division-two', season: '2025/2026', gender: 'MALE', ageCategory: 'SENIOR', status: 'ACTIVE', level: 'NATIONAL', format: 'LEAGUE', maxTeams: 16, sport: sportRef(1), federation: { id: 1, name: 'FERWAFA' }, startDate: days(-120), description: 'Rwanda’s second tier of football.', _count: { teams: 16, fixtures: 240 } },
  { id: 6, name: 'Tour du Rwanda', slug: 'tour-du-rwanda', season: '2026', gender: 'MALE', ageCategory: 'SENIOR', status: 'ACTIVE', level: 'NATIONAL', format: 'LEAGUE', maxTeams: 8, sport: sportRef(4), federation: { id: 4, name: 'FERWACY' }, startDate: days(-2), endDate: days(6), description: 'Rwanda’s UCI 2.1 stage race — eight stages across the country.', _count: { teams: 8, fixtures: 8 } },
  { id: 7, name: 'National Athletics Championship', slug: 'athletics-champs', season: '2026', gender: 'MIXED', ageCategory: 'SENIOR', status: 'ACTIVE', level: 'NATIONAL', format: 'LEAGUE', maxTeams: 6, sport: sportRef(5), federation: { id: 5, name: 'RAF' }, startDate: days(1), endDate: days(3), description: 'The national track & field championship.', _count: { teams: 6, fixtures: 12 } },
  { id: 8, name: 'National Handball League', slug: 'handball-league', season: '2025/2026', gender: 'MALE', ageCategory: 'SENIOR', status: 'ACTIVE', level: 'NATIONAL', format: 'LEAGUE', maxTeams: 8, sport: sportRef(6), federation: { id: 6, name: 'FRH' }, startDate: days(-40), description: 'The national handball championship.', _count: { teams: 8, fixtures: 56 } },
];

/* ── standings ─────────────────────────────────────────────────────────── */
const buildStandings = (leagueId, teamIds) => teamIds.map((tid, i) => {
  const played = 18;
  const won = Math.max(0, 15 - i * 2 - (i % 2));
  const drawn = (i + 2) % 4;
  const lost = played - won - drawn;
  const gf = 40 - i * 3 - (i % 3);
  const ga = 10 + i * 3;
  const forms = ['WWWDW', 'WWLWW', 'DWWDL', 'DDWLW', 'LWDLW', 'WLDWD', 'LLDWL', 'DLWLL', 'LLDLL', 'LWLLD', 'DLLWL', 'LLLDL'];
  return { id: leagueId * 100 + i, leagueId, team: teamRef(tid), teamId: tid, played, won, drawn, lost, goalsFor: gf, goalsAgainst: ga, points: won * 3 + drawn, form: forms[i % forms.length] };
}).sort((a, b) => b.points - a.points);

export const standings = buildStandings(1, [1, 3, 2, 4, 5, 6, 9, 10, 8, 11, 7, 12]);
export const standingsByLeague = {
  1: standings,
  2: buildStandings(2, [22, 20, 21, 23, 24, 25]),
  3: buildStandings(3, [30, 31, 33, 32, 34, 35]),
  8: buildStandings(8, [60, 61, 62, 63]),
};

/* ── top scorers ───────────────────────────────────────────────────────── */
const scorersFor = (leagueId, teamIds) => teamIds.slice(0, 8).map((tid, i) => {
  const p = playersOf(tid).find((x) => /Striker|Wing|Forward|Hitter|Opposite/.test(x.position)) || playersOf(tid)[10];
  return { id: leagueId * 100 + i, leagueId, player: { fullName: p?.fullName || nameAt(tid + i), photo: p?.photo }, team: teamRef(tid), goals: 17 - i * 2, assists: 9 - i };
});
export const topScorers = scorersFor(1, [1, 3, 2, 4, 5, 6, 9, 8]);
export const scorersByLeague = {
  1: topScorers,
  2: scorersFor(2, [22, 20, 21, 23, 24, 25]),
  3: scorersFor(3, [30, 31, 33, 32, 34, 35]),
  8: scorersFor(8, [60, 61, 62, 63]),
};

/* ── fixtures ──────────────────────────────────────────────────────────── */
const REFS = ['P. Mukasine', 'J. Habineza', 'S. Nkurunziza', 'A. Mutabazi', 'D. Uwimana'];
const fx = (id, leagueId, leagueName, homeId, awayId, status, whenIso, venue, hs, as, matchday, opts: any = {}) => ({
  id, leagueId, league: { id: leagueId, name: leagueName },
  homeTeamId: homeId, awayTeamId: awayId, homeTeam: teamRef(homeId), awayTeam: teamRef(awayId),
  status, matchDate: whenIso, venue, referee: REFS[id % REFS.length], matchday,
  homeScore: hs, awayScore: as,
  homeScoreHt: hs == null ? null : Math.max(0, hs - (id % 2)), awayScoreHt: as == null ? null : Math.max(0, as - ((id + 1) % 2)),
  attendance: status === 'COMPLETED' ? 8000 + (id % 20) * 700 : null,
  streamUrl: opts.stream ? 'https://example.com/live' : null, streamActive: !!opts.stream,
  // Short live badge shown on the Live strip: a football minute, a basketball
  // quarter, a volleyball set. The list endpoint has no liveState, so it is
  // carried here directly.
  statusLabel: opts.statusLabel || (status === 'LIVE' ? 'LIVE' : null),
});

export const fixtures = [
  // Live now
  fx(101, 1, 'Rwanda Premier League', 2, 1, 'LIVE', mins(-52), 'Nyanza Stadium', 1, 1, 19, { stream: true, statusLabel: "67'" }),
  fx(102, 1, 'Rwanda Premier League', 3, 4, 'LIVE', mins(-33), 'Kigali Pelé Stadium', 0, 2, 19, { statusLabel: "38'" }),
  fx(110, 2, 'Rwanda Basketball League', 20, 21, 'LIVE', mins(-20), 'BK Arena', 58, 61, 11, { stream: true, statusLabel: 'Q4' }),
  // Upcoming
  fx(103, 1, 'Rwanda Premier League', 1, 5, 'SCHEDULED', days(2), 'Kigali Pelé Stadium', null, null, 20),
  fx(104, 1, 'Rwanda Premier League', 6, 2, 'SCHEDULED', days(3), 'Kigali Pelé Stadium', null, null, 20),
  fx(105, 1, 'Rwanda Premier League', 4, 3, 'SCHEDULED', days(5), 'Amahoro National Stadium', null, null, 20),
  fx(106, 1, 'Rwanda Premier League', 9, 10, 'SCHEDULED', days(2), 'Umuganda Stadium', null, null, 20),
  fx(111, 2, 'Rwanda Basketball League', 22, 23, 'SCHEDULED', days(1), 'BK Arena', null, null, 12),
  fx(120, 3, "Women's Volleyball League", 30, 31, 'SCHEDULED', days(2), 'Petit Stade Remera', null, null, 8),
  // Results
  fx(107, 1, 'Rwanda Premier League', 1, 3, 'COMPLETED', days(-3), 'Kigali Pelé Stadium', 2, 0, 18),
  fx(108, 1, 'Rwanda Premier League', 5, 6, 'COMPLETED', days(-4), 'Huye Stadium', 3, 1, 18),
  fx(109, 1, 'Rwanda Premier League', 2, 4, 'COMPLETED', days(-6), 'Nyanza Stadium', 1, 1, 17),
  fx(112, 2, 'Rwanda Basketball League', 21, 23, 'COMPLETED', days(-2), 'BK Arena', 82, 74, 10),
  fx(121, 3, "Women's Volleyball League", 33, 32, 'COMPLETED', days(-3), 'Petit Stade Remera', 3, 1, 7),
  fx(122, 3, "Women's Volleyball League", 34, 35, 'SCHEDULED', days(3), 'Petit Stade Remera', null, null, 8),
  // Basketball — extra
  fx(113, 2, 'Rwanda Basketball League', 24, 25, 'COMPLETED', days(-3), 'BK Arena', 78, 71, 10),
  fx(114, 2, 'Rwanda Basketball League', 20, 24, 'SCHEDULED', days(2), 'BK Arena', null, null, 12),
  // Handball — National Handball League
  fx(130, 8, 'National Handball League', 60, 61, 'COMPLETED', days(-2), 'Amahoro Indoor Arena', 31, 28, 9),
  fx(131, 8, 'National Handball League', 62, 63, 'LIVE', mins(-24), 'Amahoro Indoor Arena', 14, 12, 10, { stream: true, statusLabel: "45'" }),
  fx(132, 8, 'National Handball League', 60, 62, 'SCHEDULED', days(2), 'Amahoro Indoor Arena', null, null, 11),
  fx(133, 8, 'National Handball League', 61, 63, 'SCHEDULED', days(4), 'Huye Sports Hall', null, null, 11),
  // A "today" fixture for volleyball so its Match Centre opens on content.
  // NOTE: cycling & athletics are RACING sports — they are NOT modelled as
  // head-to-head fixtures. Their logic lives in the `races` block below.
  fx(123, 3, "Women's Volleyball League", 30, 31, 'LIVE', mins(-28), 'Petit Stade Remera', 2, 1, 8, { stream: true, statusLabel: 'Set 2' }),
];

/* ══ RACING (cycling & athletics) ══════════════════════════════════════════
 * A racing sport is not a ball game. There is no home/away and no score — a race
 * produces a RANKED FINISH (time or mark per athlete), and a series produces a
 * CLASSIFICATION (cyclists by cumulative time; athletics clubs by a medal table).
 * The public sport hub renders these instead of a fixture Match Centre.
 * ------------------------------------------------------------------------- */
const riderPool = (clubIds) => clubIds.flatMap((cid) => playersOf(cid).map((p) => ({ fullName: p.fullName, photo: p.photo, specialty: p.position, club: teamRef(cid) })));
const cyclingRiders = riderPool([40, 41, 42, 43]);
const athleticsAthletes = riderPool([50, 51, 52, 53]);

const secToTime = (s) => `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const CYC_PTS = [25, 20, 16, 13, 10, 8, 6, 4, 2, 1];
const stageResult = (riders, baseSec, spread) => riders.slice(0, 10).map((r, i) => ({
  position: i + 1, athlete: { fullName: r.fullName, photo: r.photo }, club: r.club,
  time: secToTime(baseSec + i * spread + i * i), gap: i === 0 ? '—' : `+${i * spread + i * i}s`, points: CYC_PTS[i] || 1,
}));
const ATH_PTS = [8, 7, 6, 5, 4, 3, 2, 1];
const eventResult = (athletes, base, step, unit) => athletes.slice(0, 8).map((a, i) => ({
  position: i + 1, athlete: { fullName: a.fullName, photo: a.photo }, club: a.club,
  mark: unit === 's' ? `${(base + i * step).toFixed(2)}` : `${(base - i * step).toFixed(2)} m`,
  points: ATH_PTS[i] || 0,
}));

export const races = [
  // Cycling — Tour du Rwanda (UCI 2.1 stage race)
  { id: 401, competitionId: 6, sportId: 4, name: 'Stage 1 — Kigali City Circuit', discipline: 'Flat', distanceKm: 120, date: days(-2), status: 'COMPLETED', results: stageResult(cyclingRiders, 3 * 3600 + 2 * 60, 4) },
  { id: 402, competitionId: 6, sportId: 4, name: 'Stage 2 — Kigali → Musanze', discipline: 'Mountain', distanceKm: 142, date: days(-1), status: 'COMPLETED', results: stageResult([...cyclingRiders].reverse(), 3 * 3600 + 40 * 60, 6) },
  { id: 403, competitionId: 6, sportId: 4, name: 'Stage 3 — Musanze → Rubavu', discipline: 'Hilly', distanceKm: 138, date: hours(3), status: 'SCHEDULED', results: [] },
  { id: 404, competitionId: 6, sportId: 4, name: 'Stage 4 — Rubavu → Karongi', discipline: 'Mountain', distanceKm: 150, date: days(1), status: 'SCHEDULED', results: [] },
  { id: 405, competitionId: 6, sportId: 4, name: 'Stage 5 — Individual Time Trial', discipline: 'ITT', distanceKm: 32, date: days(2), status: 'SCHEDULED', results: [] },
  { id: 406, competitionId: 6, sportId: 4, name: 'Stage 6 — Kigali Finale', discipline: 'Flat', distanceKm: 98, date: days(3), status: 'SCHEDULED', results: [] },
  // Athletics — National Championship (track & field)
  { id: 451, competitionId: 7, sportId: 5, name: 'Men 100m — Final', discipline: '100m', unit: 's', date: days(-1), status: 'COMPLETED', results: eventResult(athleticsAthletes, 10.24, 0.09, 's') },
  { id: 452, competitionId: 7, sportId: 5, name: 'Women 800m — Final', discipline: '800m', unit: 's', date: days(-1), status: 'COMPLETED', results: eventResult([...athleticsAthletes].reverse(), 124.5, 0.8, 's') },
  { id: 453, competitionId: 7, sportId: 5, name: 'Men Long Jump — Final', discipline: 'Long Jump', unit: 'm', date: hours(4), status: 'SCHEDULED', results: [] },
  { id: 454, competitionId: 7, sportId: 5, name: 'Men 1500m — Final', discipline: '1500m', unit: 's', date: days(1), status: 'SCHEDULED', results: [] },
  { id: 455, competitionId: 7, sportId: 5, name: 'Women Javelin — Final', discipline: 'Javelin', unit: 'm', date: days(2), status: 'SCHEDULED', results: [] },
];

// The series-level standing. Cycling: riders by cumulative time (GC). Athletics:
// clubs by a medal table. Shape is generic so one table renders either.
export const classificationByLeague = {
  6: {
    title: 'General Classification', identityLabel: 'Rider', valueColumns: ['Time', 'Gap'],
    rows: cyclingRiders.slice(0, 12).map((r, i) => ({ rank: i + 1, name: r.fullName, image: r.photo, sub: r.club.name, values: [secToTime(11 * 3600 + 41 * 60 + i * 23), i === 0 ? '—' : `+${i * 23}s`] })),
  },
  7: {
    title: 'Medal Table', identityLabel: 'Club', valueColumns: ['G', 'S', 'B', 'Pts'],
    rows: [50, 51, 52, 53].map((cid, i) => { const c = teamRef(cid); const g = [6, 4, 3, 2][i]; const s = [3, 5, 2, 4][i]; const b = [2, 3, 5, 3][i]; return { name: c.name, image: c.logo, g, s, b, pts: g * 3 + s * 2 + b }; })
      .sort((a, b) => b.pts - a.pts).map((r, i) => ({ rank: i + 1, name: r.name, image: r.image, values: [r.g, r.s, r.b, r.pts] })),
  },
};

const RACING_LEAGUE_OF = { 4: 6, 5: 7 };
export const racingForSport = (sportId) => ({
  races: races.filter((r) => String(r.sportId) === String(sportId)),
  classification: classificationByLeague[RACING_LEAGUE_OF[sportId]] || null,
  competition: leagues.find((l) => l.id === RACING_LEAGUE_OF[sportId]) || null,
});
export const raceById = (id) => races.find((r) => String(r.id) === String(id));

/* ── transfers ─────────────────────────────────────────────────────────── */
const TTYPE = ['PERMANENT', 'LOAN', 'FREE', 'PERMANENT'];
export const transfers = Array.from({ length: 8 }, (_, i) => {
  const from = footballTeams[i % footballTeams.length];
  const to = footballTeams[(i + 3) % footballTeams.length];
  const p = playersOf(from.id)[i % 16];
  return {
    id: i + 1,
    player: { id: p.id, fullName: p.fullName, photo: p.photo },
    fromTeam: { id: from.id, name: from.name, logo: from.logo }, toTeam: { id: to.id, name: to.name, logo: to.logo },
    transferType: TTYPE[i % TTYPE.length], fee: i % 3 === 0 ? null : (i + 1) * 1500000,
    transferDate: days(-(i * 9 + 3)), notes: 'Registered with FERWAFA.',
  };
});

/* ── documents (review queue) ──────────────────────────────────────────── */
const DOC_TYPES = ['NATIONAL_ID', 'BIRTH_CERTIFICATE', 'MEDICAL', 'PASSPORT'];
const DOC_STATUS = ['PENDING', 'APPROVED', 'REJECTED', 'PENDING', 'APPROVED'];
export const documents = players.slice(0, 18).map((p, i) => ({
  id: i + 1,
  player: { id: p.id, fullName: p.fullName, photo: p.photo, team: { name: p.team.name } },
  docType: DOC_TYPES[i % DOC_TYPES.length],
  originalName: `${p.fullName.toLowerCase().replace(/\s+/g, '_')}_${DOC_TYPES[i % DOC_TYPES.length].toLowerCase()}.pdf`,
  filename: `demo/${i + 1}.pdf`, mimeType: 'application/pdf', fileSize: 240000 + i * 5000,
  uploadedAt: days(-(i + 1)), status: DOC_STATUS[i % DOC_STATUS.length], reviewNote: i % 5 === 2 ? 'Illegible scan — please re-upload.' : null,
}));

/* ── news ──────────────────────────────────────────────────────────────── */
/**
 * `photo` is a sport slug with a real photograph in /public/hero. News used to
 * take `cover(seed)` — a generated gradient — for every story, which is why the
 * news rail rendered as a row of coloured blobs. A story about the Kigali derby
 * now carries the football photograph.
 */
const newsPhoto = (photo, seed) => (photo ? `/hero/${photo}.jpg` : cover(seed));
const article = (id, slug, key, seed, ageInDays, authorName, category, photo) => ({
  id, slug, category, coverImage: newsPhoto(photo, seed), createdAt: days(ageInDays), published: true, views: 400 + id * 137,
  author: { fullName: authorName },
  get title() { return i18n.t(`demo.news.${key}.title`); },
  get excerpt() { return i18n.t(`demo.news.${key}.excerpt`); },
  get body() { return i18n.t(`demo.news.${key}.body`); },
});
const plainArticle = (id, slug, title, excerpt, body, seed, ageInDays, authorName, category, photo) => ({
  id, slug, category, coverImage: newsPhoto(photo, seed), createdAt: days(ageInDays), published: true, views: 300 + id * 91,
  author: { fullName: authorName }, title, excerpt, body,
});
export const news = [
  article(1, 'apr-clinch-derby', 'derby', 'derby-kigali', -1, 'Eric Niyonzima', 'RESULT', 'football'),
  article(2, 'rayon-sign-striker', 'striker', 'transfer-window', -2, 'Aline Uwase', 'TRANSFER', 'football'),
  article(3, 'kagame-cup-preview', 'kagame_cup', 'kagame-cup', -3, 'Jean Damascene', 'ANNOUNCEMENT', 'amashuri'),
  article(4, 'volleyball-league-roundup', 'volleyball', 'volleyball-roundup', -5, 'Claudine Mukamana', 'NEWS', 'volleyball'),
  plainArticle(5, 'bk-arena-hosts-final', 'BK Arena to host national basketball final', 'The championship series returns to Kigali’s 10,000-seat arena this month.', 'The Rwanda Basketball League play-off final will be staged at BK Arena, with tip-off scheduled for the weekend. Organisers expect a sell-out crowd as the top two seeds meet for the title.', 'basketball-final', -6, 'Patrick Habimana', 'ANNOUNCEMENT', 'basketball'),
  plainArticle(6, 'tour-du-rwanda-route', 'Tour du Rwanda unveils 2026 route', 'Eight stages will cross all five provinces, finishing in Kigali.', 'The Rwanda Cycling Federation has confirmed the 2026 Tour du Rwanda route, taking the peloton through the Northern Province climbs before a final circuit in the capital.', 'cycling-tour', -8, 'Samuel Rwema', 'NEWS', 'cycling'),
  plainArticle(7, 'grassroots-investment', 'Ministry launches grassroots pitch programme', 'Twelve district pitches to be upgraded ahead of next season.', 'A new national programme will resurface and floodlight community pitches in twelve districts, widening access to organised football for young players across the country.', 'grassroots', -12, 'Grace Ingabire', 'ANNOUNCEMENT', 'athletics'),
];

/* ── ads ───────────────────────────────────────────────────────────────── */
export const adsList = [
  { id: 1, title: 'Inyange Industries — Official Hydration Partner', imageUrl: cover('inyange', '#1D4ED8'), targetUrl: 'https://example.com', position: 'HOME_BANNER', active: true, createdAt: days(-20) },
  { id: 2, title: 'BK Arena — Matchday Experience', imageUrl: cover('bk-arena', '#0B6E3F'), targetUrl: 'https://example.com', position: 'SPOTLIGHT_BANNER', active: true, createdAt: days(-15) },
  { id: 3, title: 'MTN Rwanda — Powering the League', imageUrl: cover('mtn', '#F59E0B'), targetUrl: 'https://example.com', position: 'SIDEBAR', active: true, createdAt: days(-9) },
  { id: 4, title: 'Skol Brewery — Proud Sponsor', imageUrl: cover('skol', '#C81E1E'), targetUrl: 'https://example.com', position: 'SIDEBAR', active: false, createdAt: days(-30) },
];

/* ── settings ──────────────────────────────────────────────────────────── */
export const settings = {
  site_name: 'RwaSport',
  get hero_title() { return i18n.t('demo.settings.hero_title'); },
  contact_email: 'info@rwasport.rw',
  support_phone: '+250 788 000 000',
  address: 'KG 7 Ave, Kigali, Rwanda',
  facebook: 'https://facebook.com/rwasport',
  twitter: 'https://x.com/rwasport',
  instagram: 'https://instagram.com/rwasport',
  youtube: 'https://youtube.com/@rwasport',
  about: 'RwaSport is the official digital home of Rwandan sport — leagues, clubs, fixtures, live scores and player registration under one national platform.',
};
// /settings/all → flat list of editable rows for the admin settings screen.
export const settingsAll = Object.entries(settings).map(([skey, sval], i) => ({
  id: i + 1, skey, sval: typeof sval === 'string' ? sval : String(sval), label: skey.replace(/_/g, ' '), grp: skey.includes('_') ? 'general' : 'social', isPublic: true,
}));

/* ── contacts (inbox) ──────────────────────────────────────────────────── */
const CONTACT_STATUS = ['NEW', 'READ', 'REPLIED', 'NEW', 'READ'];
export const contacts = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1, name: nameAt(i * 4 + 60), email: `contact${i + 1}@example.rw`, phone: `+250 78${2 + i} 111 ${200 + i}`,
  subject: ['Club registration query', 'Fixture correction', 'Media accreditation', 'Sponsorship enquiry', 'Player transfer question', 'Ticketing'][i],
  message: 'Hello, I would like more information regarding the matter in the subject line. Thank you.',
  status: CONTACT_STATUS[i % CONTACT_STATUS.length], createdAt: days(-(i + 1)),
}));

/* ── activity logs ─────────────────────────────────────────────────────── */
const PATHS = ['/', '/leagues', '/fixtures', '/amashuri', '/amashuri/standings', '/news', '/leagues/1', '/matches/101', '/sports/football', '/sports/basketball'];
const AGENTS = ['Chrome/Windows', 'Safari/iPhone', 'Chrome/Android', 'Firefox/macOS'];
const ACTIONS = ['PAGE_VIEW', 'LOGIN', 'DOCUMENT_APPROVED', 'FIXTURE_UPDATED', 'PLAYER_VERIFIED'];
export const activityLogs = Array.from({ length: 24 }, (_, i) => ({
  id: i + 1, createdAt: mins(-(i * 7 + 2)),
  user: i % 4 === 0 ? { fullName: 'Demo Administrator' } : null,
  action: ACTIONS[i % ACTIONS.length], detail: i % 3 === 0 ? 'via Admin console' : null,
  ip: `41.74.${100 + (i % 50)}.${10 + i}`, userAgent: AGENTS[i % AGENTS.length], pagePath: PATHS[i % PATHS.length],
}));

/* ── admin dashboard stats ─────────────────────────────────────────────── */
export const adminStats = {
  activeLeagues: leagues.filter((l) => l.status === 'ACTIVE').length,
  totalTeams: teams.length,
  totalPlayers: players.length,
  pendingDocuments: documents.filter((d) => d.status === 'PENDING').length,
  totalLeagues: leagues.length,
  totalFixtures: fixtures.length,
  liveMatches: fixtures.filter((f) => f.status === 'LIVE').length,
  pendingTeams: teams.filter((t) => t.status === 'PENDING').length,
  totalSchools: 8, totalVisitorsToday: 1284,
};

/* ── sport-admin assignments (superadmin) ──────────────────────────────── */
export const sportAdmins = [
  { id: 1, user: { id: 11, fullName: 'Jean Bosco Mugenzi', username: 'ferwafa.admin', email: 'admin@ferwafa.rw', role: 'FEDERATION_ADMIN' }, federation: { id: 1, name: 'FERWAFA' }, assignedAt: days(-200) },
  { id: 2, user: { id: 12, fullName: 'Aline Uwase', username: 'ferwaba.admin', email: 'admin@ferwaba.rw', role: 'FEDERATION_ADMIN' }, federation: { id: 2, name: 'FERWABA' }, assignedAt: days(-180) },
  { id: 3, user: { id: 13, fullName: 'Patrick Habimana', username: 'rpl.admin', email: 'rpl@rwasport.rw', role: 'LEAGUE_ADMIN' }, league: { id: 1, name: 'Rwanda Premier League' }, assignedAt: days(-150) },
  { id: 4, user: { id: 14, fullName: 'Grace Ingabire', username: 'amashuri.admin', email: 'amashuri@rwasport.rw', role: 'AMASHURI_ADMIN' }, assignedAt: days(-120) },
];

/* ── transactions (subscriptions) ──────────────────────────────────────── */
const TX_STATUS = ['SUCCESS', 'SUCCESS', 'PENDING', 'FAILED', 'SUCCESS'];
export const transactions = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1, userId: 100 + i, amount: [50000, 120000, 250000][i % 3], type: 'SUBSCRIPTION',
  status: TX_STATUS[i % TX_STATUS.length], reference: `RW-SUB-${20260000 + i}`, createdAt: days(-(i * 4 + 1)),
  team: { name: footballTeams[i % footballTeams.length].name },
}));

/* ══ Amashuri Games (inter-school) ═════════════════════════════════════════ */
export const schools = [
  { id: 1, name: 'Lycée de Kigali', shortName: 'LDK', code: 'LDK-001', category: 'SECONDARY', province: 'Kigali City', sector: 'Nyarugenge', logo: crest('LDK', '#1D4ED8', '#FFD200'), headTeacher: 'Dr. E. Rugamba', coordinator: 'M. Uwase', coordPhone: '+250 788 100 001', active: true },
  { id: 2, name: 'Groupe Scolaire Officiel de Butare', shortName: 'GSOB', code: 'GSOB-002', category: 'SECONDARY', province: 'Southern', sector: 'Huye', logo: crest('GSOB', '#0B6E3F', '#FFFFFF'), headTeacher: 'Mr. J. Bosco', coordinator: 'A. Mukamana', coordPhone: '+250 788 100 002', active: true },
  { id: 3, name: 'Ecole des Sciences de Byimana', shortName: 'ESB', code: 'ESB-003', category: 'SECONDARY', province: 'Southern', sector: 'Ruhango', logo: crest('ESB', '#C81E1E', '#FFD200'), headTeacher: 'Fr. P. Habyarimana', coordinator: 'E. Nkusi', coordPhone: '+250 788 100 003', active: true },
  { id: 4, name: 'FAWE Girls School', shortName: 'FAWE', code: 'FAWE-004', category: 'SECONDARY', province: 'Kigali City', sector: 'Gasabo', logo: crest('FAWE', '#7C3AED', '#FFD200'), headTeacher: 'Mrs. C. Umutoni', coordinator: 'D. Ingabire', coordPhone: '+250 788 100 004', active: true },
  { id: 5, name: 'College Saint André', shortName: 'CSA', code: 'CSA-005', category: 'SECONDARY', province: 'Kigali City', sector: 'Nyarugenge', logo: crest('CSA', '#12386E', '#C81E1E'), headTeacher: 'Br. L. Niyonshuti', coordinator: 'F. Mugabo', coordPhone: '+250 788 100 005', active: true },
  { id: 6, name: 'IPRC Kigali', shortName: 'IPRC', code: 'IPRC-006', category: 'TVET', province: 'Kigali City', sector: 'Kicukiro', logo: crest('IPRC', '#0D9488', '#FFFFFF'), headTeacher: 'Eng. R. Karangwa', coordinator: 'S. Mutesi', coordPhone: '+250 788 100 006', active: true },
  { id: 7, name: 'Petit Séminaire de Ndera', shortName: 'PSN', code: 'PSN-007', category: 'SECONDARY', province: 'Kigali City', sector: 'Gasabo', logo: crest('PSN', '#EA580C', '#0B6E3F'), headTeacher: 'Fr. M. Twagirayezu', coordinator: 'J. Nsengiyumva', coordPhone: '+250 788 100 007', active: true },
  { id: 8, name: 'GS Notre Dame de Cîteaux', shortName: 'NDC', code: 'NDC-008', category: 'SECONDARY', province: 'Kigali City', sector: 'Nyarugenge', logo: crest('NDC', '#1E40AF', '#FFFFFF'), headTeacher: 'Sr. A. Mukandori', coordinator: 'V. Uwimana', coordPhone: '+250 788 100 008', active: true },
];
const schoolRef = (id) => { const s = schools.find((x) => x.id === id); return { id: s.id, name: s.name, shortName: s.shortName, logo: s.logo, sector: s.sector }; };

const akcRosterFor = (teamId, n, female?) => Array.from({ length: n }, (_, i) => ({
  id: teamId * 100 + i + 1, fullName: nameAt(teamId * 9 + i, female),
  photo: avatar(nameAt(teamId * 9 + i, female)),
  position: (female ? VB_POS : FB_POS)[i % (female ? VB_POS.length : FB_POS.length)],
  jersey: i + 1, dob: yearsAgo(15 + (i % 4)), gender: female ? 'FEMALE' : 'MALE',
  idType: 'BIRTH_CERT', docVerified: i % 4 !== 0,
}));

export const akcTeams = [
  { id: 1, schoolId: 1, school: schoolRef(1), sport: sportRef(1), gender: 'MALE', ageCategory: 'U17', level: 'NATIONAL', coachName: 'Jean Damascene', players: akcRosterFor(1, 16) },
  { id: 2, schoolId: 4, school: schoolRef(4), sport: sportRef(3), gender: 'FEMALE', ageCategory: 'U19', level: 'NATIONAL', coachName: 'Grace Ingabire', players: akcRosterFor(2, 14, true) },
  { id: 3, schoolId: 2, school: schoolRef(2), sport: sportRef(1), gender: 'MALE', ageCategory: 'U17', level: 'NATIONAL', coachName: 'Patrick Habimana', players: akcRosterFor(3, 16) },
  { id: 4, schoolId: 3, school: schoolRef(3), sport: sportRef(1), gender: 'MALE', ageCategory: 'U17', level: 'PROVINCE', coachName: 'Eric Mutoni', players: akcRosterFor(4, 15) },
  { id: 5, schoolId: 5, school: schoolRef(5), sport: sportRef(2), gender: 'MALE', ageCategory: 'U19', level: 'NATIONAL', coachName: 'Claude Uwera', players: akcRosterFor(5, 12) },
  { id: 6, schoolId: 8, school: schoolRef(8), sport: sportRef(1), gender: 'MALE', ageCategory: 'U17', level: 'NATIONAL', coachName: 'Faustin Nkusi', players: akcRosterFor(6, 16) },
  { id: 7, schoolId: 6, school: schoolRef(6), sport: sportRef(3), gender: 'FEMALE', ageCategory: 'U19', level: 'NATIONAL', coachName: 'Solange Mutesi', players: akcRosterFor(7, 14, true) },
  { id: 8, schoolId: 7, school: schoolRef(7), sport: sportRef(1), gender: 'MALE', ageCategory: 'U15', level: 'DISTRICT', coachName: 'Norbert Kagabo', players: akcRosterFor(8, 15) },
];
const akcTeamRef = (id) => { const tm = akcTeams.find((x) => x.id === id); return { id: tm.id, school: schoolRef(tm.schoolId), ageCategory: tm.ageCategory, gender: tm.gender }; };

export const akcCompetitions = [
  { id: 1, name: 'Kigali Schools Football League', get edition() { return i18n.t('demo.edition', { year: 2026 }); }, sportId: 1, sportName: 'Football', status: 'ONGOING', level: 'PROVINCE', levelLabel: 'Secondary Schools', location: 'Kigali City', gender: 'male', ageCategory: 'U17', venue: 'Amahoro National Stadium', startDate: days(-10), endDate: days(6), description: 'The Kigali inter-school football league.', coverImage: cover('akc-football', '#0B6E3F'), schools: 32, groups: 8, matches: 124, _count: { fixtures: 124, standings: 32 } },
  { id: 2, name: 'Rwanda Schools Volleyball League', get edition() { return i18n.t('demo.edition', { year: 2026 }); }, sportId: 3, sportName: 'Volleyball', status: 'ONGOING', level: 'NATIONAL', levelLabel: 'Secondary Schools', location: 'National', gender: 'female', ageCategory: 'U19', venue: 'Huye Stadium', startDate: days(14), description: 'The national inter-school volleyball league.', coverImage: cover('akc-volley', '#1D4ED8'), schools: 20, groups: 4, matches: 48, _count: { fixtures: 48, standings: 20 } },
  { id: 3, name: 'Rwanda Schools Basketball League', get edition() { return i18n.t('demo.edition', { year: 2025 }); }, sportId: 2, sportName: 'Basketball', status: 'ONGOING', level: 'NATIONAL', levelLabel: 'Secondary Schools', location: 'National', gender: 'male', ageCategory: 'U19', venue: 'BK Arena', startDate: days(-30), description: 'The national inter-school basketball league.', coverImage: cover('akc-basket', '#C81E1E'), schools: 24, groups: 6, matches: 72, _count: { fixtures: 72, standings: 24 } },
  { id: 4, name: 'National Schools Athletics Championship', get edition() { return i18n.t('demo.edition', { year: 2026 }); }, sportId: 5, sportName: 'Athletics', status: 'UPCOMING', level: 'NATIONAL', levelLabel: 'All Schools', location: 'National', gender: 'mixed', ageCategory: 'U19', venue: 'Amahoro National Stadium', startDate: days(20), description: 'The national inter-school track & field championship.', coverImage: cover('akc-athletics', '#F59E0B'), regions: 10, events: 18, athletes: 320, _count: { fixtures: 40, standings: 0 } },
];

// Amashuri sport catalogue — the "Pick a sport" grid. Counts are per-sport
// school-competition totals (real values wherever the backend provides them).
export const akcSports = [
  { slug: 'football', name: 'Football', icon: '⚽', competitions: 24 },
  { slug: 'basketball', name: 'Basketball', icon: '🏀', competitions: 12 },
  { slug: 'volleyball', name: 'Volleyball', icon: '🏐', competitions: 8 },
  { slug: 'handball', name: 'Handball', icon: '🤾', competitions: 6 },
  { slug: 'athletics', name: 'Athletics', icon: '🏃', competitions: 10 },
  { slug: 'rugby', name: 'Rugby', icon: '🏉', competitions: 4 },
  { slug: 'table-tennis', name: 'Table Tennis', icon: '🏓', competitions: 3 },
];

export const akcStandings = [1, 3, 6, 4, 8].map((tid, i) => ({
  id: i + 1, competitionId: 1, teamId: tid, team: akcTeamRef(tid),
  played: 5, won: 5 - i, drawn: (i + 1) % 2, lost: i - ((i + 1) % 2) < 0 ? 0 : i - ((i + 1) % 2),
  gf: 14 - i * 2, ga: 3 + i * 2, points: (5 - i) * 3 + ((i + 1) % 2),
})).sort((a, b) => b.points - a.points);

export const akcFixtures = [
  { id: 201, competitionId: 1, competition: { id: 1, name: 'Kagame Cup Schools' }, status: 'COMPLETED', homeTeamId: 1, awayTeamId: 3, winnerTeamId: 1, isDraw: false, stage: 'GROUP', get round() { return i18n.t('demo.round', { number: 4 }); }, homeTeam: akcTeamRef(1), awayTeam: akcTeamRef(3), homeScore: 3, awayScore: 1, matchDate: days(-2), venue: 'Amahoro National Stadium', get notes() { return i18n.t('demo.fixture_notes.group_win'); } },
  { id: 202, competitionId: 1, competition: { id: 1, name: 'Kagame Cup Schools' }, status: 'ONGOING', homeTeamId: 6, awayTeamId: 4, stage: 'GROUP', get round() { return i18n.t('demo.round', { number: 5 }); }, homeTeam: akcTeamRef(6), awayTeam: akcTeamRef(4), homeScore: 1, awayScore: 1, matchDate: mins(-40), venue: 'Kigali Pelé Stadium' },
  { id: 203, competitionId: 1, competition: { id: 1, name: 'Kagame Cup Schools' }, status: 'SCHEDULED', homeTeamId: 8, awayTeamId: 3, stage: 'GROUP', get round() { return i18n.t('demo.round', { number: 5 }); }, homeTeam: akcTeamRef(8), awayTeam: akcTeamRef(3), homeScore: null, awayScore: null, matchDate: days(2), venue: 'Petit Stade Remera' },
  { id: 204, competitionId: 1, competition: { id: 1, name: 'Kigali Schools Football League' }, status: 'SCHEDULED', homeTeamId: 1, awayTeamId: 6, stage: 'SEMIFINAL', get round() { return i18n.t('enums.stage.SEMI_FINAL'); }, homeTeam: akcTeamRef(1), awayTeam: akcTeamRef(6), homeScore: null, awayScore: null, matchDate: days(4), venue: 'Amahoro National Stadium' },
  // LIVE now — across sports, each with a sport-appropriate status label.
  { id: 210, competitionId: 3, competition: { id: 3, name: 'Rwanda Schools Basketball League' }, sport: 'basketball', status: 'ONGOING', statusLabel: 'Q3', homeTeam: akcTeamRef(3), awayTeam: akcTeamRef(1), homeScore: 42, awayScore: 38, matchDate: mins(-18), venue: 'Kigali Arena' },
  { id: 211, competitionId: 1, competition: { id: 1, name: 'Kigali Schools Football League' }, sport: 'football', status: 'ONGOING', statusLabel: "62'", homeTeam: akcTeamRef(5), awayTeam: akcTeamRef(8), homeScore: 1, awayScore: 0, matchDate: mins(-62), venue: 'Muhanga Stadium' },
  { id: 212, competitionId: 2, competition: { id: 2, name: 'Rwanda Schools Volleyball League' }, sport: 'volleyball', status: 'ONGOING', statusLabel: 'Set 2', homeTeam: akcTeamRef(2), awayTeam: akcTeamRef(7), homeScore: 1, awayScore: 0, matchDate: mins(-25), venue: 'Musanze Sports Hall' },
  { id: 213, competitionId: 1, competition: { id: 1, name: 'Southern Schools Handball' }, sport: 'handball', status: 'ONGOING', statusLabel: "45'", homeTeam: akcTeamRef(6), awayTeam: akcTeamRef(4), homeScore: 12, awayScore: 8, matchDate: mins(-45), venue: 'Huye Indoor Arena' },
];

export const akcAnnouncements = [
  { id: 1, title: 'Kagame Cup semi-final draw confirmed', body: 'The last-four pairings for the national schools championship have been set.', category: 'COMPETITION', pinned: true, published: true, createdAt: days(-1) },
  { id: 2, title: 'Player registration closes Friday', body: 'All schools must finalise their squad lists and upload birth certificates before the deadline.', category: 'REGISTRATION', pinned: false, published: true, createdAt: days(-3) },
  { id: 3, title: 'Provincial qualifiers schedule released', body: 'Fixtures for the Southern and Western provincial rounds are now available.', category: 'GENERAL', pinned: false, published: true, createdAt: days(-6) },
];

/* ── demo accounts + role-aware login ──────────────────────────────────── */
export const demoUser = { id: 1, username: 'admin', fullName: 'Demo Administrator', email: 'admin@rwasport.rw', role: 'SUPERADMIN', active: true, verified: true };

/**
 * The presenter types the admin's name (any password) and lands in that portal:
 *   admin / super         → SUPERADMIN     (full admin console)
 *   federation / ferwafa  → FEDERATION_ADMIN
 *   amashuri / schools    → AMASHURI_ADMIN
 *   league / rpl          → LEAGUE_ADMIN
 *   reporter              → MATCH_REPORTER  (live reporting)
 *   coach / team / manager→ TEAM_MANAGER    (team portal)
 */
export const DEMO_LOGINS = [
  { match: /coach|team|manager/, id: 4, fullName: 'Demo Team Manager', role: 'TEAM_MANAGER', hint: 'coach' },
  { match: /reporter/, id: 3, fullName: 'Demo Match Reporter', role: 'MATCH_REPORTER', hint: 'reporter' },
  { match: /federation|ferwafa|ferwaba|frvb/, id: 5, fullName: 'Demo Federation Admin', role: 'FEDERATION_ADMIN', hint: 'federation' },
  { match: /amashuri|school/, id: 6, fullName: 'Demo Amashuri Admin', role: 'AMASHURI_ADMIN', hint: 'amashuri' },
  { match: /league|rpl|nbl/, id: 2, fullName: 'Demo League Admin', role: 'LEAGUE_ADMIN', hint: 'league' },
];
export const loginUser = (username = '') => {
  const u = String(username).toLowerCase();
  const hit = DEMO_LOGINS.find((r) => r.match.test(u));
  if (hit) return { ...demoUser, id: hit.id, username, fullName: hit.fullName, role: hit.role };
  return { ...demoUser, username: username || 'admin' };
};

/* ── detail builders ───────────────────────────────────────────────────── */
export const buildLeagueDetail = (league) => {
  // Only this league's own standings/scorers — empty for a race calendar, never
  // football's table borrowed as a fallback (which showed the wrong teams).
  const st = standingsByLeague[league.id] || [];
  const sc = scorersByLeague[league.id] || [];
  const teamsInLeague = st.length
    ? st.map((s) => ({ team: s.team }))
    : teams.filter((t) => String(t.sportId) === String(league.sport?.id)).map((t) => ({ team: teamRef(t.id) }));
  return { ...league, teams: teamsInLeague, standings: st, topScorers: sc, fixtures: fixtures.filter((f) => f.leagueId === league.id) };
};

const lineupFor = (teamId) => playersOf(teamId).slice(0, 11).map((p, i) => ({
  id: teamId * 50 + i, teamId, jerseyNo: p.jerseyNumber, isStarter: i < 11, isCaptain: i === 0, position: p.position, player: { id: p.id, fullName: p.fullName, photo: p.photo },
}));

export const buildFixtureDetail = (fixture) => {
  const homePlayers = playersOf(fixture.homeTeamId);
  const awayPlayers = playersOf(fixture.awayTeamId);
  const events = [];
  if (fixture.status === 'COMPLETED' || fixture.status === 'LIVE') {
    for (let i = 0; i < (fixture.homeScore || 0); i++) events.push({ id: `${fixture.id}-h-${i}`, eventType: 'GOAL', minute: 12 + i * 20, teamId: fixture.homeTeamId, player: { fullName: homePlayers[(i * 3) % homePlayers.length]?.fullName || 'Player' } });
    for (let i = 0; i < (fixture.awayScore || 0); i++) events.push({ id: `${fixture.id}-a-${i}`, eventType: 'GOAL', minute: 20 + i * 18, teamId: fixture.awayTeamId, player: { fullName: awayPlayers[(i * 2) % awayPlayers.length]?.fullName || 'Player' } });
    events.push({ id: `${fixture.id}-yc`, eventType: 'YELLOW_CARD', minute: 55, teamId: fixture.awayTeamId, player: { fullName: awayPlayers[0]?.fullName || 'Player' } });
    events.push({ id: `${fixture.id}-sub`, eventType: 'SUBSTITUTION', minute: 66, teamId: fixture.homeTeamId, player: { fullName: homePlayers[9]?.fullName }, player2: { fullName: homePlayers[12]?.fullName } });
  }
  events.sort((a, b) => (a.minute || 0) - (b.minute || 0));
  const home = teams.find((t) => t.id === fixture.homeTeamId);
  const away = teams.find((t) => t.id === fixture.awayTeamId);
  const played = fixture.status === 'COMPLETED' || fixture.status === 'LIVE';
  // Per-team stat rows — the Match Centre finds each by teamId, so this MUST be an
  // array shaped like the MatchStat model, not a { home, away } object.
  const stats = played ? [
    { teamId: fixture.homeTeamId, possession: 54, shots: 12, shotsOnTarget: 6, shotsInsideBox: 8, shotsOutsideBox: 4, corners: 7, offsides: 2, fouls: 11, yellowCards: 1, redCards: 0, gkSaves: 3, passAccuracy: 84, xg: 1.8 },
    { teamId: fixture.awayTeamId, possession: 46, shots: 9, shotsOnTarget: 4, shotsInsideBox: 5, shotsOutsideBox: 4, corners: 3, offsides: 3, fouls: 14, yellowCards: 2, redCards: 0, gkSaves: 5, passAccuracy: 79, xg: 1.1 },
  ] : [];
  // A running clock for live matches, shaped exactly like the API's derived clock
  // so the shared tickClock() has something to count from. `minute` is taken from
  // the fixture, and elapsedSeconds is back-dated to that minute, which makes the
  // demo tick forward from a plausible point instead of sitting on 0'.
  const liveMinute = fixture.minute ?? 37;
  const secondHalf = liveMinute > 45;
  const clock = fixture.status === 'LIVE'
    ? {
        period: secondHalf ? 'SECOND_HALF' : 'FIRST_HALF',
        running: true,
        minute: liveMinute,
        stoppage: 0,
        addedMinutes: secondHalf ? 4 : 2,
        elapsedSeconds: liveMinute * 60,
        display: `${liveMinute}'`,
      }
    : { period: fixture.status === 'COMPLETED' ? 'FULL_TIME' : 'PRE', running: false, minute: fixture.status === 'COMPLETED' ? 90 : 0, stoppage: 0, addedMinutes: 0, elapsedSeconds: 0, display: fixture.status === 'COMPLETED' ? "90'" : "0'" };

  return {
    ...fixture, referee: fixture.referee || 'TBD', events, stats, clock,
    lineups: [...lineupFor(fixture.homeTeamId), ...lineupFor(fixture.awayTeamId)],
    teamSheets: [
      { teamId: fixture.homeTeamId, formation: '4-3-3', coachName: coachOf(fixture.homeTeamId), published: true },
      { teamId: fixture.awayTeamId, formation: '4-2-3-1', coachName: coachOf(fixture.awayTeamId), published: true },
    ],
    homeCoach: coachOf(fixture.homeTeamId), awayCoach: coachOf(fixture.awayTeamId),
    homeTeamDetail: home, awayTeamDetail: away,
  };
};

export const buildMyTeam = () => {
  const roster = playersOf(1).map((p) => ({ ...p, documents: Array.from({ length: p.status === 'VERIFIED' ? 3 : 1 }, () => ({ status: 'APPROVED' })) }));
  const team = teams[0];
  return { ...team, players: roster, officials: officials.filter((o) => o.teamId === 1), fixtures: fixtures.filter((f) => f.homeTeamId === 1 || f.awayTeamId === 1) };
};

export const buildTeamDetail = (team) => ({ ...team, players: playersOf(team.id), officials: officials.filter((o) => o.teamId === team.id), fixtures: fixtures.filter((f) => f.homeTeamId === team.id || f.awayTeamId === team.id) });

export const buildSchoolDetail = (school) => ({ ...school, teams: akcTeams.filter((tm) => tm.schoolId === school.id) });
