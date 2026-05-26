import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import useAuthStore from '../../store/authStore';
import { Menu } from 'lucide-react';

const AdminLayout = () => {
  const { isAuthenticated, role } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!isAuthenticated || (role !== 'SUPERADMIN' && role !== 'LEAGUE_ADMIN')) {
    return <Navigate to="/auth/login" />;
  }

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
          <span className="text-[10px] uppercase font-bold tracking-widest">Admin Menu</span>
        </button>
      </div>

      <div className="flex flex-grow relative">
        <Sidebar type="admin" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-grow bg-surface-2 p-4 sm:p-6 md:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
