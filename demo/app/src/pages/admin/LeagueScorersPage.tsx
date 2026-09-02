import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Target } from 'lucide-react';
import apiClient from '../../api/client';
import useAdminLeague from '../../hooks/useAdminLeague';
import Avatar from '../../components/ui/Avatar';
import AdminTable from '../../components/admin/AdminTable';
import { Skeleton, EmptyState } from '../../components/ui';

/** League Admin → Top Scorers: leading goalscorers in the admin's league. */
const LeagueScorersPage = () => {
  const { t } = useTranslation();
  const { leagueId } = useAdminLeague();
  const { data, isLoading } = useQuery({
    queryKey: ['la-scorers-page', leagueId],
    queryFn: async () => (await apiClient.get(`/leagues/${leagueId}/scorers`)).data.data,
    enabled: !!leagueId,
  });
  const scorers = data || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-4xl font-display uppercase tracking-tighter">{t('ladmin.scorers_title')} <span className="text-red">{t('ladmin.scorers_accent')}</span></h1>
        <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">{t('ladmin.scorers_sub')}</p>
      </div>
      {isLoading ? (
        <Skeleton type="card" count={3} />
      ) : scorers.length === 0 ? (
        <EmptyState icon={Target} title={t('ladmin.none_scorers')} hint={t('ladmin.none_scorers_hint')} />
      ) : (
        <AdminTable headers={['#', t('ladmin.col_player'), t('ladmin.col_team'), t('ladmin.col_goals')]}>
          {scorers.map((s, i) => (
            <tr key={s.id ?? i} className="transition-colors hover:bg-surface-2 dark:hover:bg-white/5">
              <td className="px-6 py-4 text-sm tabular-nums text-tertiary">{i + 1}</td>
              <td className="px-6 py-4"><div className="flex items-center gap-3"><Avatar src={s.player?.photo} name={s.player?.fullName} size="sm" /><span className="text-sm font-semibold text-primary">{s.player?.fullName}</span></div></td>
              <td className="px-6 py-4 text-sm text-secondary">{s.team?.name}</td>
              <td className="px-6 py-4 text-lg font-display font-bold tabular-nums text-primary">{s.goals}</td>
            </tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
};

export default LeagueScorersPage;
