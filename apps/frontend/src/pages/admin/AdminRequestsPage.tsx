import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Inbox, Check, X, Mail, Phone, Clock } from 'lucide-react';
import { format } from 'date-fns';
import apiClient from '../../api/client';
import { PageHeader } from '../../components/admin/AdminUI';
import { Badge, Button, StatusPill, EmptyState, ErrorState, Skeleton, SkeletonList, cn } from '../../components/ui';

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

// The filter is a set of backend enums; the label is what a person reads.
const FILTERS: Array<[string, string]> = [
  ['PENDING', 'Pending'],
  ['APPROVED', 'Approved'],
  ['REJECTED', 'Rejected'],
  ['ALL', 'All'],
];

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
    <div>
      <PageHeader
        title={`${t('admin.requests.title', 'Join')} ${t('admin.requests.title_accent', 'Requests')}`}
        subtitle={t('admin.requests.subtitle', 'Organisations asking to be added to the platform')}
        actions={
          <div className="flex flex-wrap gap-1 rounded-pill border border-hairline bg-surface p-1">
            {FILTERS.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                aria-pressed={filter === value}
                className={cn(
                  'rounded-pill px-3 py-1.5 text-xs font-semibold transition-colors duration-150 ease-standard',
                  filter === value ? 'bg-brand-tint text-brand-text' : 'text-tertiary hover:bg-surface-2 hover:text-primary'
                )}
              >
                {value === 'PENDING' && data?.pending ? `${label} (${data.pending})` : label}
              </button>
            ))}
          </div>
        }
      />

      {isLoading ? (
        <SkeletonList count={3} className="grid gap-3">
          <div className="rounded-card border border-hairline bg-surface p-4">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="mt-2 h-3 w-40" />
            <Skeleton className="mt-3 h-3 w-full max-w-lg" />
          </div>
        </SkeletonList>
      ) : isError ? (
        <div className="rounded-card border border-hairline bg-surface">
          <ErrorState title={t('admin.users.load_error', 'Could not load')} />
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-card border border-hairline bg-surface">
          <EmptyState
            icon={Inbox}
            title={t('admin.requests.none_title', 'Nothing waiting')}
            hint={t('admin.requests.none_hint', 'New applications appear here as they arrive.')}
          />
        </div>
      ) : (
        <div className="grid gap-3">
          {requests.map((r) => (
            <div key={r.id} className="rounded-card border border-hairline bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate font-display text-base font-semibold text-primary">{r.organisation}</h2>
                    <Badge>{KIND_LABEL[r.kind] || r.kind}</Badge>
                    <StatusPill status={r.status} />
                  </div>
                  <p className="text-sm text-secondary">{r.contactName}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-tertiary">
                    <span className="inline-flex items-center gap-1"><Mail size={12} aria-hidden="true" /> {r.contactEmail}</span>
                    {r.contactPhone && <span className="inline-flex items-center gap-1"><Phone size={12} aria-hidden="true" /> {r.contactPhone}</span>}
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Clock size={12} aria-hidden="true" /> {format(new Date(r.createdAt), 'd MMM yyyy')}
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
                    aria-label={t('admin.requests.note_placeholder', 'Reason — required to reject, so the applicant can be told why')}
                    placeholder={t('admin.requests.note_placeholder', 'Reason — required to reject, so the applicant can be told why')}
                    className="w-full rounded-input border border-hairline bg-surface-2 p-3 text-sm text-primary placeholder:text-tertiary focus:border-brand focus:outline-none"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      icon={Check}
                      disabled={review.isPending}
                      onClick={() => review.mutate({ id: r.id, status: 'APPROVED', decisionNote: notes[r.id] || undefined })}
                    >
                      {t('admin.requests.approve', 'Approve')}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      icon={X}
                      disabled={review.isPending || !(notes[r.id] || '').trim()}
                      onClick={() => review.mutate({ id: r.id, status: 'REJECTED', decisionNote: notes[r.id] })}
                      title={!(notes[r.id] || '').trim() ? t('admin.requests.needs_reason', 'Give a reason first') : undefined}
                      className="border-danger/40 text-danger-text hover:border-danger/60 hover:bg-danger/10 hover:text-danger-text"
                    >
                      {t('admin.requests.reject', 'Reject')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 border-t border-hairline pt-3 text-xs text-tertiary">
                  {r.status === 'APPROVED' ? t('admin.requests.approved_by', 'Approved by') : t('admin.requests.rejected_by', 'Rejected by')}{' '}
                  <strong className="font-semibold text-secondary">{r.reviewedBy?.fullName || '—'}</strong>
                  {r.reviewedAt && <span className="tabular-nums"> · {format(new Date(r.reviewedAt), 'd MMM yyyy')}</span>}
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
