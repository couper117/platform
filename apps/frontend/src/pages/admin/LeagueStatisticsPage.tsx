import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Target, TrendingUp, Users } from 'lucide-react';
import apiClient from '../../api/client';
import useAdminLeague from '../../hooks/useAdminLeague';
import { PageHeader, StatCard } from '../../components/admin/AdminUI';

/** League Admin → Statistics: season totals derived from the league standings. */
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
    { icon: CalendarDays, value: played, label: t('ladmin.stat_matches'), tone: 'brand' as const },
    { icon: Target, value: goals, label: t('ladmin.stat_goals') },
    { icon: TrendingUp, value: avg, label: t('ladmin.stat_avg') },
    { icon: Users, value: rows.length, label: t('ladmin.stat_teams') },
  ];

  return (
    <div>
      <PageHeader
        title={`${t('ladmin.stats_title')} ${t('ladmin.stats_accent')}`}
        subtitle={t('ladmin.stats_sub')}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }, (_, i) => <StatCard.Skeleton key={i} />)
          : cards.map((c) => <StatCard key={String(c.label)} {...c} />)}
      </div>
    </div>
  );
};

export default LeagueStatisticsPage;
