import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserSquare2, Plus, Edit2, Trash2, User, Loader2 } from 'lucide-react';
import apiClient from '../../api/client';
import AdminTable from '../../components/admin/AdminTable';
import AdminModal from '../../components/admin/AdminModal';
import Skeleton from '../../components/shared/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import useUiStore from '../../store/uiStore';

const SKILL_LEVELS = ['AMATEUR', 'SEMI_PROFESSIONAL', 'PROFESSIONAL', 'ELITE'];
const GENDERS = ['MALE', 'FEMALE'];

const emptyForm = { fullName: '', nationality: 'Rwandan', position: '', jerseyNumber: '', skillLevel: 'AMATEUR', gender: 'MALE' };

const TeamPlayersPage = () => {
  const queryClient = useQueryClient();
  const pushToast = useUiStore((s) => s.pushToast);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const { data: team, isLoading, isError } = useQuery({
    queryKey: ['team-dashboard-data'],
    queryFn: async () => {
      const { data } = await apiClient.get('/teams/my');
      return data.data;
    },
  });

  const players = team?.players || [];

  const invalidateTeam = () => queryClient.invalidateQueries({ queryKey: ['team-dashboard-data'] });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiClient.post('/players', { ...data, teamId: team.id });
    },
    onSuccess: () => {
      invalidateTeam();
      closeModal();
      pushToast('Player registered!', 'success');
    },
    onError: (err: any) => pushToast(err.response?.data?.message || 'Failed to register player'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: any) => {
      await apiClient.put(`/players/${id}`, data);
    },
    onSuccess: () => {
      invalidateTeam();
      closeModal();
      pushToast('Player updated!', 'success');
    },
    onError: (err: any) => pushToast(err.response?.data?.message || 'Failed to update player'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: any) => {
      await apiClient.delete(`/players/${id}`);
    },
    onSuccess: () => {
      invalidateTeam();
      pushToast('Player removed', 'success');
    },
    onError: (err: any) => pushToast(err.response?.data?.message || 'Failed to remove player'),
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPlayer(null);
    setFormData(emptyForm);
  };

  const openCreate = () => {
    setEditingPlayer(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (player) => {
    setEditingPlayer(player);
    setFormData({
      fullName: player.fullName || '',
      nationality: player.nationality || 'Rwandan',
      position: player.position || '',
      jerseyNumber: player.jerseyNumber ?? '',
      skillLevel: player.skillLevel || 'AMATEUR',
      gender: player.gender || 'MALE',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (editingPlayer) {
      updateMutation.mutate({ id: editingPlayer.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isLoading) return <Skeleton type="table-row" count={5} />;

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-display uppercase tracking-tighter">My <span className="text-red">Roster</span></h1>
          <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">Register and manage your club's athletes</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-red text-white px-8 py-3 rounded-xl font-display text-lg uppercase tracking-widest hover:bg-red-dark transition-all shadow-xl shadow-red/20 flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Register Athlete</span>
        </button>
      </div>

      {isError ? (
        <EmptyState icon={UserSquare2} title="Couldn't load your roster" hint="Something went wrong. Try refreshing the page." />
      ) : !players.length ? (
        <EmptyState icon={UserSquare2} title="No players yet" hint="Register your first athlete to start building your roster." />
      ) : (
        <AdminTable headers={['Player', 'Position', 'Skill', 'Status', 'Actions']}>
          {players.map(player => (
            <tr key={player.id} className="hover:bg-surface-2 dark:hover:bg-white/5 transition-colors">
              <td className="px-6 py-5">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-surface-3 dark:bg-white/10 flex items-center justify-center overflow-hidden border border-surface-3">
                    {player.photo ? <img src={player.photo} className="w-full h-full object-cover" /> : <User size={16} className="opacity-20" />}
                  </div>
                  <div>
                    <p className="font-bold text-sm uppercase tracking-tight">{player.fullName}</p>
                    <p className="text-[8px] opacity-40 uppercase tracking-widest">No. {player.jerseyNumber ?? '—'}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-5 text-[10px] font-bold opacity-60 uppercase">{player.position || 'N/A'}</td>
              <td className="px-6 py-5 text-[10px] font-bold opacity-60 uppercase">{player.skillLevel}</td>
              <td className="px-6 py-5">
                <span className={`text-[8px] font-bold px-2 py-1 rounded border uppercase ${player.status === 'VERIFIED' ? 'bg-green/5 text-green border-green/10' : 'bg-gold/5 text-gold border-gold/20'}`}>
                  {player.status}
                </span>
              </td>
              <td className="px-6 py-5">
                <div className="flex items-center space-x-2">
                  <button onClick={() => openEdit(player)} className="p-2 hover:bg-surface-3 dark:hover:bg-white/10 rounded-lg transition-colors">
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => { if (window.confirm(`Remove ${player.fullName} from the roster?`)) deleteMutation.mutate(player.id); }}
                    disabled={deleteMutation.isPending}
                    className="p-2 hover:bg-red/10 text-red rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}

      <AdminModal isOpen={isModalOpen} onClose={closeModal} title={editingPlayer ? 'Edit Player' : 'Register Athlete'}>
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Full Name</label>
            <input className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none focus:border-red" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Nationality</label>
              <input className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none focus:border-red" value={formData.nationality} onChange={e => setFormData({ ...formData, nationality: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Position</label>
              <input className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none focus:border-red" value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Jersey Number</label>
              <input type="number" className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none focus:border-red" value={formData.jerseyNumber} onChange={e => setFormData({ ...formData, jerseyNumber: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Gender</label>
              <select className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none focus:border-red" value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="space-y-2 col-span-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Skill Level</label>
              <select className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none focus:border-red" value={formData.skillLevel} onChange={e => setFormData({ ...formData, skillLevel: e.target.value })}>
                {SKILL_LEVELS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!formData.fullName.trim() || isSaving}
            className="w-full bg-red text-white font-display text-xl uppercase tracking-widest py-4 rounded-xl hover:bg-red-dark transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin mx-auto" /> : <span>{editingPlayer ? 'Save Changes' : 'Register Athlete'}</span>}
          </button>
        </div>
      </AdminModal>
    </div>
  );
};

export default TeamPlayersPage;
