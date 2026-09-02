import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Radio, UserPlus, Search, MapPin, CircleDot } from 'lucide-react';
import { format } from 'date-fns';
import apiClient from '../../api/client';
import useAdminLeague from '../../hooks/useAdminLeague';
import { PageHeader, Panel, TableWrap, Th, Td } from '../../components/admin/AdminUI';
import { Button, EmptyState, Input, Skeleton, SkeletonList, cn } from '../../components/ui';

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
    <div>
      <PageHeader
        title={`${t('ladmin.reporters_title')} ${t('ladmin.reporters_accent')}`}
        subtitle={t('ladmin.reporters_sub')}
      />

      <Panel title={t('ladmin.available_reporters', 'Reporters you can send')}>
        <div className="relative max-w-sm">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" aria-hidden="true" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('ladmin.search_reporters', 'Search by name or email')}
            className="pl-9 text-sm"
          />
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {(directory || []).map((r) => {
            const already = assignedIds.has(r.id);
            const free = r.availability === 'AVAILABLE';
            return (
              <div key={r.id} className="flex items-start justify-between gap-3 rounded-control border border-hairline bg-surface-2 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-primary">{r.fullName}</p>
                  <p className="truncate text-xs text-tertiary">{r.email}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-tertiary">
                    <span className={cn('inline-flex items-center gap-1 font-semibold', free ? 'text-brand-text' : 'text-secondary')}>
                      <CircleDot size={10} aria-hidden="true" /> {r.availability}
                    </span>
                    {r.location && (
                      <span className="inline-flex items-center gap-0.5">
                        <MapPin size={10} aria-hidden="true" /> {r.location}
                      </span>
                    )}
                    <span className="tabular-nums">· {t('ladmin.n_matches', '{{count}} match', { count: r.assignments })}</span>
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={already ? 'secondary' : 'primary'}
                  disabled={already || assign.isPending}
                  onClick={() => assign.mutate(r.email)}
                  title={already ? t('ladmin.already_assigned', 'Already on this league') : undefined}
                  className="shrink-0"
                >
                  {already ? t('ladmin.assigned', 'Assigned') : t('ladmin.assign')}
                </Button>
              </div>
            );
          })}
          {directory && directory.length === 0 && (
            <p className="col-span-full text-sm text-tertiary">
              {t('ladmin.no_reporters_found', 'No reporters match that search.')}
            </p>
          )}
        </div>

        {/* Kept for a reporter who is not in the directory yet — someone whose
            account exists but who has never been given the role. */}
        <form
          onSubmit={(e) => { e.preventDefault(); if (email.trim()) assign.mutate(email.trim()); }}
          className="mt-5 flex max-w-md flex-wrap gap-2 border-t border-hairline pt-4"
        >
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('ladmin.email_placeholder')}
            className="min-w-0 flex-1 text-sm"
          />
          <Button type="submit" variant="secondary" size="sm" icon={UserPlus} disabled={assign.isPending}>
            {t('ladmin.assign')}
          </Button>
        </form>
        {error && <p role="alert" className="mt-2 text-xs font-semibold text-danger-text">{error}</p>}
      </Panel>

      <Panel flush className="mt-4">
        {isLoading ? (
          <SkeletonList count={5} className="divide-y divide-hairline">
            <div className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="ml-auto h-4 w-24" />
            </div>
          </SkeletonList>
        ) : reporters.length === 0 ? (
          <EmptyState icon={Radio} title={t('ladmin.none_reporters')} hint={t('ladmin.none_reporters_hint')} />
        ) : (
          <TableWrap>
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr>
                  <Th>{t('ladmin.col_reporter')}</Th>
                  <Th>{t('ladmin.col_scope')}</Th>
                  <Th align="right">{t('ladmin.col_assigned')}</Th>
                </tr>
              </thead>
              <tbody>
                {reporters.map((r) => (
                  <tr key={r.id} className="transition-colors duration-150 ease-standard hover:bg-surface-2">
                    <Td>
                      <p className="font-medium text-primary">{r.user?.fullName || r.user?.username}</p>
                      <p className="text-xs text-tertiary">{r.user?.email}</p>
                    </Td>
                    <Td>{r.fixture ? `${r.fixture.homeTeam?.name} v ${r.fixture.awayTeam?.name}` : t('ladmin.league_wide')}</Td>
                    <Td align="right">{r.assignedAt ? format(new Date(r.assignedAt), 'd MMM yyyy') : '—'}</Td>
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

export default LeagueReportersPage;
