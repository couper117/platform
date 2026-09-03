import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Trash2, Edit2, User, Plus, BarChart3 } from 'lucide-react';
import apiClient from '../../api/client';
import { PageHeader, Panel, TableWrap, Th, Td } from '../../components/admin/AdminUI';
import {
  Button, IconButton, Input, Avatar, StatusPill, EmptyState, Skeleton, SkeletonList,
} from '../../components/ui';
import useSportScope from '../../hooks/useSportScope';
import PlayerStatsModal from '../../components/admin/PlayerStatsModal';

/**
 * Super Admin / Federation Admin → the athlete registry.
 *
 * Terminology follows the scoped sport's profile: a judo club registers athletes
 * in a weight category, not players in a position.
 *
 * Registration itself is not here. It is fourteen fields, a photograph and three
 * eligibility rules that can refuse it, which is a page and not a dialog — see
 * AdminPlayerCreate at /admin/players/create.
 */
const AdminPlayersPage = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearcherTerm] = useState('');
  // The player whose season is being recorded; null when the editor is closed.
  const [statsFor, setStatsFor] = useState<any>(null);
  const scope = useSportScope();
  const p = scope.profile;
  const rosterOne = p?.roster || 'Player';
  const rosterMany = p?.rosterPlural || 'Players';
  const registry = p?.rosterRegistry || 'Athlete Registry';
  const posLabel = p?.rosterField || 'Position';
  const teamLabel = p?.competitor || 'Team';

  const { data: players, isLoading } = useQuery({
    queryKey: ['admin-players', searchTerm, scope.key],
    queryFn: async () => {
      const { data } = await apiClient.get('/players', { params: { search: searchTerm, ...scope.params } });
      return data.data;
    },
  });

  const deletePlayerMutation = useMutation({
    mutationFn: async (id: any) => { await apiClient.delete(`/players/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-players'] });
    },
  });

  return (
    <div>
      <PageHeader
        title={registry}
        subtitle={`Register and manage licensed ${rosterMany.toLowerCase()}`}
        actions={
          <>
            <div className="relative w-full sm:w-64">
              <Search
                size={16}
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tertiary"
              />
              <Input
                type="text"
                aria-label={`Search ${rosterMany.toLowerCase()} by name`}
                placeholder="Search name…"
                className="pl-9 text-sm"
                value={searchTerm}
                onChange={(e) => setSearcherTerm(e.target.value)}
              />
            </div>
            <Button size="sm" icon={Plus} to="/admin/players/create">
              Register {rosterOne.toLowerCase()}
            </Button>
          </>
        }
      />

      <Panel flush>
        {isLoading ? (
          <div className="p-4">
            <SkeletonList count={5} className="space-y-3">
              <Skeleton className="h-10 w-full" />
            </SkeletonList>
          </div>
        ) : !players?.length ? (
          <EmptyState icon={User} />
        ) : (
          <TableWrap>
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr>
                  <Th>{rosterOne}</Th>
                  <Th>{teamLabel}</Th>
                  <Th>{posLabel}</Th>
                  <Th>Jersey</Th>
                  <Th>Status</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {players.map((player) => (
                  <tr key={player.id} className="transition-colors duration-150 ease-standard hover:bg-surface-2">
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar src={player.photo} name={player.fullName} size="lg" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-primary">{player.fullName}</p>
                          <p className="truncate text-xs text-tertiary">
                            {player.nationality}{player.licenseNo ? ` · Lic ${player.licenseNo}` : ''}
                          </p>
                        </div>
                      </div>
                    </Td>
                    <Td>{player.team?.name}</Td>
                    <Td>{player.position || '—'}</Td>
                    <Td className="tabular-nums">{player.jerseyNumber ?? '—'}</Td>
                    <Td>
                      <StatusPill status={player.status} />
                    </Td>
                    <Td align="right">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton
                          icon={BarChart3}
                          size="sm"
                          label={`Season statistics for ${player.fullName}`}
                          onClick={() => setStatsFor(player)}
                        />
                        <IconButton icon={Edit2} size="sm" label={`Edit ${player.fullName}`} />
                        <IconButton
                          icon={Trash2}
                          size="sm"
                          variant="danger"
                          label={`Remove ${player.fullName}`}
                          onClick={() => { if (window.confirm(`Remove ${player.fullName}?`)) deletePlayerMutation.mutate(player.id); }}
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

      <PlayerStatsModal
        player={statsFor}
        open={!!statsFor}
        onClose={() => setStatsFor(null)}
      />
    </div>
  );
};

export default AdminPlayersPage;
