import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Activity, Play, StopCircle, Award, Loader2, ChevronRight } from 'lucide-react';
import apiClient from '../../api/client';
import useAuthStore from '../../store/authStore';
import Skeleton from '../../components/shared/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import useUiStore from '../../store/uiStore';

const ACTIVE_STATUSES = ['SCHEDULED', 'LIVE'];

const LiveReportingPage = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const pushToast = useUiStore((s) => s.pushToast);
  const [selectedFixtureId, setSelectedFixtureId] = useState(null);
  const [minute, setMinute] = useState(1);

  // Fetch fixtures assigned to this reporter (directly, or via their league).
  const { data: assignments, isLoading } = useQuery({
    queryKey: ['reporter-assignments', user?.id],
    queryFn: async () => {
      const { data } = await apiClient.get('/fixtures', { params: { reporterId: user.id } });
      return data.data;
    },
    enabled: !!user?.id,
  });

  const upcoming = (assignments || [])
    .filter((f) => ACTIVE_STATUSES.includes(f.status))
    .sort((a, b) => new Date(a.matchDate) - new Date(b.matchDate));

  const { data: fixture, isLoading: fixtureLoading } = useQuery({
    queryKey: ['match-details', selectedFixtureId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/fixtures/${selectedFixtureId}`);
      return data.data;
    },
    enabled: !!selectedFixtureId,
  });

  const invalidateMatch = () => queryClient.invalidateQueries({ queryKey: ['match-details', selectedFixtureId] });

  const startMatchMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post(`/fixtures/${selectedFixtureId}/result`, { homeScore: 0, awayScore: 0, status: 'LIVE' });
      await apiClient.post(`/fixtures/${selectedFixtureId}/events`, { eventType: 'KICKOFF', minute: 0 });
    },
    onSuccess: () => {
      invalidateMatch();
      queryClient.invalidateQueries({ queryKey: ['reporter-assignments'] });
      pushToast('Match is now live!', 'success');
    },
    onError: (err) => pushToast(err.response?.data?.message || 'Failed to start the match'),
  });

  const addEventMutation = useMutation({
    mutationFn: async (eventData) => {
      await apiClient.post(`/fixtures/${selectedFixtureId}/events`, eventData);
    },
    onSuccess: () => {
      invalidateMatch();
      pushToast('Event logged successfully!', 'success');
    },
    onError: (err) => pushToast(err.response?.data?.message || 'Failed to log event'),
  });

  const endHalfMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post(`/fixtures/${selectedFixtureId}/events`, { eventType: 'HALFTIME', minute });
    },
    onSuccess: () => {
      invalidateMatch();
      pushToast('First half ended', 'success');
    },
    onError: (err) => pushToast(err.response?.data?.message || 'Failed to end the half'),
  });

  const finishMatchMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post(`/fixtures/${selectedFixtureId}/events`, { eventType: 'FULLTIME', minute });
      await apiClient.post(`/fixtures/${selectedFixtureId}/result`, {
        homeScore: fixture?.homeScore || 0,
        awayScore: fixture?.awayScore || 0,
        status: 'COMPLETED',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reporter-assignments'] });
      pushToast('Match finished!', 'success');
      setSelectedFixtureId(null);
    },
    onError: (err) => pushToast(err.response?.data?.message || 'Failed to finish the match'),
  });

  if (isLoading) return <div className="p-8"><Skeleton type="card" count={3} /></div>;

  if (!selectedFixtureId) {
    return (
      <div className="p-6 sm:p-10 space-y-10 animate-in fade-in duration-500">
        <div className="space-y-2">
          <h1 className="text-4xl font-display uppercase tracking-tighter">Pitch-Side <span className="text-red">Reporting</span></h1>
          <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">Select an assigned match to begin live updates</p>
        </div>

        {upcoming.length === 0 ? (
          <EmptyState icon={Activity} title="No assigned matches" hint="You'll see fixtures here once a league admin assigns you to report on them." />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {upcoming.map(f => (
              <button
                key={f.id}
                onClick={() => setSelectedFixtureId(f.id)}
                className="bg-white dark:bg-surface-dark2 p-6 rounded-3xl border border-surface-3 dark:border-white/5 flex items-center justify-between group hover:border-red/20 transition-all"
              >
                <div className="flex items-center space-x-6">
                  <div className="p-3 bg-red/5 rounded-2xl text-red">
                    <Activity size={24} />
                  </div>
                  <div className="text-left">
                    <p className="text-xl font-display uppercase tracking-tight">
                      {f.homeTeam.name} <span className="opacity-20 mx-2 text-sm">VS</span> {f.awayTeam.name}
                    </p>
                    <p className="text-[10px] uppercase font-bold tracking-widest opacity-40">
                      {f.league.name} • {new Date(f.matchDate).toLocaleString()}
                      {f.status === 'LIVE' && <span className="ml-2 text-red">• LIVE</span>}
                    </p>
                  </div>
                </div>
                <ChevronRight size={20} className="opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (fixtureLoading || !fixture) {
    return <div className="p-8"><Skeleton type="card" count={3} /></div>;
  }

  const isScheduled = fixture.status === 'SCHEDULED';

  return (
    <div className="p-4 sm:p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      {/* Active Match Header */}
      <div className="bg-surface-dark text-white p-6 rounded-3xl space-y-6 shadow-2xl">
        <div className="flex justify-between items-center">
          <button onClick={() => setSelectedFixtureId(null)} className="text-[10px] font-bold uppercase tracking-widest opacity-40 hover:text-red">Exit Reporter</button>
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${fixture.status === 'LIVE' ? 'bg-red animate-pulse' : 'bg-white/10'}`}>
            <span className="text-[10px] font-bold uppercase tracking-tighter italic">{fixture.status === 'LIVE' ? 'Live Reporting' : fixture.status}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-center">
          <div className="flex-1 space-y-2">
            <p className="text-sm font-bold uppercase tracking-tight">{fixture.homeTeam.name}</p>
            <span className="text-5xl font-display">{fixture.homeScore || 0}</span>
          </div>
          <div className="px-8 text-white/20 font-display text-2xl">:</div>
          <div className="flex-1 space-y-2">
            <p className="text-sm font-bold uppercase tracking-tight">{fixture.awayTeam.name}</p>
            <span className="text-5xl font-display">{fixture.awayScore || 0}</span>
          </div>
        </div>
      </div>

      {isScheduled ? (
        <button
          onClick={() => startMatchMutation.mutate()}
          disabled={startMatchMutation.isPending}
          className="w-full flex items-center justify-center space-x-3 py-6 bg-green text-white rounded-3xl font-display text-2xl uppercase tracking-widest shadow-xl shadow-green/20 transition-all active:scale-95 disabled:opacity-50"
        >
          {startMatchMutation.isPending ? <Loader2 className="animate-spin" /> : <Play size={24} fill="currentColor" />}
          <span>Start Match</span>
        </button>
      ) : (
        <>
          <div className="flex items-center justify-center gap-3 bg-white dark:bg-surface-dark2 p-4 rounded-2xl border border-surface-3 dark:border-white/5">
            <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Match Minute</label>
            <input
              type="number"
              min={0}
              max={130}
              value={minute}
              onChange={(e) => setMinute(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-20 bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 rounded-xl p-2 text-center font-display text-xl"
            />
          </div>

          {/* Quick Action Logging Buttons */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Goal Home', type: 'GOAL', teamId: fixture.homeTeamId, color: 'bg-green text-white' },
              { label: 'Goal Away', type: 'GOAL', teamId: fixture.awayTeamId, color: 'bg-green text-white' },
              { label: 'Yellow Home', type: 'YELLOW_CARD', teamId: fixture.homeTeamId, color: 'bg-gold text-white' },
              { label: 'Yellow Away', type: 'YELLOW_CARD', teamId: fixture.awayTeamId, color: 'bg-gold text-white' },
              { label: 'Red Home', type: 'RED_CARD', teamId: fixture.homeTeamId, color: 'bg-red text-white' },
              { label: 'Red Away', type: 'RED_CARD', teamId: fixture.awayTeamId, color: 'bg-red text-white' },
            ].map((btn, i) => (
              <button
                key={i}
                onClick={() => addEventMutation.mutate({ eventType: btn.type, teamId: btn.teamId, minute })}
                disabled={addEventMutation.isPending}
                className={`p-6 rounded-3xl font-display text-xl uppercase tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-50 ${btn.color}`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-surface-dark2 p-6 rounded-3xl border border-surface-3 dark:border-white/5">
            <h3 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-4 border-b border-surface-3 dark:border-white/5 pb-2 text-center">Match Control</h3>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => endHalfMutation.mutate()}
                disabled={endHalfMutation.isPending}
                className="flex items-center justify-center space-x-3 py-4 bg-surface-2 dark:bg-white/5 rounded-2xl font-display text-lg uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-50"
              >
                {endHalfMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : <StopCircle size={20} />}
                <span>End First Half</span>
              </button>
              <button
                onClick={() => { if (window.confirm('Finish this match? This will lock in the final score.')) finishMatchMutation.mutate(); }}
                disabled={finishMatchMutation.isPending}
                className="flex items-center justify-center space-x-3 py-4 bg-surface-dark text-white rounded-2xl font-display text-lg uppercase tracking-widest hover:bg-surface-dark2 transition-all disabled:opacity-50"
              >
                {finishMatchMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : <Award size={20} />}
                <span>Finish Match</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LiveReportingPage;
