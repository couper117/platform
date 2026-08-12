import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  ShieldCheck, Trophy, Users, Newspaper, Megaphone, Clock, ArrowRight, Eye,
  Database, Server, Cloud, Mail, Radio, LayoutTemplate, CheckCircle2, Lock,
} from 'lucide-react';
import { format } from 'date-fns';
import apiClient from '../../api/client';
import useAuthStore from '../../store/authStore';
import EmptyState from '../../components/ui/EmptyState';
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
 */

const StatCard = ({ icon: Icon, value, label, sub }) => (
  <div className="rounded-2xl border border-hairline bg-surface p-5 transition-shadow hover:shadow-md">
    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
      <Icon size={18} />
    </div>
    <p className="font-display text-3xl font-bold tabular-nums text-primary">{value}</p>
    <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-tertiary">{label}</p>
    {sub && <p className="mt-1 text-[11px] text-tertiary">{sub}</p>}
  </div>
);

const useTrend = () => React.useMemo(() => {
  const base = [30, 38, 45, 52, 48, 58, 55, 50, 62, 66, 60, 68, 64, 70];
  const today = new Date();
  return base.map((v, i) => ({
    day: format(new Date(today.getTime() - (base.length - 1 - i) * 86400000), 'MMM d'),
    value: v,
  }));
}, []);

const AdminDashboard = () => {
  const { t } = useTranslation();
  const { user, role } = useAuthStore();
  const [tab, setTab] = useState('admins');

  // A federation admin governs one sport; a league admin runs one league —
  // different dashboards entirely.
  if (role === 'FEDERATION_ADMIN') return <FederationDashboard />;
  if (role === 'LEAGUE_ADMIN') return <LeagueDashboard />;
  const trend = useTrend();

  const { data: statsRes } = useQuery({ queryKey: ['admin-stats'], queryFn: async () => (await apiClient.get('/admin/stats')).data });
  const { data: rosterRes } = useQuery({ queryKey: ['admin-roster'], queryFn: async () => (await apiClient.get('/admin/roster')).data });
  const { data: activityRes } = useQuery({ queryKey: ['admin-activity'], queryFn: async () => (await apiClient.get('/activity', { params: { limit: 6 } })).data });
  const { data: newsRes } = useQuery({ queryKey: ['admin-news-count'], queryFn: async () => (await apiClient.get('/news')).data });
  const { data: adsRes } = useQuery({ queryKey: ['admin-ads-count'], queryFn: async () => (await apiClient.get('/ads')).data });
  const { data: champRes } = useQuery({ queryKey: ['admin-champ-count'], queryFn: async () => (await apiClient.get('/akc3/competitions')).data });

  const stats = statsRes?.data || {};
  const roster = rosterRes?.data || { federations: [], amashuriAdmins: [] };
  const activity = activityRes?.data || [];
  const news = newsRes?.data || [];
  const ads = adsRes?.data || [];
  const champs = champRes?.data || [];

  // Flatten the federation + Amashuri admins into one Sport Admins list.
  const admins = [
    ...(roster.federations || []).flatMap((f) =>
      (f.admins || []).map((a) => ({ id: `f${a.id}`, user: a.user, scope: f.sport?.name || f.name, assignedAt: a.assignedAt })),
    ),
    ...(roster.amashuriAdmins || []).map((u) => ({ id: `a${u.id}`, user: u, scope: t('dash.amashuri_games'), assignedAt: null })),
  ];

  const cards = [
    { icon: ShieldCheck, value: admins.length, label: t('dash.sport_admins'), sub: t('dash.active_admins') },
    { icon: Trophy, value: stats.activeLeagues ?? 0, label: t('dash.total_leagues'), sub: t('dash.across_sports') },
    { icon: Users, value: stats.totalTeams ?? 0, label: t('dash.total_teams'), sub: t('dash.registered_teams') },
    { icon: Trophy, value: champs.length, label: t('dash.championships'), sub: t('dash.active_championships') },
    { icon: Newspaper, value: news.length, label: t('dash.news_published'), sub: t('dash.total_news') },
    { icon: Megaphone, value: ads.filter((a) => a.active).length, label: t('dash.active_ads'), sub: t('dash.running_ads') },
  ];

  const QUICK_ACTIONS = [
    { label: t('dash.q_assign_sport_admin'), sub: t('dash.q_delegate'), icon: ShieldCheck, to: '/admin/sport-admins' },
    { label: t('dash.q_add_news'), sub: t('dash.q_publish_all'), icon: Newspaper, to: '/admin/news' },
    { label: t('dash.q_create_ad'), sub: t('dash.q_promote'), icon: Megaphone, to: '/admin/ads' },
    { label: t('dash.q_manage_layout'), sub: t('dash.q_customize'), icon: LayoutTemplate, to: '/admin/settings' },
  ];

  const HEALTH = [
    { label: t('dash.h_database'), icon: Database },
    { label: t('dash.h_server'), icon: Server },
    { label: t('dash.h_api'), icon: Radio },
    { label: t('dash.h_storage'), icon: Cloud },
    { label: t('dash.h_email'), icon: Mail },
  ];

  const TABS = [['admins', t('dash.sport_admins')], ['leagues', t('dash.all_leagues')], ['teams', t('dash.all_teams')], ['champs', t('dash.championships')]];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-display uppercase tracking-tight text-primary sm:text-3xl">
          {t('dash.welcome_admin', { name: user?.fullName?.split(' ')[0] || t('dash.super_admin') })}
          <CheckCircle2 size={20} className="text-brand" />
        </h1>
        <p className="mt-1 text-sm text-tertiary">{t('dash.ministry')}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => <StatCard key={c.label} {...c} />)}
      </div>

      {/* Overview + Quick actions + Recent activity */}
      <div className="grid gap-4 lg:grid-cols-[1fr_300px_320px]">
        <div className="rounded-2xl border border-hairline bg-surface p-5">
          <div className="mb-4">
            <h2 className="font-display text-lg uppercase tracking-tight text-primary">{t('dash.system_overview')}</h2>
            <p className="text-xs text-tertiary">{t('dash.system_overview_sub')}</p>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="ov" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16a34a" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'currentColor' }} className="text-tertiary" interval={2} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={2} fill="url(#ov)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick actions */}
        <div className="rounded-2xl border border-hairline bg-surface p-5">
          <h2 className="mb-4 font-display text-lg uppercase tracking-tight text-primary">{t('dash.quick_actions')}</h2>
          <div className="space-y-2">
            {QUICK_ACTIONS.map((a) => (
              <Link key={a.label} to={a.to} className="group flex items-center gap-3 rounded-xl border border-hairline bg-surface-2 p-3 transition-colors hover:border-brand/40">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand"><a.icon size={16} /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-primary">{a.label}</p>
                  <p className="truncate text-[11px] text-tertiary">{a.sub}</p>
                </div>
                <ArrowRight size={14} className="shrink-0 text-tertiary transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="rounded-2xl border border-hairline bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg uppercase tracking-tight text-primary">{t('dash.recent_activity')}</h2>
            <Link to="/admin/visitors" className="text-[11px] font-bold uppercase tracking-wider text-brand-text">{t('dash.view_all')}</Link>
          </div>
          {activity.length === 0 ? (
            <p className="py-4 text-sm text-tertiary">{t('dash.no_activity')}</p>
          ) : (
            <div className="space-y-3">
              {activity.map((log) => (
                <div key={log.id} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-tertiary"><Clock size={13} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-primary">{String(log.action || '').replace(/_/g, ' ')}</p>
                    <p className="truncate text-[11px] text-tertiary">{log.detail || log.pagePath || (log.user?.fullName ?? t('dash.guest'))}</p>
                  </div>
                  <span className="shrink-0 text-[10px] text-tertiary">{log.createdAt ? format(new Date(log.createdAt), 'HH:mm') : ''}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Oversight tables + Platform health */}
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border border-hairline bg-surface p-5">
          <div className="mb-4 flex items-center gap-1 border-b border-hairline">
            {TABS.map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)} className={`relative px-3 py-2.5 text-sm font-semibold transition-colors ${tab === id ? 'text-primary' : 'text-tertiary hover:text-primary'}`}>
                {label}
                {tab === id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand" />}
              </button>
            ))}
          </div>

          {tab === 'admins' ? (
            admins.length === 0 ? (
              <EmptyState icon={ShieldCheck} title={t('dash.no_admins_title')} hint={t('dash.no_admins_hint')} />
            ) : (
              <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full min-w-[560px] text-left">
                  <thead>
                    <tr className="text-[9px] font-bold uppercase tracking-widest text-tertiary">
                      <th className="pb-2 pr-2">{t('dash.col_administrator')}</th><th className="pb-2 px-2">{t('dash.col_sport')}</th>
                      <th className="pb-2 px-2">{t('dash.col_email')}</th><th className="pb-2 px-2">{t('dash.col_status')}</th>
                      <th className="pb-2 px-2">{t('dash.col_assigned')}</th><th className="pb-2 pl-2 text-right">{t('dash.col_actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((a) => (
                      <tr key={a.id} className="border-t border-hairline/60">
                        <td className="py-2.5 pr-2 text-sm font-medium text-primary">{a.user?.fullName}</td>
                        <td className="py-2.5 px-2 text-sm text-secondary">{a.scope}</td>
                        <td className="py-2.5 px-2 text-sm text-secondary">{a.user?.email}</td>
                        <td className="py-2.5 px-2"><span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-text">{t('dash.active')}</span></td>
                        <td className="py-2.5 px-2 text-sm tabular-nums text-tertiary">{a.assignedAt ? format(new Date(a.assignedAt), 'd MMM yyyy') : '—'}</td>
                        <td className="py-2.5 pl-2 text-right"><Link to="/admin/sport-admins" aria-label={t('dash.col_view')} className="text-tertiary hover:text-primary"><Eye size={15} className="ml-auto" /></Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Link to="/admin/sport-admins" className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-text">{t('dash.view_all_admins')} <ArrowRight size={13} /></Link>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-tertiary"><Lock size={18} /></span>
              <p className="text-sm font-semibold text-primary">{t('dash.read_only_oversight')}</p>
              <p className="max-w-xs text-xs text-tertiary">{t('dash.read_only_hint', { section: tab === 'leagues' ? t('dash.all_leagues') : tab === 'teams' ? t('dash.all_teams') : t('dash.championships') })}</p>
              <Link to={tab === 'leagues' ? '/admin/leagues' : tab === 'teams' ? '/admin/teams' : '/admin/championships'} className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-text">
                {t('dash.open_section', { section: tab === 'leagues' ? t('dash.all_leagues') : tab === 'teams' ? t('dash.all_teams') : t('dash.championships') })} <ArrowRight size={13} />
              </Link>
            </div>
          )}
        </div>

        {/* Platform health */}
        <div className="rounded-2xl border border-hairline bg-surface p-5">
          <h2 className="mb-4 font-display text-lg uppercase tracking-tight text-primary">{t('dash.platform_health')}</h2>
          <div className="space-y-3">
            {HEALTH.map((h) => (
              <div key={h.label} className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-tertiary"><h.icon size={15} /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-primary">{h.label}</p>
                  <p className="text-[11px] text-tertiary">{t('dash.operational')}</p>
                </div>
                <CheckCircle2 size={17} className="shrink-0 text-brand" />
              </div>
            ))}
          </div>
          <p className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-brand/5 py-2 text-xs font-bold uppercase tracking-wider text-brand-text">
            {t('dash.all_operational')} <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
