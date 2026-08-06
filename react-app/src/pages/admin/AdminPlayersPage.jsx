import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Trash2, Edit2, User, Plus, Loader2, AlertCircle } from 'lucide-react';
import apiClient from '../../api/client';
import AdminTable from '../../components/admin/AdminTable';
import AdminModal from '../../components/admin/AdminModal';
import Skeleton from '../../components/shared/Skeleton';
import useSportScope from '../../hooks/useSportScope';

const EMPTY = {
  teamId: '', fullName: '', dateOfBirth: '', nationality: 'Rwandan', gender: 'MALE',
  position: '', jerseyNumber: '', skillLevel: 'AMATEUR', idNumber: '', licenseNo: '', height: '', weight: '',
};

const inputCls = 'w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-3 rounded-xl outline-none focus:border-red';
const lblCls = 'text-[10px] uppercase font-bold tracking-widest opacity-40';

const AdminPlayersPage = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearcherTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [photoFile, setPhotoFile] = useState(null);
  const [formError, setFormError] = useState('');
  const scope = useSportScope();

  const { data: players, isLoading } = useQuery({
    queryKey: ['admin-players', searchTerm, scope.key],
    queryFn: async () => {
      const { data } = await apiClient.get('/players', { params: { search: searchTerm, ...scope.params } });
      return data.data;
    },
  });

  const { data: teams } = useQuery({
    queryKey: ['admin-teams-forplayers', scope.key],
    queryFn: async () => {
      const { data } = await apiClient.get('/teams', { params: { status: 'VERIFIED', ...scope.params } });
      return data.data;
    },
  });

  const createPlayerMutation = useMutation({
    mutationFn: async (payload) => {
      const fd = new FormData();
      Object.entries(payload).forEach(([k, v]) => { if (v !== '' && v != null) fd.append(k, v); });
      if (photoFile) fd.append('photo', photoFile);
      const { data } = await apiClient.post('/players', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-players'] });
      setIsModalOpen(false);
      setForm(EMPTY);
      setPhotoFile(null);
      setFormError('');
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to register player');
    },
  });

  const deletePlayerMutation = useMutation({
    mutationFn: async (id) => { await apiClient.delete(`/players/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-players'] });
    },
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.teamId) return setFormError('Please select a team');
    if (!form.fullName.trim()) return setFormError('Full name is required');
    createPlayerMutation.mutate(form);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-display uppercase tracking-tighter">Athlete <span className="text-red">Registry</span></h1>
          <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">Register and manage licensed players</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex bg-white dark:bg-white/5 rounded-2xl border border-surface-3 dark:border-white/10 p-2 flex-1 md:w-72">
            <Search className="text-white/20 ml-2 mt-1.5" size={18} />
            <input
              type="text"
              placeholder="Search name..."
              className="bg-transparent border-none focus:ring-0 text-sm font-bold uppercase tracking-widest p-2 w-full"
              value={searchTerm}
              onChange={(e) => setSearcherTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => { setForm(EMPTY); setPhotoFile(null); setFormError(''); setIsModalOpen(true); }}
            className="bg-red text-white px-6 py-3 rounded-xl font-display text-sm uppercase tracking-widest hover:bg-red-dark transition-all shadow-xl shadow-red/20 flex items-center space-x-2 whitespace-nowrap"
          >
            <Plus size={18} />
            <span>Register</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <Skeleton type="table-row" count={5} />
      ) : (
        <AdminTable headers={['Player', 'Team', 'Position', 'Jersey', 'Status', 'Actions']}>
          {players?.map(player => (
            <tr key={player.id} className="hover:bg-surface-2 dark:hover:bg-white/5 transition-colors">
              <td className="px-6 py-5">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-surface-3 dark:bg-white/10 flex items-center justify-center overflow-hidden border border-surface-3">
                    {player.photo ? <img src={player.photo} className="w-full h-full object-cover" /> : <User size={16} className="opacity-20" />}
                  </div>
                  <div>
                    <p className="font-bold text-sm uppercase tracking-tight">{player.fullName}</p>
                    <p className="text-[8px] opacity-40 uppercase tracking-widest">{player.nationality}{player.licenseNo ? ` · Lic ${player.licenseNo}` : ''}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-5 text-[10px] font-bold opacity-60 uppercase">{player.team?.name}</td>
              <td className="px-6 py-5 text-[10px] font-bold opacity-60 uppercase">{player.position || 'N/A'}</td>
              <td className="px-6 py-5 text-[10px] font-bold opacity-60 uppercase">{player.jerseyNumber ?? '—'}</td>
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
                    onClick={() => { if (window.confirm(`Remove ${player.fullName}?`)) deletePlayerMutation.mutate(player.id); }}
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

      <AdminModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register Player">
        <form onSubmit={submit} className="space-y-5">
          {formError && (
            <div className="bg-red/10 border border-red/20 p-3 rounded-xl flex items-center space-x-2 text-red">
              <AlertCircle size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={lblCls}>Team</label>
              <select value={form.teamId} onChange={set('teamId')} className={inputCls}>
                <option value="">Select team...</option>
                {teams?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className={lblCls}>Full Name</label>
              <input value={form.fullName} onChange={set('fullName')} className={inputCls} placeholder="Player name" />
            </div>
            <div className="space-y-1.5">
              <label className={lblCls}>Date of Birth</label>
              <input type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className={lblCls}>Gender</label>
              <select value={form.gender} onChange={set('gender')} className={inputCls}>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className={lblCls}>Nationality</label>
              <input value={form.nationality} onChange={set('nationality')} className={inputCls} placeholder="Rwandan" />
            </div>
            <div className="space-y-1.5">
              <label className={lblCls}>National ID / Passport</label>
              <input value={form.idNumber} onChange={set('idNumber')} className={inputCls} placeholder="ID number" />
            </div>
            <div className="space-y-1.5">
              <label className={lblCls}>Position</label>
              <input value={form.position} onChange={set('position')} className={inputCls} placeholder="e.g. Goalkeeper" />
            </div>
            <div className="space-y-1.5">
              <label className={lblCls}>Jersey Number</label>
              <input type="number" value={form.jerseyNumber} onChange={set('jerseyNumber')} className={inputCls} placeholder="10" />
            </div>
            <div className="space-y-1.5">
              <label className={lblCls}>Licence Number</label>
              <input value={form.licenseNo} onChange={set('licenseNo')} className={inputCls} placeholder="Federation licence" />
            </div>
            <div className="space-y-1.5">
              <label className={lblCls}>Skill Level</label>
              <select value={form.skillLevel} onChange={set('skillLevel')} className={inputCls}>
                <option value="AMATEUR">Amateur</option>
                <option value="SEMI_PROFESSIONAL">Semi-professional</option>
                <option value="PROFESSIONAL">Professional</option>
                <option value="ELITE">Elite</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className={lblCls}>Height (cm)</label>
              <input type="number" value={form.height} onChange={set('height')} className={inputCls} placeholder="180" />
            </div>
            <div className="space-y-1.5">
              <label className={lblCls}>Weight (kg)</label>
              <input type="number" value={form.weight} onChange={set('weight')} className={inputCls} placeholder="75" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className={lblCls}>Photo</label>
              <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} className={inputCls} />
            </div>
          </div>

          <button type="submit" disabled={createPlayerMutation.isPending} className="w-full bg-red text-white font-display text-lg uppercase tracking-widest py-4 rounded-xl hover:bg-red-dark transition-all flex items-center justify-center disabled:opacity-50">
            {createPlayerMutation.isPending ? <Loader2 className="animate-spin" /> : <span>Register Player</span>}
          </button>
        </form>
      </AdminModal>
    </div>
  );
};

export default AdminPlayersPage;
