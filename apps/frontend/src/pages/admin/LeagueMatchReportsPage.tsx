import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ClipboardCheck, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { getFixtures } from '../../api/endpoints/fixtures';
import useAdminLeague from '../../hooks/useAdminLeague';
import { PageHeader, Panel, TableWrap, Th, Td } from '../../components/admin/AdminUI';
import { EmptyState, IconButton, Skeleton, SkeletonList } from '../../components/ui';

/** League Admin → Match Reports: completed fixtures in the admin's league. */
const LeagueMatchReportsPage = () => {
  const { t } = useTranslation();
  const { leagueId } = useAdminLeague();
  const { data, isLoading } = useQuery({
    queryKey: ['la-reports', leagueId],
    queryFn: () => getFixtures({ leagueId }),
    enabled: !!leagueId,
  });
  const reports = (data?.data || []).filter((f) => f.status === 'COMPLETED');

  return (
    <div>
      <PageHeader
        title={`${t('ladmin.match_reports_title')} ${t('ladmin.match_reports_accent')}`}
        subtitle={t('ladmin.match_reports_sub')}
      />

      <Panel flush>
        {isLoading ? (
          <SkeletonList count={6} className="divide-y divide-hairline">
            <div className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="ml-auto h-4 w-16" />
            </div>
          </SkeletonList>
        ) : reports.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title={t('ladmin.none_reports')} hint={t('ladmin.none_reports_hint')} />
        ) : (
          <TableWrap>
            <table className="w-full min-w-[680px] text-left">
              <thead>
                <tr>
                  <Th>{t('ladmin.col_match')}</Th>
                  <Th>{t('ladmin.col_date')}</Th>
                  <Th align="right">{t('ladmin.col_score')}</Th>
                  <Th>{t('admin.col_status')}</Th>
                  <Th align="right">{t('admin.col_actions')}</Th>
                </tr>
              </thead>
              <tbody>
                {reports.map((f) => (
                  <tr key={f.id} className="transition-colors duration-150 ease-standard hover:bg-surface-2">
                    <Td className="font-medium text-primary">
                      {f.homeTeam?.name} <span className="font-normal text-tertiary">v</span> {f.awayTeam?.name}
                    </Td>
                    <Td className="tabular-nums">{f.matchDate ? format(new Date(f.matchDate), 'd MMM yyyy') : '—'}</Td>
                    <Td align="right" className="font-semibold text-primary">{f.homeScore}-{f.awayScore}</Td>
                    <Td>
                      <span className="rounded-pill bg-brand-tint px-2 py-0.5 text-xs font-semibold text-brand-text">
                        {t('ladmin.reported')}
                      </span>
                    </Td>
                    <Td align="right">
                      <IconButton
                        icon={Eye}
                        size="sm"
                        label={t('admin.col_actions')}
                        to={`/matches/${f.id}`}
                        className="ml-auto"
                      />
                    </Td>
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

export default LeagueMatchReportsPage;
