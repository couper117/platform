import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Target, TrendingUp, Users } from 'lucide-react';
import apiClient from '../../api/client';
import useAdminLeague from '../../hooks/useAdminLeague';
import { Skeleton } from '../../components/ui';

/** League Admin → Statistics: season totals derived from the league standings. */
const StatCard = ({ icon: Icon, value, label }) => (
  <div className="rounded-2xl border border-hairline bg-surface p-5">
    <Icon size={18} className="mb-2 text-brand" />
    <p className="font-display text-3xl font-bold tabular-nums text-primary">{value}</p>
    <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-tertiary">{label}</p>
  </div>
);

const LeagueStatisticsPage = () => {
  const { t } = useTranslation();
  const { leagueId } = useAdminLeague();
  const { data, isLoading } = useQuery({
    queryKey: ['la-stats-page', leagueId],
    queryFn: async () => (await apiClient.get(`/leagues/${leagueId}/standings`)).data.data,
    enabled: !!leagueId,
  });
  const rows = data || [];

  const played = Math.round(rows.reduce((n, s) => n + (s.played ?? 0), 0) / 2);
  const goals = rows.reduce((n, s) => n + (s.goalsFor ?? 0), 0);
  const avg = played ? (goals / played).toFixed(2) : '0.00';

  const cards = [
    { icon: CalendarDays, value: played, label: t('ladmin.stat_matches') },
    { icon: Target, value: goals, label: t('ladmin.stat_goals') },
    { icon: TrendingUp, value: avg, label: t('ladmin.stat_avg') },
    { icon: Users, value: rows.length, label: t('ladmin.stat_teams') },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-4xl font-display uppercase tracking-tighter">{t('ladmin.stats_title')} <span className="text-red">{t('ladmin.stats_accent')}</span></h1>
        <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">{t('ladmin.stats_sub')}</p>
      </div>
      {isLoading ? (
        <Skeleton type="card" count={2} />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {cards.map((c) => <StatCard key={c.label} {...c} />)}
        </div>
      )}
    </div>
  );
};

export default LeagueStatisticsPage;
