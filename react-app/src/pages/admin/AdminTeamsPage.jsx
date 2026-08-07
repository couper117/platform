import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, ShieldCheck, XCircle, Mail, Trash2, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/client';
import { useEnumLabel } from '../../i18n/enums';
import AdminTable from '../../components/admin/AdminTable';
import Skeleton from '../../components/shared/Skeleton';

const AdminTeamsPage = () => {
  const { t } = useTranslation();
  const enumLabel = useEnumLabel();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('PENDING');

  const { data: teams, isLoading } = useQuery({
    queryKey: ['admin-teams', filter],
    queryFn: async () => {
      const { data } = await apiClient.get('/teams', { params: { status: filter } });
      return data.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      await apiClient.put(`/teams/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-teams']);
    },
    onError: (err) => {
      alert(err.response?.data?.message || t('admin.teams.update_failed'));
    }
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async (id) => {
      await apiClient.delete(`/teams/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-teams']);
      alert(t('admin.teams.delete_success'));
    },
    onError: (err) => {
      alert(err.response?.data?.message || t('admin.teams.delete_failed'));
    }
  });

  const handleDeleteTeam = (id) => {
    if (window.confirm(t('admin.teams.delete_confirm'))) {
      deleteTeamMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-display uppercase tracking-tighter">
            {t('admin.teams.title')} <span className="text-red">{t('admin.teams.title_accent')}</span>
          </h1>
          <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">{t('admin.teams.subtitle')}</p>
        </div>

        <div className="flex bg-surface-dark p-1 rounded-2xl border border-white/10">
          {['PENDING', 'VERIFIED', 'SUSPENDED'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${filter === s ? 'bg-red text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
            >
              {enumLabel('team_status', s)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Skeleton type="card" count={3} />
      ) : (
        <AdminTable headers={[t('admin.teams.col_info'), t('admin.col_sport'), t('admin.teams.col_location'), t('admin.teams.col_manager'), t('admin.col_status'), t('admin.col_actions')]}>
          {teams?.map(team => (
            <tr key={team.id} className="hover:bg-surface-2 dark:hover:bg-white/5 transition-colors">
              <td className="px-6 py-5">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-surface-3 dark:bg-white/10 flex items-center justify-center overflow-hidden border border-surface-3">
                    {team.logo ? <img src={team.logo} className="w-full h-full object-cover" /> : <Users size={16} className="opacity-20" />}
                  </div>
                  <div>
                    <p className="font-bold text-sm uppercase tracking-tight">{team.name}</p>
                    <p className="text-[8px] opacity-40 uppercase tracking-widest">{team.shortName || t('admin.teams.no_code')}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-5 text-[10px] font-bold opacity-60 uppercase">{enumLabel('sport', team.sport?.name)}</td>
              <td className="px-6 py-5">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{team.city}</p>
                  <p className="text-[8px] opacity-40 uppercase font-bold tracking-widest">{team.province}</p>
                </div>
              </td>
              <td className="px-6 py-5">
                <div className="flex flex-col space-y-1">
                  <span className="text-xs font-bold uppercase tracking-tight">{team.managerUser?.fullName || t('admin.teams.unassigned')}</span>
                  <span className="text-[8px] opacity-40 lowercase">{team.managerUser?.email || t('admin.teams.no_email')}</span>
                </div>
              </td>
              <td className="px-6 py-5">
                <span className={`text-[8px] font-bold px-2 py-1 rounded border uppercase ${team.status === 'VERIFIED' ? 'bg-green/5 text-green border-green/10' : team.status === 'PENDING' ? 'bg-gold/5 text-gold border-gold/20' : 'bg-red/5 text-red border-red/10'}`}>
                  {enumLabel('team_status', team.status)}
                </span>
              </td>
              <td className="px-6 py-5">
                <div className="flex items-center space-x-2">
                  {team.status !== 'VERIFIED' && (
                    <button 
                      onClick={() => updateStatusMutation.mutate({ id: team.id, status: 'VERIFIED' })}
                      className="p-2 hover:bg-green/10 text-green rounded-lg transition-colors" title={t('admin.teams.verify')}
                    >
                      <ShieldCheck size={18} />
                    </button>
                  )}
                  {team.status !== 'SUSPENDED' && (
                    <button 
                      onClick={() => updateStatusMutation.mutate({ id: team.id, status: 'SUSPENDED' })}
                      className="p-2 hover:bg-red/10 text-red rounded-lg transition-colors" title={t('admin.teams.suspend')}
                    >
                      <XCircle size={18} />
                    </button>
                  )}
                  <button 
                    onClick={() => handleDeleteTeam(team.id)}
                    className="p-2 hover:bg-red/10 text-red rounded-lg transition-colors" title={t('admin.teams.delete')}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
};

export default AdminTeamsPage;
