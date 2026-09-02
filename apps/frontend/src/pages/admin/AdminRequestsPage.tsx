import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Inbox, Check, X, Mail, Phone, Clock } from 'lucide-react';
import { format } from 'date-fns';
import apiClient from '../../api/client';
import { Skeleton, EmptyState } from '../../components/ui';

/**
 * Super Admin → Join Requests.
 *
 * Clubs, schools and federations asking to be added. Approving one records a
 * decision; it does not create the organisation. That is deliberate — a club
 * conjured into existence by a single click, then thought better of, leaves rows
 * across half the schema. Whoever acts on an approval still goes through the
 * normal creation flow, with its own validation and its own audit trail.
 */
const KIND_LABEL = { CLUB: 'Club', SCHOOL: 'School', FEDERATION: 'Federation', SPORT: 'Sport' };

const STATUS_TONE = {
  PENDING: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  APPROVED: 'bg-brand/10 text-brand-text',
  REJECTED: 'bg-danger/10 text-danger-text',
};

const AdminRequestsPage = () => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [filter, setFilter] = useState('PENDING');
  const [notes, setNotes] = useState({});

  const { data, isLoading, isError } = useQuery({
    queryKey: ['platform-requests', filter],
    queryFn: async () =>
      (await apiClient.get('/requests', { params: filter === 'ALL' ? {} : { status: filter } })).data,
  });

  const review = useMutation({
    mutationFn: ({ id, status, decisionNote }: any) =>
      apiClient.patch(`/requests/${id}`, { status, decisionNote }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['platform-requests'] }),
  });

  const requests = data?.data || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-4xl font-display uppercase tracking-tighter">
          {t('admin.requests.title', 'Join')} <span className="text-red">{t('admin.requests.title_accent', 'Requests')}</span>
        </h1>
        <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">
          {t('admin.requests.subtitle', 'Organisations asking to be added to the platform')}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${
              filter === s ? 'bg-brand text-white' : 'border border-hairline text-tertiary hover:text-primary'
            }`}
          >
            {s === 'PENDING' && data?.pending ? `${s} (${data.pending})` : s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Skeleton type="card" count={3} />
      ) : isError ? (
        <div className="py-16 text-center opacity-50 font-display uppercase tracking-widest">
          {t('admin.users.load_error', 'Could not load')}
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={t('admin.requests.none_title', 'Nothing waiting')}
          hint={t('admin.requests.none_hint', 'New applications appear here as they arrive.')}
        />
      ) : (
        <div className="grid gap-3">
          {requests.map((r) => (
            <div key={r.id} className="rounded-2xl border border-hairline bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-lg font-semibold text-primary">{r.organisation}</h2>
                    <span className="rounded-full border border-hairline px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-tertiary">
                      {KIND_LABEL[r.kind] || r.kind}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_TONE[r.status]}`}>
                      {r.status}
                    </span>
                  </div>
                  <p className="text-sm text-secondary">{r.contactName}</p>
                  <div className="flex flex-wrap gap-4 text-[12px] text-tertiary">
                    <span className="inline-flex items-center gap-1"><Mail size={12} /> {r.contactEmail}</span>
                    {r.contactPhone && <span className="inline-flex items-center gap-1"><Phone size={12} /> {r.contactPhone}</span>}
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Clock size={12} /> {format(new Date(r.createdAt), 'd MMM yyyy')}
                    </span>
                  </div>
                </div>
              </div>

              {r.details && <p className="mt-3 whitespace-pre-wrap text-sm text-secondary">{r.details}</p>}

              {r.status === 'PENDING' ? (
                <div className="mt-4 space-y-2 border-t border-hairline pt-4">
                  <textarea
                    value={notes[r.id] || ''}
                    onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                    rows={2}
                    placeholder={t('admin.requests.note_placeholder', 'Reason — required to reject, so the applicant can be told why')}
                    className="w-full rounded-lg border border-hairline bg-surface-2 p-2.5 text-sm text-primary outline-none focus-visible:border-brand"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={review.isPending}
                      onClick={() => review.mutate({ id: r.id, status: 'APPROVED', decisionNote: notes[r.id] || undefined })}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white disabled:opacity-40"
                    >
                      <Check size={13} /> {t('admin.requests.approve', 'Approve')}
                    </button>
                    <button
                      type="button"
                      disabled={review.isPending || !(notes[r.id] || '').trim()}
                      onClick={() => review.mutate({ id: r.id, status: 'REJECTED', decisionNote: notes[r.id] })}
                      title={!(notes[r.id] || '').trim() ? t('admin.requests.needs_reason', 'Give a reason first') : undefined}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-danger/50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-danger-text disabled:opacity-40"
                    >
                      <X size={13} /> {t('admin.requests.reject', 'Reject')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 border-t border-hairline pt-3 text-[12px] text-tertiary">
                  {r.status === 'APPROVED' ? t('admin.requests.approved_by', 'Approved by') : t('admin.requests.rejected_by', 'Rejected by')}{' '}
                  <strong className="text-secondary">{r.reviewedBy?.fullName || '—'}</strong>
                  {r.reviewedAt && <> · {format(new Date(r.reviewedAt), 'd MMM yyyy')}</>}
                  {r.decisionNote && <p className="mt-1 italic text-secondary">“{r.decisionNote}”</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminRequestsPage;
