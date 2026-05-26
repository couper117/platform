import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trophy, Plus, Edit2, Trash2, UserPlus, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import apiClient from '../../api/client';
import AdminTable from '../../components/admin/AdminTable';
import AdminModal from '../../components/admin/AdminModal';
import Skeleton from '../../components/shared/Skeleton';

const AdminLeaguesPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReporterModalOpen, setIsModalReporterOpen] = useState(false);
  const [isAdminModalOpen, setIsModalAdminOpen] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [reporterEmail, setReporterEmail] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  const { data: leagues, isLoading } = useQuery({
    queryKey: ['admin-leagues'],
    queryFn: async () => {
      const { data } = await apiClient.get('/leagues');
      return data.data;
    },
  });

  const assignReporterMutation = useMutation({
    mutationFn: async ({ leagueId, email }) => {
      await apiClient.post(`/leagues/${leagueId}/assign-reporter`, { email });
    },
    onSuccess: () => {
      setIsModalReporterOpen(false);
      setReporterEmail('');
      alert('Reporter authorized successfully!');
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to assign reporter');
    }
  });

  const assignAdminMutation = useMutation({
    mutationFn: async ({ leagueId, email }) => {
      await apiClient.post(`/admin/assign-league-admin`, { leagueId, email });
    },
    onSuccess: () => {
      setIsModalAdminOpen(false);
      setAdminEmail('');
      alert('League Admin assigned successfully!');
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to assign admin');
    }
  });

  const handleOpenReporter = (league) => {
    setSelectedLeague(league);
    setIsModalReporterOpen(true);
  };

  const handleOpenAdmin = (league) => {
    setSelectedLeague(league);
    setIsModalAdminOpen(true);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-display uppercase tracking-tighter">Manage <span className="text-red">Leagues</span></h1>
          <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">System-wide competition management</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-red text-white px-8 py-3 rounded-xl font-display text-lg uppercase tracking-widest hover:bg-red-dark transition-all shadow-xl shadow-red/20 flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Create League</span>
        </button>
      </div>

      {isLoading ? (
        <Skeleton type="card" count={3} />
      ) : (
        <AdminTable headers={['League Name', 'Sport', 'Season', 'Teams', 'Status', 'Actions']}>
          {leagues?.map(league => (
            <tr key={league.id} className="hover:bg-surface-2 dark:hover:bg-white/5 transition-colors">
              <td className="px-6 py-5">
                <span className="font-bold text-sm uppercase tracking-tight">{league.name}</span>
              </td>
              <td className="px-6 py-5 text-[10px] font-bold opacity-60 uppercase">{league.sport?.name}</td>
              <td className="px-6 py-5 text-sm opacity-40">{league.season}</td>
              <td className="px-6 py-5 text-sm">{league._count?.teams || 0}</td>
              <td className="px-6 py-5">
                <span className={`text-[8px] font-bold px-2 py-1 rounded border uppercase ${league.status === 'ACTIVE' ? 'bg-green/5 text-green border-green/10' : 'bg-gold/5 text-gold border-gold/10'}`}>
                  {league.status}
                </span>
              </td>
              <td className="px-6 py-5">
                <div className="flex items-center space-x-3">
                  <button onClick={() => handleOpenAdmin(league)} className="p-2 hover:bg-red/10 text-red rounded-lg transition-colors" title="Assign League Admin">
                    <ShieldCheck size={18} />
                  </button>
                  <button onClick={() => handleOpenReporter(league)} className="p-2 hover:bg-blue-500/10 text-blue-500 rounded-lg transition-colors" title="Authorize Reporter">
                    <UserPlus size={18} />
                  </button>
                  <button className="p-2 hover:bg-surface-3 dark:hover:bg-white/10 rounded-lg transition-colors">
                    <Edit2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}

      {/* Authorize Reporter Modal */}
      <AdminModal 
        isOpen={isReporterModalOpen} 
        onClose={() => setIsModalReporterOpen(false)} 
        title={`Authorize Reporter for ${selectedLeague?.name}`}
      >
        <div className="space-y-6">
          <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-start space-x-4 text-blue-500">
            <AlertCircle size={20} className="mt-0.5" />
            <p className="text-xs font-bold uppercase tracking-widest leading-relaxed">
              Entering an email here will grant the user "Match Reporter" privileges for this league. They will be able to log live match events from the pitch.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-widest opacity-40 ml-1">Reporter Email Address</label>
            <input 
              type="email" 
              className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl focus:border-red outline-none transition-all placeholder:opacity-20"
              placeholder="e.g. reporter@rwasport.rw"
              value={reporterEmail}
              onChange={(e) => setReporterEmail(e.target.value)}
            />
          </div>

          <button 
            onClick={() => assignReporterMutation.mutate({ leagueId: selectedLeague.id, email: reporterEmail })}
            disabled={assignReporterMutation.isPending || !reporterEmail}
            className="w-full bg-red text-white font-display text-xl uppercase tracking-widest py-4 rounded-xl hover:bg-red-dark transition-all disabled:opacity-50 flex items-center justify-center space-x-3"
          >
            {assignReporterMutation.isPending ? <Loader2 className="animate-spin" /> : <span>Authorize Access</span>}
          </button>
        </div>
      </AdminModal>

      {/* Assign League Admin Modal */}
      <AdminModal 
        isOpen={isAdminModalOpen} 
        onClose={() => setIsModalAdminOpen(false)} 
        title={`Assign Admin for ${selectedLeague?.name}`}
      >
        <div className="space-y-6">
          <div className="p-4 bg-red/5 border border-red/10 rounded-2xl flex items-start space-x-4 text-red">
            <ShieldCheck size={20} className="mt-0.5" />
            <p className="text-xs font-bold uppercase tracking-widest leading-relaxed">
              Superadmin Action: Granting "League Admin" status will allow this user to manage matches, verify teams, and authorize reporters for this specific competition.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-widest opacity-40 ml-1">Admin Email Address</label>
            <input 
              type="email" 
              className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl focus:border-red outline-none transition-all"
              placeholder="e.g. admin@rwasport.rw"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
            />
          </div>

          <button 
            onClick={() => assignAdminMutation.mutate({ leagueId: selectedLeague.id, email: adminEmail })}
            disabled={assignAdminMutation.isPending || !adminEmail}
            className="w-full bg-red text-white font-display text-xl uppercase tracking-widest py-4 rounded-xl hover:bg-red-dark transition-all disabled:opacity-50 flex items-center justify-center space-x-3"
          >
            {assignAdminMutation.isPending ? <Loader2 className="animate-spin" /> : <span>Confirm Assignment</span>}
          </button>
        </div>
      </AdminModal>
    </div>
  );
};

export default AdminLeaguesPage;
