import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Users2 } from 'lucide-react';
import { getAkcTeams } from '../../api/endpoints/amashuri';
import AdminTable from '../../components/admin/AdminTable';
import { Skeleton, EmptyState } from '../../components/ui';

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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-4xl font-display uppercase tracking-tighter">{t('aadmin.officials_title')} <span className="text-red">{t('aadmin.officials_accent')}</span></h1>
        <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">{t('aadmin.officials_sub')}</p>
      </div>
      {isLoading ? <Skeleton type="card" count={3} />
        : officials.length === 0 ? <EmptyState icon={Users2} title={t('aadmin.none_officials')} hint={t('aadmin.none_officials_hint')} />
        : (
          <AdminTable headers={[t('aadmin.col_coach'), t('aadmin.col_school')]}>
            {officials.map((o, i) => (
              <tr key={i} className="transition-colors hover:bg-surface-2 dark:hover:bg-white/5">
                <td className="px-6 py-4"><div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-tertiary"><Users2 size={15} /></span><span className="text-sm font-semibold text-primary">{o.name}</span></div></td>
                <td className="px-6 py-4 text-sm text-secondary">{o.school}</td>
              </tr>
            ))}
          </AdminTable>
        )}
    </div>
  );
};

export default AmashuriAdminOfficials;
