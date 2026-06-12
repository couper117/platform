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
