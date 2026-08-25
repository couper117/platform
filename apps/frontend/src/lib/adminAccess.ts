// Which admin roles may see each admin page. Mirrors the backend's
// authorize() lists per resource (see api/src/routes/*.routes.js) so the UI
// doesn't dangle nav links or routes a role will just get 403'd on.
export const ADMIN_PAGES = [
  { path: '/admin/dashboard', label: 'Dashboard', roles: ['SUPERADMIN', 'FEDERATION_ADMIN', 'LEAGUE_ADMIN'] },
  { path: '/admin/sport-admins', label: 'Sport Admins', roles: ['SUPERADMIN'] },
  { path: '/admin/leagues', label: 'Leagues', roles: ['SUPERADMIN', 'FEDERATION_ADMIN', 'LEAGUE_ADMIN'] },
  { path: '/admin/fixtures', label: 'Fixtures', roles: ['SUPERADMIN', 'FEDERATION_ADMIN', 'LEAGUE_ADMIN'] },
  { path: '/admin/teams', label: 'Teams', roles: ['SUPERADMIN', 'FEDERATION_ADMIN'] },
  { path: '/admin/players', label: 'Players', roles: ['SUPERADMIN', 'FEDERATION_ADMIN'] },
  { path: '/admin/documents', label: 'Documents', roles: ['SUPERADMIN', 'FEDERATION_ADMIN'] },
  { path: '/admin/news', label: 'News', roles: ['SUPERADMIN', 'FEDERATION_ADMIN'] },
  { path: '/admin/ads', label: 'Ads', roles: ['SUPERADMIN'] },
  { path: '/admin/content', label: 'Website Content', roles: ['SUPERADMIN'] },
  { path: '/admin/media', label: 'Media Library', roles: ['SUPERADMIN'] },
  { path: '/admin/users', label: 'Users', roles: ['SUPERADMIN'] },
  { path: '/admin/roles', label: 'Roles & Permissions', roles: ['SUPERADMIN'] },
  { path: '/admin/system-health', label: 'System Health', roles: ['SUPERADMIN'] },
  { path: '/admin/visitors', label: 'Visitors', roles: ['SUPERADMIN'] },
  { path: '/admin/akc3', label: 'Amashuri Games', roles: ['SUPERADMIN', 'AMASHURI_ADMIN'] },
  { path: '/admin/championships', label: 'Championships', roles: ['SUPERADMIN', 'AMASHURI_ADMIN'] },
  { path: '/admin/settings', label: 'Settings', roles: ['SUPERADMIN'] },

  // League Admin operational sub-sections
  { path: '/admin/league/match-reports', label: 'Match Reports', roles: ['SUPERADMIN', 'LEAGUE_ADMIN'] },
  { path: '/admin/league/standings', label: 'Standings', roles: ['SUPERADMIN', 'LEAGUE_ADMIN'] },
  { path: '/admin/league/top-scorers', label: 'Top Scorers', roles: ['SUPERADMIN', 'LEAGUE_ADMIN'] },
  { path: '/admin/league/statistics', label: 'Statistics', roles: ['SUPERADMIN', 'LEAGUE_ADMIN'] },
  { path: '/admin/league/officials', label: 'Officials', roles: ['SUPERADMIN', 'LEAGUE_ADMIN'] },
  { path: '/admin/league/reporters', label: 'Reporters', roles: ['SUPERADMIN', 'LEAGUE_ADMIN'] },

  // Amashuri (school-sports) sub-sections
  { path: '/admin/amashuri/seasons', label: 'Seasons', roles: ['SUPERADMIN', 'AMASHURI_ADMIN'] },
  { path: '/admin/amashuri/stages', label: 'Stages', roles: ['SUPERADMIN', 'AMASHURI_ADMIN'] },
  { path: '/admin/amashuri/sports', label: 'Sports', roles: ['SUPERADMIN', 'AMASHURI_ADMIN'] },
  { path: '/admin/amashuri/schools', label: 'Schools', roles: ['SUPERADMIN', 'AMASHURI_ADMIN'] },
  { path: '/admin/amashuri/school/', label: 'School detail', roles: ['SUPERADMIN', 'AMASHURI_ADMIN'] },
  { path: '/admin/amashuri/teams', label: 'Teams', roles: ['SUPERADMIN', 'AMASHURI_ADMIN'] },
  { path: '/admin/amashuri/athletes', label: 'Athletes', roles: ['SUPERADMIN', 'AMASHURI_ADMIN'] },
  { path: '/admin/amashuri/approvals', label: 'Approvals', roles: ['SUPERADMIN', 'AMASHURI_ADMIN'] },
  { path: '/admin/amashuri/officials', label: 'Officials', roles: ['SUPERADMIN', 'AMASHURI_ADMIN'] },
  { path: '/admin/amashuri/fixtures', label: 'Fixtures', roles: ['SUPERADMIN', 'AMASHURI_ADMIN'] },
  { path: '/admin/amashuri/live', label: 'Live Matches', roles: ['SUPERADMIN', 'AMASHURI_ADMIN'] },
  { path: '/admin/amashuri/results', label: 'Results', roles: ['SUPERADMIN', 'AMASHURI_ADMIN'] },
  { path: '/admin/amashuri/standings', label: 'Standings', roles: ['SUPERADMIN', 'AMASHURI_ADMIN'] },
];

export const isAdminPathAllowed = (role, pathname) => {
  const page = ADMIN_PAGES.find((p) => pathname.startsWith(p.path));
  if (!page) return true; // unknown path — let routing (404) handle it, not this gate
  return page.roles.includes(role);
};
