import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import useAuthStore from '../../store/authStore';
import { Menu } from 'lucide-react';

const TeamLayout = () => {
  const { isAuthenticated, role } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!isAuthenticated || role !== 'TEAM_MANAGER') {
    return <Navigate to="/auth/login" />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Mobile Sidebar Trigger */}
      <div className="lg:hidden bg-surface-dark border-b border-white/5 px-4 py-2 flex items-center justify-between">