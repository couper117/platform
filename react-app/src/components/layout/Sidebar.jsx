import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Trophy, Users, UserSquare2, FileText,
  Newspaper, Settings, Activity, School, X, Megaphone, Eye, ShieldCheck
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/authStore';
import useSportScope from '../../hooks/useSportScope';

const Sidebar = ({ type = 'admin', isOpen, onClose }) => {
  const { t } = useTranslation();
  const { role } = useAuthStore();
  const { profile } = useSportScope();
  const S = 'SUPERADMIN', F = 'FEDERATION_ADMIN', L = 'LEAGUE_ADMIN', A = 'AMASHURI_ADMIN';

  // For a sport-scoped federation admin, relabel nav to the sport's language
  // (a cycling admin sees "Races & Tours", a judo admin sees "Bouts", etc.).
  const labelFor = (link) => {
    if (!profile) return link.label;
    return ({
      '/admin/leagues': profile.competitionPlural,
      '/admin/fixtures': profile.eventPlural,
      '/admin/teams': profile.competitorPlural,
      '/admin/players': profile.rosterPlural,
    })[link.to] || link.label;
  };
  const adminLinks = [
    { to: '/admin/dashboard', icon: <LayoutDashboard size={18} />, label: t('nav.dashboard'), roles: [S, F, L] },
    { to: '/admin/sport-admins', icon: <ShieldCheck size={18} />, label: t('admin.nav.sport_admins'), roles: [S] },
    { to: '/admin/leagues', icon: <Trophy size={18} />, label: t('nav.leagues'), roles: [S, F, L] },
    { to: '/admin/fixtures', icon: <Activity size={18} />, label: t('nav.fixtures'), roles: [S, F, L] },
    { to: '/admin/teams', icon: <Users size={18} />, label: t('admin.nav.teams'), roles: [S, F] },
    { to: '/admin/players', icon: <UserSquare2 size={18} />, label: t('admin.nav.players'), roles: [S, F] },
    { to: '/admin/documents', icon: <FileText size={18} />, label: t('admin.nav.documents'), roles: [S, F] },
    { to: '/admin/news', icon: <Newspaper size={18} />, label: t('nav.news'), roles: [S, F] },
    { to: '/admin/ads', icon: <Megaphone size={18} />, label: t('admin.nav.ads'), roles: [S] },
    { to: '/admin/visitors', icon: <Eye size={18} />, label: t('admin.nav.visitors'), roles: [S] },
    { to: '/admin/akc3', icon: <School size={18} />, label: t('nav.amashuri'), roles: [S, A] },
    { to: '/admin/championships', icon: <Trophy size={18} />, label: t('amashuri.championships'), roles: [S, A] },
    { to: '/admin/settings', icon: <Settings size={18} />, label: t('admin.nav.settings'), roles: [S] },
  ];

  const teamLinks = [
    { to: '/team/dashboard', icon: <LayoutDashboard size={18} />, label: t('nav.dashboard') },
    { to: '/team/players', icon: <UserSquare2 size={18} />, label: t('team.nav.my_players') },
    { to: '/team/documents', icon: <FileText size={18} />, label: t('admin.nav.documents') },
    { to: '/team/fixtures', icon: <Activity size={18} />, label: t('nav.fixtures') },
    { to: '/team/profile', icon: <Users size={18} />, label: t('team.nav.team_profile') },
  ];

  const links = type === 'admin'
    ? adminLinks.filter((l) => l.roles.includes(role))
    : teamLinks;

  const sidebarContent = (
    <>
      <div className="p-6 border-b border-surface-dark2 flex justify-between items-center">
        <h2 className="font-display text-xl text-red tracking-tighter uppercase">
          {type === 'admin' ? t('admin.portal') : t('team.portal')}
        </h2>
        <button onClick={onClose} aria-label={t('common.close')} className="lg:hidden p-1 text-white/40 hover:text-white">
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
            <span>{labelFor(link)}</span>
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
