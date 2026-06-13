import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, ShieldCheck, XCircle, Mail, Trash2, Loader2 } from 'lucide-react';
import apiClient from '../../api/client';
import AdminTable from '../../components/admin/AdminTable';
import Skeleton from '../../components/shared/Skeleton';

const AdminTeamsPage = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('PENDING');

  const { data: teams, isLoading } = useQuery({
    queryKey: ['admin-teams', filter],
    queryFn: async () => {
      const { data } = await apiClient.get('/teams', { params: { status: filter } });
      return data.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      await apiClient.put(`/teams/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-teams']);
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to update team status');
    }
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async (id) => {
      await apiClient.delete(`/teams/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-teams']);
      alert('Team deleted successfully');
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to delete team');
    }
  });

  const handleDeleteTeam = (id) => {
    if (window.confirm('Are you sure you want to delete this team? This will remove all its players and matches.')) {
      deleteTeamMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-display uppercase tracking-tighter">Team <span className="text-red">Verification</span></h1>
          <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">Approve or audit club applications</p>
        </div>
        
        <div className="flex bg-surface-dark p-1 rounded-2xl border border-white/10">
          {['PENDING', 'VERIFIED', 'SUSPENDED'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${filter === s ? 'bg-red text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Skeleton type="card" count={3} />
      ) : (
        <AdminTable headers={['Team Info', 'Sport', 'Location', 'Manager', 'Status', 'Actions']}>
          {teams?.map(team => (
            <tr key={team.id} className="hover:bg-surface-2 dark:hover:bg-white/5 transition-colors">
              <td className="px-6 py-5">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-surface-3 dark:bg-white/10 flex items-center justify-center overflow-hidden border border-surface-3">
                    {team.logo ? <img src={team.logo} className="w-full h-full object-cover" /> : <Users size={16} className="opacity-20" />}
                  </div>
                  <div>
                    <p className="font-bold text-sm uppercase tracking-tight">{team.name}</p>
                    <p className="text-[8px] opacity-40 uppercase tracking-widest">{team.shortName || 'NO CODE'}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-5 text-[10px] font-bold opacity-60 uppercase">{team.sport?.name}</td>
              <td className="px-6 py-5">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{team.city}</p>
                  <p className="text-[8px] opacity-40 uppercase font-bold tracking-widest">{team.province}</p>
                </div>
              </td>