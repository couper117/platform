import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import {
  Trophy, ShieldCheck, Users, UserSquare2, Medal, CalendarDays, Clock, Eye, Lock,
  PlusCircle, UserPlus, Newspaper, LayoutTemplate, ChevronDown,
} from 'lucide-react';
import { getLeagues } from '../../api/endpoints/leagues';
import { getFixtures } from '../../api/endpoints/fixtures';
import apiClient from '../../api/client';
import useAuthStore from '../../store/authStore';
import useSportScope from '../../hooks/useSportScope';

/**
 * FEDERATION DASHBOARD — a national federation managing ONE sport.
 *
 * Scoped to the authenticated admin's sport via useSportScope (never the client):
 * a football admin governs football, a cycling admin cycling. The federation runs
 * leagues/admins/teams/players/news for its sport, but FIXTURES ARE READ-ONLY —
 * managed by League Admins. The quick actions omit fixture creation, and the
 * boundary is also enforced by the backend authorize().
 */

const PIE = ['#16a34a', '#7c3aed', '#f5b301', '#2563eb', '#0d9488', '#dc2626'];

const StatCard = ({ icon: Icon, value, label, sub }) => (
  <div className="rounded-2xl border border-hairline bg-surface p-4 transition-shadow hover:shadow-md">
    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand"><Icon size={17} /></div>
    <p className="font-display text-2xl font-bold tabular-nums text-primary">{value}</p>
    <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-tertiary">{label}</p>
    {sub && <p className="mt-0.5 text-[11px] text-tertiary">{sub}</p>}
  </div>
);

const GROWTH = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'].map((m, i) => ({ m, v: [14, 34, 40, 45, 48, 55][i] }));

const FederationDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const scope = useSportScope();
  // Football (sportId 1) is the fallback when an admin has no sport assigned yet.
  const sportId = scope.sportId ?? 1;
  const sportName = scope.sport?.name || t('dash.your_federation');
  const abbr = user?.fullName?.split(' ')[0] || t('dash.federation');
  const season = '2025/2026';

  const { data: leaguesRes } = useQuery({ queryKey: ['fed-leagues', sportId], queryFn: () => getLeagues({ sportId }) });
  const { data: teamsRes } = useQuery({ queryKey: ['fed-teams', sportId], queryFn: async () => (await apiClient.get('/teams', { params: { sportId } })).data });
  const { data: fixturesRes } = useQuery({ queryKey: ['fed-fixtures', sportId], queryFn: () => getFixtures({ sportId }) });
  const { data: newsRes } = useQuery({ queryKey: ['fed-news'], queryFn: async () => (await apiClient.get('/news')).data });
  const { data: champRes } = useQuery({ queryKey: ['fed-champs'], queryFn: async () => (await apiClient.get('/akc3/competitions')).data });
  const { data: activityRes } = useQuery({ queryKey: ['fed-activity'], queryFn: async () => (await apiClient.get('/activity', { params: { limit: 6 } })).data });

  const leagues = leaguesRes?.data || [];
  const teams = teamsRes?.data || [];
  const fixtures = fixturesRes?.data || [];
  const news = newsRes?.data || [];
  const champs = champRes?.data || [];
  const activity = activityRes?.data || [];

  const players = teams.reduce((n, tm) => n + (tm._count?.players ?? 0), 0);
  const upcoming = fixtures.filter((f) => f.status === 'SCHEDULED');
  const dist = leagues.map((l) => ({ name: l.name, value: l._count?.teams ?? 0 }));

  const cards = [
    { icon: Trophy, value: leagues.length, label: t('dash.total_leagues'), sub: t('dash.active_leagues') },
    { icon: ShieldCheck, value: leagues.length, label: t('dash.league_admins'), sub: t('dash.active_admins') },
    { icon: Users, value: teams.length, label: t('dash.total_teams'), sub: t('dash.registered_teams') },
    { icon: UserSquare2, value: players, label: t('dash.registered_players'), sub: t('dash.across_leagues') },
    { icon: Medal, value: champs.length, label: t('dash.championships'), sub: t('dash.active_competitions') },
    { icon: CalendarDays, value: upcoming.length, label: t('dash.upcoming_fixtures'), sub: t('dash.read_only') },
  ];

  const QUICK = [
    { label: t('dash.q_create_league'), sub: t('dash.q_create_league_sub'), icon: PlusCircle, to: '/admin/leagues' },
    { label: t('dash.q_assign_league_admin'), sub: t('dash.q_delegate'), icon: ShieldCheck, to: '/admin/sport-admins' },
    { label: t('dash.q_register_team'), sub: t('dash.q_add_team'), icon: UserPlus, to: '/admin/teams' },
    { label: t('dash.q_register_player'), sub: t('dash.q_add_player'), icon: UserSquare2, to: '/admin/players' },
    { label: t('dash.q_create_news'), sub: t('dash.q_publish_news'), icon: Newspaper, to: '/admin/news' },
    { label: t('dash.q_manage_content'), sub: t('dash.q_update_content'), icon: LayoutTemplate, to: '/admin/settings' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl uppercase tracking-tight text-primary sm:text-3xl">{t('dash.welcome_admin', { name: abbr })} <span aria-hidden="true">👋</span></h1>
          <p className="mt-1 text-sm text-tertiary">{sportName}</p>
        </div>
        <button className="inline-flex w-fit items-center gap-2 rounded-xl border border-hairline bg-surface px-3 py-2 text-sm font-semibold text-secondary">
          <CalendarDays size={15} /> {t('dash.season', { season })} <ChevronDown size={14} className="opacity-50" />
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => <StatCard key={c.label} {...c} />)}
      </div>

      {/* Growth + distribution + activity */}
      <div className="grid gap-4 lg:grid-cols-[1fr_320px_320px]">
        <div className="rounded-2xl border border-hairline bg-surface p-5">
          <div className="mb-3"><h2 className="font-display text-lg uppercase tracking-tight text-primary">{t('dash.league_growth')}</h2><p className="text-xs text-tertiary">{t('dash.league_growth_sub')}</p></div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={GROWTH} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs><linearGradient id="fg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#16a34a" stopOpacity={0.35} /><stop offset="100%" stopColor="#16a34a" stopOpacity={0} /></linearGradient></defs>
                <XAxis dataKey="m" tick={{ fontSize: 11, fill: 'currentColor' }} className="text-tertiary" axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="v" stroke="#16a34a" strokeWidth={2} fill="url(#fg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-hairline bg-surface p-5">
          <h2 className="mb-2 font-display text-lg uppercase tracking-tight text-primary">{t('dash.team_distribution')}</h2>
          <div className="flex items-center gap-3">
            <div className="relative h-32 w-32 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dist} dataKey="value" innerRadius={40} outerRadius={60} paddingAngle={2} stroke="none">
                    {dist.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-xl font-bold text-primary">{teams.length}</span>
                <span className="text-[9px] uppercase tracking-wider text-tertiary">{t('dash.teams')}</span>
              </div>
            </div>
            <ul className="min-w-0 flex-1 space-y-1.5">
              {dist.slice(0, 5).map((d, i) => (
                <li key={d.name} className="flex items-center gap-2 text-xs">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: PIE[i % PIE.length] }} />
                  <span className="min-w-0 flex-1 truncate text-secondary">{d.name}</span>
                  <span className="shrink-0 font-bold tabular-nums text-primary">{d.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-hairline bg-surface p-5">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-display text-lg uppercase tracking-tight text-primary">{t('dash.recent_activity')}</h2><Link to="/admin/visitors" className="text-[11px] font-bold uppercase tracking-wider text-brand-text">{t('dash.view_all')}</Link></div>
          <div className="space-y-3">
            {activity.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-tertiary"><Clock size={13} /></span>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-primary">{String(log.action || '').replace(/_/g, ' ')}</p><p className="truncate text-[11px] text-tertiary">{log.detail || log.pagePath}</p></div>
                <span className="shrink-0 text-[10px] text-tertiary">{log.createdAt ? format(new Date(log.createdAt), 'HH:mm') : ''}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent leagues + upcoming fixtures */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-hairline bg-surface p-5">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-lg uppercase tracking-tight text-primary">{t('dash.recent_leagues')}</h2><Link to="/admin/leagues" className="text-[11px] font-bold uppercase tracking-wider text-brand-text">{t('dash.view_all')}</Link></div>
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full min-w-[440px] text-left">
              <thead><tr className="text-[9px] font-bold uppercase tracking-widest text-tertiary"><th className="pb-2 pr-2">{t('dash.col_league')}</th><th className="pb-2 px-2">{t('dash.col_season')}</th><th className="pb-2 px-2">{t('dash.teams')}</th><th className="pb-2 px-2">{t('dash.col_status')}</th><th className="pb-2 pl-2 text-right">{t('dash.col_view')}</th></tr></thead>
              <tbody>
                {leagues.map((l) => (
                  <tr key={l.id} className="border-t border-hairline/60">
                    <td className="py-2.5 pr-2 text-sm font-medium text-primary">{l.name}</td>
                    <td className="py-2.5 px-2 text-sm tabular-nums text-secondary">{l.season}</td>
                    <td className="py-2.5 px-2 text-sm tabular-nums text-secondary">{l._count?.teams ?? 0}</td>
                    <td className="py-2.5 px-2"><span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-text">{l.status}</span></td>
                    <td className="py-2.5 pl-2 text-right"><Link to={`/leagues/${l.id}`} aria-label={t('dash.col_view')}><Eye size={15} className="ml-auto text-tertiary hover:text-primary" /></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-hairline bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-lg uppercase tracking-tight text-primary">{t('dash.upcoming_fixtures')} <span className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-tertiary"><Lock size={10} /> {t('dash.read_only')}</span></h2>
            <Link to="/admin/fixtures" className="text-[11px] font-bold uppercase tracking-wider text-brand-text">{t('dash.view_all')}</Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="py-4 text-sm text-tertiary">{t('dash.no_upcoming')}</p>
          ) : (
            <div className="space-y-2">
              {upcoming.slice(0, 4).map((f) => (
                <Link key={f.id} to={`/matches/${f.id}`} className="flex items-center gap-3 rounded-xl border border-hairline bg-surface-2 p-3 hover:border-brand/40">
                  <div className="w-16 shrink-0 text-[11px] tabular-nums text-tertiary">{f.matchDate ? format(new Date(f.matchDate), 'd MMM') : 'TBD'}<br /><span className="opacity-70">{f.matchDate ? format(new Date(f.matchDate), 'HH:mm') : ''}</span></div>
                  <div className="min-w-0 flex-1 text-center text-sm">
                    <span className="truncate font-semibold text-primary">{f.homeTeam?.name}</span>
                    <span className="mx-2 text-tertiary">{t('dash.vs')}</span>
                    <span className="truncate font-semibold text-primary">{f.awayTeam?.name}</span>
                    <p className="truncate text-[10px] uppercase tracking-wider text-tertiary">{f.league?.name}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <p className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-surface-2 py-2 text-[11px] text-tertiary"><Lock size={11} /> {t('dash.read_only_view')}</p>
        </div>
      </div>

      {/* Quick actions (no fixture creation) */}
      <div>
        <h2 className="mb-3 font-display text-lg uppercase tracking-tight text-primary">{t('dash.quick_actions')}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {QUICK.map((a) => (
            <Link key={a.label} to={a.to} className="group rounded-2xl border border-hairline bg-surface p-4 transition-colors hover:border-brand/40">
              <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand"><a.icon size={16} /></span>
              <p className="text-sm font-semibold text-primary">{a.label}</p>
              <p className="text-[11px] text-tertiary">{a.sub}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FederationDashboard;
