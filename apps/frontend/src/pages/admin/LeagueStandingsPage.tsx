import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { BarChart3 } from 'lucide-react';
import apiClient from '../../api/client';
import useAdminLeague from '../../hooks/useAdminLeague';
import { PageHeader, Panel, TableWrap, Th, Td } from '../../components/admin/AdminUI';
import { ClubCrest, EmptyState, Skeleton, SkeletonList } from '../../components/ui';

/**
 * League Admin → Standings: the live table for the admin's league.
 *
 * The table IS the page, so it gets the full width of a flush Panel and no
 * sidebar to compete with. Every figure is tabular-nums and right-aligned, which
 * is the only way a column of numbers can be read down rather than across.
 */
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
    <div>
      <PageHeader
        title={`${t('ladmin.standings_title')} ${t('ladmin.standings_accent')}`}
        subtitle={league?.name || t('ladmin.standings_sub')}
      />

      <Panel flush>
        {isLoading ? (
          <SkeletonList count={8} className="divide-y divide-hairline">
            <div className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="h-4 w-4" />
              <Skeleton circle className="h-6 w-6" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="ml-auto h-4 w-24" />
            </div>
          </SkeletonList>
        ) : rows.length === 0 ? (
          <EmptyState icon={BarChart3} title={t('ladmin.none_standings')} hint={t('ladmin.standings_sub')} />
        ) : (
          <TableWrap>
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr>
                  <Th>#</Th>
                  <Th>{t('dash.col_team')}</Th>
                  <Th align="right">{t('dash.col_p')}</Th>
                  <Th align="right">{t('dash.col_w')}</Th>
                  <Th align="right">{t('dash.col_d')}</Th>
                  <Th align="right">{t('dash.col_l')}</Th>
                  <Th align="right">{t('dash.col_gd')}</Th>
                  <Th align="right">{t('dash.col_pts')}</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s, i) => {
                  const gd = (s.goalsFor ?? 0) - (s.goalsAgainst ?? 0);
                  return (
                    <tr key={s.id ?? i} className="transition-colors duration-150 ease-standard hover:bg-surface-2">
                      <Td className="tabular-nums text-tertiary">{i + 1}</Td>
                      <Td>
                        <div className="flex min-w-0 items-center gap-2">
                          <ClubCrest team={s.team} size="sm" />
                          <span className="truncate font-medium text-primary">{s.team?.name}</span>
                        </div>
                      </Td>
                      <Td align="right">{s.played}</Td>
                      <Td align="right">{s.won}</Td>
                      <Td align="right">{s.drawn}</Td>
                      <Td align="right">{s.lost}</Td>
                      <Td align="right">{gd > 0 ? `+${gd}` : gd}</Td>
                      <Td align="right" className="font-semibold text-primary">{s.points}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Panel>
    </div>
  );
};

export default LeagueStandingsPage;
