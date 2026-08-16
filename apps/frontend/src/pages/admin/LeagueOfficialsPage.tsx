import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Users2 } from 'lucide-react';
import { getFixtures } from '../../api/endpoints/fixtures';
import useAdminLeague from '../../hooks/useAdminLeague';
import AdminTable from '../../components/admin/AdminTable';
import { Skeleton, EmptyState } from '../../components/ui';

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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-4xl font-display uppercase tracking-tighter">{t('ladmin.officials_title')} <span className="text-red">{t('ladmin.officials_accent')}</span></h1>
        <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">{t('ladmin.officials_sub')}</p>
      </div>
      {isLoading ? (
        <Skeleton type="card" count={3} />
      ) : officials.length === 0 ? (
        <EmptyState icon={Users2} title={t('ladmin.none_officials')} hint={t('ladmin.none_officials_hint')} />
      ) : (
        <AdminTable headers={[t('ladmin.col_referee'), t('ladmin.col_appearances')]}>
          {officials.map(([name, n]: any) => (
            <tr key={name} className="transition-colors hover:bg-surface-2 dark:hover:bg-white/5">
              <td className="px-6 py-4"><div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-tertiary"><Users2 size={15} /></span><span className="text-sm font-semibold text-primary">{name}</span></div></td>
              <td className="px-6 py-4 text-sm font-bold tabular-nums text-primary">{n}</td>
            </tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
};

export default LeagueOfficialsPage;
