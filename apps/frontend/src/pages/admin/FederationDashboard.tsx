import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { format } from 'date-fns';
import {
  Trophy, ShieldCheck, Users, UserSquare2, Medal, CalendarDays, Clock, Eye, Lock,
  PlusCircle, UserPlus, Newspaper, LayoutTemplate, ChevronDown, ArrowRight,
} from 'lucide-react';
import { getLeagues } from '../../api/endpoints/leagues';
import { getFixtures } from '../../api/endpoints/fixtures';
import apiClient from '../../api/client';
import useAuthStore from '../../store/authStore';
import useSportScope from '../../hooks/useSportScope';
import { PageHeader, StatCard, Panel, TableWrap, Th, Td } from '../../components/admin/AdminUI';
import { Badge, Button, EmptyState, IconButton, StatusPill } from '../../components/ui';

/**
 * FEDERATION DASHBOARD — a national federation managing ONE sport.
 *
 * Scoped to the authenticated admin's sport via useSportScope (never the client):
 * a football admin governs football, a cycling admin cycling. The federation runs
 * leagues/admins/teams/players/news for its sport, but FIXTURES ARE READ-ONLY —
 * managed by League Admins. The quick actions omit fixture creation, and the
 * boundary is also enforced by the backend authorize().
 *
 * This is the Super Admin dashboard's screen wearing a federation's scope — a
 * FEDERATION_ADMIN lands here INSTEAD of AdminDashboard — so it is built from the
 * same kit (PageHeader, StatCard, Panel, TableWrap) in the same rhythm. Nothing
 * here invents a card, a heading style or a table shell of its own.
 */

const PIE = ['#16a34a', '#7c3aed', '#f5b301', '#2563eb', '#0d9488', '#dc2626'];


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

  /**
   * REAL REGISTRATIONS. This panel drew `[14, 34, 40, 45, 48, 55]` against six
   * hard-coded month names that had stopped matching the calendar — a federation
   * admin was being shown a growth curve for their sport that no team in the
   * database had contributed to. It counts what /teams actually returns, bucketed
   * by the month each team was registered, which is exactly what the panel's own
   * subtitle has always claimed it was.
   */
  const growth = React.useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const from = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const to = new Date(from.getFullYear(), from.getMonth() + 1, 1);
      return {
        m: format(from, 'MMM'),
        v: teams.filter((tm) => {
          if (!tm.createdAt) return false;
          const at = new Date(tm.createdAt);
          return at >= from && at < to;
        }).length,
      };
    });
  }, [teams]);
  const hasGrowth = growth.some((g) => g.v > 0);

  const cards = [
    { icon: Trophy, value: leagues.length, label: t('dash.total_leagues'), hint: t('dash.active_leagues'), tone: 'brand' as const },
    { icon: ShieldCheck, value: leagues.length, label: t('dash.league_admins'), hint: t('dash.active_admins') },
    { icon: Users, value: teams.length, label: t('dash.total_teams'), hint: t('dash.registered_teams') },
    { icon: UserSquare2, value: players, label: t('dash.registered_players'), hint: t('dash.across_leagues') },
    { icon: Medal, value: champs.length, label: t('dash.championships'), hint: t('dash.active_competitions') },
    { icon: CalendarDays, value: upcoming.length, label: t('dash.upcoming_fixtures'), hint: t('dash.read_only') },
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
    <div>
      <PageHeader
        title={t('dash.welcome_admin', { name: abbr })}
        subtitle={sportName}
        actions={
          <Button variant="secondary" size="sm" icon={CalendarDays}>
            {t('dash.season', { season })}
            <ChevronDown size={14} className="text-tertiary" aria-hidden="true" />
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => <StatCard key={String(c.label)} {...c} />)}
      </div>

      {/* Growth + distribution + activity */}
      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <Panel title={t('dash.league_growth')} hint={t('dash.league_growth_sub')}>
          {/* A flat line along zero is not a chart, it is a page that looks broken.
              Six quiet months say so in words instead. */}
          {!hasGrowth ? (
            <EmptyState icon={Users} title={t('dash.registered_teams')} hint={t('dash.league_growth_sub')} />
          ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growth} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16a34a" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgb(var(--hairline))" />
                <XAxis
                  dataKey="m" tick={{ fontSize: 11, fill: 'currentColor' }} className="text-tertiary"
                  interval="preserveStartEnd" minTickGap={24} axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'currentColor' }} className="text-tertiary"
                  width={40} allowDecimals={false} axisLine={false} tickLine={false}
                />
                <Tooltip
                  cursor={{ stroke: 'rgb(var(--hairline))' }}
                  contentStyle={{
                    borderRadius: 10, fontSize: 12, padding: '6px 10px',
                    background: 'rgb(var(--surface))', border: '1px solid rgb(var(--hairline))',
                    color: 'rgb(var(--text))',
                  }}
                  labelStyle={{ color: 'rgb(var(--text-3))' }}
                />
                <Area type="monotone" dataKey="v" stroke="#16a34a" strokeWidth={2} fill="url(#fg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          )}
        </Panel>

        <Panel title={t('dash.team_distribution')}>
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
                <span className="font-display text-xl font-bold tabular-nums text-primary">{teams.length}</span>
                <span className="text-xs text-tertiary">{t('dash.teams')}</span>
              </div>
            </div>
            <ul className="min-w-0 flex-1 space-y-1.5">
              {dist.slice(0, 5).map((d, i) => (
                <li key={d.name} className="flex items-center gap-2 text-xs">
                  <span className="h-2 w-2 shrink-0 rounded-pill" style={{ background: PIE[i % PIE.length] }} />
                  <span className="min-w-0 flex-1 truncate text-secondary">{d.name}</span>
                  <span className="shrink-0 font-semibold tabular-nums text-primary">{d.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>

        <Panel title={t('dash.recent_activity')} action={t('dash.view_all')} actionTo="/admin/visitors">
          <ul className="space-y-3">
            {activity.slice(0, 5).map((log) => (
              <li key={log.id} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-control bg-surface-2 text-tertiary">
                  <Clock size={13} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium capitalize text-primary">
                    {String(log.action || '').replace(/_/g, ' ').toLowerCase()}
                  </p>
                  <p className="truncate text-xs text-tertiary">{log.detail || log.pagePath}</p>
                </div>
                <span className="shrink-0 text-xs tabular-nums text-tertiary">
                  {log.createdAt ? format(new Date(log.createdAt), 'HH:mm') : ''}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* Recent leagues + upcoming fixtures */}
      <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
        <Panel title={t('dash.recent_leagues')} action={t('dash.view_all')} actionTo="/admin/leagues" flush>
          <TableWrap>
            <table className="w-full min-w-[520px] text-left">
              <thead>
                <tr>
                  <Th>{t('dash.col_league')}</Th>
                  <Th>{t('dash.col_season')}</Th>
                  <Th align="right">{t('dash.teams')}</Th>
                  <Th>{t('dash.col_status')}</Th>
                  <Th align="right">{t('dash.col_view')}</Th>
                </tr>
              </thead>
              <tbody>
                {leagues.map((l) => (
                  <tr key={l.id} className="transition-colors duration-150 ease-standard hover:bg-surface-2">
                    <Td className="font-medium text-primary">{l.name}</Td>
                    <Td className="tabular-nums">{l.season}</Td>
                    <Td align="right">{l._count?.teams ?? 0}</Td>
                    <Td><StatusPill status={l.status} /></Td>
                    <Td align="right">
                      <IconButton
                        icon={Eye}
                        size="sm"
                        label={t('dash.col_view')}
                        to={`/leagues/${l.id}`}
                        className="ml-auto"
                      />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Panel>

        <Panel
          title={
            <span className="flex flex-wrap items-center gap-2">
              {t('dash.upcoming_fixtures')}
              <Badge className="gap-1 font-medium text-tertiary">
                <Lock size={10} aria-hidden="true" /> {t('dash.read_only')}
              </Badge>
            </span>
          }
          action={t('dash.view_all')}
          actionTo="/admin/fixtures"
        >
          {upcoming.length === 0 ? (
            <p className="py-4 text-sm text-tertiary">{t('dash.no_upcoming')}</p>
          ) : (
            <div className="space-y-2">
              {upcoming.slice(0, 4).map((f) => (
                <Link
                  key={f.id}
                  to={`/matches/${f.id}`}
                  className="flex min-h-tap items-center gap-3 rounded-control border border-hairline bg-surface-2 p-3 transition-colors duration-150 ease-standard hover:border-brand/40 hover:bg-surface"
                >
                  <div className="w-16 shrink-0 text-xs tabular-nums text-tertiary">
                    {f.matchDate ? format(new Date(f.matchDate), 'd MMM') : t('common.tbd')}
                    <br />
                    <span className="text-tertiary">{f.matchDate ? format(new Date(f.matchDate), 'HH:mm') : ''}</span>
                  </div>
                  <div className="min-w-0 flex-1 text-center text-sm">
                    <span className="truncate font-medium text-primary">{f.homeTeam?.name}</span>
                    <span className="mx-2 text-tertiary">{t('dash.vs')}</span>
                    <span className="truncate font-medium text-primary">{f.awayTeam?.name}</span>
                    <p className="truncate text-xs text-tertiary">{f.league?.name}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <p className="mt-3 flex items-center justify-center gap-1.5 rounded-control bg-surface-2 py-2 text-xs text-tertiary">
            <Lock size={11} aria-hidden="true" /> {t('dash.read_only_view')}
          </p>
        </Panel>
      </div>

      {/* Quick actions (no fixture creation) */}
      <div className="mt-4">
        <Panel title={t('dash.quick_actions')}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {QUICK.map((a) => (
              <Link
                key={a.label}
                to={a.to}
                className="group flex min-h-tap flex-col justify-center rounded-control border border-hairline bg-surface-2 p-3 transition-colors duration-150 ease-standard hover:border-brand/40 hover:bg-surface"
              >
                <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-control bg-brand-tint text-brand-text">
                  <a.icon size={15} aria-hidden="true" />
                </span>
                <p className="text-sm font-medium text-primary">{a.label}</p>
                <p className="flex items-center gap-1 text-xs text-tertiary">
                  {a.sub}
                  <ArrowRight size={12} className="shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </p>
              </Link>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
};

export default FederationDashboard;
