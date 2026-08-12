import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { getChampionships } from '../../api/endpoints/amashuri';
import AdminTable from '../../components/admin/AdminTable';
import { Skeleton, EmptyState } from '../../components/ui';

const STATUS_STYLE = { ONGOING: 'bg-red/10 text-red', UPCOMING: 'bg-gold/10 text-gold', COMPLETED: 'bg-brand/10 text-brand-text', CANCELLED: 'bg-surface-2 text-tertiary' };
const dateRange = (a, b) => {
  if (!a) return '—';
  const s = format(new Date(a), 'd MMM');
  return b ? `${s} – ${format(new Date(b), 'd MMM yyyy')}` : s;
};

/** Amashuri Admin → Competitions & Seasons: school championships and editions. */
const AmashuriAdminSeasons = () => {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({ queryKey: ['aa-seasons'], queryFn: () => getChampionships() });
  const comps = data?.data || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-4xl font-display uppercase tracking-tighter">{t('aadmin.seasons_title')} <span className="text-red">{t('aadmin.seasons_accent')}</span></h1>
        <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">{t('aadmin.seasons_sub')}</p>
      </div>
      {isLoading ? <Skeleton type="card" count={3} />
        : comps.length === 0 ? <EmptyState icon={Trophy} title={t('aadmin.none_seasons')} hint={t('aadmin.none_seasons_hint')} />
        : (
          <AdminTable headers={[t('aadmin.col_competition'), t('aadmin.col_edition'), t('aadmin.col_status'), t('aadmin.col_dates')]}>
            {comps.map((c) => (
              <tr key={c.id} className="transition-colors hover:bg-surface-2 dark:hover:bg-white/5">
                <td className="px-6 py-4"><div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand"><Trophy size={15} /></span><span className="text-sm font-semibold text-primary">{c.name}</span></div></td>
                <td className="px-6 py-4 text-sm text-secondary">{c.edition || c.level}</td>
                <td className="px-6 py-4"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLE[c.status] || 'bg-surface-2 text-tertiary'}`}>{c.status}</span></td>
                <td className="px-6 py-4 text-sm tabular-nums text-tertiary"><span className="inline-flex items-center gap-1"><CalendarDays size={12} /> {dateRange(c.startDate, c.endDate)}</span></td>
              </tr>
            ))}
          </AdminTable>
        )}
    </div>
  );
};

export default AmashuriAdminSeasons;
