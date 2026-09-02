import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import useAuthStore from '../../store/authStore';
import { Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Portal shell for a school coordinator — the person at a school who registers its
 * athletes. Only that role reaches it; every page inside is scoped server-side to
 * the one school on their account.
 */
const SchoolLayout = () => {
  const { t } = useTranslation();
  const { isAuthenticated, role } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!isAuthenticated || role !== 'SCHOOL_COORDINATOR') {
    return <Navigate to="/auth/login" />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

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
        <Sidebar type="school" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-grow bg-surface-2 dark:bg-surface-dark p-4 sm:p-6 md:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SchoolLayout;
