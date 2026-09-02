import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Users2 } from 'lucide-react';
import { getFixtures } from '../../api/endpoints/fixtures';
import useAdminLeague from '../../hooks/useAdminLeague';
import { PageHeader, Panel, TableWrap, Th, Td } from '../../components/admin/AdminUI';
import { EmptyState, Skeleton, SkeletonList } from '../../components/ui';

/** League Admin → Match Officials: referees appearing across the league's fixtures. */
const LeagueOfficialsPage = () => {
  const { t } = useTranslation();
  const { leagueId } = useAdminLeague();
  const { data, isLoading } = useQuery({
    queryKey: ['la-officials', leagueId],
    queryFn: () => getFixtures({ leagueId }),
    enabled: !!leagueId,
  });

  const counts = {};
  for (const f of data?.data || []) {
    const r = (f.referee || '').trim();
    if (r) counts[r] = (counts[r] || 0) + 1;
  }
  const officials = Object.entries(counts).sort((a: any, b: any) => b[1] - a[1]);

  return (
    <div>
      <PageHeader
        title={`${t('ladmin.officials_title')} ${t('ladmin.officials_accent')}`}
        subtitle={t('ladmin.officials_sub')}
      />

      <Panel flush>
        {isLoading ? (
          <SkeletonList count={6} className="divide-y divide-hairline">
            <div className="flex items-center gap-3 px-4 py-3">
              <Skeleton circle className="h-8 w-8" />
              <Skeleton className="h-4 w-44" />
              <Skeleton className="ml-auto h-4 w-8" />
            </div>
          </SkeletonList>
        ) : officials.length === 0 ? (
          <EmptyState icon={Users2} title={t('ladmin.none_officials')} hint={t('ladmin.none_officials_hint')} />
        ) : (
          <TableWrap>
            <table className="w-full min-w-[420px] text-left">
              <thead>
                <tr>
                  <Th>{t('ladmin.col_referee')}</Th>
                  <Th align="right">{t('ladmin.col_appearances')}</Th>
                </tr>
              </thead>
              <tbody>
                {officials.map(([name, n]: any) => (
                  <tr key={name} className="transition-colors duration-150 ease-standard hover:bg-surface-2">
                    <Td>
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill bg-surface-2 text-tertiary">
                          <Users2 size={15} aria-hidden="true" />
                        </span>
                        <span className="truncate font-medium text-primary">{name}</span>
                      </div>
                    </Td>
                    <Td align="right" className="font-semibold text-primary">{n}</Td>
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

export default LeagueOfficialsPage;
