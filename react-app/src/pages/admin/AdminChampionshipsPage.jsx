import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Trophy, Plus, Edit2, Trash2, Loader2, Layers } from 'lucide-react';
import { format } from 'date-fns';
import {
  getChampionships, createChampionship, updateChampionship, deleteChampionship,
} from '../../api/endpoints/amashuri';
import AdminTable from '../../components/admin/AdminTable';
import AdminModal from '../../components/admin/AdminModal';
import Skeleton from '../../components/shared/Skeleton';

const LEVELS = ['CELL', 'SECTOR', 'DISTRICT', 'PROVINCE', 'NATIONAL'];
const STATUSES = ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'];

const statusStyle = (s) => {
  switch (s) {
    case 'ONGOING': return 'bg-green/5 text-green border-green/10';
    case 'COMPLETED': return 'bg-rwanda-blue/5 text-rwanda-blue border-rwanda-blue/10';
    case 'CANCELLED': return 'bg-red/5 text-red border-red/10';
    default: return 'bg-gold/5 text-gold border-gold/10';
  }
};

// Format an ISO date for an <input type="date"> default value.
const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

const inputCls = 'w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl focus:border-rwanda-blue outline-none';
const labelCls = 'text-[10px] uppercase font-bold tracking-widest opacity-40';

const AdminChampionshipsPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-championships'],
    queryFn: () => getChampionships(),
    retry: false,
  });
  const championships = data?.data || [];

  // Populate the form when opening for create vs edit.
  useEffect(() => {
    if (!isModalOpen) return;
    reset(editing
      ? {
          name: editing.name || '',
          edition: editing.edition || '',
          level: editing.level || 'NATIONAL',
          status: editing.status || 'UPCOMING',
          gender: editing.gender || 'mixed',
          ageCategory: editing.ageCategory || 'Open',
          venue: editing.venue || '',
          startDate: toDateInput(editing.startDate),
          endDate: toDateInput(editing.endDate),
          description: editing.description || '',
        }
      : {
          name: '', edition: '', level: 'NATIONAL', status: 'UPCOMING',
          gender: 'mixed', ageCategory: 'Open', venue: '', startDate: '', endDate: '', description: '',
        });
  }, [isModalOpen, editing, reset]);

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      editing ? updateChampionship(editing.id, payload) : createChampionship(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-championships'] });
      queryClient.invalidateQueries({ queryKey: ['amashuri-championships'] });
      setIsModalOpen(false);
      setEditing(null);
    },
    onError: (err) => alert(err.response?.data?.message || 'Failed to save championship'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteChampionship(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-championships'] });
      queryClient.invalidateQueries({ queryKey: ['amashuri-championships'] });
    },
    onError: (err) => alert(err.response?.data?.message || 'Failed to delete championship'),
  });

  const openCreate = () => { setEditing(null); setIsModalOpen(true); };
  const openEdit = (c) => { setEditing(c); setIsModalOpen(true); };
  const onSubmit = (form) => saveMutation.mutate(form);

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-display uppercase tracking-tighter">
            Amashuri <span className="text-rwanda-blue">Championships</span>
          </h1>
          <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">
            Create and manage all school championships, including the Kagame Cup
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-rwanda-blue text-white px-8 py-3 rounded-xl font-display text-lg uppercase tracking-widest hover:brightness-110 transition-all shadow-xl shadow-rwanda-blue/20 flex items-center gap-2 cursor-pointer"
        >
          <Plus size={20} />
          <span>New Championship</span>
        </button>
      </div>

      {isLoading ? (
        <Skeleton type="card" count={3} />
      ) : championships.length > 0 ? (
        <AdminTable headers={['Championship', 'Level', 'Window', 'Fixtures', 'Status', 'Actions']}>
          {championships.map((c) => (
            <tr key={c.id} className="hover:bg-surface-2 dark:hover:bg-white/5 transition-colors">
              <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-rwanda-blue/10 text-rwanda-blue flex items-center justify-center shrink-0">
                    <Trophy size={16} />
                  </span>
                  <div>