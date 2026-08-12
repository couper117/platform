import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { BarChart3 } from 'lucide-react';
import { getAkcStandings } from '../../api/endpoints/amashuri';
import ClubCrest from '../../components/ui/ClubCrest';
import AdminTable from '../../components/admin/AdminTable';
import { Skeleton, EmptyState } from '../../components/ui';

/** Amashuri Admin → Standings: school competition tables. */
const AmashuriAdminStandings = () => {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({ queryKey: ['aa-standings'], queryFn: () => getAkcStandings() });
  const rows = data?.data || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-4xl font-display uppercase tracking-tighter">{t('aadmin.standings_title')} <span className="text-red">{t('aadmin.standings_accent')}</span></h1>
        <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">{t('aadmin.standings_sub')}</p>
      </div>
      {isLoading ? <Skeleton type="card" count={3} />
        : rows.length === 0 ? <EmptyState icon={BarChart3} title={t('aadmin.none_standings')} hint={t('aadmin.none_standings_hint')} />
        : (
          <AdminTable headers={['#', t('aadmin.col_team'), t('dash.col_p'), t('dash.col_w'), t('dash.col_d'), t('dash.col_l'), t('dash.col_pts')]}>
            {rows.map((s, i) => (
              <tr key={s.id ?? i} className="transition-colors hover:bg-surface-2 dark:hover:bg-white/5">
                <td className="px-6 py-4 text-sm tabular-nums text-tertiary">{i + 1}</td>
                <td className="px-6 py-4"><div className="flex items-center gap-2"><ClubCrest team={s.team?.school} size="sm" /><span className="text-sm font-medium text-primary">{s.team?.school?.name}</span></div></td>
                <td className="px-6 py-4 text-sm tabular-nums text-secondary">{s.played}</td>
                <td className="px-6 py-4 text-sm tabular-nums text-secondary">{s.won}</td>
                <td className="px-6 py-4 text-sm tabular-nums text-secondary">{s.drawn}</td>
                <td className="px-6 py-4 text-sm tabular-nums text-secondary">{s.lost}</td>
                <td className="px-6 py-4 text-sm font-bold tabular-nums text-primary">{s.points}</td>
              </tr>
            ))}
          </AdminTable>
        )}
    </div>
  );
};

export default AmashuriAdminStandings;
