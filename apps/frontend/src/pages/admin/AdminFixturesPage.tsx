import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, CalendarOff, Trash2, Tv, BarChart3, AlertTriangle } from 'lucide-react';
import apiClient from '../../api/client';
import { PageHeader, Panel, TableWrap, Th, Td } from '../../components/admin/AdminUI';
import {
  Button, IconButton, Modal, Field, Input, Select, StatusPill, EmptyState, Skeleton, SkeletonList,
} from '../../components/ui';
import useSportScope from '../../hooks/useSportScope';
import useUmugandaLookup from '../../components/umuganda/useUmuganda';
import UmugandaConflictDialog from '../../components/umuganda/UmugandaConflictDialog';
import UmugandaMark from '../../components/umuganda/UmugandaMark';
import { isUmugandaTouched } from '../../utils/umuganda';

/**
 * Fixture scheduling.
 *
 * Presentation only comes from the admin kit — PageHeader, Panel, TableWrap — and
 * status colour from StatusPill, so a LIVE fixture reads the same here as it does
 * on the public side. Nothing about the scope, the mutations or the Umuganda
 * conflict flow changed.
 */

const AdminFixturesPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const scope = useSportScope();

  const { register, handleSubmit, reset, watch } = useForm();

  // Umuganda awareness. `lookup` is indexed client-side so the warning appears
  // while the admin is still choosing the date; the server re-checks on save.
  const { lookup } = useUmugandaLookup();
  const [decisionFor, setDecisionFor] = useState<any>(null);
  const pendingDate = watch('matchDate');
  const pendingUmuganda = pendingDate ? lookup(pendingDate) : null;
  const p = scope.profile;
  const evOne = p?.event || 'Fixture';
  const evMany = p?.eventPlural || 'Fixtures';
  const compOne = p?.competition || 'League';

  const { data: fixtures, isLoading: fixturesLoading } = useQuery({
    queryKey: ['admin-fixtures', scope.key],
    queryFn: async () => {
      const { data } = await apiClient.get('/fixtures', { params: scope.params });
      return data.data;
    },
  });

  const { data: leagues } = useQuery({
    queryKey: ['admin-leagues-list', scope.key],
    queryFn: async () => {
      const { data } = await apiClient.get('/leagues', { params: scope.params });
      return data.data;
    },
  });

  // Fetch teams based on selected league (needs reactive state from form)
  const [selectedLeagueId, setSelectedLeagueId] = useState('');
  const { data: teams } = useQuery({
    queryKey: ['admin-teams-list', selectedLeagueId],
    queryFn: async () => {
      if (!selectedLeagueId) return [];
      const { data } = await apiClient.get('/teams', { params: { leagueId: selectedLeagueId } });
      return data.data;
    },
    enabled: !!selectedLeagueId
  });

  const createFixtureMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: body } = await apiClient.post('/fixtures', data);
      return body;
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-fixtures'] });
      queryClient.invalidateQueries({ queryKey: ['umuganda'] });
      setIsModalOpen(false);
      reset();
      // The fixture is always created. If it landed on Umuganda, ask the admin
      // what to do rather than deciding for them.
      if (res?.umugandaConflict) {
        setDecisionFor({ kind: 'league', fixture: res.data, umugandaDay: res.umugandaConflict.umugandaDay });
      }
    }
  });

  const deleteFixtureMutation = useMutation({
    mutationFn: async (id: any) => {
      await apiClient.delete(`/fixtures/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-fixtures'] });
      alert('Fixture deleted successfully');
    }
  });

  const onSubmit = (data) => {
    createFixtureMutation.mutate(data);
  };

  // ── Streaming URL ──
  const [streamFixture, setStreamFixture] = useState(null);
  const [streamUrl, setStreamUrl] = useState('');
  const streamMutation = useMutation({
    mutationFn: async ({ id, url }: any) => { await apiClient.patch(`/fixtures/${id}`, { streamUrl: url, streamActive: !!url }); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-fixtures'] }); setStreamFixture(null); },
    onError: (err: any) => alert(err.response?.data?.message || 'Failed to save streaming URL'),
  });

  // ── Match statistics (both teams) ──
  const STAT_FIELDS = [
    ['possession', 'Possession %'], ['shots', 'Shots'], ['shotsOnTarget', 'On target'],
    ['shotsInsideBox', 'Shots in box'], ['shotsOutsideBox', 'Shots out box'], ['corners', 'Corners'],
    ['offsides', 'Offsides'], ['fouls', 'Fouls'], ['yellowCards', 'Yellow cards'],
    ['redCards', 'Red cards'], ['gkSaves', 'GK saves'], ['passAccuracy', 'Pass accuracy %'], ['xg', 'Expected goals'],
  ];
  const [statsFixture, setStatsFixture] = useState(null);
  const [homeStats, setHomeStats] = useState({});
  const [awayStats, setAwayStats] = useState({});
  const openStats = async (f) => {
    setStatsFixture(f);
    const detail = (await apiClient.get(`/fixtures/${f.id}`)).data.data;
    const h = (detail.stats || []).find((s) => s.teamId === f.homeTeamId) || {};
    const a = (detail.stats || []).find((s) => s.teamId === f.awayTeamId) || {};
    setHomeStats(h); setAwayStats(a);
  };
  const statsMutation = useMutation({
    mutationFn: async () => {
      await apiClient.put(`/fixtures/${statsFixture.id}/stats`, { teamId: statsFixture.homeTeamId, ...homeStats });
      await apiClient.put(`/fixtures/${statsFixture.id}/stats`, { teamId: statsFixture.awayTeamId, ...awayStats });
    },
    onSuccess: () => { setStatsFixture(null); alert('Match statistics saved'); },
    onError: (err: any) => alert(err.response?.data?.message || 'Failed to save statistics'),
  });

  const rows = fixtures || [];

  return (
    <div>
      <PageHeader
        title={`${evMany} management`}
        subtitle={`Schedule ${evMany.toLowerCase()} and assign reporters`}
        actions={
          <Button size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
            New {evOne.toLowerCase()}
          </Button>
        }
      />

      {fixturesLoading ? (
        <Panel flush>
          <SkeletonList count={5} className="space-y-2 p-4">
            <Skeleton className="h-12 w-full" />
          </SkeletonList>
        </Panel>
      ) : rows.length === 0 ? (
        <Panel>
          <EmptyState
            icon={CalendarOff}
            title={`No ${evMany.toLowerCase()} yet`}
            hint={`Scheduled ${evMany.toLowerCase()} appear here.`}
            action={
              <Button size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
                New {evOne.toLowerCase()}
              </Button>
            }
          />
        </Panel>
      ) : (
        <Panel flush>
          <TableWrap>
            <table className="w-full min-w-[820px] text-left">
              <thead>
                <tr>
                  <Th>Match</Th>
                  <Th>{compOne}</Th>
                  <Th>Date &amp; time</Th>
                  <Th>Venue</Th>
                  <Th>Status</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((f) => (
                  <tr key={f.id} className="transition-colors duration-150 ease-standard hover:bg-surface-2">
                    <Td>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-primary">{f.homeTeam.name}</span>
                        <span className="text-xs text-tertiary">v</span>
                        <span className="text-sm font-medium text-primary">{f.awayTeam.name}</span>
                      </div>
                    </Td>
                    <Td>{f.league.name}</Td>
                    <Td className="whitespace-nowrap">
                      <span className="block tabular-nums text-primary">
                        {f.matchDate ? new Date(f.matchDate).toLocaleDateString() : 'TBD'}
                      </span>
                      <span className="block text-xs tabular-nums text-tertiary">
                        {f.matchDate ? new Date(f.matchDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'}
                      </span>
                    </Td>
                    <Td>{f.venue || 'TBD'}</Td>
                    <Td>
                      <div className="flex flex-col items-start gap-1.5">
                        <StatusPill status={f.status} />
                        {(isUmugandaTouched(f.status) || lookup(f.matchDate)) && (
                          <button
                            type="button"
                            onClick={() => setDecisionFor({ kind: 'league', fixture: f, umugandaDay: lookup(f.matchDate) })}
                            className="inline-flex items-center gap-1 rounded-pill border border-brand/30 px-2 py-1 text-xs font-semibold text-brand-text transition-colors duration-150 ease-standard hover:bg-brand-tint"
                          >
                            <AlertTriangle size={12} aria-hidden="true" />
                            Umuganda
                          </button>
                        )}
                      </div>
                    </Td>
                    <Td align="right">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton
                          icon={Tv}
                          label="Streaming URL"
                          size="sm"
                          className={f.streamUrl ? 'text-brand-text' : undefined}
                          onClick={() => { setStreamFixture(f); setStreamUrl(f.streamUrl || ''); }}
                        />
                        <IconButton
                          icon={BarChart3}
                          label="Match statistics"
                          size="sm"
                          onClick={() => openStats(f)}
                        />
                        <IconButton
                          icon={Trash2}
                          label="Delete fixture"
                          size="sm"
                          variant="danger"
                          onClick={() => { if (window.confirm('Delete this fixture?')) deleteFixtureMutation.mutate(f.id); }}
                        />
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Panel>
      )}

      {/* New Fixture Modal */}
      {isModalOpen && (
        <Modal open onClose={() => setIsModalOpen(false)} title={`Schedule new ${evOne.toLowerCase()}`}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={`Select ${compOne.toLowerCase()}`} className="sm:col-span-2">
                {(fp) => {
                  // The league drives the team lists, so its change has to reach
                  // both react-hook-form and local state — hence the wrapper.
                  const reg = register('leagueId', { required: true });
                  return (
                    <Select
                      {...fp}
                      {...reg}
                      size="md"
                      placeholder="Choose a competition…"
                      options={(leagues || []).map((l) => ({ value: l.id, label: l.name }))}
                      onChange={(e) => { reg.onChange(e); setSelectedLeagueId(e.target.value); }}
                    />
                  );
                }}
              </Field>

              <Field label="Home team">
                {(fp) => (
                  <Select
                    {...fp}
                    {...register('homeTeamId', { required: true })}
                    size="md"
                    placeholder="Select home…"
                    options={(teams || []).map((tm) => ({ value: tm.id, label: tm.name }))}
                  />
                )}
              </Field>

              <Field label="Away team">
                {(fp) => (
                  <Select
                    {...fp}
                    {...register('awayTeamId', { required: true })}
                    size="md"
                    placeholder="Select away…"
                    options={(teams || []).map((tm) => ({ value: tm.id, label: tm.name }))}
                  />
                )}
              </Field>

              <Field label="Match date & time">
                {(fp) => <Input {...fp} type="datetime-local" {...register('matchDate', { required: true })} />}
              </Field>

              <Field label="Venue">
                {(fp) => <Input {...fp} type="text" {...register('venue')} placeholder="Stadium name" />}
              </Field>

              {pendingUmuganda && (
                <div className="flex items-start gap-2 rounded-card border border-brand/30 bg-brand-tint p-3 sm:col-span-2">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0 text-brand-text" aria-hidden="true" />
                  <div className="min-w-0">
                    <UmugandaMark size="sm" />
                    <p className="mt-1 text-xs text-secondary">
                      This date is an expected Umuganda day ({pendingUmuganda.startTime}-{pendingUmuganda.endTime}).
                      The match will still be created — you will be asked to confirm, move, or schedule it after Umuganda.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <Button type="submit" size="sm" block loading={createFixtureMutation.isPending}>
              Create fixture
            </Button>
          </form>
        </Modal>
      )}

      {/* Streaming URL Modal */}
      {streamFixture && (
        <Modal open onClose={() => setStreamFixture(null)} title="Live streaming URL">
          <div className="space-y-4">
            <p className="text-sm text-secondary">
              Paste a broadcast link (YouTube Live, CAF TV, FIFA+, ESPN, any http(s) URL). Viewers get an active{' '}
              <b className="font-semibold text-primary">Watch live</b> button on the match page.
            </p>
            <Input
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              placeholder="https://youtube.com/live/..."
              aria-label="Streaming URL"
            />
            <div className="flex gap-2">
              {streamFixture?.streamUrl && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => streamMutation.mutate({ id: streamFixture.id, url: '' })}
                >
                  Remove
                </Button>
              )}
              <Button
                size="sm"
                className="flex-1"
                loading={streamMutation.isPending}
                onClick={() => streamMutation.mutate({ id: streamFixture.id, url: streamUrl.trim() })}
              >
                Save stream link
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Match Statistics Modal */}
      {statsFixture && (
        <Modal open onClose={() => setStatsFixture(null)} title="Match statistics">
          <div className="space-y-4">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center">
              <p className="truncate text-sm font-medium text-primary">{statsFixture.homeTeam?.name}</p>
              <span className="text-xs text-tertiary">Stat</span>
              <p className="truncate text-sm font-medium text-primary">{statsFixture.awayTeam?.name}</p>
            </div>
            <div className="scroll-contain max-h-80 space-y-2 overflow-y-auto pr-1">
              {STAT_FIELDS.map(([key, label]) => (
                <div key={key} className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 sm:gap-2">
                  <Input
                    type="number"
                    step={key === 'xg' ? '0.01' : '1'}
                    value={homeStats[key] ?? ''}
                    onChange={(e) => setHomeStats((s) => ({ ...s, [key]: e.target.value }))}
                    aria-label={`${label} — ${statsFixture.homeTeam?.name}`}
                    className="px-2 text-center tabular-nums"
                  />
                  <span className="w-16 text-center text-xs leading-tight text-tertiary sm:w-24">{label}</span>
                  <Input
                    type="number"
                    step={key === 'xg' ? '0.01' : '1'}
                    value={awayStats[key] ?? ''}
                    onChange={(e) => setAwayStats((s) => ({ ...s, [key]: e.target.value }))}
                    aria-label={`${label} — ${statsFixture.awayTeam?.name}`}
                    className="px-2 text-center tabular-nums"
                  />
                </div>
              ))}
            </div>
            <Button size="sm" block loading={statsMutation.isPending} onClick={() => statsMutation.mutate()}>
              Save statistics
            </Button>
          </div>
        </Modal>
      )}

      {/* Umuganda decision — the four options, never an auto-cancel. */}
      {decisionFor && (
        <UmugandaConflictDialog
          open
          onClose={() => setDecisionFor(null)}
          kind={decisionFor.kind}
          fixture={decisionFor.fixture}
          umugandaDay={decisionFor.umugandaDay}
        />
      )}
    </div>
  );
};

export default AdminFixturesPage;
