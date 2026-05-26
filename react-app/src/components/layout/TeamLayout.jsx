import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import useAuthStore from '../../store/authStore';

const TeamLayout = () => {
  const { isAuthenticated, role } = useAuthStore();

  if (!isAuthenticated || role !== 'TEAM_MANAGER') {
    return <Navigate to="/auth/login" />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-grow">
        <Sidebar type="team" />
        <main className="flex-grow bg-surface-2 p-6 md:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default TeamLayout;
