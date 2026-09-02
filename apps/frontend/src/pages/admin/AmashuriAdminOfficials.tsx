import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Users2 } from 'lucide-react';
import { getAkcTeams } from '../../api/endpoints/amashuri';
import { PageHeader, Panel, TableWrap, Th, Td } from '../../components/admin/AdminUI';
import { Avatar, Skeleton, SkeletonList, EmptyState } from '../../components/ui';

/** Amashuri Admin → Officials: coaches registered across school teams. */
const AmashuriAdminOfficials = () => {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({ queryKey: ['aa-officials'], queryFn: () => getAkcTeams() });

  const seen = new Set();
  const officials = [];
  for (const tm of data?.data || []) {
    const name = (tm.coachName || '').trim();
    if (!name) continue;
    const key = `${name}|${tm.schoolId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    officials.push({ name, school: tm.school?.name, phone: tm.coachPhone });
  }

  return (
    <div>
      <PageHeader
        title={`${t('aadmin.officials_title')} ${t('aadmin.officials_accent')}`}
        subtitle={t('aadmin.officials_sub')}
      />

      <Panel flush>
        {isLoading ? (
          <SkeletonList count={5} className="space-y-3 p-4">
            <Skeleton className="h-10 w-full" />
          </SkeletonList>
        ) : officials.length === 0 ? (
          <EmptyState icon={Users2} title={t('aadmin.none_officials')} hint={t('aadmin.none_officials_hint')} />
        ) : (
          <TableWrap>
            <table className="w-full min-w-[420px] text-left">
              <thead>
                <tr>
                  <Th>{t('aadmin.col_coach')}</Th>
                  <Th>{t('aadmin.col_school')}</Th>
                </tr>
              </thead>
              <tbody>
                {officials.map((o, i) => (
                  <tr key={i} className="transition-colors duration-150 ease-standard hover:bg-surface-2">
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar name={o.name} size="sm" />
                        <span className="font-medium text-primary">{o.name}</span>
                      </div>
                    </Td>
                    <Td>{o.school}</Td>
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

export default AmashuriAdminOfficials;
