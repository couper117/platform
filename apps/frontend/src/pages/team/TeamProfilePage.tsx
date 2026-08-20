import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trophy, Save, Loader2 } from 'lucide-react';
import apiClient from '../../api/client';
import Skeleton from '../../components/shared/Skeleton';
import useUiStore from '../../store/uiStore';

const emptyForm = { name: '', shortName: '', homeVenue: '', city: '', province: '', description: '', email: '', phone: '', website: '' };

const TeamProfilePage = () => {
  const queryClient = useQueryClient();
  const pushToast = useUiStore((s) => s.pushToast);
  const [formData, setFormData] = useState(emptyForm);
  const [logoFile, setLogoFile] = useState(null);
  const hasInitialized = useRef(false);

  const { data: team, isLoading, isError } = useQuery({
    queryKey: ['team-dashboard-data'],
    queryFn: async () => {
      const { data } = await apiClient.get('/teams/my');
      return data.data;
    },
  });

  useEffect(() => {
    if (team && !hasInitialized.current) {
      setFormData({
        name: team.name || '',
        shortName: team.shortName || '',
        homeVenue: team.homeVenue || '',
        city: team.city || '',
        province: team.province || '',
        description: team.description || '',
        email: team.email || '',
        phone: team.phone || '',
        website: team.website || '',
      });
      hasInitialized.current = true;
    }
  }, [team]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      Object.entries(formData).forEach(([key, val]) => fd.append(key, val ?? ''));
      if (logoFile) fd.append('logo', logoFile);
      await apiClient.put(`/teams/${team.id}`, fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-dashboard-data'] });
      setLogoFile(null);
      pushToast('Club profile updated!', 'success');
    },
    onError: (err: any) => pushToast(err.response?.data?.message || 'Failed to update profile'),
  });

  const handleChange = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

  if (isLoading) return <Skeleton type="stat" count={3} />;

  if (isError || !team) {
    return <div className="p-8 text-center opacity-40 uppercase font-bold text-sm">Couldn't load your club profile. Try refreshing the page.</div>;
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-display uppercase tracking-tighter">Club <span className="text-red">Profile</span></h1>
          <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">Manage your club's public information</p>
        </div>
        <button
          onClick={() => updateMutation.mutate()}
          disabled={!formData.name.trim() || updateMutation.isPending}
          className="bg-red text-white px-10 py-3 rounded-xl font-display text-lg uppercase tracking-widest hover:bg-red-dark transition-all shadow-xl shadow-red/20 flex items-center space-x-3 disabled:opacity-50"
        >
          {updateMutation.isPending ? <Loader2 className="animate-spin" /> : <Save size={20} />}
          <span>Save Changes</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Club Name</label>
              <input className="w-full bg-white dark:bg-surface-dark2 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none focus:border-red" value={formData.name} onChange={e => handleChange('name', e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Short Code</label>
              <input className="w-full bg-white dark:bg-surface-dark2 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none focus:border-red" placeholder="e.g. APR" maxLength={10} value={formData.shortName} onChange={e => handleChange('shortName', e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Home Venue</label>
              <input className="w-full bg-white dark:bg-surface-dark2 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none focus:border-red" value={formData.homeVenue} onChange={e => handleChange('homeVenue', e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">City</label>
              <input className="w-full bg-white dark:bg-surface-dark2 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none focus:border-red" value={formData.city} onChange={e => handleChange('city', e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Province</label>
              <input className="w-full bg-white dark:bg-surface-dark2 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none focus:border-red" value={formData.province} onChange={e => handleChange('province', e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Contact Email</label>
              <input className="w-full bg-white dark:bg-surface-dark2 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none focus:border-red" value={formData.email} onChange={e => handleChange('email', e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Phone</label>
              <input className="w-full bg-white dark:bg-surface-dark2 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none focus:border-red" value={formData.phone} onChange={e => handleChange('phone', e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Website</label>
              <input className="w-full bg-white dark:bg-surface-dark2 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none focus:border-red" value={formData.website} onChange={e => handleChange('website', e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Description</label>
              <textarea rows={4} className="w-full bg-white dark:bg-surface-dark2 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none focus:border-red" value={formData.description} onChange={e => handleChange('description', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-surface-dark2 p-8 rounded-3xl border border-surface-3 dark:border-white/5 space-y-6 text-center">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-surface-2 dark:bg-white/5 flex items-center justify-center overflow-hidden border border-surface-3 dark:border-white/10">
              {logoFile ? (
                <img src={URL.createObjectURL(logoFile)} className="w-full h-full object-cover" />
              ) : team.logo ? (
                <img src={team.logo} className="w-full h-full object-cover" />
              ) : (
                <Trophy size={40} className="text-red opacity-20" />
              )}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40 block">Club Logo</label>
              <input
                type="file"
                accept="image/*"
                className="w-full text-xs file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-red file:text-white file:text-[10px] file:uppercase file:font-bold"
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <div className="bg-surface-dark p-6 rounded-3xl text-white space-y-3">
            <span className={`inline-block text-[8px] font-bold px-2 py-1 rounded-full uppercase tracking-widest ${team.status === 'VERIFIED' ? 'bg-green/10 text-green border border-green/20' : 'bg-gold/10 text-gold border border-gold/20'}`}>
              {team.status}
            </span>
            <p className="text-xs opacity-60 leading-relaxed">
              {team.status === 'VERIFIED'
                ? 'Your club is verified and eligible for official competitions.'
                : 'Upload athlete documents to get your club verified.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamProfilePage;
