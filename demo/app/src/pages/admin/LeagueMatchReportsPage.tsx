import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ClipboardCheck, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { getFixtures } from '../../api/endpoints/fixtures';
import useAdminLeague from '../../hooks/useAdminLeague';
import AdminTable from '../../components/admin/AdminTable';
import { Skeleton, EmptyState } from '../../components/ui';

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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-4xl font-display uppercase tracking-tighter">{t('ladmin.match_reports_title')} <span className="text-red">{t('ladmin.match_reports_accent')}</span></h1>
        <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">{t('ladmin.match_reports_sub')}</p>
      </div>
      {isLoading ? (
        <Skeleton type="card" count={3} />
      ) : reports.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title={t('ladmin.none_reports')} hint={t('ladmin.none_reports_hint')} />
      ) : (
        <AdminTable headers={[t('ladmin.col_match'), t('ladmin.col_date'), t('ladmin.col_score'), t('admin.col_status'), t('admin.col_actions')]}>
          {reports.map((f) => (
            <tr key={f.id} className="transition-colors hover:bg-surface-2 dark:hover:bg-white/5">
              <td className="px-6 py-4 text-sm font-semibold text-primary">{f.homeTeam?.name} <span className="text-tertiary">v</span> {f.awayTeam?.name}</td>
              <td className="px-6 py-4 text-sm tabular-nums text-tertiary">{f.matchDate ? format(new Date(f.matchDate), 'd MMM yyyy') : '—'}</td>
              <td className="px-6 py-4 text-sm font-bold tabular-nums text-primary">{f.homeScore}-{f.awayScore}</td>
              <td className="px-6 py-4"><span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-text">{t('ladmin.reported')}</span></td>
              <td className="px-6 py-4"><Link to={`/matches/${f.id}`} aria-label={t('admin.col_actions')} className="text-tertiary hover:text-primary"><Eye size={16} /></Link></td>
            </tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
};

export default LeagueMatchReportsPage;
