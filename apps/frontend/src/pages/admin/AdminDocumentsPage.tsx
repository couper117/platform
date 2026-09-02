import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, CheckCircle, XCircle, Eye } from 'lucide-react';
import apiClient from '../../api/client';
import { PageHeader, Panel, TableWrap, Th, Td } from '../../components/admin/AdminUI';
import { Button, Modal, EmptyState, ErrorState, Skeleton, SkeletonList, cn } from '../../components/ui';
import useUiStore from '../../store/uiStore';

/**
 * Super Admin → Document verification.
 *
 * Identity documents belong to a person, so this screen shows the least it can:
 * whose document it is, what kind, the filename, when it arrived, and the file
 * itself only once a reviewer opens it. Nothing here reads a field the review
 * decision does not need — Law N° 058/2021 arts. 46/47.
 */
const FILTERS: Array<[string, string]> = [
  ['PENDING', 'Pending'],
  ['APPROVED', 'Approved'],
  ['REJECTED', 'Rejected'],
];

const AdminDocumentsPage = () => {
  const queryClient = useQueryClient();
  const pushToast = useUiStore((s) => s.pushToast);
  const [filter, setFilter] = useState('PENDING');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [reviewNote, setReviewNote] = useState('');

  const { data: docs, isLoading, isError } = useQuery({
    queryKey: ['admin-documents', filter],
    queryFn: async () => {
      const { data } = await apiClient.get('/documents', { params: { status: filter } });
      return data.data;
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, note }: any) => {
      await apiClient.put(`/documents/${id}/review`, { status, reviewNote: note });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-documents'] });
      setSelectedDoc(null);
      setReviewNote('');
      pushToast('Document reviewed successfully!', 'success');
    },
    onError: (err: any) => pushToast(err.response?.data?.message || 'Failed to review document'),
  });

  const noteTooShort = reviewNote.trim().length < 3;

  return (
    <div>
      <PageHeader
        title="Document verification"
        subtitle="Review athlete IDs and certificates"
        actions={
          <div className="flex gap-1 rounded-pill border border-hairline bg-surface p-1">
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
                {label}
              </button>
            ))}
          </div>
        }
      />

      {isLoading ? (
        <Panel flush>
          <SkeletonList count={5}>
            <div className="flex items-center gap-4 border-b border-hairline px-4 py-3 last:border-0">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-24" />
            </div>
          </SkeletonList>
        </Panel>
      ) : isError ? (
        <Panel>
          <ErrorState
            title="Couldn't load documents"
            hint="Something went wrong fetching documents. Try refreshing the page."
          />
        </Panel>
      ) : !docs?.length ? (
        <Panel>
          <EmptyState
            icon={FileText}
            title={`No ${filter.toLowerCase()} documents`}
            hint="Documents will show up here as teams upload verification files."
          />
        </Panel>
      ) : (
        <Panel flush>
          <TableWrap>
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr>
                  <Th>Player</Th>
                  <Th>Doc type</Th>
                  <Th>Filename</Th>
                  <Th>Uploaded at</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {docs.map((doc) => (
                  <tr key={doc.id} className="transition-colors duration-150 ease-standard hover:bg-surface-2">
                    <Td>
                      <p className="font-medium text-primary">{doc.player?.fullName}</p>
                      <p className="text-xs text-tertiary">{doc.player?.team?.name}</p>
                    </Td>
                    <Td className="capitalize">{doc.docType.replace('_', ' ').toLowerCase()}</Td>
                    <Td className="text-tertiary">{doc.originalName || 'document.pdf'}</Td>
                    <Td className="tabular-nums">{new Date(doc.uploadedAt).toLocaleDateString()}</Td>
                    <Td align="right">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        icon={Eye}
                        onClick={() => setSelectedDoc(doc)}
                      >
                        Review
                      </Button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Panel>
      )}

      {/* Review modal */}
      <Modal open={!!selectedDoc} onClose={() => setSelectedDoc(null)} title="Verify document">
        <div className="space-y-5">
          <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-card border border-hairline bg-surface-2">
            {selectedDoc?.filename?.endsWith('.pdf') ? (
              <div className="flex flex-col items-center gap-3 px-4 text-center">
                <FileText size={48} className="text-tertiary" aria-hidden="true" />
                <span className="text-sm text-secondary">PDF document preview not available</span>
                <a
                  href={selectedDoc.filename}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-brand-text hover:underline"
                >
                  Download to view
                </a>
              </div>
            ) : (
              <img src={selectedDoc?.filename} alt="" className="h-full w-full object-contain" />
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="doc-review-note" className="block text-sm font-bold text-primary">
                Review note
              </label>
              <textarea
                id="doc-review-note"
                className="min-h-[100px] w-full rounded-input border border-hairline bg-surface p-3 text-sm text-primary placeholder:text-tertiary focus:border-brand focus:outline-none"
                placeholder="Reason for rejection or verification notes…"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                aria-describedby={noteTooShort ? 'doc-review-note-hint' : undefined}
              />
              {noteTooShort && (
                <p id="doc-review-note-hint" className="text-xs text-tertiary">
                  Required to reject
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => reviewMutation.mutate({ id: selectedDoc.id, status: 'REJECTED', note: reviewNote })}
                disabled={reviewMutation.isPending || noteTooShort}
                title={noteTooShort ? 'Say why, so the club knows what to correct' : undefined}
                icon={XCircle}
                className="border-danger/40 text-danger-text hover:border-danger/60 hover:bg-danger/10 hover:text-danger-text"
              >
                Reject
              </Button>
              <Button
                type="button"
                onClick={() => reviewMutation.mutate({ id: selectedDoc.id, status: 'APPROVED', note: reviewNote })}
                disabled={reviewMutation.isPending}
                icon={CheckCircle}
              >
                Approve
              </Button>
            </div>

            {reviewMutation.isError && (
              <p role="alert" className="text-xs font-semibold text-danger-text">
                {(reviewMutation.error as any)?.response?.data?.errors?.[0]?.message
                  || (reviewMutation.error as any)?.response?.data?.message
                  || 'Could not save that review.'}
              </p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminDocumentsPage;
