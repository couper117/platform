/**
 * Which admin pages an account may see.
 *
 * This used to be a hand-written table of role names, copied from the backend's
 * authorize() lists with a comment asking future readers to keep the two in
 * step. They did not stay in step — /admin/players was hidden from league
 * administrators even though the API has always let them edit players.
 *
 * Each page now names the capability its API requires, and the account's
 * resolved capability list comes from the server (see hooks/useCan.ts). There is
 * one policy, it lives on the server, and the sidebar reads it rather than
 * restating it. Where that changes what appears in the nav, it changes it
 * towards what the server already allowed.
 *
 * This is navigation only. Every page still calls endpoints that gate on the
 * same capability, so a page reached by other means refuses to do anything.
 */
export const ADMIN_PAGES = [
  { path: '/admin/dashboard', label: 'Dashboard', capability: 'admin.stats' },
  { path: '/admin/sport-admins', label: 'Sport Admins', capability: 'federations.admins' },
  { path: '/admin/leagues', label: 'Leagues', capability: 'leagues.write' },
  { path: '/admin/fixtures', label: 'Fixtures', capability: 'fixtures.write' },
  { path: '/admin/teams', label: 'Teams', capability: 'teams.approve' },
  { path: '/admin/players', label: 'Players', capability: 'players.write' },
  { path: '/admin/documents', label: 'Documents', capability: 'players.documents' },
  { path: '/admin/news', label: 'News', capability: 'news.write' },
  { path: '/admin/ads', label: 'Ads', capability: 'ads.write' },
  { path: '/admin/content', label: 'Website Content', capability: 'settings.write' },
  { path: '/admin/media', label: 'Media Library', capability: 'media.read' },
  { path: '/admin/users', label: 'Users', capability: 'users.write' },
  { path: '/admin/roles', label: 'Roles & Permissions', capability: 'users.write' },
  { path: '/admin/requests', label: 'Join Requests', capability: 'requests.review' },
  { path: '/admin/compliance', label: 'Data Protection', capability: 'privacy.dsr' },
  { path: '/admin/system-health', label: 'System Health', capability: 'system.health' },
  { path: '/admin/visitors', label: 'Visitors', capability: 'audit.read' },
  { path: '/admin/akc3', label: 'Amashuri Games', capability: 'akc.write' },
  { path: '/admin/championships', label: 'Championships', capability: 'akc.write' },
  // Umuganda touches league AND school fixtures, so every fixture-owning role
  // needs it; per-fixture ownership is still enforced server-side.
  { path: '/admin/umuganda', label: 'Umuganda', capability: 'umuganda.write' },
  { path: '/admin/settings', label: 'Settings', capability: 'settings.write' },

  // League Admin operational sub-sections
  { path: '/admin/league/match-reports', label: 'Match Reports', capability: 'fixtures.report' },
  { path: '/admin/league/standings', label: 'Standings', capability: 'leagues.write' },
  { path: '/admin/league/top-scorers', label: 'Top Scorers', capability: 'leagues.write' },
  { path: '/admin/league/statistics', label: 'Statistics', capability: 'leagues.write' },
  { path: '/admin/league/officials', label: 'Officials', capability: 'leagues.write' },
  { path: '/admin/league/reporters', label: 'Reporters', capability: 'reporters.assign' },

  // Amashuri (school-sports) sub-sections
  { path: '/admin/amashuri/seasons', label: 'Seasons', capability: 'akc.write' },
  { path: '/admin/amashuri/stages', label: 'Stages', capability: 'akc.write' },
  { path: '/admin/amashuri/sports', label: 'Sports', capability: 'akc.write' },
  { path: '/admin/amashuri/schools', label: 'Schools', capability: 'akc.write' },
  { path: '/admin/amashuri/school/', label: 'School detail', capability: 'akc.write' },
  { path: '/admin/amashuri/teams', label: 'Teams', capability: 'akc.write' },
  { path: '/admin/amashuri/athletes', label: 'Athletes', capability: 'akc.read' },
  { path: '/admin/amashuri/approvals', label: 'Approvals', capability: 'akc.write' },
  { path: '/admin/amashuri/officials', label: 'Officials', capability: 'akc.write' },
  { path: '/admin/amashuri/fixtures', label: 'Fixtures', capability: 'akc.write' },
  { path: '/admin/amashuri/live', label: 'Live Matches', capability: 'akc.write' },
  { path: '/admin/amashuri/results', label: 'Results', capability: 'akc.write' },
  { path: '/admin/amashuri/standings', label: 'Standings', capability: 'akc.write' },
];

/**
 * Whether an account holding `capabilities` may open `pathname`.
 *
 * An account whose capability list has not arrived yet — a session that predates
 * the field, or a page rendered before syncUser() returns — is let through
 * rather than shut out: the server is the real gate, and blanking an
 * administrator's console because a list is momentarily missing is the worse
 * failure of the two.
 */
export const isAdminPathAllowed = (capabilities, pathname) => {
  const page = ADMIN_PAGES.find((p) => pathname.startsWith(p.path));
  if (!page) return true; // unknown path — let routing (404) handle it, not this gate
  if (!Array.isArray(capabilities)) return true;
  return capabilities.includes(page.capability);
};

/** The pages this account may see, in declaration order. */
export const allowedAdminPages = (capabilities) =>
  (Array.isArray(capabilities) ? ADMIN_PAGES.filter((p) => capabilities.includes(p.capability)) : ADMIN_PAGES);
