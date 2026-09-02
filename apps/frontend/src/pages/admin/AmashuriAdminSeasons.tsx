import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { getChampionships } from '../../api/endpoints/amashuri';
import { PageHeader, Panel, TableWrap, Th, Td } from '../../components/admin/AdminUI';
import { Skeleton, SkeletonList, EmptyState, StatusPill } from '../../components/ui';

const dateRange = (a, b) => {
  if (!a) return '—';
  const s = format(new Date(a), 'd MMM');
  return b ? `${s} – ${format(new Date(b), 'd MMM yyyy')}` : s;
};

/**
 * A competition's status read as a sentence. StatusPill owns the COLOUR of each
 * backend enum, but its built-in labels are match-shaped ("Full time" for
 * COMPLETED), so the label is supplied here and only the tone is inherited.
 */
const statusLabel = (status: string) => {
  const words = String(status || '').replace(/_/g, ' ').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/** Amashuri Admin → Competitions & Seasons: school championships and editions. */
const AmashuriAdminSeasons = () => {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({ queryKey: ['aa-seasons'], queryFn: () => getChampionships() });
  const comps = data?.data || [];

  return (
    <div>
      <PageHeader
        title={`${t('aadmin.seasons_title')} ${t('aadmin.seasons_accent')}`}
        subtitle={t('aadmin.seasons_sub')}
      />

      <Panel flush>
        {isLoading ? (
          <SkeletonList count={5} className="space-y-3 p-4">
            <Skeleton className="h-10 w-full" />
          </SkeletonList>
        ) : comps.length === 0 ? (
          <EmptyState icon={Trophy} title={t('aadmin.none_seasons')} hint={t('aadmin.none_seasons_hint')} />
        ) : (
          <TableWrap>
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr>
                  <Th>{t('aadmin.col_competition')}</Th>
                  <Th>{t('aadmin.col_edition')}</Th>
                  <Th>{t('aadmin.col_status')}</Th>
                  <Th>{t('aadmin.col_dates')}</Th>
                </tr>
              </thead>
              <tbody>
                {comps.map((c) => (
                  <tr key={c.id} className="transition-colors duration-150 ease-standard hover:bg-surface-2">
                    <Td>
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-brand-tint text-brand-text">
                          <Trophy size={15} aria-hidden="true" />
                        </span>
                        <span className="font-medium text-primary">{c.name}</span>
                      </div>
                    </Td>
                    <Td>{c.edition || c.level}</Td>
                    <Td><StatusPill status={c.status} label={statusLabel(c.status)} /></Td>
                    <Td className="tabular-nums text-tertiary">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={13} aria-hidden="true" /> {dateRange(c.startDate, c.endDate)}
                      </span>
                    </Td>
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

export default AmashuriAdminSeasons;
