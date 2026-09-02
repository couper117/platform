import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { FileText } from 'lucide-react';
import { format } from 'date-fns';
import { getAkcFixtures } from '../../api/endpoints/amashuri';
import { PageHeader, Panel, TableWrap, Th, Td } from '../../components/admin/AdminUI';
import { Skeleton, SkeletonList, EmptyState, StatusPill } from '../../components/ui';

/** A backend enum read as a sentence: THIRD_PLACE → "Third place". */
const sentence = (value: string) => {
  const words = String(value || '').replace(/_/g, ' ').toLowerCase();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : '—';
};

/** Amashuri Admin → Results: completed school matches with scores. */
const AmashuriAdminResults = () => {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({ queryKey: ['aa-results'], queryFn: () => getAkcFixtures() });
  const results = (data?.data || []).filter((f) => f.status === 'COMPLETED');

  return (
    <div>
      <PageHeader
        title={`${t('aadmin.results_title')} ${t('aadmin.results_accent')}`}
        subtitle={t('aadmin.results_sub')}
      />

      <Panel flush>
        {isLoading ? (
          <SkeletonList count={6} className="space-y-3 p-4">
            <Skeleton className="h-10 w-full" />
          </SkeletonList>
        ) : results.length === 0 ? (
          <EmptyState icon={FileText} title={t('aadmin.none_results')} hint={t('aadmin.none_results_hint')} />
        ) : (
          <TableWrap>
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr>
                  <Th>{t('aadmin.col_match')}</Th>
                  <Th>{t('aadmin.col_date')}</Th>
                  <Th align="right">{t('aadmin.col_score')}</Th>
                  <Th>{t('aadmin.col_stage')}</Th>
                  <Th>{t('aadmin.col_status')}</Th>
                </tr>
              </thead>
              <tbody>
                {results.map((f) => (
                  <tr key={f.id} className="transition-colors duration-150 ease-standard hover:bg-surface-2">
                    <Td className="font-medium text-primary">
                      {f.homeTeam?.school?.name} <span className="font-normal text-tertiary">v</span> {f.awayTeam?.school?.name}
                    </Td>
                    <Td className="tabular-nums text-tertiary">
                      {f.matchDate ? format(new Date(f.matchDate), 'd MMM · HH:mm') : '—'}
                    </Td>
                    <Td align="right" className="font-semibold text-primary">
                      {f.homeScore ?? 0}–{f.awayScore ?? 0}
                    </Td>
                    <Td className="text-tertiary">{sentence(f.stage)}</Td>
                    <Td><StatusPill status={f.status} label={sentence(f.status)} /></Td>
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

export default AmashuriAdminResults;
