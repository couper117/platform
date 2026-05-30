import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Trophy, Users, UserSquare2, FileText, 
  Newspaper, Settings, Activity, School, X, Megaphone, Eye
} from 'lucide-react';

const Sidebar = ({ type = 'admin', isOpen, onClose }) => {
  const adminLinks = [
    { to: '/admin/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { to: '/admin/leagues', icon: <Trophy size={18} />, label: 'Leagues' },
    { to: '/admin/fixtures', icon: <Activity size={18} />, label: 'Fixtures' },
    { to: '/admin/teams', icon: <Users size={18} />, label: 'Teams' },
    { to: '/admin/players', icon: <UserSquare2 size={18} />, label: 'Players' },
    { to: '/admin/documents', icon: <FileText size={18} />, label: 'Documents' },
    { to: '/admin/news', icon: <Newspaper size={18} />, label: 'News' },
    { to: '/admin/ads', icon: <Megaphone size={18} />, label: 'Ads' },
    { to: '/admin/visitors', icon: <Eye size={18} />, label: 'Visitors' },
    { to: '/admin/akc3', icon: <School size={18} />, label: 'Amashuri Games' },
    { to: '/admin/championships', icon: <Trophy size={18} />, label: 'Championships' },
    { to: '/admin/settings', icon: <Settings size={18} />, label: 'Settings' },
  ];

  const teamLinks = [
    { to: '/team/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { to: '/team/players', icon: <UserSquare2 size={18} />, label: 'My Players' },
    { to: '/team/documents', icon: <FileText size={18} />, label: 'Documents' },
    { to: '/team/fixtures', icon: <Activity size={18} />, label: 'Fixtures' },
    { to: '/team/profile', icon: <Users size={18} />, label: 'Team Profile' },
  ];

  const links = type === 'admin' ? adminLinks : teamLinks;

  const sidebarContent = (
    <>
      <div className="p-6 border-b border-surface-dark2 flex justify-between items-center">
        <h2 className="font-display text-xl text-red tracking-tighter uppercase">
          {type === 'admin' ? 'Admin Portal' : 'Team Portal'}
        </h2>
        <button onClick={onClose} className="lg:hidden p-1 text-white/40 hover:text-white">
          <X size={20} />
        </button>
      </div>