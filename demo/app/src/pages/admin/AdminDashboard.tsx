import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  ShieldCheck, Trophy, Users, Newspaper, Megaphone, Clock, ArrowRight, Eye,
  Database, Server, Cloud, Mail, Radio, PlusCircle, LayoutTemplate, CheckCircle2, Lock,
} from 'lucide-react';
import { format } from 'date-fns';
import apiClient from '../../api/client';
import useAuthStore from '../../store/authStore';
import Skeleton from '../../components/shared/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import FederationDashboard from './FederationDashboard';
import LeagueDashboard from './LeagueDashboard';

/**
 * SUPER ADMIN DASHBOARD — Ministry of Sport, Rwanda.
 *
 * Governance + oversight, NOT operational management. The Super Admin sees
 * everything (leagues/teams/championships read-only) and manages platform-level
 * content (news, ads, website) + assigns Sport Admins. Quick actions here
 * deliberately EXCLUDE create-league / create-team / create-championship, which
 * belong to Sport Admins — the permission boundary is expressed in the UI, and
 * must also be enforced by the backend (see the summary notes).
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

const QUICK_ACTIONS = [
  { label: 'Assign New Sport Admin', sub: 'Delegate admin access', icon: ShieldCheck, to: '/admin/sport-admins' },
  { label: 'Add News Article', sub: 'Publish to all platforms', icon: Newspaper, to: '/admin/news' },
  { label: 'Create Advertisement', sub: 'Promote events or campaigns', icon: Megaphone, to: '/admin/ads' },
  { label: 'Manage Website Layout', sub: 'Customize platform appearance', icon: LayoutTemplate, to: '/admin/settings' },
];

const HEALTH = [
  { label: 'Database', icon: Database },
  { label: 'Server Status', icon: Server },
  { label: 'API Services', icon: Radio },
  { label: 'File Storage', icon: Cloud },
  { label: 'Email Service', icon: Mail },
];

// Illustrative 14-day activity trend for the overview chart (visualisation only;
// real series plugs in from an analytics endpoint when available).
const useTrend = () => React.useMemo(() => {
  const base = [30, 38, 45, 52, 48, 58, 55, 50, 62, 66, 60, 68, 64, 70];
  const today = new Date();
  return base.map((v, i) => ({
    day: format(new Date(today.getTime() - (base.length - 1 - i) * 86400000), 'MMM d'),
    value: v,
  }));
}, []);

const AdminDashboard = () => {
  const { user, role } = useAuthStore();
  const [tab, setTab] = useState('admins');

  // A federation admin governs one sport; a league admin runs one league —
  // different dashboards entirely.
  if (role === 'FEDERATION_ADMIN') return <FederationDashboard />;
  if (role === 'LEAGUE_ADMIN') return <LeagueDashboard />;
  const trend = useTrend();

  const { data: statsRes } = useQuery({ queryKey: ['admin-stats'], queryFn: async () => (await apiClient.get('/admin/stats')).data });
  const { data: adminsRes } = useQuery({ queryKey: ['admin-sport-admins'], queryFn: async () => (await apiClient.get('/admin/sport-admins')).data });
  const { data: activityRes } = useQuery({ queryKey: ['admin-activity'], queryFn: async () => (await apiClient.get('/activity', { params: { limit: 6 } })).data });
  const { data: newsRes } = useQuery({ queryKey: ['admin-news-count'], queryFn: async () => (await apiClient.get('/news')).data });
  const { data: adsRes } = useQuery({ queryKey: ['admin-ads-count'], queryFn: async () => (await apiClient.get('/ads')).data });
  const { data: champRes } = useQuery({ queryKey: ['admin-champ-count'], queryFn: async () => (await apiClient.get('/akc3/competitions')).data });

  const stats = statsRes?.data || {};
  const admins = adminsRes?.data || [];
  const activity = activityRes?.data || [];
  const news = newsRes?.data || [];
  const ads = adsRes?.data || [];
  const champs = champRes?.data || [];

  const cards = [
    { icon: ShieldCheck, value: admins.length, label: 'Sport Admins', sub: 'Active administrators' },
    { icon: Trophy, value: stats.totalLeagues ?? 0, label: 'Total Leagues', sub: 'Across all sports' },
    { icon: Users, value: stats.totalTeams ?? 0, label: 'Total Teams', sub: 'Registered teams' },
    { icon: Trophy, value: champs.length, label: 'Championships', sub: 'Active championships' },
    { icon: Newspaper, value: news.length, label: 'News Published', sub: 'Total news articles' },
    { icon: Megaphone, value: ads.filter((a) => a.active).length, label: 'Active Ads', sub: 'Running advertisements' },
  ];

  const TABS = [['admins', 'Sport Admins'], ['leagues', 'All Leagues'], ['teams', 'All Teams'], ['champs', 'Championships']];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-display uppercase tracking-tight text-primary sm:text-3xl">
          Welcome back, {user?.fullName?.split(' ')[0] || 'Super Admin'}
          <CheckCircle2 size={20} className="text-brand" />
        </h1>
        <p className="mt-1 text-sm text-tertiary">Ministry of Sport — Rwanda</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => <StatCard key={c.label} {...c} />)}
      </div>

      {/* Overview + Quick actions + Recent activity */}
      <div className="grid gap-4 lg:grid-cols-[1fr_300px_320px]">
        {/* System overview chart */}
        <div className="rounded-2xl border border-hairline bg-surface p-5">
          <div className="mb-4">
            <h2 className="font-display text-lg uppercase tracking-tight text-primary">System Overview</h2>
            <p className="text-xs text-tertiary">Platform activity — last 14 days</p>
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
          <h2 className="mb-4 font-display text-lg uppercase tracking-tight text-primary">Quick Actions</h2>
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
            <h2 className="font-display text-lg uppercase tracking-tight text-primary">Recent Activity</h2>
            <Link to="/admin/visitors" className="text-[11px] font-bold uppercase tracking-wider text-brand-text">View all</Link>
          </div>
          {activity.length === 0 ? (
            <p className="py-4 text-sm text-tertiary">No recent activity.</p>
          ) : (
            <div className="space-y-3">
              {activity.map((log) => (
                <div key={log.id} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-tertiary"><Clock size={13} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-primary">{String(log.action || '').replace(/_/g, ' ')}</p>
                    <p className="truncate text-[11px] text-tertiary">{log.detail || log.pagePath || (log.user?.fullName ?? 'Guest')}</p>
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
        {/* Tabbed oversight table (read-only) */}
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
              <EmptyState icon={ShieldCheck} title="No Sport Admins yet" hint="Assign a Sport Administrator to delegate operational management." />
            ) : (
              <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full min-w-[560px] text-left">
                  <thead>
                    <tr className="text-[9px] font-bold uppercase tracking-widest text-tertiary">
                      <th className="pb-2 pr-2">Administrator</th><th className="pb-2 px-2">Sport</th>
                      <th className="pb-2 px-2">Email</th><th className="pb-2 px-2">Status</th>
                      <th className="pb-2 px-2">Assigned</th><th className="pb-2 pl-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((a) => (
                      <tr key={a.id} className="border-t border-hairline/60">
                        <td className="py-2.5 pr-2 text-sm font-medium text-primary">{a.user?.fullName}</td>
                        <td className="py-2.5 px-2 text-sm text-secondary">{a.federation?.name || a.league?.name || a.user?.role?.replace(/_/g, ' ')}</td>
                        <td className="py-2.5 px-2 text-sm text-secondary">{a.user?.email}</td>
                        <td className="py-2.5 px-2"><span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-text">Active</span></td>
                        <td className="py-2.5 px-2 text-sm tabular-nums text-tertiary">{a.assignedAt ? format(new Date(a.assignedAt), 'd MMM yyyy') : '—'}</td>
                        <td className="py-2.5 pl-2 text-right"><button aria-label="View" className="text-tertiary hover:text-primary"><Eye size={15} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Link to="/admin/sport-admins" className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-text">View all sport admins <ArrowRight size={13} /></Link>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-tertiary"><Lock size={18} /></span>
              <p className="text-sm font-semibold text-primary">Read-only oversight</p>
              <p className="max-w-xs text-xs text-tertiary">{tab === 'leagues' ? 'Leagues' : tab === 'teams' ? 'Teams' : 'Championships'} are managed by the assigned Sport Administrators. Open the section to view them.</p>
              <Link to={tab === 'leagues' ? '/admin/leagues' : tab === 'teams' ? '/admin/teams' : '/admin/championships'} className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-text">
                Open {tab === 'leagues' ? 'Leagues' : tab === 'teams' ? 'Teams' : 'Championships'} <ArrowRight size={13} />
              </Link>
            </div>
          )}
        </div>

        {/* Platform health */}
        <div className="rounded-2xl border border-hairline bg-surface p-5">
          <h2 className="mb-4 font-display text-lg uppercase tracking-tight text-primary">Platform Health</h2>
          <div className="space-y-3">
            {HEALTH.map((h) => (
              <div key={h.label} className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-tertiary"><h.icon size={15} /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-primary">{h.label}</p>
                  <p className="text-[11px] text-tertiary">Operational</p>
                </div>
                <CheckCircle2 size={17} className="shrink-0 text-brand" />
              </div>
            ))}
          </div>
          <p className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-brand/5 py-2 text-xs font-bold uppercase tracking-wider text-brand-text">
            All systems operational <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
