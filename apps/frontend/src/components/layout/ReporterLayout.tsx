import React, { useMemo, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import AdminTopBar from '../admin/AdminTopBar';
import useAuthStore from '../../store/authStore';

/**
 * The reporter portal's shell.
 *
 * WHAT IT REPLACED. This layout stacked the PUBLIC `Navbar` — "Explore ·
 * Football · Basketball · Volleyball · Handball · Cycling · Cricket", a row of
 * links to the fan-facing site — then a second grey strip whose only content was
 * a "Reporter Menu" button, then the sidebar and the page. Three bands of chrome
 * before any content, on the one screen in this product designed to be read
 * one-handed at the side of a pitch. The admin shell was rebuilt away from
 * exactly that arrangement and the reporter shell was simply left behind.
 *
 * It is now the SAME shell: the sidebar is the full-height column, the portal bar
 * spans only the working area, and the menu button lives in that bar. Not a
 * lookalike — the same `Sidebar` and the same `AdminTopBar`, given the reporter's
 * own pages and badge, so the two portals cannot drift apart the way they did.
 *
 * ON THE ⌘K LIST. It is written here rather than imported from `ADMIN_PAGES`
 * because a reporter holds no admin capability: every entry in that list would
 * refuse them. These four are the routes below, and the search can only offer
 * what this file actually mounts.
 */
const ReporterLayout = () => {
  const { t } = useTranslation();
  const { isAuthenticated, role } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const pages = useMemo(
    () => [
      { path: '/reporter/dashboard', label: t('portal.nav_today') },
      { path: '/reporter/matches', label: t('portal.nav_my_matches') },
      { path: '/reporter/lineups', label: t('portal.nav_team_sheets') },
      { path: '/reporter/results', label: t('portal.nav_results') },
      { path: '/reporter/profile', label: t('portal.nav_my_profile') },
      { path: '/reporter/guide', label: t('portal.nav_guide') },
    ],
    [t]
  );

  // The server gates every one of these routes again by capability; this only
  // keeps a signed-out or wrong-role visitor from watching an empty portal load.
  if (!isAuthenticated || role !== 'MATCH_REPORTER') {
    return <Navigate to="/auth/login" />;
  }

  return (
    <div className="flex min-h-screen bg-surface-2">
      <Sidebar type="reporter" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopBar
          onOpenSidebar={() => setIsSidebarOpen(true)}
          pages={pages}
          badge={t('portal.badge_reporter')}
          menuLabel={t('portal.role_reporter')}
        />
        <main className="min-w-0 flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ReporterLayout;
