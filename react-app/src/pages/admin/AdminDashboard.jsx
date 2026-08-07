import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Users, UserSquare2, FileText, Activity, ArrowUpRight, Clock, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getLeagues } from '../../api/endpoints/leagues';
import { getFixtures } from '../../api/endpoints/fixtures';
import Skeleton from '../../components/shared/Skeleton';

// Static class map — Tailwind JIT can't see interpolated `bg-${color}` strings.
const COLOR_CLASSES = {
  red: 'bg-red/5 text-red group-hover:bg-red',
  'rwanda-yellow': 'bg-rwanda-yellow/5 text-rwanda-yellow group-hover:bg-rwanda-yellow',
  'rwanda-green': 'bg-rwanda-green/5 text-rwanda-green group-hover:bg-rwanda-green',
  'rwanda-blue': 'bg-rwanda-blue/5 text-rwanda-blue group-hover:bg-rwanda-blue',
  gold: 'bg-gold/5 text-gold group-hover:bg-gold',
};

const StatCard = ({ icon, label, value, trend, color = "red" }) => (
  <div className="bg-white dark:bg-surface-dark2 p-6 rounded-3xl border border-surface-3 dark:border-white/5 space-y-4 hover:shadow-xl transition-all group">
    <div className="flex justify-between items-start">
      <div className={`p-3 rounded-2xl group-hover:text-white transition-all ${COLOR_CLASSES[color] || COLOR_CLASSES.red}`}>
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

const AdminDashboard = () => {
  const { t } = useTranslation();

  const { data: leagues, isLoading: leaguesLoading } = useQuery({
    queryKey: ['admin-stats-leagues'],
    queryFn: () => getLeagues(),
  });

  const { data: fixtures } = useQuery({
    queryKey: ['admin-stats-fixtures'],
    queryFn: () => getFixtures({ status: 'LIVE' }),
  });

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-display uppercase tracking-tighter">
            {t('admin.dashboard.title')} <span className="text-red">{t('admin.dashboard.title_accent')}</span>
          </h1>
          <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">{t('admin.dashboard.subtitle')}</p>
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest opacity-30 italic">
          {t('admin.dashboard.last_updated')}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {leaguesLoading ? (
          <Skeleton type="stat" count={4} />
        ) : (
          <>
            <StatCard icon={<Trophy size={20} />} label={t('admin.dashboard.active_leagues')} value={leagues?.count || 0} trend={12} color="red" />
            <StatCard icon={<Users size={20} />} label={t('admin.dashboard.total_teams')} value="842" trend={5} color="rwanda-yellow" />
            <StatCard icon={<UserSquare2 size={20} />} label={t('admin.dashboard.elite_athletes')} value="12,402" trend={8} color="rwanda-green" />
            <StatCard icon={<FileText size={20} />} label={t('admin.dashboard.pending_docs')} value="124" color="red" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Activity Feed Placeholder */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-surface-3 dark:border-white/5 pb-4">
            <h2 className="text-xl font-display uppercase tracking-tight">{t('admin.dashboard.recent_activity')}</h2>
            <button className="text-[10px] font-bold uppercase tracking-widest text-red hover:underline">{t('admin.dashboard.view_all_logs')}</button>
          </div>
          <div className="space-y-4">
            {[
              { action: t('admin.activity.team_verified'), user: t('enums.role.SUPERADMIN'), time: t('admin.activity.minutes_ago', { count: 2 }), detail: 'Rayon Sports FC' },
              { action: t('admin.activity.match_result'), user: t('admin.activity.system'), time: t('admin.activity.minutes_ago', { count: 15 }), detail: 'APR FC vs AS Kigali (2-1)' },
              { action: t('admin.activity.new_article'), user: 'K. Jean', time: t('admin.activity.hours_ago', { count: 1 }), detail: t('admin.activity.article_detail') },
              { action: t('admin.activity.player_registered'), user: t('enums.role.TEAM_MANAGER'), time: t('admin.activity.hours_ago', { count: 2 }), detail: 'M. Mugisha — Gorilla FC' },
            ].map((log, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-surface-dark2 rounded-2xl border border-surface-3 dark:border-white/5">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-surface-2 dark:bg-white/5 rounded-lg opacity-40">
                    <Clock size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-tight">{log.action}</p>
                    <p className="text-[10px] opacity-40 uppercase tracking-widest">{log.detail}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">{log.user}</p>
                  <p className="text-[8px] opacity-30 uppercase tracking-tighter">{log.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links / Tasks */}
        <div className="space-y-6">
          <div className="border-b border-surface-3 dark:border-white/5 pb-4">
            <h2 className="text-xl font-display uppercase tracking-tight">{t('admin.dashboard.quick_actions')}</h2>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {[
              { label: t('admin.dashboard.action_create_league'), icon: <Trophy size={16} /> },
              { label: t('admin.dashboard.action_verify_teams'), icon: <Users size={16} /> },
              { label: t('admin.dashboard.action_input_results'), icon: <Activity size={16} /> },
              { label: t('admin.dashboard.action_settings'), icon: <Settings size={16} /> },
            ].map((link, i) => (
              <button key={i} className="flex items-center space-x-3 p-4 bg-red text-white rounded-2xl hover:bg-red-dark transition-all shadow-lg shadow-red/20 text-[11px] font-bold uppercase tracking-widest">
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
