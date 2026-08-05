import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Trophy, Users, UserSquare2, FileText,
  Newspaper, Settings, Activity, School, X, Megaphone, Eye, Radio
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { ADMIN_PAGES } from '../../lib/adminAccess';

const ADMIN_ICONS = {
  '/admin/dashboard': <LayoutDashboard size={18} />,
  '/admin/leagues': <Trophy size={18} />,
  '/admin/fixtures': <Activity size={18} />,
  '/admin/teams': <Users size={18} />,
  '/admin/players': <UserSquare2 size={18} />,
  '/admin/documents': <FileText size={18} />,
  '/admin/news': <Newspaper size={18} />,
  '/admin/ads': <Megaphone size={18} />,
  '/admin/visitors': <Eye size={18} />,
  '/admin/akc3': <School size={18} />,
  '/admin/championships': <Trophy size={18} />,
  '/admin/settings': <Settings size={18} />,
};

const Sidebar = ({ type = 'admin', isOpen, onClose }) => {
  const { role } = useAuthStore();

  const adminLinks = ADMIN_PAGES
    .filter((page) => page.roles.includes(role))
    .map((page) => ({ to: page.path, icon: ADMIN_ICONS[page.path], label: page.label }));

  const teamLinks = [
    { to: '/team/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { to: '/team/players', icon: <UserSquare2 size={18} />, label: 'My Players' },
    { to: '/team/documents', icon: <FileText size={18} />, label: 'Documents' },
    { to: '/team/fixtures', icon: <Activity size={18} />, label: 'Fixtures' },
    { to: '/team/profile', icon: <Users size={18} />, label: 'Team Profile' },
  ];

  const reporterLinks = [
    { to: '/reporter/dashboard', icon: <Radio size={18} />, label: 'Live Reporting' },
  ];

  const links = type === 'admin' ? adminLinks : type === 'reporter' ? reporterLinks : teamLinks;
  const portalLabel = type === 'admin' ? 'Admin Portal' : type === 'reporter' ? 'Reporter Portal' : 'Team Portal';

  const sidebarContent = (
    <>
      <div className="p-6 border-b border-surface-dark2 flex justify-between items-center">
        <h2 className="font-display text-xl text-red tracking-tighter uppercase">
          {portalLabel}
        </h2>
        <button onClick={onClose} className="lg:hidden p-1 text-white/40 hover:text-white">
          <X size={20} />
        </button>
      </div>
      <nav className="p-4 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={() => { if (window.innerWidth < 1024) onClose(); }}
            className={({ isActive }) => 
              `flex items-center space-x-3 px-4 py-2.5 rounded transition-all font-display text-[13px] uppercase tracking-widest ${
                isActive ? 'bg-red text-white shadow-lg shadow-red-glow' : 'text-white/50 hover:bg-surface-dark2 hover:text-white'
              }`
            }
          >
            {link.icon}
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="bg-surface-dark text-white w-64 min-h-screen hidden lg:block flex-shrink-0 border-r border-surface-dark2">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[110] lg:hidden">
          <div className="absolute inset-0 bg-surface-dark/80 backdrop-blur-sm" onClick={onClose} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-surface-dark text-white shadow-2xl animate-in slide-in-from-left duration-300">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
