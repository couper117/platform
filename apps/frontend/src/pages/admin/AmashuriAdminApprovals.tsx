import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ClipboardList, Check } from 'lucide-react';
import { getAkcAthletes, verifyAkcAthlete } from '../../api/endpoints/amashuri';
import { PageHeader, Panel, TableWrap, Th, Td } from '../../components/admin/AdminUI';
import { Avatar, Button, Skeleton, SkeletonList, EmptyState } from '../../components/ui';

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
    mutationFn: (id: any) => verifyAkcAthlete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['aa-approvals'] }),
  });

  return (
    <div>
      <PageHeader
        title={`${t('aadmin.approvals_title')} ${t('aadmin.approvals_accent')}`}
        subtitle={t('aadmin.approvals_sub')}
      />

      <Panel flush>
        {isLoading ? (
          <SkeletonList count={5} className="space-y-3 p-4">
            <Skeleton className="h-10 w-full" />
          </SkeletonList>
        ) : pending.length === 0 ? (
          <EmptyState icon={ClipboardList} title={t('aadmin.none_approvals')} hint={t('aadmin.none_approvals_hint')} />
        ) : (
          <TableWrap>
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr>
                  <Th>{t('aadmin.col_athlete')}</Th>
                  <Th>{t('aadmin.col_team')}</Th>
                  <Th>{t('aadmin.col_id')}</Th>
                  <Th align="right">{t('admin.col_actions')}</Th>
                </tr>
              </thead>
              <tbody>
                {pending.map((a) => (
                  <tr key={a.id} className="transition-colors duration-150 ease-standard hover:bg-surface-2">
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar name={a.fullName} size="sm" />
                        <span className="font-medium text-primary">{a.fullName}</span>
                      </div>
                    </Td>
                    <Td>{a.team?.school?.name}</Td>
                    <Td className="tabular-nums text-tertiary">{a.idNumber || '—'}</Td>
                    <Td align="right">
                      <Button
                        size="sm"
                        icon={Check}
                        onClick={() => approve.mutate(a.id)}
                        disabled={approve.isPending}
                        // Only the row being approved shows the spinner — a shared
                        // `isPending` would set every button in the list spinning.
                        loading={approve.isPending && approve.variables === a.id}
                      >
                        {t('aadmin.approve')}
                      </Button>
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

export default AmashuriAdminApprovals;
