import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserSquare2, Search, Trash2, Edit2, ShieldCheck, Filter, User } from 'lucide-react';
import apiClient from '../../api/client';
import AdminTable from '../../components/admin/AdminTable';
import Skeleton from '../../components/shared/Skeleton';

const AdminPlayersPage = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearcherTerm] = useState('');

  const { data: players, isLoading } = useQuery({
    queryKey: ['admin-players', searchTerm],
    queryFn: async () => {
      const { data } = await apiClient.get('/players', { params: { search: searchTerm } });
      return data.data;
    },
  });

  const deletePlayerMutation = useMutation({
    mutationFn: async (id) => {
      await apiClient.delete(`/players/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-players']);
      alert('Player removed successfully');
    }
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-display uppercase tracking-tighter">Athlete <span className="text-red">Registry</span></h1>
          <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">Manage all registered sports players</p>
        </div>
        
        <div className="flex bg-white dark:bg-white/5 rounded-2xl border border-surface-3 dark:border-white/10 p-2 w-full max-w-md">
          <Search className="text-white/20 ml-2 mt-1.5" size={18} />
          <input 
            type="text" 
            placeholder="Search name or ID..." 
            className="bg-transparent border-none focus:ring-0 text-sm font-bold uppercase tracking-widest p-2 w-full"
            value={searchTerm}
            onChange={(e) => setSearcherTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <Skeleton type="table-row" count={5} />
      ) : (
        <AdminTable headers={['Player', 'Team', 'Position', 'Skill', 'Status', 'Actions']}>
          {players?.map(player => (
            <tr key={player.id} className="hover:bg-surface-2 dark:hover:bg-white/5 transition-colors">
              <td className="px-6 py-5">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-surface-3 dark:bg-white/10 flex items-center justify-center overflow-hidden border border-surface-3">
                    {player.photo ? <img src={player.photo} className="w-full h-full object-cover" /> : <User size={16} className="opacity-20" />}
                  </div>
                  <div>
                    <p className="font-bold text-sm uppercase tracking-tight">{player.fullName}</p>
                    <p className="text-[8px] opacity-40 uppercase tracking-widest">{player.nationality}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-5 text-[10px] font-bold opacity-60 uppercase">{player.team?.name}</td>
              <td className="px-6 py-5 text-[10px] font-bold opacity-60 uppercase">{player.position || 'N/A'}</td>
              <td className="px-6 py-5 text-[10px] font-bold opacity-60 uppercase">{player.skillLevel}</td>
              <td className="px-6 py-5">
                <span className={`text-[8px] font-bold px-2 py-1 rounded border uppercase ${player.status === 'VERIFIED' ? 'bg-green/5 text-green border-green/10' : 'bg-gold/5 text-gold border-gold/20'}`}>
                  {player.status}
                </span>
              </td>
              <td className="px-6 py-5">
                <div className="flex items-center space-x-2">
                  <button className="p-2 hover:bg-surface-3 dark:hover:bg-white/10 rounded-lg transition-colors">
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => deletePlayerMutation.mutate(player.id)}
                    className="p-2 hover:bg-red/10 text-red rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
};

export default AdminPlayersPage;
