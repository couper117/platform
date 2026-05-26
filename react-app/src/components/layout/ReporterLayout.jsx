import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Navbar from './Navbar';
import useAuthStore from '../../store/authStore';

const ReporterLayout = () => {
  const { isAuthenticated, role } = useAuthStore();

  if (!isAuthenticated || role !== 'MATCH_REPORTER') {
    return <Navigate to="/auth/login" />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-surface-2 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default ReporterLayout;
