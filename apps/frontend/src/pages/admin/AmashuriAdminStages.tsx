import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Layers } from 'lucide-react';
import { getAkcFixtures } from '../../api/endpoints/amashuri';
import { PageHeader, Panel, TableWrap, Th, Td } from '../../components/admin/AdminUI';
import { Skeleton, SkeletonList, EmptyState } from '../../components/ui';

const STAGE_ORDER = ['GROUP', 'ROUND16', 'QUARTERFINAL', 'SEMIFINAL', 'THIRD_PLACE', 'FINAL'];

/** A backend enum read as a sentence: THIRD_PLACE → "Third place". */
const stageLabel = (stage: string) => {
  const words = String(stage || '').replace(/_/g, ' ').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/** Amashuri Admin → Stages: fixtures grouped by tournament stage. */
const AmashuriAdminStages = () => {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({ queryKey: ['aa-stages'], queryFn: () => getAkcFixtures() });

  const counts = {};
  for (const f of data?.data || []) { const s = f.stage || 'GROUP'; counts[s] = (counts[s] || 0) + 1; }
  const stages = Object.entries(counts).sort((a, b) => STAGE_ORDER.indexOf(a[0]) - STAGE_ORDER.indexOf(b[0]));

  return (
    <div>
      <PageHeader
        title={`${t('aadmin.stages_title')} ${t('aadmin.stages_accent')}`}
        subtitle={t('aadmin.stages_sub')}
      />

      <Panel flush>
        {isLoading ? (
          <SkeletonList count={4} className="space-y-3 p-4">
            <Skeleton className="h-10 w-full" />
          </SkeletonList>
        ) : stages.length === 0 ? (
          <EmptyState icon={Layers} title={t('aadmin.none_stages')} hint={t('aadmin.none_stages_hint')} />
        ) : (
          <TableWrap>
            <table className="w-full min-w-[360px] text-left">
              <thead>
                <tr>
                  <Th>{t('aadmin.col_stage')}</Th>
                  <Th align="right">{t('aadmin.col_matches')}</Th>
                </tr>
              </thead>
              <tbody>
                {stages.map(([stage, n]: any) => (
                  <tr key={stage} className="transition-colors duration-150 ease-standard hover:bg-surface-2">
                    <Td>
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-surface-2 text-tertiary">
                          <Layers size={15} aria-hidden="true" />
                        </span>
                        <span className="font-medium text-primary">{stageLabel(stage)}</span>
                      </div>
                    </Td>
                    <Td align="right" className="font-semibold text-primary">{n}</Td>
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

export default AmashuriAdminStages;
