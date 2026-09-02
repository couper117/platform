import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import apiClient from '../../api/client';
import { PageHeader, StatCard, Panel, TableWrap, Th, Td } from '../../components/admin/AdminUI';
import { Avatar, Button, EmptyState, ErrorState, Skeleton, SkeletonList, cn } from '../../components/ui';

/**
 * Super Admin → Visitor analytics.
 *
 * The raw traffic log: one row per tracked request, newest first, twenty at a
 * time. It is the densest table in the portal, so the row carries only what an
 * operator scans for — when, who, what, from where — and the long user agent is
 * kept quiet under the address rather than given a column of its own.
 */
const AdminVisitorsPage = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-activity-logs', page],
    queryFn: async () => {
      const { data } = await apiClient.get('/activity', { params: { page, limit: 20 } });
      return data;
    },
  });

  return (
    <div>
      <PageHeader
        title="Visitor analytics"
        subtitle="Live tracking of platform traffic and user actions"
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={Eye} value={data?.total || 0} label="Total events" tone="brand" />
      </div>

      <div className="mt-4">
        {isLoading ? (
          <Panel flush>
            <SkeletonList count={8}>
              <div className="flex items-center gap-4 border-b border-hairline px-4 py-3 last:border-0">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-24" />
              </div>
            </SkeletonList>
          </Panel>
        ) : isError ? (
          <Panel>
            <ErrorState
              title="Couldn't load activity"
              hint="Something went wrong fetching visitor analytics. Try refreshing the page."
            />
          </Panel>
        ) : !data?.data?.length ? (
          <Panel>
            <EmptyState icon={Eye} title="No activity yet" hint="Visitor and admin actions will show up here as they happen." />
          </Panel>
        ) : (
          <Panel flush>
            <TableWrap>
              <table className="w-full min-w-[880px] text-left">
                <thead>
                  <tr>
                    <Th>Time</Th>
                    <Th>User</Th>
                    <Th>Action</Th>
                    <Th>IP / device</Th>
                    <Th>Path</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((log) => (
                    <tr key={log.id} className="transition-colors duration-150 ease-standard hover:bg-surface-2">
                      <Td className="whitespace-nowrap tabular-nums text-tertiary">
                        <span className="text-primary">{format(new Date(log.createdAt), 'HH:mm:ss')}</span>
                        <br />
                        {format(new Date(log.createdAt), 'dd MMM')}
                      </Td>
                      <Td>
                        {log.user ? (
                          <span className="inline-flex items-center gap-2">
                            <Avatar name={log.user.fullName} size="sm" />
                            <span className="font-medium text-primary">{log.user.fullName}</span>
                          </span>
                        ) : (
                          <span className="text-tertiary">Guest</span>
                        )}
                      </Td>
                      <Td>
                        {/* Page views are the noise this log is mostly made of, so
                            they stay neutral and anything else is tinted — that is
                            what an operator is actually scanning the column for. */}
                        <span
                          className={cn(
                            'inline-flex whitespace-nowrap rounded-pill px-2 py-0.5 text-xs font-semibold capitalize',
                            log.action === 'PAGE_VIEW' ? 'bg-surface-2 text-secondary' : 'bg-brand-tint text-brand-text'
                          )}
                        >
                          {String(log.action || '').replace(/_/g, ' ').toLowerCase()}
                        </span>
                      </Td>
                      <Td>
                        <span className="block tabular-nums text-primary">{log.ip}</span>
                        <span className="block max-w-[220px] truncate text-xs text-tertiary" title={log.userAgent}>
                          {log.userAgent}
                        </span>
                      </Td>
                      <Td className="text-tertiary">{log.pagePath}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </Panel>
        )}
      </div>

      <div className="mt-4 flex items-center justify-center gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          icon={ChevronLeft}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </Button>
        <span className="text-sm font-semibold tabular-nums text-secondary">{page}</span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          icon={ChevronRight}
          iconRight
          onClick={() => setPage((p) => p + 1)}
          disabled={data?.pages <= page}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default AdminVisitorsPage;
