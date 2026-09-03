import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Trophy, Users, UserSquare2, FileText, Newspaper, Settings, Activity, HeartHandshake,
  School, X, Megaphone, ClipboardList, ShieldCheck, Radio, Lock, Landmark, GraduationCap,
  Medal, Shield, ExternalLink, HelpCircle, Users2, KeyRound, LayoutTemplate, Image as ImageIcon,
  ClipboardCheck, BarChart3, Target, TrendingUp, CalendarDays, Layers, Inbox, Sparkles,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useSportScope from '../../hooks/useSportScope';
import { ADMIN_PAGES } from '../../lib/adminAccess';
import { useCapabilities } from '../../hooks/useCan';
import ReporterSidebarFooter from '../reporter/ReporterSidebarFooter';
import TeamSidebarFooter from '../team/TeamSidebarFooter';
import TeamSidebarIdentity from '../team/TeamSidebarIdentity';

/**
 * Role-aware admin/team/reporter sidebar — the demo's grouped, role-branded design
 * (Ministry / Federation / Amashuri / League / Team / Reporter), driven by the
 * REAL ADMIN_PAGES access list so it mirrors the capabilities the server grants and never
 * links to a page that does not exist. Fully translated (EN/FR/RW).
 *
 * A sport-scoped federation admin gets its nav relabelled to the sport's language
 * (a cycling admin sees "Races", a judo admin "Bouts") via useSportScope().profile.
 *
 * ON TOKENS, NOT A BLACK SLAB. The structure here — role-branded header, grouped
 * sections, capability-driven items — was already right and is untouched. What
 * changed is the surface: it was `bg-surface-dark` with `text-white`,
 * `border-white/10` and `text-white/30` section labels set in 9px capitals with
 * 0.25em of tracking, which is the language the public app was rebuilt out of and
 * the only dark panel left in a light product. It is `bg-surface` with hairline
 * borders now, and it follows the theme like everything else — an operator who
 * chooses dark mode gets a dark sidebar because the page is dark, not because
 * this one component always was.
 *
 * SENTENCE CASE. An operator reads these twenty labels every day; letterspaced
 * capitals cost them a beat each time and buy nothing back.
 */

// path → { i18n key, section, icon }. Only real routes appear here.
//
// Exported because the admin search needs the same labels the sidebar shows. The
// alternative was a second list of admin page names living in adminAccess.ts,
// which would drift from this one the first time a page was renamed.
export const PATH_META = {
  '/admin/dashboard': { key: 'portal.nav_dashboard', section: 'main', icon: <LayoutDashboard size={18} /> },
  '/admin/akc3': { key: 'portal.nav_akc3', section: 'main', icon: <School size={18} /> },
  '/admin/sport-admins': { key: 'portal.nav_sport_admins', section: 'management', icon: <ShieldCheck size={18} /> },
  '/admin/sports': { key: 'portal.nav_sports', section: 'management', icon: <Medal size={18} /> },
  '/admin/leagues': { key: 'portal.nav_leagues', section: 'management', icon: <Trophy size={18} /> },
  '/admin/teams': { key: 'portal.nav_teams', section: 'management', icon: <Users size={18} /> },
  '/admin/players': { key: 'portal.nav_players', section: 'management', icon: <UserSquare2 size={18} /> },
  '/admin/documents': { key: 'portal.nav_documents', section: 'management', icon: <FileText size={18} /> },
  '/admin/fixtures': { key: 'portal.nav_fixtures', section: 'operations', icon: <Activity size={18} /> },
  '/admin/umuganda': { key: 'portal.nav_umuganda', section: 'operations', icon: <HeartHandshake size={18} /> },
  '/admin/championships': { key: 'portal.nav_championships', section: 'competitions', icon: <Medal size={18} /> },
  '/admin/news': { key: 'portal.nav_news', section: 'content', icon: <Newspaper size={18} /> },
  '/admin/ads': { key: 'portal.nav_ads', section: 'content', icon: <Megaphone size={18} /> },
  '/admin/content': { key: 'portal.nav_content', section: 'content', icon: <LayoutTemplate size={18} /> },
  '/admin/media': { key: 'portal.nav_media', section: 'content', icon: <ImageIcon size={18} /> },
  '/admin/users': { key: 'portal.nav_users', section: 'system', icon: <Users2 size={18} /> },
  '/admin/roles': { key: 'portal.nav_roles', section: 'system', icon: <KeyRound size={18} /> },
  '/admin/requests': { key: 'portal.nav_requests', section: 'system', icon: <Inbox size={18} /> },
  '/admin/compliance': { key: 'portal.nav_compliance', section: 'system', icon: <ShieldCheck size={18} /> },
  '/admin/system-health': { key: 'portal.nav_system_health', section: 'system', icon: <Activity size={18} /> },
  '/admin/visitors': { key: 'portal.nav_visitors', section: 'system', icon: <ClipboardList size={18} /> },
  '/admin/settings': { key: 'portal.nav_settings', section: 'system', icon: <Settings size={18} /> },
  '/admin/ai': { key: 'portal.nav_ai', section: 'system', icon: <Sparkles size={18} /> },

  // League Admin sub-sections
  '/admin/league/match-reports': { key: 'portal.nav_match_reports', section: 'operations', icon: <ClipboardCheck size={18} /> },
  '/admin/league/standings': { key: 'portal.nav_standings', section: 'operations', icon: <BarChart3 size={18} /> },
  '/admin/league/top-scorers': { key: 'portal.nav_top_scorers', section: 'operations', icon: <Target size={18} /> },
  '/admin/league/statistics': { key: 'portal.nav_statistics', section: 'operations', icon: <TrendingUp size={18} /> },
  '/admin/league/officials': { key: 'portal.nav_officials', section: 'management', icon: <Users2 size={18} /> },
  '/admin/league/reporters': { key: 'portal.nav_reporters', section: 'management', icon: <Radio size={18} /> },

  // Amashuri sub-sections
  '/admin/amashuri/seasons': { key: 'portal.nav_seasons', section: 'competitions', icon: <CalendarDays size={18} /> },
  '/admin/amashuri/stages': { key: 'portal.nav_stages', section: 'competitions', icon: <Layers size={18} /> },
  '/admin/amashuri/sports': { key: 'portal.nav_sports', section: 'competitions', icon: <Medal size={18} /> },
  '/admin/amashuri/schools': { key: 'portal.nav_schools', section: 'management', icon: <School size={18} /> },
  '/admin/amashuri/teams': { key: 'portal.nav_teams', section: 'management', icon: <Users size={18} /> },
  '/admin/amashuri/athletes': { key: 'portal.nav_athletes', section: 'management', icon: <UserSquare2 size={18} /> },
  '/admin/amashuri/approvals': { key: 'portal.nav_approvals', section: 'management', icon: <ClipboardList size={18} /> },
  '/admin/amashuri/officials': { key: 'portal.nav_officials', section: 'management', icon: <Users2 size={18} /> },
  '/admin/amashuri/fixtures': { key: 'portal.nav_fixtures', section: 'operations', icon: <Activity size={18} /> },
  '/admin/amashuri/live': { key: 'portal.nav_live_matches', section: 'operations', icon: <Radio size={18} /> },
  '/admin/amashuri/results': { key: 'portal.nav_results', section: 'operations', icon: <FileText size={18} /> },
  '/admin/amashuri/standings': { key: 'portal.nav_standings', section: 'operations', icon: <BarChart3 size={18} /> },
};

const SECTION_ORDER = ['main', 'management', 'operations', 'matchday', 'competitions', 'content', 'squad', 'club', 'system', 'amashuri', 'you'];
const SECTION_KEY = {
  main: null, management: 'portal.sec_management', operations: 'portal.sec_operations',
  competitions: 'portal.sec_competitions', content: 'portal.sec_content', system: 'portal.sec_system', amashuri: 'portal.sec_amashuri',
  // Reporter-only groupings. "Match day" is the work itself; "You" is the two
  // pages about the person rather than the fixture. An admin never sees either,
  // which is why they sit at the ends of the order and not in the middle of it.
  matchday: 'portal.sec_matchday', you: 'portal.sec_you',
  // Club-portal groupings, seen only by a coach.
  squad: 'portal.sec_squad', club: 'portal.sec_club',
};

// Super admin oversees leagues/teams/championships read-only; a federation admin's
// fixtures are managed by league admins, so read-only there too.
const isReadOnly = (role, path) =>
  (role === 'SUPERADMIN' && ['/admin/leagues', '/admin/teams', '/admin/championships'].includes(path)) ||
  (role === 'FEDERATION_ADMIN' && path === '/admin/fixtures');

const Sidebar = ({ type = 'admin', isOpen, onClose }) => {
  const { t } = useTranslation();
  const { role } = useAuthStore();
  // What this account may actually do, as the server resolved it. An empty list
  // means it has not arrived yet (a session predating capabilities, or the first
  // render before syncUser returns) — the filter below falls back to showing the
  // nav rather than blanking it, and every page is gated server-side regardless.
  const capabilities = useCapabilities();
  const { profile, sport } = useSportScope();

  const closeOnMobile = () => { if (window.innerWidth < 1024) onClose(); };

  /**
   * ACTIVE IS A TINT, NOT A SLAB. The active item was `bg-brand-strong` with a
   * shadow — a saturated green block in a column of twenty, loud enough that the
   * eye goes to it before the page content. The tint plus brand ink says the same
   * thing quietly, and it is the treatment the public app already uses for a
   * selected chip, so the two halves of the product agree.
   */
  const navItemClass = ({ isActive }) =>
    `group flex min-h-tap items-center gap-3 rounded-control px-3 py-2 text-sm font-medium transition-colors duration-150 ease-standard ${
      isActive
        ? 'bg-brand-tint font-semibold text-brand-text'
        : 'text-secondary hover:bg-surface-2 hover:text-primary'
    }`;

  // Sport-scoped relabelling (federation admin only): leagues→competitions, etc.
  const labelFor = (path, fallbackKey) => {
    if (profile) {
      const scoped = {
        '/admin/leagues': profile.competitionPlural,
        '/admin/fixtures': profile.eventPlural,
        '/admin/teams': profile.competitorPlural,
        '/admin/players': profile.rosterPlural,
      }[path];
      if (scoped) return scoped;
    }
    return t(fallbackKey);
  };

  // ── build grouped admin nav from the real access list ──
  // The Super Admin can *reach* every route (god mode), but the league/amashuri
  // operational sub-sections belong to those admins' portals — keep them out of
  // the Ministry nav so it stays governance-focused, matching the reference.
  const adminItems = ADMIN_PAGES
    .filter((page) => !capabilities.length || capabilities.includes(page.capability))
    .filter((page) => !(role === 'SUPERADMIN' && (page.path.startsWith('/admin/league/') || page.path.startsWith('/admin/amashuri/'))))
    .map((page) => ({ to: page.path, ...PATH_META[page.path], readOnly: isReadOnly(role, page.path) }))
    .filter((i) => i.section);
  const adminGroups = SECTION_ORDER
    .map((section) => ({ section, items: adminItems.filter((i) => i.section === section) }))
    .filter((g) => g.items.length);

  /**
   * THE CLUB'S NAV, GROUPED THE WAY A SEASON IS.
   *
   * It was six flat items with the club profile sitting second, above the squad
   * and the fixtures — the thing a coach edits once a year in front of the two
   * they touch every week. The order is now what they are doing: the week ahead,
   * then the squad, then the club, then themselves.
   *
   * Team sheets are promoted out of the flat list and into their own group with
   * the matches, because filing one is the club's single obligation to the rest
   * of the platform: until a coach does, the reporter at the ground has to copy
   * it off paper and a goal cannot name the player who scored it.
   *
   * The match page itself is deliberately absent — it belongs to a fixture, is
   * reached from a list, and a nav item pointing at "a match" with no match
   * chosen is a dead link waiting to happen. Same rule as the reporter's console.
   */
  const teamGroups = [
    { section: 'main', items: [
      { to: '/team/dashboard', key: 'portal.nav_dashboard', icon: <LayoutDashboard size={18} /> },
      { to: '/team/fixtures', key: 'portal.nav_matches', icon: <CalendarDays size={18} /> },
      { to: '/team/formation', key: 'portal.nav_team_sheets', icon: <LayoutTemplate size={18} /> },
    ] },
    { section: 'squad', items: [
      { to: '/team/players', key: 'portal.nav_my_players', icon: <UserSquare2 size={18} /> },
      { to: '/team/staff', key: 'portal.nav_staff', icon: <Users2 size={18} /> },
    ] },
    { section: 'club', items: [
      { to: '/team/profile', key: 'portal.nav_profile', icon: <Shield size={18} /> },
    ] },
    { section: 'you', items: [
      { to: '/team/account', key: 'portal.nav_account', icon: <UserSquare2 size={18} /> },
    ] },
  ];
  const schoolGroups = [
    { section: 'main', items: [
      { to: '/school/dashboard', key: 'portal.nav_dashboard', icon: <LayoutDashboard size={18} /> },
      { to: '/school/athletes', key: 'portal.nav_my_athletes', icon: <UserSquare2 size={18} /> },
    ] },
  ];
  /**
   * THE REPORTER'S NAV, WHICH USED TO BE TWO LINKS.
   *
   * "Live Reporting" and "My Profile" were the whole portal, and the first of
   * them was really three screens wearing one label: a match picker, a live
   * console and nothing at all for a match already finished. A reporter holds
   * three server capabilities — `fixtures.report`, `fixtures.lineups` and
   * `reporters.profile` — and two of them had no screen behind them, so a
   * reporter could not name a line-up or record a statistic they were entitled
   * to enter.
   *
   * The order below is the shape of their day: what is happening now, everything
   * they are down for, the two things done at the ground, then themselves. The
   * match console itself is deliberately absent — it belongs to a fixture, is
   * reached from a list, and a nav item pointing at "a match" with no match
   * chosen is a dead link waiting to happen.
   */
  const reporterGroups = [
    { section: 'main', items: [
      { to: '/reporter/dashboard', key: 'portal.nav_today', icon: <LayoutDashboard size={18} /> },
      { to: '/reporter/matches', key: 'portal.nav_my_matches', icon: <CalendarDays size={18} /> },
    ] },
    { section: 'matchday', items: [
      { to: '/reporter/lineups', key: 'portal.nav_team_sheets', icon: <ClipboardList size={18} /> },
      { to: '/reporter/results', key: 'portal.nav_results', icon: <ClipboardCheck size={18} /> },
    ] },
    { section: 'you', items: [
      { to: '/reporter/profile', key: 'portal.nav_my_profile', icon: <UserSquare2 size={18} /> },
      { to: '/reporter/guide', key: 'portal.nav_guide', icon: <HelpCircle size={18} /> },
    ] },
  ];

  const groups = type === 'team' ? teamGroups
    : type === 'reporter' ? reporterGroups
    : type === 'school' ? schoolGroups
    : adminGroups;

  // ── role-branded header ──
  const headerFor = () => {
    // No `team` case: the club's rail is headed by its own crest and name — see
    // TeamSidebarIdentity, rendered instead of this block below.
    if (type === 'reporter') return { icon: <Radio size={18} />, title: t('portal.role_reporter'), sub: null, accent: 'text-brand bg-brand/15' };
    if (type === 'school') return { icon: <GraduationCap size={18} />, title: t('portal.role_school'), sub: t('portal.role_school_sub'), accent: 'text-[#F5B301] bg-[#F5B301]/15' };
    if (role === 'SUPERADMIN') return { icon: <Landmark size={18} />, title: t('portal.role_ministry'), sub: t('portal.role_ministry_sub'), accent: 'text-brand bg-brand/15' };
    if (role === 'FEDERATION_ADMIN') return { icon: <ShieldCheck size={18} />, title: t('portal.role_federation'), sub: sport?.name || null, accent: 'text-brand bg-brand/15' };
    if (role === 'AMASHURI_ADMIN') return { icon: <GraduationCap size={18} />, title: t('portal.role_amashuri'), sub: t('portal.role_amashuri_sub'), accent: 'text-[#F5B301] bg-[#F5B301]/15' };
    if (role === 'LEAGUE_ADMIN') return { icon: <Trophy size={18} />, title: t('portal.role_league'), sub: '2025/2026', accent: 'text-brand bg-brand/15' };
    return { icon: <LayoutDashboard size={18} />, title: t('portal.role_admin'), sub: null, accent: 'text-brand bg-brand/15' };
  };
  const header = headerFor();

  // ── role footer panel ──
  const footer = (() => {
    // A reporter's own two questions — am I marked free, and where am I next.
    if (type === 'reporter') return <ReporterSidebarFooter onNavigate={closeOnMobile} />;
    // The club's own two questions — when do we play, and have we filed.
    if (type === 'team') return <TeamSidebarFooter onNavigate={closeOnMobile} />;
    if (role === 'FEDERATION_ADMIN' && type === 'admin') {
      return (
        <div className="space-y-3 border-t border-hairline p-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-tertiary">{t('portal.current_season')}</p>
            <p className="font-display text-lg font-bold text-primary">2025/2026</p>
          </div>
          <div className="rounded-card border border-hairline bg-surface-2 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-tertiary">{t('portal.your_sport')}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-primary"><Trophy size={13} className="text-brand" /> {sport?.name || '—'}</p>
          </div>
        </div>
      );
    }
    if (role === 'SUPERADMIN' && type === 'admin') {
      return (
        <div className="border-t border-hairline p-4">
          <div className="rounded-card border border-hairline bg-surface-2 p-3">
            <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-tertiary">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" /> {t('portal.system_status')}
            </p>
            <p className="text-sm text-brand-text">{t('portal.all_operational')}</p>
            <p className="mt-2 text-xs text-tertiary">v1.0.0 · {t('portal.role_ministry')}</p>
          </div>
        </div>
      );
    }
    return null;
  })();

  const content = (
    <>
      <div className="flex items-center justify-between gap-2 border-b border-hairline px-4 py-4">
        {/* THE CLUB'S RAIL NAMES THE CLUB. Every other portal here is headed by
            the organisation it belongs to — the Ministry, a federation, a league
            — and the club's was headed "Club portal", which tells a coach the one
            thing they already know. The crest and the name also answer a question
            the label could not: which club am I signed into. */}
        {type === 'team' ? (
          <TeamSidebarIdentity onNavigate={closeOnMobile} />
        ) : (
          <div className="flex min-w-0 items-center gap-2.5">
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${header.accent}`}>{header.icon}</span>
            <div className="min-w-0 leading-tight">
              <p className="truncate font-display text-sm font-bold text-primary">{header.title}</p>
              {header.sub && <p className="truncate text-xs text-tertiary">{header.sub}</p>}
            </div>
          </div>
        )}
        <button onClick={onClose} className="p-1 text-tertiary hover:text-primary lg:hidden" aria-label="Close"><X size={20} /></button>
      </div>

      <nav className="scroll-contain flex-1 space-y-4 overflow-y-auto p-3">
        {groups.map((group) => (
          <div key={group.section} className="space-y-1">
            {SECTION_KEY[group.section] && <p className="px-3 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-tertiary">{t(SECTION_KEY[group.section])}</p>}
            {group.items.map((link) => (
              <NavLink key={link.to} to={link.to} end onClick={closeOnMobile} className={navItemClass}>
                {link.icon}
                <span className="flex-1 truncate">{labelFor(link.to, link.key)}</span>
                {link.readOnly && <Lock size={12} className="shrink-0 opacity-40" aria-label={t('portal.read_only')} />}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {footer}
    </>
  );

  return (
    <>
      {/* STICKY, AND ITS OWN SCROLLER. Inside `flex min-h-screen` the rail grew to
          the height of the CONTENT, so on a long list (the players table runs to
          20,000px) the navigation scrolled off the top and an operator had to
          scroll back up to reach another section. Pinned to the viewport with
          `h-screen`, the nav below scrolls inside itself instead. */}
      <aside className="sticky top-0 hidden h-screen w-64 flex-shrink-0 flex-col border-r border-hairline bg-surface lg:flex">
        {content}
      </aside>

      {isOpen && (
        <div className="fixed inset-0 z-[110] lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <aside className="absolute bottom-0 left-0 top-0 flex w-72 flex-col bg-surface shadow-nav animate-in slide-in-from-left duration-300">
            {content}
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
