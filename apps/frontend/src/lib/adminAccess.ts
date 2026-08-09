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
  { path: '/admin/visitors', label: 'Visitors', roles: ['SUPERADMIN'] },
  { path: '/admin/akc3', label: 'Amashuri Games', roles: ['SUPERADMIN', 'AMASHURI_ADMIN'] },
  { path: '/admin/championships', label: 'Championships', roles: ['SUPERADMIN', 'AMASHURI_ADMIN'] },
  { path: '/admin/settings', label: 'Settings', roles: ['SUPERADMIN'] },
];

export const isAdminPathAllowed = (role, pathname) => {
  const page = ADMIN_PAGES.find((p) => pathname.startsWith(p.path));
  if (!page) return true; // unknown path — let routing (404) handle it, not this gate
  return page.roles.includes(role);
};
