import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Activity, Play, StopCircle, Award, AlertTriangle, Users, Loader2, ChevronRight } from 'lucide-react';
import apiClient from '../../api/client';
import useAuthStore from '../../store/authStore';
import Skeleton from '../../components/shared/Skeleton';

const LiveReportingPage = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedFixture, setSelectedFixture] = useState(null);

  // Fetch fixtures assigned to this reporter
  const { data: assignments, isLoading } = useQuery({
    queryKey: ['reporter-assignments', user.id],
    queryFn: async () => {
      // In a real app, you'd have a specific endpoint for reporter's matches
      const { data } = await apiClient.get('/fixtures', { params: { status: 'SCHEDULED' } }); 
      return data.data;
    },
  });

  const addEventMutation = useMutation({
    mutationFn: async (eventData) => {
      await apiClient.post(`/fixtures/${selectedFixture.id}/events`, eventData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['match-details', selectedFixture.id]);
      alert('Event logged successfully!');
    }
  });

  if (isLoading) return <div className="p-8"><Skeleton type="card" count={3} /></div>;

  if (!selectedFixture) {
    return (
      <div className="p-6 sm:p-10 space-y-10 animate-in fade-in duration-500">
        <div className="space-y-2">
          <h1 className="text-4xl font-display uppercase tracking-tighter">Pitch-Side <span className="text-red">Reporting</span></h1>
          <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">Select an assigned match to begin live updates</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {assignments?.map(f => (
            <button 
              key={f.id}
              onClick={() => setSelectedFixture(f)}
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
                  <p className="text-[10px] uppercase font-bold tracking-widest opacity-40">{f.league.name} • {new Date(f.matchDate).toLocaleString()}</p>
                </div>
              </div>
              <ChevronRight size={20} className="opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      {/* Active Match Header */}
      <div className="bg-surface-dark text-white p-6 rounded-3xl space-y-6 shadow-2xl">
        <div className="flex justify-between items-center">
          <button onClick={() => setSelectedFixture(null)} className="text-[10px] font-bold uppercase tracking-widest opacity-40 hover:text-red">Exit Reporter</button>
          <div className="flex items-center space-x-2 bg-red px-3 py-1 rounded-full animate-pulse">
            <span className="text-[10px] font-bold uppercase tracking-tighter italic">Live Reporting</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-center">
          <div className="flex-1 space-y-2">
            <p className="text-sm font-bold uppercase tracking-tight">{selectedFixture.homeTeam.name}</p>
            <span className="text-5xl font-display">{selectedFixture.homeScore || 0}</span>
          </div>
          <div className="px-8 text-white/20 font-display text-2xl">:</div>
          <div className="flex-1 space-y-2">
            <p className="text-sm font-bold uppercase tracking-tight">{selectedFixture.awayTeam.name}</p>
            <span className="text-5xl font-display">{selectedFixture.awayScore || 0}</span>
          </div>
        </div>
      </div>

      {/* Quick Action Logging Buttons */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Goal Home', type: 'GOAL', teamId: selectedFixture.homeTeamId, color: 'bg-green text-white' },
          { label: 'Goal Away', type: 'GOAL', teamId: selectedFixture.awayTeamId, color: 'bg-green text-white' },
          { label: 'Yellow Card', type: 'YELLOW_CARD', color: 'bg-gold text-white' },
          { label: 'Red Card', type: 'RED_CARD', color: 'bg-red text-white' },
        ].map((btn, i) => (
          <button
            key={i}
            onClick={() => addEventMutation.mutate({ eventType: btn.type, teamId: btn.teamId, minute: 45 })} // Minute should be dynamic in real use
            className={`p-6 rounded-3xl font-display text-xl uppercase tracking-widest shadow-xl transition-all active:scale-95 ${btn.color}`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-surface-dark2 p-6 rounded-3xl border border-surface-3 dark:border-white/5">
        <h3 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-4 border-b border-surface-3 dark:border-white/5 pb-2 text-center">Match Control</h3>
        <div className="grid grid-cols-1 gap-3">
          <button className="flex items-center justify-center space-x-3 py-4 bg-surface-2 dark:bg-white/5 rounded-2xl font-display text-lg uppercase tracking-widest hover:bg-white/10 transition-all">
            <StopCircle size={20} />
            <span>End First Half</span>
          </button>
          <button className="flex items-center justify-center space-x-3 py-4 bg-surface-dark text-white rounded-2xl font-display text-lg uppercase tracking-widest hover:bg-surface-dark2 transition-all">
            <Play size={20} fill="currentColor" />
            <span>Finish Match</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveReportingPage;
