import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  ShieldCheck, Trophy, Users, Newspaper, Megaphone, Clock, ArrowRight, Eye,
  Database, Server, Cloud, Radio, LayoutTemplate, Activity as ActivityIcon,
  CheckCircle2, AlertCircle, Lock, Plus,
} from 'lucide-react';
import { format } from 'date-fns';
import apiClient from '../../api/client';
import useAuthStore from '../../store/authStore';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import { PageHeader, StatCard, Panel } from '../../components/admin/AdminUI';
import cn from '../../components/ui/cn';
import FederationDashboard from './FederationDashboard';
import LeagueDashboard from './LeagueDashboard';

/**
 * SUPER ADMIN DASHBOARD — Ministry of Sport, Rwanda.
 *
 * Governance + oversight, not operational management. The Super Admin sees
 * everything (leagues/teams/championships read-only) and manages platform-level
 * content + assigns Sport Admins. A FEDERATION_ADMIN / LEAGUE_ADMIN reaching this
 * route gets their own dashboard instead — delegated below. Fully translated;
 * every quick action that would create a league/team/championship is deliberately
 * absent (that belongs to Sport Admins, enforced by the backend authorize()).
 *
 * THIS IS THE TEMPLATE. Every other admin screen is being brought onto the same
 * vocabulary — PageHeader, StatCard, Panel from components/admin/AdminUI — so the
 * portal reads as one product. Nothing here invents a card, a heading style or a
 * table shell of its own; if a screen needs a new piece, it belongs in the kit.
 *
 * NOTHING ON THIS PAGE IS INVENTED. Two things used to be: the activity chart
 * drew a hard-coded array relabelled with today's dates, and the health panel
 * listed five services all permanently "Operational" — including an email service
 * the platform does not run. On a ministry's oversight screen a number that looks
 * measured and isn't is worse than no number at all, so both now come from the
 * API (/admin/activity-trend, /admin/system-health) and show what is really there.
 */

const SERVICE_ICON: Record<string, any> = {
  database: Database, api: Server, storage: Cloud, realtime: Radio,
};

const AdminDashboard = () => {
  const { t } = useTranslation();
  const { user, role } = useAuthStore();
  const [tab, setTab] = useState('admins');
  const [days, setDays] = useState(14);

  // A federation admin governs one sport; a league admin runs one league —
  // different dashboards entirely. The Rules of Hooks require every hook below
  // to run unconditionally, so the redirect happens *after* them and the
  // super-admin queries are gated with `enabled` instead of an early return
  // (so those roles never fire the requests).
  const isSuperAdmin = role !== 'FEDERATION_ADMIN' && role !== 'LEAGUE_ADMIN';

  const { data: statsRes, isPending: statsPending } = useQuery({ queryKey: ['admin-stats'], enabled: isSuperAdmin, queryFn: async () => (await apiClient.get('/admin/stats')).data });
  const { data: rosterRes } = useQuery({ queryKey: ['admin-roster'], enabled: isSuperAdmin, queryFn: async () => (await apiClient.get('/admin/roster')).data });
  // The AUDIT trail, not the traffic log: the visitor tracker writes a row per
  // request, so an unfiltered feed here read "page view · /api/v1/ads" six times
  // over — the portal reporting on its own network calls. Excluding that module
  // leaves what a ministry actually wants on an oversight screen: who assigned,
  // published or deleted what.
  const { data: activityRes } = useQuery({
    queryKey: ['admin-activity'],
    enabled: isSuperAdmin,
    queryFn: async () => (await apiClient.get('/activity', { params: { limit: 6, excludeModule: 'VISITOR_TRACKING' } })).data,
  });
  const { data: newsRes } = useQuery({ queryKey: ['admin-news-count'], enabled: isSuperAdmin, queryFn: async () => (await apiClient.get('/news')).data });
  const { data: adsRes } = useQuery({ queryKey: ['admin-ads-count'], enabled: isSuperAdmin, queryFn: async () => (await apiClient.get('/ads')).data });
  const { data: champRes } = useQuery({ queryKey: ['admin-champ-count'], enabled: isSuperAdmin, queryFn: async () => (await apiClient.get('/akc3/competitions')).data });
  const { data: trendRes } = useQuery({
    queryKey: ['admin-activity-trend', days],
    enabled: isSuperAdmin,
    queryFn: async () => (await apiClient.get('/admin/activity-trend', { params: { days } })).data,
  });
  // The health check does a real database round-trip, so it is polled rather than
  // read once — a dashboard left open on a wall should notice an outage.
  const { data: healthRes } = useQuery({
    queryKey: ['admin-system-health'],
    enabled: isSuperAdmin,
    refetchInterval: 30000,
    queryFn: async () => (await apiClient.get('/admin/system-health')).data,
  });

  const trend = useMemo(
    () => (trendRes?.data || []).map((d: any) => ({
      day: format(new Date(`${d.date}T00:00:00`), 'd MMM'),
      value: d.count,
    })),
    [trendRes]
  );

  if (role === 'FEDERATION_ADMIN') return <FederationDashboard />;
  if (role === 'LEAGUE_ADMIN') return <LeagueDashboard />;

  const stats = statsRes?.data || {};
  const roster = rosterRes?.data || { federations: [], amashuriAdmins: [] };
  const activity = activityRes?.data || [];
  const news = newsRes?.data || [];
  const ads = adsRes?.data || [];
  const champs = champRes?.data || [];
  const services = healthRes?.data?.services || [];
  const allOk = services.length > 0 && services.every((s: any) => s.ok);

  // Flatten the federation + Amashuri admins into one Sport Admins list.
  const admins = [
    ...(roster.federations || []).flatMap((f) =>
      (f.admins || []).map((a) => ({ id: `f${a.id}`, user: a.user, scope: f.sport?.name || f.name, assignedAt: a.assignedAt })),
    ),
    ...(roster.amashuriAdmins || []).map((u) => ({ id: `a${u.id}`, user: u, scope: t('dash.amashuri_games'), assignedAt: null })),
  ];

  // Every number is a question with a page for an answer, so every card links.
  const cards = [
    { icon: ShieldCheck, value: admins.length, label: t('dash.sport_admins'), hint: t('dash.active_admins'), to: '/admin/sport-admins', tone: 'brand' as const },
    { icon: Trophy, value: stats.activeLeagues ?? 0, label: t('dash.total_leagues'), hint: t('dash.across_sports'), to: '/admin/leagues' },
    { icon: Users, value: stats.totalTeams ?? 0, label: t('dash.total_teams'), hint: t('dash.registered_teams'), to: '/admin/teams' },
    { icon: Trophy, value: champs.length, label: t('dash.championships'), hint: t('dash.active_championships'), to: '/admin/championships' },
    { icon: Newspaper, value: news.length, label: t('dash.news_published'), hint: t('dash.total_news'), to: '/admin/news' },
    { icon: Megaphone, value: ads.filter((a) => a.active).length, label: t('dash.active_ads'), hint: t('dash.running_ads'), to: '/admin/ads' },
  ];

  const QUICK_ACTIONS = [
    { label: t('dash.q_assign_sport_admin'), sub: t('dash.q_delegate'), icon: ShieldCheck, to: '/admin/sport-admins' },
    { label: t('dash.q_add_news'), sub: t('dash.q_publish_all'), icon: Newspaper, to: '/admin/news' },
    { label: t('dash.q_create_ad'), sub: t('dash.q_promote'), icon: Megaphone, to: '/admin/ads' },
    { label: t('dash.q_manage_layout'), sub: t('dash.q_customize'), icon: LayoutTemplate, to: '/admin/settings' },
  ];

  const TABS: Array<[string, string, string]> = [
    ['admins', t('dash.sport_admins'), '/admin/sport-admins'],
    ['leagues', t('dash.all_leagues'), '/admin/leagues'],
    ['teams', t('dash.all_teams'), '/admin/teams'],
    ['champs', t('dash.championships'), '/admin/championships'],
  ];
  const activeTab = TABS.find(([id]) => id === tab)!;

  return (
    <div>
      <PageHeader
        title={t('dash.welcome_admin', { name: user?.fullName?.split(' ')[0] || t('dash.super_admin') })}
        subtitle={t('dash.ministry')}
        actions={
          <Button to="/admin/sport-admins" size="sm" icon={Plus}>
            {t('dash.q_assign_sport_admin')}
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {statsPending
          ? Array.from({ length: 6 }, (_, i) => <StatCard.Skeleton key={i} />)
          : cards.map((c) => <StatCard key={String(c.label)} {...c} />)}
      </div>

      {/* Activity + quick actions + what just happened */}
      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <Panel
          title={t('dash.system_overview')}
          hint={t('dash.days_range', { count: days })}
          className="xl:col-span-1"
        >
          {/* The range picker is the one control on this panel, so it sits with
              the chart rather than in the panel header where it would compete
              with the title. */}
          <div className="mb-3 flex gap-1">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                aria-pressed={days === d}
                className={cn(
                  'rounded-pill px-2.5 py-1 text-xs font-semibold transition-colors duration-150 ease-standard',
                  days === d ? 'bg-brand-tint text-brand-text' : 'text-tertiary hover:bg-surface-2 hover:text-primary'
                )}
              >
                {t('dash.days_short', { count: d })}
              </button>
            ))}
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="ov" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16a34a" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgb(var(--hairline))" />
                <XAxis
                  dataKey="day" tick={{ fontSize: 11, fill: 'currentColor' }} className="text-tertiary"
                  interval="preserveStartEnd" minTickGap={24} axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'currentColor' }} className="text-tertiary"
                  width={40} allowDecimals={false} axisLine={false} tickLine={false}
                  // A busy day runs to four figures; "1.2k" keeps the axis narrow
                  // enough that it does not eat the plot.
                  tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : String(v))}
                />
                <Tooltip
                  cursor={{ stroke: 'rgb(var(--hairline))' }}
                  contentStyle={{
                    borderRadius: 10, fontSize: 12, padding: '6px 10px',
                    background: 'rgb(var(--surface))', border: '1px solid rgb(var(--hairline))',
                    color: 'rgb(var(--text))',
                  }}
                  labelStyle={{ color: 'rgb(var(--text-3))' }}
                  formatter={(v: any) => [v, t('dash.events')]}
                />
                <Area type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={2} fill="url(#ov)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title={t('dash.quick_actions')}>
          <div className="space-y-2">
            {QUICK_ACTIONS.map((a) => (
              <Link
                key={a.label}
                to={a.to}
                className="group flex min-h-tap items-center gap-3 rounded-control border border-hairline bg-surface-2 p-2.5 transition-colors duration-150 ease-standard hover:border-brand/40 hover:bg-surface"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-brand-tint text-brand-text">
                  <a.icon size={15} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-primary">{a.label}</p>
                  <p className="truncate text-xs text-tertiary">{a.sub}</p>
                </div>
                <ArrowRight size={14} className="shrink-0 text-tertiary transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </Panel>

        <Panel title={t('dash.recent_activity')} action={t('dash.view_all')} actionTo="/admin/visitors">
          {activity.length === 0 ? (
            <p className="py-4 text-sm text-tertiary">{t('dash.no_activity')}</p>
          ) : (
            <ul className="space-y-3">
              {activity.map((log) => (
                <li key={log.id} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-control bg-surface-2 text-tertiary">
                    <Clock size={13} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium capitalize text-primary">
                      {String(log.action || '').replace(/_/g, ' ').toLowerCase()}
                    </p>
                    <p className="truncate text-xs text-tertiary">
                      {log.user?.fullName || t('dash.guest')}
                      {log.detail ? ` — ${log.detail}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-tertiary">
                    {log.createdAt ? format(new Date(log.createdAt), 'HH:mm') : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Oversight + health */}
      <div className="mt-4 grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Panel flush>
          <div className="flex gap-1 overflow-x-auto border-b border-hairline px-2 scroll-contain">
            {TABS.map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                aria-selected={tab === id}
                className={cn(
                  'relative whitespace-nowrap px-3 py-3 text-sm transition-colors duration-150 ease-standard',
                  tab === id ? 'font-semibold text-primary' : 'text-tertiary hover:text-primary'
                )}
              >
                {label}
                {tab === id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand" />}
              </button>
            ))}
          </div>

          {tab === 'admins' ? (
            admins.length === 0 ? (
              <div className="p-4">
                <EmptyState icon={ShieldCheck} title={t('dash.no_admins_title')} hint={t('dash.no_admins_hint')} />
              </div>
            ) : (
              <>
                <div className="scroll-contain w-full overflow-x-auto">
                  <table className="w-full min-w-[600px] text-left">
                    <thead>
                      <tr>
                        {[t('dash.col_administrator'), t('dash.col_sport'), t('dash.col_email'), t('dash.col_status'), t('dash.col_assigned')].map((h) => (
                          <th key={h} scope="col" className="whitespace-nowrap border-b border-hairline px-4 py-2.5 text-xs font-semibold text-tertiary">{h}</th>
                        ))}
                        <th scope="col" className="whitespace-nowrap border-b border-hairline px-4 py-2.5 text-right text-xs font-semibold text-tertiary">{t('dash.col_actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admins.map((a) => (
                        <tr key={a.id} className="transition-colors duration-150 ease-standard hover:bg-surface-2">
                          <td className="border-b border-hairline px-4 py-3 text-sm font-medium text-primary">{a.user?.fullName}</td>
                          <td className="border-b border-hairline px-4 py-3 text-sm text-secondary">{a.scope}</td>
                          <td className="border-b border-hairline px-4 py-3 text-sm text-secondary">{a.user?.email}</td>
                          <td className="border-b border-hairline px-4 py-3">
                            <span className="rounded-pill bg-brand-tint px-2 py-0.5 text-xs font-semibold text-brand-text">{t('dash.active')}</span>
                          </td>
                          <td className="border-b border-hairline px-4 py-3 text-sm tabular-nums text-secondary">
                            {a.assignedAt ? format(new Date(a.assignedAt), 'd MMM yyyy') : '—'}
                          </td>
                          <td className="border-b border-hairline px-4 py-3 text-right">
                            <Link to="/admin/sport-admins" aria-label={t('dash.col_view')} className="inline-flex text-tertiary transition-colors hover:text-brand-text">
                              <Eye size={16} aria-hidden="true" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3">
                  <Link to="/admin/sport-admins" className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary transition-colors hover:text-brand-text">
                    {t('dash.view_all_admins')} <ArrowRight size={13} aria-hidden="true" />
                  </Link>
                </div>
              </>
            )
          ) : (
            /* The Super Admin can SEE leagues, teams and championships but not run
               them — the backend's authorize() says so, and a table full of
               controls that all 403 would be a lie. The panel says why and hands
               over to the read-only section. */
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-tertiary"><Lock size={18} aria-hidden="true" /></span>
              <p className="text-sm font-semibold text-primary">{t('dash.read_only_oversight')}</p>
              <p className="max-w-xs text-sm text-tertiary">{t('dash.read_only_hint', { section: activeTab[1] })}</p>
              <Link to={activeTab[2]} className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-secondary transition-colors hover:text-brand-text">
                {t('dash.open_section', { section: activeTab[1] })} <ArrowRight size={13} aria-hidden="true" />
              </Link>
            </div>
          )}
        </Panel>

        <Panel title={t('dash.platform_health')} action={t('dash.view_all')} actionTo="/admin/system-health">
          {services.length === 0 ? (
            <p className="py-4 text-sm text-tertiary">{t('dash.no_activity')}</p>
          ) : (
            <>
              <ul className="space-y-3">
                {services.map((s: any) => {
                  const Icon = SERVICE_ICON[s.key] || ActivityIcon;
                  return (
                    <li key={s.key} className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-surface-2 text-tertiary">
                        <Icon size={15} aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-primary">{String(t(`admin.health.svc_${s.key}`, s.key))}</p>
                        {/* The real detail — "3 ms", "SSE active" — instead of the
                            word "Operational" repeated five times. */}
                        <p className="truncate text-xs tabular-nums text-tertiary">{s.detail}</p>
                      </div>
                      {s.ok
                        ? <CheckCircle2 size={16} className="shrink-0 text-brand" aria-hidden="true" />
                        : <AlertCircle size={16} className="shrink-0 text-danger-text" aria-hidden="true" />}
                    </li>
                  );
                })}
              </ul>
              <p className={cn(
                'mt-4 flex items-center justify-center gap-1.5 rounded-control py-2 text-xs font-semibold',
                allOk ? 'bg-brand-tint text-brand-text' : 'bg-danger/10 text-danger-text'
              )}>
                {allOk ? t('admin.health.all_operational') : t('admin.health.degraded')}
              </p>
            </>
          )}
        </Panel>
      </div>
    </div>
  );
};

export default AdminDashboard;
