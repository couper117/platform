import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Trophy, Users, UserSquare2, FileText,
  Newspaper, Settings, Activity, School, X, Megaphone, Eye, ShieldCheck
} from 'lucide-react';
import useAuthStore from '../../store/authStore';

const Sidebar = ({ type = 'admin', isOpen, onClose }) => {
  const { role } = useAuthStore();
  const S = 'SUPERADMIN', F = 'FEDERATION_ADMIN', L = 'LEAGUE_ADMIN', A = 'AMASHURI_ADMIN';
  const adminLinks = [
    { to: '/admin/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard', roles: [S, F, L, A] },
    { to: '/admin/sport-admins', icon: <ShieldCheck size={18} />, label: 'Sport Admins', roles: [S] },
    { to: '/admin/leagues', icon: <Trophy size={18} />, label: 'Leagues', roles: [S, F, L] },
    { to: '/admin/fixtures', icon: <Activity size={18} />, label: 'Fixtures', roles: [S, F, L] },
    { to: '/admin/teams', icon: <Users size={18} />, label: 'Teams', roles: [S, F] },
    { to: '/admin/players', icon: <UserSquare2 size={18} />, label: 'Players', roles: [S, F] },
    { to: '/admin/documents', icon: <FileText size={18} />, label: 'Documents', roles: [S, F, L] },
    { to: '/admin/news', icon: <Newspaper size={18} />, label: 'News', roles: [S, F, L] },
    { to: '/admin/ads', icon: <Megaphone size={18} />, label: 'Ads', roles: [S] },
    { to: '/admin/visitors', icon: <Eye size={18} />, label: 'Visitors', roles: [S] },
    { to: '/admin/akc3', icon: <School size={18} />, label: 'Amashuri Games', roles: [S, A] },
    { to: '/admin/championships', icon: <Trophy size={18} />, label: 'Championships', roles: [S, A] },
    { to: '/admin/settings', icon: <Settings size={18} />, label: 'Settings', roles: [S] },
  ];

  const teamLinks = [
    { to: '/team/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { to: '/team/players', icon: <UserSquare2 size={18} />, label: 'My Players' },
    { to: '/team/documents', icon: <FileText size={18} />, label: 'Documents' },
    { to: '/team/fixtures', icon: <Activity size={18} />, label: 'Fixtures' },
    { to: '/team/profile', icon: <Users size={18} />, label: 'Team Profile' },
  ];

  const links = type === 'admin'
    ? adminLinks.filter((l) => l.roles.includes(role))
    : teamLinks;

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
