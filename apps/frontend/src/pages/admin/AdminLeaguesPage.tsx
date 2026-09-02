import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Trophy, Plus, Trash2, UserPlus, ShieldCheck, CalendarPlus } from 'lucide-react';
import apiClient from '../../api/client';
import { PageHeader, Panel, TableWrap, Th, Td } from '../../components/admin/AdminUI';
import {
  Button, IconButton, Modal, Input, Select, Field, StatusPill, EmptyState, Skeleton, SkeletonList,
} from '../../components/ui';
import useSportScope from '../../hooks/useSportScope';

/**
 * Super Admin / Federation Admin → competitions.
 *
 * Terminology follows the scoped sport's profile (a cycling tour is not a
 * "league"), and the presentation is the shared admin kit — PageHeader, Panel,
 * TableWrap — so this reads as the same product as the dashboard.
 */
const AdminLeaguesPage = () => {
  const queryClient = useQueryClient();
  const scope = useSportScope();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReporterModalOpen, setIsModalReporterOpen] = useState(false);
  const [isAdminModalOpen, setIsModalAdminOpen] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [reporterEmail, setReporterEmail] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const p = scope.profile;
  const compOne = p?.competition || 'League';
  const compMany = p?.competitionPlural || 'Leagues';
  const formats = p?.formats || [
    { value: 'LEAGUE', label: 'League (round-robin)' },
    { value: 'KNOCKOUT', label: 'Knockout / Cup' },
    { value: 'GROUP_KNOCKOUT', label: 'Groups + Knockout' },
    { value: 'ROUND_ROBIN', label: 'Double round-robin' },
  ];

  const { data: leagues, isLoading } = useQuery({
    queryKey: ['admin-leagues', scope.key],
    queryFn: async () => {
      const { data } = await apiClient.get('/leagues', { params: scope.params });
      return data.data;
    },
  });

  const { data: sports } = useQuery({
    queryKey: ['admin-sports-list'],
    queryFn: async () => {
      const { data } = await apiClient.get('/sports');
      return data.data;
    },
  });

  const createLeagueMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiClient.post('/leagues', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-leagues'] });
      setIsModalOpen(false);
      reset();
      alert('League created successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to create league');
    }
  });

  const deleteLeagueMutation = useMutation({
    mutationFn: async (id: any) => {
      await apiClient.delete(`/leagues/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-leagues'] });
      alert('League deleted successfully');
    }
  });

  const generateFixturesMutation = useMutation({
    mutationFn: async ({ id, doubleRound, force }: any) => {
      const { data } = await apiClient.post(`/leagues/${id}/generate-fixtures`, { doubleRound, force });
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-fixtures'] });
      alert(data?.message || 'Fixtures generated');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to generate fixtures');
    }
  });

  const handleGenerate = (league) => {
    const doubleRound = window.confirm(`Generate a fixture schedule for "${league.name}"?\n\nOK = double round (home & away)\nCancel = single round`);
    generateFixturesMutation.mutate({ id: league.id, doubleRound, force: true });
  };

  const assignReporterMutation = useMutation({
    mutationFn: async ({ leagueId, email }: any) => {
      await apiClient.post(`/leagues/${leagueId}/assign-reporter`, { email });
    },
    onSuccess: () => {
      setIsModalReporterOpen(false);
      setReporterEmail('');
      alert('Reporter authorized successfully!');
    }
  });

  const assignAdminMutation = useMutation({
    mutationFn: async ({ leagueId, email }: any) => {
      await apiClient.post(`/admin/assign-league-admin`, { leagueId, email });
    },
    onSuccess: () => {
      setIsModalAdminOpen(false);
      setAdminEmail('');
      alert('League Admin assigned successfully!');
    }
  });

  const onSubmit = (data) => {
    createLeagueMutation.mutate(data);
  };

  return (
    <div>
      <PageHeader
        title={`Manage ${compMany.toLowerCase()}`}
        subtitle={`Create and delegate ${p ? `${p.label.toLowerCase()} competitions` : 'sports competitions'}`}
        actions={
          <Button size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
            Create {compOne.toLowerCase()}
          </Button>
        }
      />

      <Panel flush>
        {isLoading ? (
          <div className="p-4">
            <SkeletonList count={5} className="space-y-3">
              <Skeleton className="h-10 w-full" />
            </SkeletonList>
          </div>
        ) : !leagues?.length ? (
          <EmptyState icon={Trophy} />
        ) : (
          <TableWrap>
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr>
                  <Th>{compOne} name</Th>
                  <Th>Sport</Th>
                  <Th>Season</Th>
                  <Th>Status</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {leagues.map((league) => (
                  <tr key={league.id} className="transition-colors duration-150 ease-standard hover:bg-surface-2">
                    <Td className="text-sm font-medium text-primary">{league.name}</Td>
                    <Td>{league.sport?.name}</Td>
                    <Td className="tabular-nums">{league.season}</Td>
                    <Td>
                      <StatusPill status={league.status} />
                    </Td>
                    <Td align="right">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton
                          icon={ShieldCheck}
                          size="sm"
                          label={`Assign ${compOne.toLowerCase()} admin`}
                          onClick={() => { setSelectedLeague(league); setIsModalAdminOpen(true); }}
                        />
                        <IconButton
                          icon={CalendarPlus}
                          size="sm"
                          label="Generate fixtures"
                          onClick={() => handleGenerate(league)}
                        />
                        <IconButton
                          icon={UserPlus}
                          size="sm"
                          label="Authorise reporter"
                          onClick={() => { setSelectedLeague(league); setIsModalReporterOpen(true); }}
                        />
                        <IconButton
                          icon={Trash2}
                          size="sm"
                          variant="danger"
                          label={`Delete ${league.name}`}
                          onClick={() => { if (window.confirm('Delete this league?')) deleteLeagueMutation.mutate(league.id); }}
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

      {/* Create competition */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Create ${compOne.toLowerCase()}`}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label={`${compOne} name`} className="md:col-span-2">
              {(f) => <Input {...f} {...register('name', { required: true })} placeholder="e.g. Rwanda Premier League" />}
            </Field>

            <Field label="Sport">
              {(f) => (scope.isScoped ? (
                <div
                  id={f.id}
                  className="flex min-h-tap w-full items-center rounded-input border border-hairline bg-surface-2 px-4 text-sm text-secondary"
                >
                  {scope.sport?.name || 'Your sport'}
                </div>
              ) : (
                <Select
                  {...f}
                  size="md"
                  {...register('sportId', { required: true })}
                  placeholder="Select sport…"
                  options={(sports || []).map((s) => ({ value: s.id, label: s.name }))}
                />
              ))}
            </Field>

            <Field label="Season">
              {(f) => <Input {...f} {...register('season', { required: true })} placeholder="2025/2026" />}
            </Field>

            <Field label="Gender">
              {(f) => (
                <Select
                  {...f}
                  size="md"
                  {...register('gender')}
                  options={[
                    { value: 'MALE', label: 'Male' },
                    { value: 'FEMALE', label: 'Female' },
                    { value: 'MIXED', label: 'Mixed' },
                  ]}
                />
              )}
            </Field>

            <Field label="Competition level">
              {(f) => (
                <Select
                  {...f}
                  size="md"
                  {...register('level')}
                  options={[
                    { value: 'NATIONAL', label: 'National' },
                    { value: 'REGIONAL', label: 'Regional' },
                    { value: 'DISTRICT', label: 'District' },
                    { value: 'SCHOOL', label: 'School' },
                  ]}
                />
              )}
            </Field>

            <Field label="Age category">
              {(f) => (
                <Select
                  {...f}
                  size="md"
                  {...register('ageCategory')}
                  options={[
                    { value: 'SENIOR', label: 'Senior' },
                    { value: 'U20', label: 'U20' },
                    { value: 'U17', label: 'U17' },
                    { value: 'U15', label: 'U15' },
                    { value: 'U13', label: 'U13' },
                    { value: 'JUNIOR', label: 'Junior' },
                    { value: 'VETERAN', label: 'Veteran' },
                    { value: 'ALL', label: 'All ages' },
                  ]}
                />
              )}
            </Field>

            <Field label="Format">
              {(f) => (
                <Select
                  {...f}
                  size="md"
                  {...register('format')}
                  options={formats.map((x) => ({ value: x.value, label: x.label }))}
                />
              )}
            </Field>

            <Field label="Max teams">
              {(f) => <Input {...f} type="number" min="2" defaultValue={16} {...register('maxTeams')} />}
            </Field>

            <Field label="Start date">
              {(f) => <Input {...f} type="date" {...register('startDate')} />}
            </Field>

            <Field label="End date">
              {(f) => <Input {...f} type="date" {...register('endDate')} />}
            </Field>
          </div>

          <Button type="submit" block loading={createLeagueMutation.isPending}>
            Create {compOne.toLowerCase()}
          </Button>
        </form>
      </Modal>

      {/* Delegation */}
      <Modal open={isReporterModalOpen} onClose={() => setIsModalReporterOpen(false)} title="Authorise match reporter">
        <div className="space-y-4">
          <Field label="Reporter email">
            {(f) => (
              <Input
                {...f}
                type="email"
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
                placeholder="reporter@email.com"
              />
            )}
          </Field>
          <Button
            block
            onClick={() => assignReporterMutation.mutate({ leagueId: selectedLeague.id, email: reporterEmail })}
          >
            Authorise
          </Button>
        </div>
      </Modal>

      <Modal open={isAdminModalOpen} onClose={() => setIsModalAdminOpen(false)} title={`Assign ${compOne.toLowerCase()} admin`}>
        <div className="space-y-4">
          <Field label="Admin email">
            {(f) => (
              <Input
                {...f}
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@email.com"
              />
            )}
          </Field>
          <Button
            block
            onClick={() => assignAdminMutation.mutate({ leagueId: selectedLeague.id, email: adminEmail })}
          >
            Assign admin
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminLeaguesPage;
