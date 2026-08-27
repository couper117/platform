const { z } = require('zod');

// Form fields often arrive as strings (multipart) — accept string|number for ids.
const idish = z.union([z.string().min(1), z.number()]);
const optIdish = idish.optional().nullable();

// The validate() middleware parses { body, query, params }. Body is validated
// with .passthrough() so unrelated extra fields don't cause rejections; only
// the listed fields are required/typed.
const wrap = (bodyShape) => z.object({
  body: z.object(bodyShape).passthrough(),
  query: z.any().optional(),
  params: z.any().optional(),
});

module.exports = {
  // ── Auth ──
  login: wrap({
    // Either a username or an email may be supplied as the identifier.
    username: z.string().min(3, 'Enter your username or email').optional(),
    email: z.string().optional(),
    password: z.string().min(1, 'Password is required'),
  }),
  registerTeam: wrap({
    username: z.string().min(3),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    fullName: z.string().min(2),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    teamName: z.string().min(2),
    sportId: idish,
  }),
  forgotPassword: wrap({ email: z.string().email('A valid email is required') }),
  resetPassword: wrap({
    token: z.string().min(10),
    uid: idish,
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  }),

  // ── Competitions ──
  createLeague: wrap({ name: z.string().min(2), sportId: idish, season: z.string().min(1) }),
  updateLeague: wrap({}),
  createFixture: wrap({ leagueId: idish, homeTeamId: idish, awayTeamId: idish }),
  saveResult: wrap({ homeScore: idish, awayScore: idish }),
  addMatchEvent: wrap({
    eventType: z.enum(['GOAL', 'OWN_GOAL', 'PENALTY', 'RED_CARD', 'YELLOW_CARD', 'SUBSTITUTION', 'INJURY', 'VAR', 'KICKOFF', 'HALFTIME', 'FULLTIME', 'EXTRA_TIME']),
    minute: idish,
  }),

  // ── Teams / Players / Docs ──
  createTeam: wrap({ name: z.string().min(2) }),
  createPlayer: wrap({ fullName: z.string().min(2), teamId: idish }),
  reviewDocument: wrap({ status: z.enum(['APPROVED', 'REJECTED']), reviewNote: z.string().optional() }),
  updateTeamStatus: wrap({ status: z.enum(['PENDING', 'VERIFIED', 'SUSPENDED', 'REJECTED']) }),

  // ── Content ──
  createNews: wrap({ title: z.string().min(3) }),
  createSport: wrap({ name: z.string().min(2) }),
  submitContact: wrap({ name: z.string().min(2), message: z.string().min(5) }),

  // ── Ads ──
  createAd: wrap({ title: z.string().min(2), imageUrl: z.string().min(1), position: z.string().min(1) }),
  updateAd: wrap({}),

  // ── Amashuri (school sports) ──
  akcCreateSchool: wrap({ name: z.string().min(2, 'School name is required') }),
  akcUpdateSchool: wrap({}),
  akcCreateTeam: wrap({ schoolId: idish, sportId: idish }),
  akcUpdateTeam: wrap({}),
  akcCreateFixture: wrap({ homeTeamId: idish, awayTeamId: idish }),
  akcCreateAthlete: wrap({ teamId: idish, fullName: z.string().min(2, 'Athlete name is required') }),
  akcCreateCompetition: wrap({ name: z.string().min(2) }),

  // ── Users (admin) ──
  updateUser: wrap({
    role: z.enum(['SUPERADMIN', 'FEDERATION_ADMIN', 'LEAGUE_ADMIN', 'AMASHURI_ADMIN', 'MATCH_REPORTER', 'TEAM_MANAGER', 'PUBLIC']).optional(),
    active: z.boolean().optional(),
  }),

  // ── Umuganda ──
  createUmuganda: wrap({
    date: z.string().min(8, 'A date is required'),
    title: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(['EXPECTED', 'CONFIRMED', 'MOVED', 'DISABLED']).optional(),
    startTime: z.string().regex(/^\d{1,2}:\d{2}$/, 'Use HH:MM').optional(),
    endTime: z.string().regex(/^\d{1,2}:\d{2}$/, 'Use HH:MM').optional(),
  }),
  updateUmuganda: wrap({
    date: z.string().min(8).optional(),
    status: z.enum(['EXPECTED', 'CONFIRMED', 'MOVED', 'DISABLED']).optional(),
    startTime: z.string().regex(/^\d{1,2}:\d{2}$/, 'Use HH:MM').optional(),
    endTime: z.string().regex(/^\d{1,2}:\d{2}$/, 'Use HH:MM').optional(),
  }),
  umugandaAnnouncement: wrap({
    title: z.string().min(3, 'A title is required'),
    body: z.string().min(3, 'A message is required'),
  }),
  // The four decisions an administrator may take on a clashing match. There is
  // deliberately no "cancel" — the platform never cancels a match over Umuganda.
  umugandaDecision: wrap({
    decision: z.enum(['CONTINUE', 'MOVED', 'AFTER_UMUGANDA', 'AFFECTED']),
    newDate: z.string().optional().nullable(),
    reason: z.string().max(500).optional().nullable(),
  }),

  idish,
  optIdish,
};
