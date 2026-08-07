import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Trophy, Plus, Edit2, Trash2, UserPlus, AlertCircle, Loader2, ShieldCheck, X, CalendarPlus } from 'lucide-react';
import apiClient from '../../api/client';
import AdminTable from '../../components/admin/AdminTable';
import AdminModal from '../../components/admin/AdminModal';
import Skeleton from '../../components/shared/Skeleton';
import useSportScope from '../../hooks/useSportScope';

const AdminLeaguesPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const scope = useSportScope();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReporterModalOpen, setIsModalReporterOpen] = useState(false);
  const [isAdminModalOpen, setIsModalAdminOpen] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [reporterEmail, setReporterEmail] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const p = scope.profile;
  const compOne = p?.competition || 'League';
  const compMany = p?.competitionPlural || 'Leagues';
  const formats = p?.formats || [
    { value: 'LEAGUE', label: t('sport_profile.TEAM.formats.LEAGUE') },
    { value: 'KNOCKOUT', label: t('sport_profile.TEAM.formats.KNOCKOUT') },
    { value: 'GROUP_KNOCKOUT', label: t('sport_profile.TEAM.formats.GROUP_KNOCKOUT') },
    { value: 'ROUND_ROBIN', label: t('sport_profile.TEAM.formats.ROUND_ROBIN') },
  ];

  const { data: leagues, isLoading } = useQuery({
    queryKey: ['admin-leagues', scope.key],
    queryFn: async () => {
      const { data } = await apiClient.get('/leagues', { params: scope.params });
      return data.data;
    },
  });

  const { data: sports } = useQuery({
    queryKey: ['admin-sports-list'],
    queryFn: async () => {
      const { data } = await apiClient.get('/sports');
      return data.data;
    },
  });

  const createLeagueMutation = useMutation({
    mutationFn: async (data) => {
      await apiClient.post('/leagues', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-leagues'] });
      setIsModalOpen(false);
      reset();
      alert(t('admin.leagues.create_success'));
    },
    onError: (err) => {
      alert(err.response?.data?.message || t('admin.leagues.create_failed'));
    }
  });

  const deleteLeagueMutation = useMutation({
    mutationFn: async (id) => {
      await apiClient.delete(`/leagues/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-leagues'] });
      alert(t('admin.leagues.delete_success'));
    }
  });

  const generateFixturesMutation = useMutation({
    mutationFn: async ({ id, doubleRound, force }) => {
      const { data } = await apiClient.post(`/leagues/${id}/generate-fixtures`, { doubleRound, force });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-fixtures'] });
      alert(data?.message || t('admin.leagues.fixtures_generated'));
    },
    onError: (err) => {
      alert(err.response?.data?.message || t('admin.leagues.generate_failed'));
    }
  });

  const handleGenerate = (league) => {
    const doubleRound = window.confirm(t('admin.leagues.generate_confirm', { name: league.name }));
    generateFixturesMutation.mutate({ id: league.id, doubleRound, force: true });
  };

  const assignReporterMutation = useMutation({
    mutationFn: async ({ leagueId, email }) => {
      await apiClient.post(`/leagues/${leagueId}/assign-reporter`, { email });
    },
    onSuccess: () => {
      setIsModalReporterOpen(false);
      setReporterEmail('');
      alert(t('admin.leagues.reporter_success'));
    }
  });

  const assignAdminMutation = useMutation({
    mutationFn: async ({ leagueId, email }) => {
      await apiClient.post(`/admin/assign-league-admin`, { leagueId, email });
    },
    onSuccess: () => {
      setIsModalAdminOpen(false);
      setAdminEmail('');
      alert(t('admin.leagues.admin_success'));
    }
  });

  const onSubmit = (data) => {
    createLeagueMutation.mutate(data);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-display uppercase tracking-tighter">Manage <span className="text-red">{compMany}</span></h1>
          <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">Create and delegate {p ? `${p.label.toLowerCase()} competitions` : 'sports competitions'}</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-red text-white px-8 py-3 rounded-xl font-display text-lg uppercase tracking-widest hover:bg-red-dark transition-all shadow-xl shadow-red/20 flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>{t('admin.leagues.create_named', { name: compOne })}</span>
        </button>
      </div>

      {isLoading ? (
        <Skeleton type="card" count={3} />
      ) : (
        <AdminTable headers={[t('admin.leagues.col_name'), t('admin.col_sport'), t('admin.leagues.col_season'), t('admin.col_status'), t('admin.col_actions')]}>
          {leagues?.map(league => (
            <tr key={league.id} className="hover:bg-surface-2 dark:hover:bg-white/5 transition-colors">
              <td className="px-6 py-5">
                <span className="font-bold text-sm uppercase tracking-tight">{league.name}</span>
              </td>
              <td className="px-6 py-5 text-[10px] font-bold opacity-60 uppercase">{league.sport?.name}</td>
              <td className="px-6 py-5 text-sm opacity-40">{league.season}</td>
              <td className="px-6 py-5">
                <span className={`text-[8px] font-bold px-2 py-1 rounded border uppercase ${league.status === 'ACTIVE' ? 'bg-green/5 text-green border-green/10' : 'bg-gold/5 text-gold border-gold/10'}`}>
                  {league.status}
                </span>
              </td>
              <td className="px-6 py-5">
                <div className="flex items-center space-x-3">
                  <button onClick={() => { setSelectedLeague(league); setIsModalAdminOpen(true); }} className="p-2 hover:bg-red/10 text-red rounded-lg transition-colors" title={t('admin.leagues.assign_admin')}>
                    <ShieldCheck size={18} />
                  </button>
                  <button onClick={() => handleGenerate(league)} className="p-2 hover:bg-green/10 text-green rounded-lg transition-colors" title="Generate Fixtures">
                    <CalendarPlus size={18} />
                  </button>
                  <button onClick={() => { setSelectedLeague(league); setIsModalReporterOpen(true); }} className="p-2 hover:bg-blue-500/10 text-blue-500 rounded-lg transition-colors" title="Authorize Reporter">
                    <UserPlus size={18} />
                  </button>
                  <button onClick={() => { if(window.confirm('Delete this league?')) deleteLeagueMutation.mutate(league.id) }} className="p-2 hover:bg-red/10 text-red rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}

      {/* Create League Modal */}
      <AdminModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('admin.leagues.modal_create_named', { name: compOne })}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">{t('admin.leagues.col_name')}</label>
              <input {...register('name', { required: true })} className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl focus:border-red outline-none" placeholder="e.g. Rwanda Premier League" />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">{t('admin.col_sport')}</label>
              {scope.isScoped ? (
                <div className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl opacity-70 text-sm font-bold uppercase tracking-tight">
                  {scope.sport?.name || 'Your Sport'}
                </div>
              ) : (
                <select {...register('sportId', { required: true })} className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none">
                  <option value="">{t('admin.leagues.select_sport')}</option>
                  {sports?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">{t('admin.leagues.col_season')}</label>
              <input {...register('season', { required: true })} className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none" placeholder="2025/2026" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">{t('admin.leagues.gender')}</label>
              <select {...register('gender')} className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none">
                <option value="MALE">{t('enums.gender.MALE')}</option>
                <option value="FEMALE">{t('enums.gender.FEMALE')}</option>
                <option value="MIXED">{t('enums.gender.MIXED')}</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">{t('admin.leagues.competition_level')}</label>
              <select {...register('level')} className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none">
                <option value="NATIONAL">{t('enums.level.NATIONAL')}</option>
                <option value="REGIONAL">{t('enums.level.REGIONAL')}</option>
                <option value="DISTRICT">{t('enums.level.DISTRICT')}</option>
                <option value="SCHOOL">{t('enums.level.SCHOOL')}</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">{t('admin.championships.age_category')}</label>
              <select {...register('ageCategory')} className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none">
                <option value="SENIOR">{t('enums.age_group.SENIOR')}</option>
                <option value="U20">U20</option>
                <option value="U17">U17</option>
                <option value="U15">U15</option>
                <option value="U13">U13</option>
                <option value="JUNIOR">{t('enums.age_group.JUNIOR')}</option>
                <option value="VETERAN">{t('enums.age_group.VETERAN')}</option>
                <option value="ALL">{t('enums.age_group.ALL')}</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">{t('admin.leagues.format')}</label>
              <select {...register('format')} className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none">
                {formats.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">{t('admin.leagues.max_teams')}</label>
              <input type="number" min="2" {...register('maxTeams')} defaultValue={16} className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">{t('admin.championships.start_date')}</label>
              <input type="date" {...register('startDate')} className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">{t('admin.championships.end_date')}</label>
              <input type="date" {...register('endDate')} className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none" />
            </div>
          </div>

          <button type="submit" disabled={createLeagueMutation.isPending} className="w-full bg-red text-white font-display text-xl uppercase tracking-widest py-4 rounded-xl hover:bg-red-dark transition-all flex items-center justify-center space-x-3">
            {createLeagueMutation.isPending ? <Loader2 className="animate-spin" /> : <span>Create League</span>}
          </button>
        </form>
      </AdminModal>

      {/* Delegation Modals (Same as before but integrated) */}
      <AdminModal isOpen={isReporterModalOpen} onClose={() => setIsModalReporterOpen(false)} title={t('admin.leagues.modal_reporter')}>
        <div className="space-y-6">
          <input type="email" value={reporterEmail} onChange={e => setReporterEmail(e.target.value)} className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl" placeholder="reporter@email.com" />
          <button onClick={() => assignReporterMutation.mutate({ leagueId: selectedLeague.id, email: reporterEmail })} className="w-full bg-red text-white font-display text-xl uppercase py-4 rounded-xl">Authorize</button>
        </div>
      </AdminModal>

      <AdminModal isOpen={isAdminModalOpen} onClose={() => setIsModalAdminOpen(false)} title={t('admin.leagues.assign_admin')}>
        <div className="space-y-6">
          <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl" placeholder="admin@email.com" />
          <button onClick={() => assignAdminMutation.mutate({ leagueId: selectedLeague.id, email: adminEmail })} className="w-full bg-red text-white font-display text-xl uppercase py-4 rounded-xl">Assign Admin</button>
        </div>
      </AdminModal>
    </div>
  );
};

export default AdminLeaguesPage;
