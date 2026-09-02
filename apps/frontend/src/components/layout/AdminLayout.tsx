import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import AdminTopBar from '../admin/AdminTopBar';
import useAuthStore from '../../store/authStore';
import { ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { isAdminPathAllowed } from '../../lib/adminAccess';
import { useCapabilities } from '../../hooks/useCan';

const AdminLayout = () => {
  const { t } = useTranslation();
  const { isAuthenticated, role } = useAuthStore();
  const capabilities = useCapabilities();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const ADMIN_ROLES = ['SUPERADMIN', 'LEAGUE_ADMIN', 'FEDERATION_ADMIN', 'AMASHURI_ADMIN'];
  if (!isAuthenticated || !ADMIN_ROLES.includes(role)) {
    return <Navigate to="/auth/login" />;
  }

  const pageAllowed = isAdminPathAllowed(capabilities, location.pathname);

  return (
    /**
     * THE SIDEBAR IS THE FULL-HEIGHT COLUMN, the bar sits inside the content.
     * The old shell stacked the public Navbar across the top, then a second
     * mobile-only strip carrying a "Menu" button, then the sidebar and page below
     * — three bands of chrome before any content. The sidebar now runs the whole
     * height, the admin bar spans only the working area, and the menu button
     * lives in that bar rather than in a strip of its own.
     */
    <div className="flex min-h-screen bg-surface-2">
      <Sidebar type="admin" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopBar onOpenSidebar={() => setIsSidebarOpen(true)} />
        <main className="min-w-0 flex-1 p-4 sm:p-6">
          {pageAllowed ? (
            <Outlet />
          ) : (
            <div className="flex flex-col items-center gap-3 py-24 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-card bg-surface-3">
                <ShieldAlert size={22} className="text-danger-text" aria-hidden="true" />
              </span>
              <p className="font-display text-lg font-bold text-primary">{t('adminui.not_authorized')}</p>
              <p className="max-w-sm text-sm text-secondary">{t('adminui.not_authorized_hint')}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
