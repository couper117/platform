import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { BarChart3 } from 'lucide-react';
import apiClient from '../../api/client';
import useAdminLeague from '../../hooks/useAdminLeague';
import ClubCrest from '../../components/ui/ClubCrest';
import AdminTable from '../../components/admin/AdminTable';
import { Skeleton, EmptyState } from '../../components/ui';

/** League Admin → Standings: the live table for the admin's league. */
const LeagueStandingsPage = () => {
  const { t } = useTranslation();
  const { leagueId, league } = useAdminLeague();
  const { data, isLoading } = useQuery({
    queryKey: ['la-standings-page', leagueId],
    queryFn: async () => (await apiClient.get(`/leagues/${leagueId}/standings`)).data.data,
    enabled: !!leagueId,
  });
  const rows = data || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-4xl font-display uppercase tracking-tighter">{t('ladmin.standings_title')} <span className="text-red">{t('ladmin.standings_accent')}</span></h1>
        <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">{league?.name || t('ladmin.standings_sub')}</p>
      </div>
      {isLoading ? (
        <Skeleton type="card" count={3} />
      ) : rows.length === 0 ? (
        <EmptyState icon={BarChart3} title={t('ladmin.none_standings')} hint={t('ladmin.standings_sub')} />
      ) : (
        <AdminTable headers={['#', t('dash.col_team'), t('dash.col_p'), t('dash.col_w'), t('dash.col_d'), t('dash.col_l'), t('dash.col_gd'), t('dash.col_pts')]}>
          {rows.map((s, i) => {
            const gd = (s.goalsFor ?? 0) - (s.goalsAgainst ?? 0);
            return (
              <tr key={s.id ?? i} className="transition-colors hover:bg-surface-2 dark:hover:bg-white/5">
                <td className="px-6 py-4 text-sm tabular-nums text-tertiary">{i + 1}</td>
                <td className="px-6 py-4"><div className="flex items-center gap-2"><ClubCrest team={s.team} size="sm" /><span className="text-sm font-medium text-primary">{s.team?.name}</span></div></td>
                <td className="px-6 py-4 text-sm tabular-nums text-secondary">{s.played}</td>
                <td className="px-6 py-4 text-sm tabular-nums text-secondary">{s.won}</td>
                <td className="px-6 py-4 text-sm tabular-nums text-secondary">{s.drawn}</td>
                <td className="px-6 py-4 text-sm tabular-nums text-secondary">{s.lost}</td>
                <td className="px-6 py-4 text-sm tabular-nums text-secondary">{gd > 0 ? `+${gd}` : gd}</td>
                <td className="px-6 py-4 text-sm font-bold tabular-nums text-primary">{s.points}</td>
              </tr>
            );
          })}
        </AdminTable>
      )}
    </div>
  );
};

export default LeagueStandingsPage;
