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