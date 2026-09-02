import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { BarChart3 } from 'lucide-react';
import { getAkcStandings } from '../../api/endpoints/amashuri';
import ClubCrest from '../../components/ui/ClubCrest';
import { PageHeader, Panel, TableWrap, Th, Td } from '../../components/admin/AdminUI';
import { Skeleton, SkeletonList, EmptyState } from '../../components/ui';

/** Amashuri Admin → Standings: school competition tables. */
const AmashuriAdminStandings = () => {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({ queryKey: ['aa-standings'], queryFn: () => getAkcStandings() });
  const rows = data?.data || [];

  return (
    <div>
      <PageHeader
        title={`${t('aadmin.standings_title')} ${t('aadmin.standings_accent')}`}
        subtitle={t('aadmin.standings_sub')}
      />

      <Panel flush>
        {isLoading ? (
          <SkeletonList count={6} className="space-y-3 p-4">
            <Skeleton className="h-10 w-full" />
          </SkeletonList>
        ) : rows.length === 0 ? (
          <EmptyState icon={BarChart3} title={t('aadmin.none_standings')} hint={t('aadmin.none_standings_hint')} />
        ) : (
          <TableWrap>
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr>
                  <Th className="w-12">#</Th>
                  <Th>{t('aadmin.col_team')}</Th>
                  <Th align="right">{t('dash.col_p')}</Th>
                  <Th align="right">{t('dash.col_w')}</Th>
                  <Th align="right">{t('dash.col_d')}</Th>
                  <Th align="right">{t('dash.col_l')}</Th>
                  <Th align="right">{t('dash.col_pts')}</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s, i) => (
                  <tr key={s.id ?? i} className="transition-colors duration-150 ease-standard hover:bg-surface-2">
                    <Td className="tabular-nums text-tertiary">{i + 1}</Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        <ClubCrest team={s.team?.school} size="sm" />
                        <span className="font-medium text-primary">{s.team?.school?.name}</span>
                      </div>
                    </Td>
                    <Td align="right">{s.played}</Td>
                    <Td align="right">{s.won}</Td>
                    <Td align="right">{s.drawn}</Td>
                    <Td align="right">{s.lost}</Td>
                    <Td align="right" className="font-semibold text-primary">{s.points}</Td>
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

export default AmashuriAdminStandings;
