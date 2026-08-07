import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Activity, Plus, Calendar, MapPin, Trophy, Clock, Search, Trash2, Edit2, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/client';
import { useEnumLabel } from '../../i18n/enums';
import { useDateFormat } from '../../i18n/dateLocale';
import AdminTable from '../../components/admin/AdminTable';
import AdminModal from '../../components/admin/AdminModal';
import Skeleton from '../../components/shared/Skeleton';

const AdminFixturesPage = () => {
  const { t } = useTranslation();
  const enumLabel = useEnumLabel();
  const formatDate = useDateFormat();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { register, handleSubmit, reset } = useForm();

  const { data: fixtures, isLoading: fixturesLoading } = useQuery({
    queryKey: ['admin-fixtures'],
    queryFn: async () => {
      const { data } = await apiClient.get('/fixtures');
      return data.data;
    },
  });

  const { data: leagues } = useQuery({
    queryKey: ['admin-leagues-list'],
    queryFn: async () => {
      const { data } = await apiClient.get('/leagues');
      return data.data;
    },
  });

  // Fetch teams based on selected league (needs reactive state from form)
  const [selectedLeagueId, setSelectedLeagueId] = useState('');
  const { data: teams } = useQuery({
    queryKey: ['admin-teams-list', selectedLeagueId],
    queryFn: async () => {
      if (!selectedLeagueId) return [];
      const { data } = await apiClient.get('/teams', { params: { leagueId: selectedLeagueId } });
      return data.data;
    },
    enabled: !!selectedLeagueId
  });

  const createFixtureMutation = useMutation({
    mutationFn: async (data) => {
      await apiClient.post('/fixtures', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-fixtures']);
      setIsModalOpen(false);
      reset();
      alert(t('admin.fixtures.create_success'));
    }
  });

  const deleteFixtureMutation = useMutation({
    mutationFn: async (id) => {
      await apiClient.delete(`/fixtures/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-fixtures']);
      alert(t('admin.fixtures.delete_success'));
    }
  });

  const onSubmit = (data) => {
    createFixtureMutation.mutate(data);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-display uppercase tracking-tighter">
            {t('admin.fixtures.title')} <span className="text-red">{t('admin.fixtures.title_accent')}</span>
          </h1>
          <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">{t('admin.fixtures.subtitle')}</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-red text-white px-8 py-3 rounded-xl font-display text-lg uppercase tracking-widest hover:bg-red-dark transition-all shadow-xl shadow-red/20 flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>{t('admin.fixtures.new')}</span>
        </button>
      </div>

      {fixturesLoading ? (
        <Skeleton type="card" count={3} />
      ) : (
        <AdminTable headers={[t('admin.fixtures.col_match'), t('admin.fixtures.col_league'), t('admin.fixtures.col_datetime'), t('admin.fixtures.col_venue'), t('admin.col_status'), t('admin.col_actions')]}>
          {fixtures?.map(f => (
            <tr key={f.id} className="hover:bg-surface-2 dark:hover:bg-white/5 transition-colors group">
              <td className="px-6 py-5">
                <div className="flex items-center space-x-4">
                  <span className="font-bold text-sm uppercase tracking-tight">{f.homeTeam.name}</span>
                  <span className="text-[10px] opacity-20">{t('match.versus')}</span>
                  <span className="font-bold text-sm uppercase tracking-tight">{f.awayTeam.name}</span>
                </div>
              </td>
              <td className="px-6 py-5 text-[10px] font-bold opacity-60 uppercase">{f.league.name}</td>
              <td className="px-6 py-5">
                <div className="flex flex-col">
                  <span className="text-sm font-bold uppercase tracking-tight italic text-red">
                    {formatDate(f.matchDate, 'dd MMM yyyy') || t('common.tbd')}
                  </span>
                  <span className="text-[8px] opacity-40 uppercase font-bold tracking-widest">
                    {formatDate(f.matchDate, 'HH:mm') || t('common.tbd')}
                  </span>
                </div>
              </td>
              <td className="px-6 py-5 text-[10px] font-bold opacity-60 uppercase">{f.venue || t('common.tbd')}</td>
              <td className="px-6 py-5">
                <span className={`text-[8px] font-bold px-2 py-1 rounded border uppercase ${f.status === 'LIVE' ? 'bg-red text-white border-red' : 'bg-surface-3 dark:bg-white/5 opacity-40'}`}>
                  {enumLabel('match_status', f.status)}
                </span>
              </td>
              <td className="px-6 py-5">
                <div className="flex items-center space-x-2">
                  <button onClick={() => { if(window.confirm(t('admin.fixtures.delete_confirm'))) deleteFixtureMutation.mutate(f.id) }} className="p-2 hover:bg-red/10 text-red rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}

      {/* New Fixture Modal */}
      <AdminModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('admin.fixtures.modal_title')}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">{t('admin.fixtures.select_league')}</label>
              <select 
                {...register('leagueId', { required: true })} 
                className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none"
                onChange={(e) => setSelectedLeagueId(e.target.value)}
              >
                <option value="">{t('admin.fixtures.choose_competition')}</option>
                {leagues?.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">{t('admin.fixtures.home_team')}</label>
              <select {...register('homeTeamId', { required: true })} className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none">
                <option value="">{t('admin.fixtures.select_home')}</option>
                {teams?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">{t('admin.fixtures.away_team')}</label>
              <select {...register('awayTeamId', { required: true })} className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none">
                <option value="">{t('admin.fixtures.select_away')}</option>
                {teams?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">{t('admin.fixtures.col_datetime')}</label>
              <input {...register('matchDate', { required: true })} type="datetime-local" className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">{t('admin.fixtures.col_venue')}</label>
              <input {...register('venue')} type="text" className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none" placeholder={t('admin.fixtures.venue_placeholder')} />
            </div>
          </div>

          <button type="submit" disabled={createFixtureMutation.isPending} className="w-full bg-red text-white font-display text-xl uppercase tracking-widest py-4 rounded-xl hover:bg-red-dark transition-all disabled:opacity-50">
            {createFixtureMutation.isPending ? <Loader2 className="animate-spin mx-auto" /> : <span>{t('admin.fixtures.create')}</span>}
          </button>
        </form>
      </AdminModal>
    </div>
  );
};

export default AdminFixturesPage;
