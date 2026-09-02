import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Target } from 'lucide-react';
import apiClient from '../../api/client';
import useAdminLeague from '../../hooks/useAdminLeague';
import { PageHeader, Panel, TableWrap, Th, Td } from '../../components/admin/AdminUI';
import { Avatar, EmptyState, Skeleton, SkeletonList } from '../../components/ui';

/**
 * League Admin → Top Scorers: leading goalscorers in the admin's league.
 *
 * Like the standings, the table IS the page: full panel width, goals right-aligned
 * and tabular so the column reads as a ranking rather than a list of facts.
 */
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
    <div>
      <PageHeader
        title={`${t('ladmin.scorers_title')} ${t('ladmin.scorers_accent')}`}
        subtitle={t('ladmin.scorers_sub')}
      />

      <Panel flush>
        {isLoading ? (
          <SkeletonList count={8} className="divide-y divide-hairline">
            <div className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="h-4 w-4" />
              <Skeleton circle className="h-7 w-7" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="ml-auto h-4 w-10" />
            </div>
          </SkeletonList>
        ) : scorers.length === 0 ? (
          <EmptyState icon={Target} title={t('ladmin.none_scorers')} hint={t('ladmin.none_scorers_hint')} />
        ) : (
          <TableWrap>
            <table className="w-full min-w-[520px] text-left">
              <thead>
                <tr>
                  <Th>#</Th>
                  <Th>{t('ladmin.col_player')}</Th>
                  <Th>{t('ladmin.col_team')}</Th>
                  <Th align="right">{t('ladmin.col_goals')}</Th>
                </tr>
              </thead>
              <tbody>
                {scorers.map((s, i) => (
                  <tr key={s.id ?? i} className="transition-colors duration-150 ease-standard hover:bg-surface-2">
                    <Td className="tabular-nums text-tertiary">{i + 1}</Td>
                    <Td>
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar src={s.player?.photo} name={s.player?.fullName} size="sm" />
                        <span className="truncate font-medium text-primary">{s.player?.fullName}</span>
                      </div>
                    </Td>
                    <Td>{s.team?.name}</Td>
                    <Td align="right" className="font-semibold text-primary">{s.goals}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Panel>
    </div>
  );
};

export default LeagueScorersPage;
