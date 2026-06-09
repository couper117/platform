import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Plus, Trash2, Globe, Image as ImageIcon, Loader2 } from 'lucide-react';
import apiClient from '../../api/client';
import AdminTable from '../../components/admin/AdminTable';
import AdminModal from '../../components/admin/AdminModal';
import Skeleton from '../../components/shared/Skeleton';

const AdminAdsPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', imageUrl: '', targetUrl: '', position: 'HOME_BANNER' });

  const { data: ads, isLoading } = useQuery({
    queryKey: ['admin-ads'],
    queryFn: async () => {
      const { data } = await apiClient.get('/ads');
      return data.data;
    },
  });

  const createAdMutation = useMutation({
    mutationFn: async (data) => {
      await apiClient.post('/ads', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-ads']);
      setIsModalOpen(false);
      alert('Ad banner created successfully!');
    }
  });

  const deleteAdMutation = useMutation({
    mutationFn: async (id) => {
      await apiClient.delete(`/ads/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-ads']);
      alert('Ad banner deleted!');
    }
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-display uppercase tracking-tighter">Sponsorship <span className="text-red">Center</span></h1>
          <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">Manage advertising banners for the platform</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-red text-white px-8 py-3 rounded-xl font-display text-lg uppercase tracking-widest hover:bg-red-dark transition-all shadow-xl shadow-red/20 flex items-center space-x-2"