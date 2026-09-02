import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Radio, UserPlus, Search, MapPin, CircleDot } from 'lucide-react';
import { format } from 'date-fns';
import apiClient from '../../api/client';
import useAdminLeague from '../../hooks/useAdminLeague';
import AdminTable from '../../components/admin/AdminTable';
import { Skeleton, EmptyState } from '../../components/ui';

/**
 * League Admin → Reporters: who covers this league, and who is free to.
 *
 * Assignment used to mean typing a reporter's email address from memory. There
 * was no way to see who covers this sport, where they are, or that someone is
 * already out on another match — so the choice was made blind, or not made at
 * all. The directory below answers that before the assign button is pressed.
 */
const LeagueReportersPage = () => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { leagueId } = useAdminLeague();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [q, setQ] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['la-reporters', leagueId],
    queryFn: async () => (await apiClient.get(`/leagues/${leagueId}/reporters`)).data.data,
    enabled: !!leagueId,
  });
  const reporters = data || [];

  // Everyone who could be sent, with what they cover and whether they are free.
  const { data: directory } = useQuery({
    queryKey: ['reporter-directory', q],
    queryFn: async () => (await apiClient.get('/reporters', { params: q ? { q } : {} })).data.data,
  });

  // Already on this league — shown as assigned rather than offered again.
  const assignedIds = new Set(reporters.map((r) => r.user?.id ?? r.userId));

  const assign = useMutation({
    mutationFn: (mail: any) => apiClient.post(`/leagues/${leagueId}/assign-reporter`, { email: mail }),
    onSuccess: () => {
      setEmail(''); setError('');
      qc.invalidateQueries({ queryKey: ['la-reporters', leagueId] });
      qc.invalidateQueries({ queryKey: ['reporter-directory'] });
    },
    onError: (e: any) => setError(e.response?.data?.message || 'Failed'),
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-4xl font-display uppercase tracking-tighter">{t('ladmin.reporters_title')} <span className="text-red">{t('ladmin.reporters_accent')}</span></h1>
        <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">{t('ladmin.reporters_sub')}</p>
      </div>

      <section className="rounded-2xl border border-hairline bg-surface p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-primary">
          {t('ladmin.available_reporters', 'Reporters you can send')}
        </h2>

        <div className="relative mt-3 max-w-sm">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('ladmin.search_reporters', 'Search by name or email')}
            className="w-full rounded-lg border border-hairline bg-surface-2 py-2 pl-9 pr-3 text-sm text-primary outline-none focus-visible:border-brand"
          />
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {(directory || []).map((r) => {
            const already = assignedIds.has(r.id);
            const free = r.availability === 'AVAILABLE';
            return (
              <div key={r.id} className="flex items-start justify-between gap-3 rounded-xl border border-hairline bg-surface-2 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-primary">{r.fullName}</p>
                  <p className="truncate text-[11px] text-tertiary">{r.email}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-tertiary">
                    <span className={`inline-flex items-center gap-1 font-semibold ${free ? 'text-brand-text' : 'text-gold'}`}>
                      <CircleDot size={9} /> {r.availability}
                    </span>
                    {r.location && <span className="inline-flex items-center gap-0.5"><MapPin size={9} /> {r.location}</span>}
                    <span>· {t('ladmin.n_matches', '{{count}} match', { count: r.assignments })}</span>
                  </p>
                </div>
                <button
                  type="button"
                  disabled={already || assign.isPending}
                  onClick={() => assign.mutate(r.email)}
                  title={already ? t('ladmin.already_assigned', 'Already on this league') : undefined}
                  className="shrink-0 rounded-lg bg-brand px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white disabled:opacity-30"
                >
                  {already ? t('ladmin.assigned', 'Assigned') : t('ladmin.assign')}
                </button>
              </div>
            );
          })}
          {directory && directory.length === 0 && (
            <p className="col-span-full text-xs text-tertiary">
              {t('ladmin.no_reporters_found', 'No reporters match that search.')}
            </p>
          )}
        </div>

        {/* Kept for a reporter who is not in the directory yet — someone whose
            account exists but who has never been given the role. */}
        <form
          onSubmit={(e) => { e.preventDefault(); if (email.trim()) assign.mutate(email.trim()); }}
          className="mt-5 flex max-w-md gap-2 border-t border-hairline pt-4"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('ladmin.email_placeholder')}
            className="flex-1 rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-sm text-primary outline-none focus-visible:border-brand"
          />
          <button type="submit" disabled={assign.isPending} className="inline-flex items-center gap-1.5 rounded-lg border border-hairline px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-secondary disabled:opacity-50">
            <UserPlus size={14} /> {t('ladmin.assign')}
          </button>
        </form>
        {error && <p className="mt-2 text-xs text-danger-text">{error}</p>}
      </section>

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
