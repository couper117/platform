import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Users, UserSquare2, FileText, Activity, ArrowUpRight, Clock, Settings } from 'lucide-react';
import { getLeagues } from '../../api/endpoints/leagues';
import apiClient from '../../api/client';
import useAuthStore from '../../store/authStore';
import Skeleton from '../../components/shared/Skeleton';
import EmptyState from '../../components/ui/EmptyState';

// Tailwind's JIT scanner needs literal class names in source — a template
// literal like `bg-${color}/5` never gets picked up and ships colorless.
const COLOR_STYLES = {
  red: { chip: 'bg-red/5 text-red group-hover:bg-red group-hover:text-white' },
  'rwanda-yellow': { chip: 'bg-rwanda-yellow/5 text-rwanda-yellow group-hover:bg-rwanda-yellow group-hover:text-white' },
  'rwanda-green': { chip: 'bg-rwanda-green/5 text-rwanda-green group-hover:bg-rwanda-green group-hover:text-white' },
};

const StatCard = ({ icon, label, value, trend, color = 'red' }) => (
  <div className="bg-white dark:bg-surface-dark2 p-6 rounded-3xl border border-surface-3 dark:border-white/5 space-y-4 hover:shadow-xl transition-all group">
    <div className="flex justify-between items-start">
      <div className={`p-3 rounded-2xl transition-all ${(COLOR_STYLES[color] || COLOR_STYLES.red).chip}`}>
        {icon}
      </div>
      {trend && (
        <div className="flex items-center space-x-1 text-green text-[10px] font-bold uppercase tracking-widest bg-green/5 px-2 py-1 rounded-full">
          <ArrowUpRight size={10} />
          <span>{trend}%</span>
        </div>
      )}
    </div>
    <div>
      <h3 className="text-4xl font-display uppercase tracking-tight">{value}</h3>
      <p className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-40">{label}</p>
    </div>
  </div>
);

const QUICK_ACTIONS = [
  { label: 'Create New League', icon: <Trophy size={16} />, to: '/admin/leagues' },
  { label: 'Verify Pending Teams', icon: <Users size={16} />, to: '/admin/teams' },
  { label: 'Input Match Results', icon: <Activity size={16} />, to: '/admin/fixtures' },
  { label: 'System Settings', icon: <Settings size={16} />, to: '/admin/settings' },
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { role } = useAuthStore();
  const canViewActivity = role === 'SUPERADMIN';

  const { data: leagues, isLoading: leaguesLoading } = useQuery({
    queryKey: ['admin-stats-leagues'],
    queryFn: () => getLeagues(),
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data } = await apiClient.get('/admin/stats');
      return data.data;
    },
  });

  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: ['admin-recent-activity'],
    queryFn: async () => {
      const { data } = await apiClient.get('/activity', { params: { limit: 4 } });
      return data.data;
    },
    enabled: canViewActivity,
  });

  const statsReady = !leaguesLoading && !statsLoading;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-display uppercase tracking-tighter">System <span className="text-red">Overview</span></h1>
          <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">Live platform performance and metrics</p>
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest opacity-30 italic">
          Last updated: Just now
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {!statsReady ? (
          <Skeleton type="stat" count={4} />
        ) : (
          <>
            <StatCard icon={<Trophy size={20} />} label="Active Leagues" value={stats?.activeLeagues ?? leagues?.count ?? 0} color="red" />
            <StatCard icon={<Users size={20} />} label="Total Teams" value={stats?.totalTeams ?? 0} color="rwanda-yellow" />
            <StatCard icon={<UserSquare2 size={20} />} label="Registered Athletes" value={(stats?.totalPlayers ?? 0).toLocaleString()} color="rwanda-green" />
            <StatCard icon={<FileText size={20} />} label="Pending Docs" value={stats?.pendingDocuments ?? 0} color="red" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Activity Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-surface-3 dark:border-white/5 pb-4">
            <h2 className="text-xl font-display uppercase tracking-tight">Recent Activity</h2>
            {canViewActivity && (
              <button onClick={() => navigate('/admin/visitors')} className="text-[10px] font-bold uppercase tracking-widest text-red hover:underline">View All Logs</button>
            )}
          </div>

          {!canViewActivity ? (
            <EmptyState icon={Clock} title="Superadmin only" hint="Activity logs are visible to superadmins. Ask a superadmin to check the visitor analytics page." />
          ) : activityLoading ? (
            <Skeleton type="table-row" count={4} />
          ) : activity?.length ? (
            <div className="space-y-4">
              {activity.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-4 bg-white dark:bg-surface-dark2 rounded-2xl border border-surface-3 dark:border-white/5">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-surface-2 dark:bg-white/5 rounded-lg opacity-40">
                      <Clock size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold uppercase tracking-tight">{log.action}</p>
                      <p className="text-[10px] opacity-40 uppercase tracking-widest">{log.detail || log.pagePath}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">{log.user?.fullName || 'Guest'}</p>
                    <p className="text-[8px] opacity-30 uppercase tracking-tighter">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Clock} title="No activity yet" hint="Admin and visitor actions will show up here as they happen." />
          )}
        </div>

        {/* Quick Links / Tasks */}
        <div className="space-y-6">
          <div className="border-b border-surface-3 dark:border-white/5 pb-4">
            <h2 className="text-xl font-display uppercase tracking-tight">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {QUICK_ACTIONS.map((link) => (
              <button
                key={link.label}
                onClick={() => navigate(link.to)}
                className="flex items-center space-x-3 p-4 bg-red text-white rounded-2xl hover:bg-red-dark transition-all shadow-lg shadow-red/20 text-[11px] font-bold uppercase tracking-widest"
              >
                {link.icon}
                <span>{link.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
