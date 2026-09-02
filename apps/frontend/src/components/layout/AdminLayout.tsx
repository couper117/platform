import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import useAuthStore from '../../store/authStore';
import { Menu, ShieldAlert } from 'lucide-react';
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
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      {/* Mobile Sidebar Trigger */}
      <div className="lg:hidden bg-surface-dark border-b border-white/5 px-4 py-2 flex items-center justify-between">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="flex items-center space-x-2 text-white/60 hover:text-red transition-colors"
        >
          <Menu size={20} />
          <span className="text-[10px] uppercase font-bold tracking-widest">{t('admin.menu')}</span>
        </button>
      </div>

      <div className="flex flex-grow relative">
        <Sidebar type="admin" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-grow bg-surface-2 dark:bg-surface-dark p-4 sm:p-6 md:p-8 overflow-x-hidden">
          {pageAllowed ? (
            <Outlet />
          ) : (
            <div className="py-24 flex flex-col items-center text-center gap-4 opacity-60">
              <ShieldAlert size={48} className="text-red" />
              <p className="font-display text-2xl uppercase tracking-widest">Not authorized</p>
              <p className="text-xs max-w-xs">Your role doesn't have access to this page. Ask a superadmin if you need it.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
