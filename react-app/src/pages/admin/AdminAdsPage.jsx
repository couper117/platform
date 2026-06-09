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
        >
          <Plus size={20} />
          <span>New Banner</span>
        </button>
      </div>

      {isLoading ? (
        <Skeleton type="card" count={3} />
      ) : (
        <AdminTable headers={['Banner Title', 'Position', 'Status', 'Actions']}>
          {ads?.map(ad => (
            <tr key={ad.id} className="hover:bg-surface-2 dark:hover:bg-white/5 transition-colors">
              <td className="px-6 py-5 font-bold text-sm uppercase">{ad.title}</td>
              <td className="px-6 py-5 text-[10px] font-bold opacity-60 uppercase">{ad.position}</td>
              <td className="px-6 py-5">
                <span className="bg-green/5 text-green text-[8px] font-bold px-2 py-1 rounded border border-green/10 uppercase">Active</span>
              </td>
              <td className="px-6 py-5">
                <button onClick={() => deleteAdMutation.mutate(ad.id)} className="p-2 hover:bg-red/10 text-red rounded-lg transition-colors">
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}

      {/* New Ad Modal */}
      <AdminModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Upload Sponsorship Banner">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Banner Title</label>
            <input className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none" placeholder="e.g. Inyange Summer Campaign" onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Image URL</label>
            <input className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none" placeholder="Cloudinary/Image URL" onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
          </div>
          <button 
            onClick={() => createAdMutation.mutate(formData)}
            className="w-full bg-red text-white font-display text-xl uppercase tracking-widest py-4 rounded-xl hover:bg-red-dark transition-all"
          >
            {createAdMutation.isPending ? <Loader2 className="animate-spin mx-auto" /> : <span>Publish Banner</span>}
          </button>
        </div>
      </AdminModal>
    </div>
  );
};

export default AdminAdsPage;
