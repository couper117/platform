import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Medal } from 'lucide-react';
import { getAkcSports } from '../../api/endpoints/amashuri';
import AdminTable from '../../components/admin/AdminTable';
import { Skeleton, EmptyState } from '../../components/ui';

/** Amashuri Admin → Sports: sports contested across the schools. */
const AmashuriAdminSports = () => {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({ queryKey: ['aa-sports'], queryFn: () => getAkcSports() });
  const sports = data?.data || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-4xl font-display uppercase tracking-tighter">{t('aadmin.sports_title')} <span className="text-red">{t('aadmin.sports_accent')}</span></h1>
        <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">{t('aadmin.sports_sub')}</p>
      </div>
      {isLoading ? <Skeleton type="card" count={2} />
        : sports.length === 0 ? <EmptyState icon={Medal} title={t('aadmin.none_sports')} hint={t('aadmin.none_sports_hint')} />
        : (
          <AdminTable headers={[t('aadmin.col_sport'), t('aadmin.col_competitions')]}>
            {sports.map((s) => (
              <tr key={s.slug} className="transition-colors hover:bg-surface-2 dark:hover:bg-white/5">
                <td className="px-6 py-4"><div className="flex items-center gap-3"><span className="text-2xl" aria-hidden="true">{s.icon}</span><span className="text-sm font-semibold text-primary">{s.name}</span></div></td>
                <td className="px-6 py-4 text-lg font-display font-bold tabular-nums text-primary">{s.competitions}</td>
              </tr>
            ))}
          </AdminTable>
        )}
    </div>
  );
};

export default AmashuriAdminSports;
