import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Layers } from 'lucide-react';
import { getAkcFixtures } from '../../api/endpoints/amashuri';
import AdminTable from '../../components/admin/AdminTable';
import { Skeleton, EmptyState } from '../../components/ui';

const STAGE_ORDER = ['GROUP', 'ROUND16', 'QUARTERFINAL', 'SEMIFINAL', 'THIRD_PLACE', 'FINAL'];

/** Amashuri Admin → Stages: fixtures grouped by tournament stage. */
const AmashuriAdminStages = () => {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({ queryKey: ['aa-stages'], queryFn: () => getAkcFixtures() });

  const counts = {};
  for (const f of data?.data || []) { const s = f.stage || 'GROUP'; counts[s] = (counts[s] || 0) + 1; }
  const stages = Object.entries(counts).sort((a, b) => STAGE_ORDER.indexOf(a[0]) - STAGE_ORDER.indexOf(b[0]));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-4xl font-display uppercase tracking-tighter">{t('aadmin.stages_title')} <span className="text-red">{t('aadmin.stages_accent')}</span></h1>
        <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">{t('aadmin.stages_sub')}</p>
      </div>
      {isLoading ? <Skeleton type="card" count={2} />
        : stages.length === 0 ? <EmptyState icon={Layers} title={t('aadmin.none_stages')} hint={t('aadmin.none_stages_hint')} />
        : (
          <AdminTable headers={[t('aadmin.col_stage'), t('aadmin.col_matches')]}>
            {stages.map(([stage, n]: any) => (
              <tr key={stage} className="transition-colors hover:bg-surface-2 dark:hover:bg-white/5">
                <td className="px-6 py-4"><div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand"><Layers size={15} /></span><span className="text-sm font-semibold uppercase tracking-wider text-primary">{stage.replace(/_/g, ' ')}</span></div></td>
                <td className="px-6 py-4 text-lg font-display font-bold tabular-nums text-primary">{n}</td>
              </tr>
            ))}
          </AdminTable>
        )}
    </div>
  );
};

export default AmashuriAdminStages;
