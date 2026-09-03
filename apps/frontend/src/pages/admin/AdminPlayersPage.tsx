import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Trash2, Edit2, User, Plus, BarChart3 } from 'lucide-react';
import apiClient from '../../api/client';
import { PageHeader, Panel, TableWrap, Th, Td } from '../../components/admin/AdminUI';
import {
  Button, IconButton, Modal, Input, Select, Field, Avatar, StatusPill, EmptyState, Skeleton, SkeletonList,
} from '../../components/ui';
import useSportScope from '../../hooks/useSportScope';
import PlayerStatsModal from '../../components/admin/PlayerStatsModal';

/**
 * Super Admin / Federation Admin → the athlete registry.
 *
 * Terminology follows the scoped sport's profile: a judo club registers athletes
 * in a weight category, not players in a position.
 */
const EMPTY = {
  teamId: '', fullName: '', dateOfBirth: '', nationality: 'Rwandan', gender: 'MALE',
  position: '', jerseyNumber: '', skillLevel: 'AMATEUR', idNumber: '', licenseNo: '', height: '', weight: '',
};

const AdminPlayersPage = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearcherTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [photoFile, setPhotoFile] = useState(null);
  // The player whose season is being recorded; null when the editor is closed.
  const [statsFor, setStatsFor] = useState<any>(null);
  const [formError, setFormError] = useState('');
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

  const { data: teams } = useQuery({
    queryKey: ['admin-teams-forplayers', scope.key],
    queryFn: async () => {
      const { data } = await apiClient.get('/teams', { params: { status: 'VERIFIED', ...scope.params } });
      return data.data;
    },
  });

  const createPlayerMutation = useMutation({
    mutationFn: async (payload: any) => {
      const fd = new FormData();
      Object.entries(payload).forEach(([k, v]: any) => { if (v !== '' && v != null) fd.append(k, v as any); });
      if (photoFile) fd.append('photo', photoFile);
      const { data } = await apiClient.post('/players', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-players'] });
      setIsModalOpen(false);
      setForm(EMPTY);
      setPhotoFile(null);
      setFormError('');
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Failed to register player');
    },
  });

  const deletePlayerMutation = useMutation({
    mutationFn: async (id: any) => { await apiClient.delete(`/players/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-players'] });
    },
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.teamId) return setFormError('Please select a team');
    if (!form.fullName.trim()) return setFormError('Full name is required');
    createPlayerMutation.mutate(form);
  };

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
            <Button
              size="sm"
              icon={Plus}
              onClick={() => { setForm(EMPTY); setPhotoFile(null); setFormError(''); setIsModalOpen(true); }}
            >
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

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Register ${rosterOne.toLowerCase()}`}>
        <form onSubmit={submit} className="space-y-5">
          {formError && (
            <p role="alert" className="rounded-control bg-danger/10 p-3 text-sm font-semibold text-danger-text">
              {formError}
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label={teamLabel}>
              {(f) => (
                <Select
                  {...f}
                  size="md"
                  value={form.teamId}
                  onChange={set('teamId')}
                  placeholder={`Select ${teamLabel.toLowerCase()}…`}
                  options={(teams || []).map((tm) => ({ value: tm.id, label: tm.name }))}
                />
              )}
            </Field>
            <Field label="Full name">
              {(f) => <Input {...f} value={form.fullName} onChange={set('fullName')} placeholder={`${rosterOne} name`} />}
            </Field>
            <Field label="Date of birth">
              {(f) => <Input {...f} type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} />}
            </Field>
            <Field label="Gender">
              {(f) => (
                <Select
                  {...f}
                  size="md"
                  value={form.gender}
                  onChange={set('gender')}
                  options={[
                    { value: 'MALE', label: 'Male' },
                    { value: 'FEMALE', label: 'Female' },
                  ]}
                />
              )}
            </Field>
            <Field label="Nationality">
              {(f) => <Input {...f} value={form.nationality} onChange={set('nationality')} placeholder="Rwandan" />}
            </Field>
            <Field label="National ID / passport">
              {(f) => <Input {...f} value={form.idNumber} onChange={set('idNumber')} placeholder="ID number" />}
            </Field>
            <Field label={posLabel}>
              {(f) => (
                <Input
                  {...f}
                  value={form.position}
                  onChange={set('position')}
                  placeholder={`e.g. ${posLabel === 'Weight Category' ? '-73kg' : posLabel === 'Specialty' ? 'Sprinter' : posLabel === 'Discipline' ? 'Singles' : 'Goalkeeper'}`}
                />
              )}
            </Field>
            <Field label="Jersey number">
              {(f) => <Input {...f} type="number" value={form.jerseyNumber} onChange={set('jerseyNumber')} placeholder="10" />}
            </Field>
            <Field label="Licence number">
              {(f) => <Input {...f} value={form.licenseNo} onChange={set('licenseNo')} placeholder="Federation licence" />}
            </Field>
            <Field label="Skill level">
              {(f) => (
                <Select
                  {...f}
                  size="md"
                  value={form.skillLevel}
                  onChange={set('skillLevel')}
                  options={[
                    { value: 'AMATEUR', label: 'Amateur' },
                    { value: 'SEMI_PROFESSIONAL', label: 'Semi-professional' },
                    { value: 'PROFESSIONAL', label: 'Professional' },
                    { value: 'ELITE', label: 'Elite' },
                  ]}
                />
              )}
            </Field>
            <Field label="Height (cm)">
              {(f) => <Input {...f} type="number" value={form.height} onChange={set('height')} placeholder="180" />}
            </Field>
            <Field label="Weight (kg)">
              {(f) => <Input {...f} type="number" value={form.weight} onChange={set('weight')} placeholder="75" />}
            </Field>
            <Field label="Photo" className="md:col-span-2">
              {(f) => (
                <Input
                  {...f}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  className="py-2 text-sm file:mr-3 file:rounded-pill file:border-0 file:bg-surface-2 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-secondary"
                />
              )}
            </Field>
          </div>

          <Button type="submit" block loading={createPlayerMutation.isPending}>
            Register {rosterOne.toLowerCase()}
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default AdminPlayersPage;
