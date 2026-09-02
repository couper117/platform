import React from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import AdminTable from './AdminTable';

const STATUS_STYLE = {
  ONGOING: 'bg-red/10 text-red', SCHEDULED: 'bg-surface-2 text-tertiary',
  COMPLETED: 'bg-brand/10 text-brand-text', POSTPONED: 'bg-gold/10 text-gold', CANCELLED: 'bg-surface-2 text-tertiary',
};

/** Shared table for Amashuri admin fixtures / live / results views. */
const AkcFixtureTable = ({ fixtures, showScore = false }) => {
  const { t } = useTranslation();
  return (
    <AdminTable headers={[t('aadmin.col_match'), t('aadmin.col_date'), showScore ? t('aadmin.col_score') : t('aadmin.col_venue'), t('aadmin.col_stage'), t('aadmin.col_status')]}>
      {fixtures.map((f) => (
        <tr key={f.id} className="transition-colors hover:bg-surface-2 dark:hover:bg-white/5">
          <td className="px-6 py-4 text-sm font-semibold text-primary">{f.homeTeam?.school?.name} <span className="text-tertiary">v</span> {f.awayTeam?.school?.name}</td>
          <td className="px-6 py-4 text-sm tabular-nums text-tertiary">{f.matchDate ? format(new Date(f.matchDate), 'd MMM · HH:mm') : '—'}</td>
          <td className="px-6 py-4 text-sm text-secondary">{showScore ? <span className="font-bold tabular-nums text-primary">{f.homeScore ?? 0}-{f.awayScore ?? 0}</span> : (f.venue || '—')}</td>
          <td className="px-6 py-4 text-xs uppercase tracking-wider text-tertiary">{f.stage?.replace(/_/g, ' ')}</td>
          <td className="px-6 py-4"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLE[f.status] || 'bg-surface-2 text-tertiary'}`}>{f.status}</span></td>
        </tr>
      ))}
    </AdminTable>
  );
};

export default AkcFixtureTable;
