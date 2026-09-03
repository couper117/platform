import React, { useMemo, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import AdminTopBar from '../admin/AdminTopBar';
import useAuthStore from '../../store/authStore';

/**
 * The club portal's shell — the coach's side of the product.
 *
 * WHAT IT REPLACED. Exactly what the reporter shell did: the PUBLIC `Navbar`
 * ("Explore · Football · Basketball · Volleyball…", a row of links to the
 * fan-facing site), then a grey strip whose only content was a menu button, then
 * the sidebar and the page. Three bands of chrome before any content, on the
 * screen where somebody runs a football club.
 *
 * It is now the SAME shell as the admin and reporter portals — the same
 * `Sidebar`, the same `AdminTopBar` given the club's own pages and badge. That
 * matters here more than anywhere: the coach and the reporter hand work to each
 * other all season, and until now they were looking at two products that did not
 * appear to be related.
 */
const TeamLayout = () => {
  const { t } = useTranslation();
  const { isAuthenticated, role } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Written here rather than imported from ADMIN_PAGES because a coach holds no
  // admin capability: every entry in that list would refuse them. These are the
  // routes App.tsx actually mounts under this layout, so the search can only
  // offer what exists.
  const pages = useMemo(
    () => [
      { path: '/team/dashboard', label: t('portal.nav_dashboard') },
      { path: '/team/fixtures', label: t('portal.nav_matches') },
      { path: '/team/formation', label: t('portal.nav_team_sheets') },
      { path: '/team/players', label: t('portal.nav_my_players') },
      { path: '/team/staff', label: t('portal.nav_staff') },
      { path: '/team/profile', label: t('portal.nav_profile') },
      { path: '/team/account', label: t('portal.nav_account') },
    ],
    [t]
  );

  // The server gates every one of these routes again by capability, and confines
  // each write to this manager's own club; this only keeps a signed-out or
  // wrong-role visitor from watching an empty portal load.
  if (!isAuthenticated || role !== 'TEAM_MANAGER') {
    return <Navigate to="/auth/login" />;
  }

  return (
    <div className="flex min-h-screen bg-surface-2">
      <Sidebar type="team" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopBar
          onOpenSidebar={() => setIsSidebarOpen(true)}
          pages={pages}
          badge={t('portal.badge_club')}
          menuLabel={t('portal.role_team')}
        />
        <main className="min-w-0 flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default TeamLayout;
