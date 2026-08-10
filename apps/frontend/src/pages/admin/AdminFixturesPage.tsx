import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Activity, Plus, Calendar, MapPin, Trophy, Clock, Search, Trash2, Edit2, Loader2, Tv, BarChart3 } from 'lucide-react';
import apiClient from '../../api/client';
import AdminTable from '../../components/admin/AdminTable';
import AdminModal from '../../components/admin/AdminModal';
import Skeleton from '../../components/shared/Skeleton';
import useSportScope from '../../hooks/useSportScope';

const AdminFixturesPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const scope = useSportScope();

  const { register, handleSubmit, reset } = useForm();
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
    mutationFn: async (data) => {
      await apiClient.post('/fixtures', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-fixtures'] });
      setIsModalOpen(false);
      reset();
      alert('Match scheduled successfully!');
    }
  });

  const deleteFixtureMutation = useMutation({
    mutationFn: async (id) => {
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
    mutationFn: async ({ id, url }) => { await apiClient.patch(`/fixtures/${id}`, { streamUrl: url, streamActive: !!url }); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-fixtures'] }); setStreamFixture(null); },
    onError: (err) => alert(err.response?.data?.message || 'Failed to save streaming URL'),
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
    onError: (err) => alert(err.response?.data?.message || 'Failed to save statistics'),
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-display uppercase tracking-tighter">{evMany} <span className="text-red">Management</span></h1>
          <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">Schedule {evMany.toLowerCase()} and assign reporters</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-red text-white px-8 py-3 rounded-xl font-display text-lg uppercase tracking-widest hover:bg-red-dark transition-all shadow-xl shadow-red/20 flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>New {evOne}</span>
        </button>
      </div>

      {fixturesLoading ? (
        <Skeleton type="card" count={3} />
      ) : (
        <AdminTable headers={['Match', 'League', 'Date & Time', 'Venue', 'Status', 'Actions']}>
          {fixtures?.map(f => (
            <tr key={f.id} className="hover:bg-surface-2 dark:hover:bg-white/5 transition-colors group">
              <td className="px-6 py-5">
                <div className="flex items-center space-x-4">
                  <span className="font-bold text-sm uppercase tracking-tight">{f.homeTeam.name}</span>
                  <span className="text-[10px] opacity-20">VS</span>
                  <span className="font-bold text-sm uppercase tracking-tight">{f.awayTeam.name}</span>
                </div>
              </td>
              <td className="px-6 py-5 text-[10px] font-bold opacity-60 uppercase">{f.league.name}</td>
              <td className="px-6 py-5">
                <div className="flex flex-col">
                  <span className="text-sm font-bold uppercase tracking-tight italic text-red">
                    {f.matchDate ? new Date(f.matchDate).toLocaleDateString() : 'TBD'}
                  </span>
                  <span className="text-[8px] opacity-40 uppercase font-bold tracking-widest">
                    {f.matchDate ? new Date(f.matchDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'}
                  </span>
                </div>
              </td>
              <td className="px-6 py-5 text-[10px] font-bold opacity-60 uppercase">{f.venue || 'TBD'}</td>
              <td className="px-6 py-5">
                <span className={`text-[8px] font-bold px-2 py-1 rounded border uppercase ${f.status === 'LIVE' ? 'bg-red text-white border-red' : 'bg-surface-3 dark:bg-white/5 opacity-40'}`}>
                  {f.status}
                </span>
              </td>
              <td className="px-6 py-5">
                <div className="flex items-center space-x-2">
                  <button onClick={() => { setStreamFixture(f); setStreamUrl(f.streamUrl || ''); }} className={`p-2 rounded-lg transition-colors ${f.streamUrl ? 'text-red hover:bg-red/10' : 'opacity-40 hover:opacity-80 hover:bg-surface-3 dark:hover:bg-white/10'}`} title="Streaming URL">
                    <Tv size={16} />
                  </button>
                  <button onClick={() => openStats(f)} className="p-2 hover:bg-blue-500/10 text-blue-500 rounded-lg transition-colors" title="Match statistics">
                    <BarChart3 size={16} />
                  </button>
                  <button onClick={() => { if(window.confirm('Delete this fixture?')) deleteFixtureMutation.mutate(f.id) }} className="p-2 hover:bg-red/10 text-red rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}

      {/* New Fixture Modal */}
      <AdminModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Schedule New ${evOne}`}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Select {compOne}</label>
              <select 
                {...register('leagueId', { required: true })} 
                className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none"
                onChange={(e) => setSelectedLeagueId(e.target.value)}
              >
                <option value="">Choose a competition...</option>
                {leagues?.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Home Team</label>
              <select {...register('homeTeamId', { required: true })} className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none">
                <option value="">Select Home...</option>
                {teams?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Away Team</label>
              <select {...register('awayTeamId', { required: true })} className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none">
                <option value="">Select Away...</option>
                {teams?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Match Date & Time</label>
              <input {...register('matchDate', { required: true })} type="datetime-local" className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Venue</label>
              <input {...register('venue')} type="text" className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none" placeholder="Stadium name" />
            </div>
          </div>

          <button type="submit" disabled={createFixtureMutation.isPending} className="w-full bg-red text-white font-display text-xl uppercase tracking-widest py-4 rounded-xl hover:bg-red-dark transition-all disabled:opacity-50">
            {createFixtureMutation.isPending ? <Loader2 className="animate-spin mx-auto" /> : <span>Create Fixture</span>}
          </button>
        </form>
      </AdminModal>

      {/* Streaming URL Modal */}
      <AdminModal isOpen={!!streamFixture} onClose={() => setStreamFixture(null)} title="Live Streaming URL">
        <div className="space-y-5">
          <p className="text-xs opacity-60 leading-relaxed">
            Paste a broadcast link (YouTube Live, CAF TV, FIFA+, ESPN, any http(s) URL). Viewers get an active <b>Watch Live</b> button on the match page.
          </p>
          <input
            value={streamUrl}
            onChange={(e) => setStreamUrl(e.target.value)}
            className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none focus:border-red"
            placeholder="https://youtube.com/live/..."
          />
          <div className="flex gap-3">
            {streamFixture?.streamUrl && (
              <button onClick={() => streamMutation.mutate({ id: streamFixture.id, url: '' })} className="px-5 py-3 rounded-xl border border-surface-3 dark:border-white/15 text-xs font-bold uppercase tracking-widest hover:bg-surface-2 dark:hover:bg-white/5">
                Remove
              </button>
            )}
            <button onClick={() => streamMutation.mutate({ id: streamFixture.id, url: streamUrl.trim() })} disabled={streamMutation.isPending} className="flex-1 bg-red text-white font-display text-lg uppercase tracking-widest py-3 rounded-xl hover:bg-red-dark transition-all flex items-center justify-center disabled:opacity-50">
              {streamMutation.isPending ? <Loader2 className="animate-spin" /> : 'Save Stream Link'}
            </button>
          </div>
        </div>
      </AdminModal>

      {/* Match Statistics Modal */}
      <AdminModal isOpen={!!statsFixture} onClose={() => setStatsFixture(null)} title="Match Statistics">
        {statsFixture && (
          <div className="space-y-5">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center">
              <p className="font-bold text-xs uppercase tracking-tight truncate">{statsFixture.homeTeam?.name}</p>
              <span className="text-[9px] opacity-40 uppercase">Stat</span>
              <p className="font-bold text-xs uppercase tracking-tight truncate">{statsFixture.awayTeam?.name}</p>
            </div>
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {STAT_FIELDS.map(([key, label]) => (
                <div key={key} className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 sm:gap-2">
                  <input type="number" step={key === 'xg' ? '0.01' : '1'} value={homeStats[key] ?? ''} onChange={(e) => setHomeStats((s) => ({ ...s, [key]: e.target.value }))} className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-2 rounded-lg text-center text-sm outline-none focus:border-red" />
                  <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-tight sm:tracking-widest opacity-50 w-16 sm:w-24 text-center leading-tight">{label}</span>
                  <input type="number" step={key === 'xg' ? '0.01' : '1'} value={awayStats[key] ?? ''} onChange={(e) => setAwayStats((s) => ({ ...s, [key]: e.target.value }))} className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-2 rounded-lg text-center text-sm outline-none focus:border-red" />
                </div>
              ))}
            </div>
            <button onClick={() => statsMutation.mutate()} disabled={statsMutation.isPending} className="w-full bg-red text-white font-display text-lg uppercase tracking-widest py-3 rounded-xl hover:bg-red-dark transition-all flex items-center justify-center disabled:opacity-50">
              {statsMutation.isPending ? <Loader2 className="animate-spin" /> : 'Save Statistics'}
            </button>
          </div>
        )}
      </AdminModal>
    </div>
  );
};

export default AdminFixturesPage;
