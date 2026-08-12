import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ClipboardList, Check } from 'lucide-react';
import { getAkcAthletes, verifyAkcAthlete } from '../../api/endpoints/amashuri';
import Avatar from '../../components/ui/Avatar';
import AdminTable from '../../components/admin/AdminTable';
import { Skeleton, EmptyState } from '../../components/ui';

/** Amashuri Admin → Pending Approvals: athletes awaiting document verification. */
const AmashuriAdminApprovals = () => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['aa-approvals'],
    queryFn: () => getAkcAthletes({ verified: 'false' }),
  });
  const pending = data?.data || [];

  const approve = useMutation({
    mutationFn: (id) => verifyAkcAthlete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['aa-approvals'] }),
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-4xl font-display uppercase tracking-tighter">{t('aadmin.approvals_title')} <span className="text-red">{t('aadmin.approvals_accent')}</span></h1>
        <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">{t('aadmin.approvals_sub')}</p>
      </div>
      {isLoading ? <Skeleton type="card" count={3} />
        : pending.length === 0 ? <EmptyState icon={ClipboardList} title={t('aadmin.none_approvals')} hint={t('aadmin.none_approvals_hint')} />
        : (
          <AdminTable headers={[t('aadmin.col_athlete'), t('aadmin.col_team'), t('aadmin.col_id'), t('admin.col_actions')]}>
            {pending.map((a) => (
              <tr key={a.id} className="transition-colors hover:bg-surface-2 dark:hover:bg-white/5">
                <td className="px-6 py-4"><div className="flex items-center gap-3"><Avatar name={a.fullName} size="sm" /><span className="text-sm font-semibold text-primary">{a.fullName}</span></div></td>
                <td className="px-6 py-4 text-sm text-secondary">{a.team?.school?.name}</td>
                <td className="px-6 py-4 text-sm tabular-nums text-tertiary">{a.idNumber || '—'}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => approve.mutate(a.id)}
                    disabled={approve.isPending}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-strong px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
                  >
                    <Check size={13} /> {t('aadmin.approve')}
                  </button>
                </td>
              </tr>
            ))}
          </AdminTable>
        )}
    </div>
  );
};

export default AmashuriAdminApprovals;
