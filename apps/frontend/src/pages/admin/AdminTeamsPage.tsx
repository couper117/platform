import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, ShieldCheck, XCircle, Trash2, Link2 } from 'lucide-react';
import apiClient from '../../api/client';
import { PageHeader, Panel, TableWrap, Th, Td } from '../../components/admin/AdminUI';
import {
  IconButton, ClubCrest, StatusPill, EmptyState, Skeleton, SkeletonList, cn,
} from '../../components/ui';
import useSportScope from '../../hooks/useSportScope';
import TeamSocialsModal from '../../components/admin/TeamSocialsModal';

/**
 * Super Admin / Federation Admin → verification queue for competitors.
 *
 * The status filter is the page's only control, so it sits in the header beside
 * the title rather than as a slab above the table.
 */
const FILTERS: Array<[string, string]> = [
  ['PENDING', 'Pending'],
  ['VERIFIED', 'Verified'],
  ['SUSPENDED', 'Suspended'],
];

const AdminTeamsPage = () => {
  // The club whose links are being edited; null when the editor is closed.
  const [linksFor, setLinksFor] = useState<any>(null);
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('PENDING');
  const scope = useSportScope();
  const compOne = scope.profile?.competitor || 'Team';

  const { data: teams, isLoading } = useQuery({
    queryKey: ['admin-teams', filter, scope.key],
    queryFn: async () => {
      const { data } = await apiClient.get('/teams', { params: { status: filter, ...scope.params } });
      return data.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: any) => {
      await apiClient.put(`/teams/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teams'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to update team status');
    }
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async (id: any) => {
      await apiClient.delete(`/teams/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teams'] });
      alert('Team deleted successfully');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to delete team');
    }
  });

  const handleDeleteTeam = (id) => {
    if (window.confirm('Are you sure you want to delete this team? This will remove all its players and matches.')) {
      deleteTeamMutation.mutate(id);
    }
  };

  return (
    <div>
      <PageHeader
        title={`${compOne} verification`}
        subtitle={`Approve or audit ${compOne.toLowerCase()} applications`}
        actions={
          <div className="flex gap-1">
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

      <Panel flush>
        {isLoading ? (
          <div className="p-4">
            <SkeletonList count={5} className="space-y-3">
              <Skeleton className="h-10 w-full" />
            </SkeletonList>
          </div>
        ) : !teams?.length ? (
          <EmptyState icon={Users} />
        ) : (
          <TableWrap>
            <table className="w-full min-w-[820px] text-left">
              <thead>
                <tr>
                  <Th>{compOne}</Th>
                  <Th>Sport</Th>
                  <Th>Location</Th>
                  <Th>Manager</Th>
                  <Th>Status</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => (
                  <tr key={team.id} className="transition-colors duration-150 ease-standard hover:bg-surface-2">
                    <Td>
                      <div className="flex items-center gap-3">
                        <ClubCrest team={team} size="lg" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-primary">{team.name}</p>
                          <p className="truncate text-xs text-tertiary">{team.shortName || 'No code'}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>{team.sport?.name}</Td>
                    <Td>
                      <p className="text-sm text-secondary">{team.city}</p>
                      <p className="text-xs text-tertiary">{team.province}</p>
                    </Td>
                    <Td>
                      <p className="text-sm text-secondary">{team.managerUser?.fullName || 'Unassigned'}</p>
                      <p className="text-xs text-tertiary">{team.managerUser?.email || 'No email'}</p>
                    </Td>
                    <Td>
                      <StatusPill status={team.status} />
                    </Td>
                    <Td align="right">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton
                          icon={Link2}
                          size="sm"
                          label={`Links for ${team.name}`}
                          onClick={() => setLinksFor(team)}
                        />
                        {team.status !== 'VERIFIED' && (
                          <IconButton
                            icon={ShieldCheck}
                            size="sm"
                            label={`Verify ${team.name}`}
                            onClick={() => updateStatusMutation.mutate({ id: team.id, status: 'VERIFIED' })}
                          />
                        )}
                        {team.status !== 'SUSPENDED' && (
                          <IconButton
                            icon={XCircle}
                            size="sm"
                            label={`Suspend ${team.name}`}
                            onClick={() => updateStatusMutation.mutate({ id: team.id, status: 'SUSPENDED' })}
                          />
                        )}
                        <IconButton
                          icon={Trash2}
                          size="sm"
                          variant="danger"
                          label={`Delete ${team.name}`}
                          onClick={() => handleDeleteTeam(team.id)}
                        />
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Panel>

      <TeamSocialsModal team={linksFor} open={!!linksFor} onClose={() => setLinksFor(null)} />
    </div>
  );
};

export default AdminTeamsPage;
