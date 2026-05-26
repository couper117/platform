import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Activity, Plus, Calendar, MapPin, Trophy, Clock, Search, Trash2 } from 'lucide-react';
import apiClient from '../../api/client';
import AdminTable from '../../components/admin/AdminTable';
import AdminModal from '../../components/admin/AdminModal';
import Skeleton from '../../components/shared/Skeleton';

const AdminFixturesPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    leagueId: '',
    homeTeamId: '',
    awayTeamId: '',
    matchDate: '',
    venue: '',
    matchday: '1'
  });

  const { data: fixtures, isLoading: fixturesLoading } = useQuery({
    queryKey: ['admin-fixtures'],
    queryFn: async () => {
      const { data } = await apiClient.get('/fixtures');
      return data.data;
    },
  });

  const { data: leagues } = useQuery({
    queryKey: ['admin-leagues-list'],
    queryFn: async () => {
      const { data } = await apiClient.get('/leagues');
      return data.data;
    },
  });

  const { data: teams } = useQuery({
    queryKey: ['admin-teams-list', formData.leagueId],
    queryFn: async () => {
      if (!formData.leagueId) return { data: [] };
      const { data } = await apiClient.get('/teams', { params: { leagueId: formData.leagueId } });
      return data.data;
    },
    enabled: !!formData.leagueId
  });

  const createFixtureMutation = useMutation({
    mutationFn: async (data) => {
      await apiClient.post('/fixtures', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-fixtures']);
      setIsModalOpen(false);
      alert('Match scheduled successfully!');
    }
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-display uppercase tracking-tighter">Schedule <span className="text-red">Management</span></h1>
          <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">Manage fixtures and assign pitch-side reporters</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-red text-white px-8 py-3 rounded-xl font-display text-lg uppercase tracking-widest hover:bg-red-dark transition-all shadow-xl shadow-red/20 flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>New Fixture</span>
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
                  <button className="p-2 hover:bg-red/10 text-red rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}

      {/* New Fixture Modal */}
      <AdminModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule New Match">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Select League</label>
              <select 
                className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none"
                value={formData.leagueId}
                onChange={(e) => setFormData({...formData, leagueId: e.target.value})}
              >
                <option value="">Choose a competition...</option>
                {leagues?.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Home Team</label>
              <select 
                className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none"
                value={formData.homeTeamId}
                onChange={(e) => setFormData({...formData, homeTeamId: e.target.value})}
              >
                <option value="">Select Home...</option>
                {teams?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Away Team</label>
              <select 
                className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none"
                value={formData.awayTeamId}
                onChange={(e) => setFormData({...formData, awayTeamId: e.target.value})}
              >
                <option value="">Select Away...</option>
                {teams?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Match Date & Time</label>
              <input 
                type="datetime-local" 
                className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none"
                value={formData.matchDate}
                onChange={(e) => setFormData({...formData, matchDate: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Venue</label>
              <input 
                type="text" 
                className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none"
                placeholder="Stadium name"
                value={formData.venue}
                onChange={(e) => setFormData({...formData, venue: e.target.value})}
              />
            </div>
          </div>

          <button 
            onClick={() => createFixtureMutation.mutate(formData)}
            className="w-full bg-red text-white font-display text-xl uppercase tracking-widest py-4 rounded-xl hover:bg-red-dark transition-all"
          >
            Create Fixture
          </button>
        </div>
      </AdminModal>
    </div>
  );
};

export default AdminFixturesPage;
