import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Trophy, Users, UserSquare2, FileText, Newspaper, Settings, Activity,
  School, X, Megaphone, Eye, ShieldCheck, Radio, ClipboardList, Medal, LayoutTemplate,
  Image as ImageIcon, Users2, KeyRound, Lock, Landmark, CalendarDays, Layers, GraduationCap, BarChart3,
  Target, TrendingUp, ClipboardCheck, MessageSquare, ExternalLink, HelpCircle, Shield,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useSportScope from '../../hooks/useSportScope';
import { ADMIN_PAGES } from '../../lib/adminAccess';

const ADMIN_ICONS = {
  '/admin/dashboard': <LayoutDashboard size={18} />,
  '/admin/sport-admins': <ShieldCheck size={18} />,
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

// The Ministry of Sport (Super Admin) navigation — grouped by remit and marking
// the read-only oversight sections (leagues/teams/championships) with a lock.
const MINISTRY_NAV = [
  { section: null, items: [{ to: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> }] },
  { section: 'Management', items: [
    { to: '/admin/sport-admins', label: 'Assign Sport Admins', icon: <ShieldCheck size={18} /> },
    { to: '/admin/leagues', label: 'Leagues', icon: <Trophy size={18} />, readOnly: true },
    { to: '/admin/teams', label: 'Teams', icon: <Users size={18} />, readOnly: true },
    { to: '/admin/championships', label: 'Championships', icon: <Medal size={18} />, readOnly: true },
  ] },
  { section: 'Content Management', items: [
    { to: '/admin/news', label: 'News', icon: <Newspaper size={18} /> },
    { to: '/admin/ads', label: 'Advertisements', icon: <Megaphone size={18} /> },
    { to: '/admin/content', label: 'Website Content', icon: <LayoutTemplate size={18} /> },
    { to: '/admin/media', label: 'Media Library', icon: <ImageIcon size={18} /> },
  ] },
  { section: 'System', items: [
    { to: '/admin/users', label: 'Users', icon: <Users2 size={18} /> },
    { to: '/admin/roles', label: 'Roles & Permissions', icon: <KeyRound size={18} /> },
    { to: '/admin/visitors', label: 'Audit Logs', icon: <ClipboardList size={18} /> },
    { to: '/admin/system-health', label: 'System Health', icon: <Activity size={18} /> },
    { to: '/admin/settings', label: 'Settings', icon: <Settings size={18} /> },
  ] },
];

// Federation (single-sport) navigation. Fixtures are read-only (lock), and there
// is no Ministry/system-wide functionality. Everything is scoped to the sport.
const FEDERATION_NAV = [
  { section: null, items: [{ to: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> }] },
  { section: 'Management', items: [
    { to: '/admin/leagues', label: 'Leagues', icon: <Trophy size={18} /> },
    { to: '/admin/users', label: 'League Admins', icon: <ShieldCheck size={18} /> },
    { to: '/admin/teams', label: 'Teams', icon: <Users size={18} /> },
    { to: '/admin/players', label: 'Players', icon: <UserSquare2 size={18} /> },
    { to: '/admin/championships', label: 'Championships', icon: <Medal size={18} /> },
  ] },
  { section: 'Operations', items: [
    { to: '/admin/fixtures', label: 'Fixtures', icon: <Activity size={18} />, readOnly: true },
    { to: '/admin/visitors', label: 'Statistics', icon: <ClipboardList size={18} /> },
  ] },
  { section: 'Content', items: [
    { to: '/admin/news', label: 'News', icon: <Newspaper size={18} /> },
    { to: '/admin/content', label: 'Sport Content', icon: <LayoutTemplate size={18} /> },
    { to: '/admin/media', label: 'Media Library', icon: <ImageIcon size={18} /> },
  ] },
  { section: 'System', items: [
    { to: '/admin/settings', label: 'Settings', icon: <Settings size={18} /> },
  ] },
];

// Amashuri (school-sports ecosystem) admin nav — the full ecosystem grouped by area.
const AMASHURI_NAV = [
  { section: null, items: [{ to: '/admin/akc3', label: 'Dashboard', icon: <LayoutDashboard size={18} /> }] },
  { section: 'Competitions', items: [
    { to: '/admin/championships', label: 'Competitions', icon: <Trophy size={18} /> },
    { to: '/admin/amashuri/seasons', label: 'Seasons', icon: <CalendarDays size={18} /> },
    { to: '/admin/amashuri/stages', label: 'Stages', icon: <Layers size={18} /> },
  ] },
  { section: 'Sports', items: [{ to: '/admin/amashuri/sports', label: 'Sports', icon: <Medal size={18} /> }] },
  { section: 'Schools', items: [
    { to: '/admin/amashuri/schools', label: 'Schools', icon: <School size={18} /> },
    { to: '/admin/amashuri/approvals', label: 'Pending Approvals', icon: <ClipboardList size={18} /> },
  ] },
  { section: 'Teams', items: [
    { to: '/admin/amashuri/teams', label: 'Teams', icon: <Users size={18} /> },
    { to: '/admin/amashuri/athletes', label: 'Athletes', icon: <UserSquare2 size={18} /> },
  ] },
  { section: 'Matches', items: [
    { to: '/admin/amashuri/fixtures', label: 'Fixtures', icon: <Activity size={18} /> },
    { to: '/admin/amashuri/live', label: 'Live Matches', icon: <Radio size={18} /> },
    { to: '/admin/amashuri/results', label: 'Results', icon: <FileText size={18} /> },
    { to: '/admin/amashuri/standings', label: 'Standings', icon: <BarChart3 size={18} /> },
  ] },
  { section: 'Content', items: [
    { to: '/admin/news', label: 'News', icon: <Newspaper size={18} /> },
    { to: '/admin/championships', label: 'Championships', icon: <Medal size={18} /> },
  ] },
  { section: 'Management', items: [
    { to: '/admin/amashuri/officials', label: 'Officials', icon: <Users2 size={18} /> },
    { to: '/admin/roles', label: 'Users & Roles', icon: <KeyRound size={18} /> },
    { to: '/admin/visitors', label: 'Audit Logs', icon: <ClipboardList size={18} /> },
    { to: '/admin/settings', label: 'Settings', icon: <Settings size={18} /> },
  ] },
];

// League (single-competition) admin nav — the operational level.
const LEAGUE_NAV = [
  { section: 'Main', items: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { to: '/admin/fixtures', label: 'Fixtures', icon: <Activity size={18} /> },
    { to: '/admin/league/match-reports', label: 'Match Reports', icon: <ClipboardCheck size={18} /> },
    { to: '/admin/league/standings', label: 'Standings', icon: <BarChart3 size={18} /> },
    { to: '/admin/league/top-scorers', label: 'Top Scorers', icon: <Target size={18} /> },
    { to: '/admin/league/statistics', label: 'Statistics', icon: <TrendingUp size={18} /> },
  ] },
  { section: 'Management', items: [
    { to: '/admin/teams', label: 'Teams', icon: <Users size={18} /> },
    { to: '/admin/players', label: 'Players', icon: <UserSquare2 size={18} /> },
    { to: '/admin/league/officials', label: 'Officials', icon: <Users2 size={18} /> },
    { to: '/admin/league/reporters', label: 'Reporter Assignment', icon: <Radio size={18} /> },
  ] },
  { section: 'Content', items: [
    { to: '/admin/news', label: 'News', icon: <Newspaper size={18} /> },
    { to: '/admin/content', label: 'League Content', icon: <LayoutTemplate size={18} /> },
    { to: '/admin/media', label: 'Media Library', icon: <ImageIcon size={18} /> },
  ] },
  { section: 'System', items: [
    { to: '/admin/visitors', label: 'Audit Logs', icon: <ClipboardList size={18} /> },
    { to: '/admin/settings', label: 'Settings', icon: <Settings size={18} /> },
  ] },
];

// Team (single-club) admin nav — the club-management portal.
const TEAM_NAV = [
  { section: 'Main', items: [
    { to: '/team/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { to: '/team/profile', label: 'Team Profile', icon: <Shield size={18} /> },
    { to: '/team/players', label: 'Players', icon: <UserSquare2 size={18} /> },
    { to: '/team/fixtures', label: 'Fixtures', icon: <Activity size={18} /> },
    { to: '/team/lineups', label: 'Lineups', icon: <ClipboardCheck size={18} /> },
    { to: '/team/staff', label: 'Staff', icon: <Users2 size={18} /> },
    { to: '/team/documents', label: 'Documents', icon: <FileText size={18} /> },
  ] },
  { section: 'Content', items: [
    { to: '/team/content', label: 'Team Content', icon: <LayoutTemplate size={18} /> },
    { to: '/team/media', label: 'Media Library', icon: <ImageIcon size={18} /> },
    { to: '/team/news', label: 'News', icon: <Newspaper size={18} /> },
  ] },
  { section: 'Communication', items: [
    { to: '/team/messages', label: 'Messages', icon: <MessageSquare size={18} />, badge: 2 },
  ] },
  { section: 'Analytics', items: [
    { to: '/team/statistics', label: 'Team Statistics', icon: <BarChart3 size={18} /> },
  ] },
  { section: 'System', items: [
    { to: '/team/settings', label: 'Settings', icon: <Settings size={18} /> },
  ] },
];

const Sidebar = ({ type = 'admin', isOpen, onClose }) => {
  const { role } = useAuthStore();
  const { profile } = useSportScope();
  const isSuper = type === 'admin' && role === 'SUPERADMIN';
  const isFed = type === 'admin' && role === 'FEDERATION_ADMIN';
  const isAma = type === 'admin' && role === 'AMASHURI_ADMIN';
  const isLeague = type === 'admin' && role === 'LEAGUE_ADMIN';
  const isTeam = type === 'team';

  const labelFor = (link) => {
    if (!profile) return link.label;
    return ({
      '/admin/leagues': profile.competitionPlural,
      '/admin/fixtures': profile.eventPlural,
      '/admin/teams': profile.competitorPlural,
      '/admin/players': profile.rosterPlural,
    })[link.to] || link.label;
  };

  const adminLinks = ADMIN_PAGES
    .filter((page) => page.roles.includes(role))
    .map((page) => ({ to: page.path, icon: ADMIN_ICONS[page.path], label: page.label }));

  const teamLinks = [
    { to: '/team/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { to: '/team/players', icon: <UserSquare2 size={18} />, label: 'My Players' },
    { to: '/team/fixtures', icon: <Activity size={18} />, label: 'Fixtures' },
    { to: '/team/lineups', icon: <ClipboardList size={18} />, label: 'Lineups' },
    { to: '/team/documents', icon: <FileText size={18} />, label: 'Documents' },
    { to: '/team/profile', icon: <Users size={18} />, label: 'Team Profile' },
  ];
  const reporterLinks = [{ to: '/reporter/dashboard', icon: <Radio size={18} />, label: 'Live Reporting' }];

  const closeOnMobile = () => { if (window.innerWidth < 1024) onClose(); };

  const navItemClass = ({ isActive }) =>
    `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-display uppercase tracking-widest transition-all ${
      isActive ? 'bg-brand-strong text-white shadow-lg' : 'text-white/50 hover:bg-white/5 hover:text-white'
    }`;

  /* ── Ministry (Super Admin) grouped nav ── */
  const ministryContent = (
    <>
      <div className="flex items-center justify-between gap-2 border-b border-white/10 p-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand"><Landmark size={18} /></span>
          <div className="leading-tight">
            <p className="text-[11px] font-bold uppercase tracking-wider text-white">Ministry of Sport</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-brand">Rwanda</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 text-white/40 hover:text-white lg:hidden"><X size={20} /></button>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto p-4">
        {MINISTRY_NAV.map((group, gi) => (
          <div key={gi} className="space-y-1">
            {group.section && <p className="px-3 pb-1 text-[9px] font-bold uppercase tracking-[0.25em] text-white/30">{group.section}</p>}
            {group.items.map((link) => (
              <NavLink key={link.to} to={link.to} end onClick={closeOnMobile} className={navItemClass}>
                {link.icon}
                <span className="flex-1 truncate">{link.label}</span>
                {link.readOnly && <Lock size={12} className="shrink-0 opacity-40" aria-label="Read only" />}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-xl bg-white/5 p-3">
          <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/50">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" /> System Status
          </p>
          <p className="text-[11px] text-brand">All systems operational</p>
          <p className="mt-2 text-[10px] text-white/30">Version 1.0.0 · Ministry Portal</p>
        </div>
      </div>
    </>
  );

  /* ── Federation (single-sport) grouped nav ── */
  const federationContent = (
    <>
      <div className="flex items-center justify-between gap-2 border-b border-white/10 p-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand"><ShieldCheck size={18} /></span>
          <div className="leading-tight">
            <p className="text-[13px] font-display font-bold uppercase tracking-tight text-white">FERWAFA</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-brand">Football Federation</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 text-white/40 hover:text-white lg:hidden"><X size={20} /></button>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto p-4">
        {FEDERATION_NAV.map((group, gi) => (
          <div key={gi} className="space-y-1">
            {group.section && <p className="px-3 pb-1 text-[9px] font-bold uppercase tracking-[0.25em] text-white/30">{group.section}</p>}
            {group.items.map((link) => (
              <NavLink key={link.to} to={link.to} end onClick={closeOnMobile} className={navItemClass}>
                {link.icon}
                <span className="flex-1 truncate">{link.label}</span>
                {link.readOnly && <Lock size={12} className="shrink-0 opacity-40" aria-label="Read only" />}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="space-y-3 border-t border-white/10 p-4">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/30">Current Season</p>
          <p className="font-display text-lg text-brand">2025/2026</p>
        </div>
        <div className="rounded-xl bg-white/5 p-3">
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/30">Your Sport</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm font-bold text-white"><Trophy size={13} className="text-brand" /> Football</p>
          <p className="mt-0.5 text-[10px] text-white/40">All football data under your federation</p>
        </div>
      </div>
    </>
  );

  /* ── Amashuri (school-sports ecosystem) grouped nav ── */
  const amashuriContent = (
    <>
      <div className="flex items-center justify-between gap-2 border-b border-white/10 p-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F5B301]/15 text-[#F5B301]"><GraduationCap size={18} /></span>
          <div className="leading-tight">
            <p className="text-[13px] font-display font-bold uppercase tracking-tight text-white">Amashuri Admin</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#F5B301]">School Sports</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 text-white/40 hover:text-white lg:hidden"><X size={20} /></button>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto p-4">
        {AMASHURI_NAV.map((group, gi) => (
          <div key={gi} className="space-y-1">
            {group.section && <p className="px-3 pb-1 text-[9px] font-bold uppercase tracking-[0.25em] text-white/30">{group.section}</p>}
            {group.items.map((link) => (
              <NavLink key={link.to + link.label} to={link.to} end onClick={closeOnMobile} className={navItemClass}>
                {link.icon}
                <span className="flex-1 truncate">{link.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-xl bg-white/5 p-3">
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/30">Ecosystem</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm font-bold text-white"><GraduationCap size={13} className="text-[#F5B301]" /> Rwandan School Sports</p>
          <p className="mt-0.5 text-[10px] text-white/40">Schools · Sports · Competitions</p>
        </div>
      </div>
    </>
  );

  /* ── League (single-competition) admin grouped nav ── */
  const leagueContent = (
    <>
      <div className="border-b border-white/10 p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/40">League Admin</p>
          <button onClick={onClose} className="p-1 text-white/40 hover:text-white lg:hidden"><X size={20} /></button>
        </div>
        <div className="flex items-center gap-2.5 rounded-xl bg-white/5 p-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand"><Trophy size={18} /></span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[12px] font-display font-bold uppercase tracking-tight text-white">Rwanda Premier League</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-brand">2025/2026 Season</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto p-4">
        {LEAGUE_NAV.map((group, gi) => (
          <div key={gi} className="space-y-1">
            {group.section && <p className="px-3 pb-1 text-[9px] font-bold uppercase tracking-[0.25em] text-white/30">{group.section}</p>}
            {group.items.map((link) => (
              <NavLink key={link.to} to={link.to} end onClick={closeOnMobile} className={navItemClass}>
                {link.icon}
                <span className="flex-1 truncate">{link.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </>
  );

  /* ── Team (single-club) grouped nav ── */
  const teamGroupedContent = (
    <>
      <div className="border-b border-white/10 p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/40">Team Portal</p>
          <button onClick={onClose} className="p-1 text-white/40 hover:text-white lg:hidden"><X size={20} /></button>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand"><Shield size={18} /></span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[13px] font-display font-bold uppercase tracking-tight text-white">APR FC</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-brand">Team Administrator</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto p-4">
        {TEAM_NAV.map((group, gi) => (
          <div key={gi} className="space-y-1">
            {group.section && <p className="px-3 pb-1 text-[9px] font-bold uppercase tracking-[0.25em] text-white/30">{group.section}</p>}
            {group.items.map((link) => (
              <NavLink key={link.to} to={link.to} end onClick={closeOnMobile} className={navItemClass}>
                {link.icon}
                <span className="flex-1 truncate">{link.label}</span>
                {link.badge && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">{link.badge}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="space-y-3 border-t border-white/10 p-4">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/30">Current Season</p>
          <p className="font-display text-lg text-brand">2025/2026</p>
        </div>
        <Link to="/teams" onClick={closeOnMobile} className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10">
          View Team Page <ExternalLink size={13} />
        </Link>
        <div className="flex items-center gap-2 rounded-xl bg-white/5 p-3 text-white/50">
          <HelpCircle size={16} className="shrink-0" />
          <div className="leading-tight"><p className="text-[11px] font-bold text-white">Need Help?</p><p className="text-[10px]">Contact Support</p></div>
        </div>
      </div>
    </>
  );

  /* ── legacy flat nav for other admin roles / team / reporter ── */
  const flatLinks = type === 'admin' ? adminLinks : type === 'reporter' ? reporterLinks : teamLinks;
  const portalLabel = type === 'admin' ? 'Admin Portal' : type === 'reporter' ? 'Reporter Portal' : 'Team Portal';
  const flatContent = (
    <>
      <div className="flex items-center justify-between border-b border-surface-dark2 p-6">
        <h2 className="font-display text-xl uppercase tracking-tighter text-red">{portalLabel}</h2>
        <button onClick={onClose} className="p-1 text-white/40 hover:text-white lg:hidden"><X size={20} /></button>
      </div>
      <nav className="space-y-1 p-4">
        {flatLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={closeOnMobile}
            className={({ isActive }) =>
              `flex items-center space-x-3 rounded px-4 py-2.5 font-display text-[13px] uppercase tracking-widest transition-all ${
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

  const content = isSuper ? ministryContent : isFed ? federationContent : isAma ? amashuriContent : isLeague ? leagueContent : isTeam ? teamGroupedContent : flatContent;

  return (
    <>
      <aside className="hidden min-h-screen w-64 flex-shrink-0 flex-col border-r border-surface-dark2 bg-surface-dark text-white lg:flex">
        {content}
      </aside>

      {isOpen && (
        <div className="fixed inset-0 z-[110] lg:hidden">
          <div className="absolute inset-0 bg-surface-dark/80 backdrop-blur-sm" onClick={onClose} />
          <aside className="absolute bottom-0 left-0 top-0 flex w-72 flex-col bg-surface-dark text-white shadow-2xl animate-in slide-in-from-left duration-300">
            {content}
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
