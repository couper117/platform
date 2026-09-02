import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Medal } from 'lucide-react';
import { getAkcSports } from '../../api/endpoints/amashuri';
import { PageHeader, Panel, TableWrap, Th, Td } from '../../components/admin/AdminUI';
import { Skeleton, SkeletonList, EmptyState } from '../../components/ui';

/** Amashuri Admin → Sports: sports contested across the schools. */
const AmashuriAdminSports = () => {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({ queryKey: ['aa-sports'], queryFn: () => getAkcSports() });
  const sports = data?.data || [];

  return (
    <div>
      <PageHeader
        title={`${t('aadmin.sports_title')} ${t('aadmin.sports_accent')}`}
        subtitle={t('aadmin.sports_sub')}
      />

      <Panel flush>
        {isLoading ? (
          <SkeletonList count={4} className="space-y-3 p-4">
            <Skeleton className="h-10 w-full" />
          </SkeletonList>
        ) : sports.length === 0 ? (
          <EmptyState icon={Medal} title={t('aadmin.none_sports')} hint={t('aadmin.none_sports_hint')} />
        ) : (
          <TableWrap>
            <table className="w-full min-w-[360px] text-left">
              <thead>
                <tr>
                  <Th>{t('aadmin.col_sport')}</Th>
                  <Th align="right">{t('aadmin.col_competitions')}</Th>
                </tr>
              </thead>
              <tbody>
                {sports.map((s) => (
                  <tr key={s.slug} className="transition-colors duration-150 ease-standard hover:bg-surface-2">
                    <Td className="font-medium text-primary">{s.name}</Td>
                    <Td align="right" className="font-semibold text-primary">{s.competitions}</Td>
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

export default AmashuriAdminSports;
