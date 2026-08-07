import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Save, RotateCcw, AlertCircle, Loader2, Globe, Shield, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/client';
import Skeleton from '../../components/shared/Skeleton';

const AdminSettingsPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [settingsData, setSettingsData] = useState({});

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const { data } = await apiClient.get('/settings');
      setSettingsData(data.data);
      return data.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates) => {
      // Backend expects array of { skey, sval }
      const payload = Object.entries(updates).map(([skey, sval]) => ({ skey, sval }));
      await apiClient.put('/settings', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-settings']);
      alert(t('admin.settings.save_success'));
    }
  });

  const handleChange = (key, val) => {
    setSettingsData(prev => ({ ...prev, [key]: val }));
  };

  const categories = [
    { id: 'branding', label: t('admin.settings.cat_branding'), icon: <Globe size={18} /> },
    { id: 'contact', label: t('admin.settings.cat_contact'), icon: <Mail size={18} /> },
    { id: 'homepage', label: t('admin.settings.cat_homepage'), icon: <RotateCcw size={18} /> },
  ];

  if (isLoading) return <div className="p-8"><Skeleton type="stat" count={3} /></div>;

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-display uppercase tracking-tighter">
            {t('admin.settings.title')} <span className="text-red">{t('admin.settings.title_accent')}</span>
          </h1>
          <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">{t('admin.settings.subtitle')}</p>
        </div>
        <button 
          onClick={() => updateMutation.mutate(settingsData)}
          disabled={updateMutation.isPending}
          className="bg-red text-white px-10 py-3 rounded-xl font-display text-lg uppercase tracking-widest hover:bg-red-dark transition-all shadow-xl shadow-red/20 flex items-center space-x-3 disabled:opacity-50"
        >
          {updateMutation.isPending ? <Loader2 className="animate-spin" /> : <Save size={20} />}
          <span>{t('admin.settings.save_all')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-12">
          {/* Branding Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-display uppercase tracking-tight border-b border-surface-3 dark:border-white/5 pb-2">{t('admin.settings.branding')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">{t('admin.settings.platform_name')}</label>
                <input 
                  className="w-full bg-white dark:bg-surface-dark2 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none focus:border-red"
                  value={settingsData.site_name || ''}
                  onChange={(e) => handleChange('site_name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">{t('admin.settings.tagline')}</label>
                <input 
                  className="w-full bg-white dark:bg-surface-dark2 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none focus:border-red"
                  value={settingsData.hero_title || ''}
                  onChange={(e) => handleChange('hero_title', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-display uppercase tracking-tight border-b border-surface-3 dark:border-white/5 pb-2">{t('admin.settings.contact_info')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">{t('admin.settings.official_email')}</label>
                <input 
                  className="w-full bg-white dark:bg-surface-dark2 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none focus:border-red"
                  value={settingsData.contact_email || ''}
                  onChange={(e) => handleChange('contact_email', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <div className="bg-surface-dark p-8 rounded-3xl text-white space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red opacity-20 -mr-8 -mt-8 rounded-full blur-3xl" />
            <div className="flex items-center space-x-3 text-red">
              <Shield size={20} />
              <h3 className="font-display text-xl uppercase tracking-tight">{t('admin.settings.admin_note')}</h3>
            </div>
            <p className="text-xs opacity-60 leading-relaxed uppercase font-bold tracking-widest">
              {t('admin.settings.admin_note_text')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
