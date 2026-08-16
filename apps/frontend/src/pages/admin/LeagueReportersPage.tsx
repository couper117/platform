import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Radio, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import apiClient from '../../api/client';
import useAdminLeague from '../../hooks/useAdminLeague';
import AdminTable from '../../components/admin/AdminTable';
import { Skeleton, EmptyState } from '../../components/ui';

/** League Admin â†’ Reporter Assignment: who covers this league, plus assign-by-email. */
const LeagueReportersPage = () => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { leagueId } = useAdminLeague();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['la-reporters', leagueId],
    queryFn: async () => (await apiClient.get(`/leagues/${leagueId}/reporters`)).data.data,
    enabled: !!leagueId,
  });
  const reporters = data || [];

  const assign = useMutation({
    mutationFn: (mail: any) => apiClient.post(`/leagues/${leagueId}/assign-reporter`, { email: mail }),
    onSuccess: () => { setEmail(''); setError(''); qc.invalidateQueries({ queryKey: ['la-reporters', leagueId] }); },
    onError: (e: any) => setError(e.response?.data?.message || 'Failed'),
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-4xl font-display uppercase tracking-tighter">{t('ladmin.reporters_title')} <span className="text-red">{t('ladmin.reporters_accent')}</span></h1>
        <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">{t('ladmin.reporters_sub')}</p>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); if (email.trim()) assign.mutate(email.trim()); }}
        className="flex max-w-md gap-2"
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('ladmin.email_placeholder')}
          className="flex-1 rounded-lg border border-hairline bg-surface px-3 py-2.5 text-sm text-primary outline-none focus-visible:border-brand"
        />
        <button type="submit" disabled={assign.isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-red px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-white disabled:opacity-50">
          <UserPlus size={15} /> {t('ladmin.assign')}
        </button>
      </form>
      {error && <p className="text-xs text-red">{error}</p>}

      {isLoading ? (
        <Skeleton type="card" count={2} />
      ) : reporters.length === 0 ? (
        <EmptyState icon={Radio} title={t('ladmin.none_reporters')} hint={t('ladmin.none_reporters_hint')} />
      ) : (
        <AdminTable headers={[t('ladmin.col_reporter'), t('ladmin.col_scope'), t('ladmin.col_assigned')]}>
          {reporters.map((r) => (
            <tr key={r.id} className="transition-colors hover:bg-surface-2 dark:hover:bg-white/5">
              <td className="px-6 py-4">
                <p className="text-sm font-semibold text-primary">{r.user?.fullName || r.user?.username}</p>
                <p className="text-[11px] text-tertiary">{r.user?.email}</p>
              </td>
              <td className="px-6 py-4 text-sm text-secondary">{r.fixture ? `${r.fixture.homeTeam?.name} v ${r.fixture.awayTeam?.name}` : t('ladmin.league_wide')}</td>
              <td className="px-6 py-4 text-sm tabular-nums text-tertiary">{r.assignedAt ? format(new Date(r.assignedAt), 'd MMM yyyy') : 'â€”'}</td>
            </tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
};

export default LeagueReportersPage;
