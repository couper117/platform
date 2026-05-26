import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, FileText, Activity, AlertCircle, Plus, ChevronRight, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import apiClient from '../../api/client';
import Skeleton from '../../components/shared/Skeleton';
import FixtureCard from '../../components/shared/FixtureCard';

const TeamDashboard = () => {
  const { user } = useAuthStore();
  const teamId = user?.managedTeam?.id;

  const { data: team, isLoading: teamLoading } = useQuery({
    queryKey: ['team-dashboard-data', teamId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/teams/${teamId}`);
      return data.data;
    },
    enabled: !!teamId,
  });

  const { data: fixtures } = useQuery({
    queryKey: ['team-fixtures-upcoming', teamId],
    queryFn: async () => {
      const { data } = await apiClient.get('/fixtures', { params: { teamId, status: 'SCHEDULED', limit: 2 } });
      return data.data;
    },
    enabled: !!teamId,
  });

  if (teamLoading) return <Skeleton type="card" count={3} />;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center space-x-6">
          <div className="w-20 h-20 bg-white dark:bg-surface-dark2 rounded-3xl flex items-center justify-center border border-surface-3 dark:border-white/5 shadow-xl">
            {team?.logo ? (
              <img src={team.logo} alt={team.name} className="w-full h-full object-cover rounded-3xl" />
            ) : (
              <Trophy size={40} className="text-red opacity-20" />
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${team?.status === 'VERIFIED' ? 'bg-green/10 text-green border border-green/20' : 'bg-gold/10 text-gold border border-gold/20'}`}>
                {team?.status}
              </span>
            </div>
            <h1 className="text-4xl font-display uppercase tracking-tighter leading-none">{team?.name}</h1>
            <p className="text-[10px] uppercase font-bold tracking-widest opacity-40 italic">Club Management Portal</p>
          </div>
        </div>
        
        <Link to="/team/players/new" className="bg-red text-white px-8 py-3 rounded-xl font-display text-lg uppercase tracking-widest hover:bg-red-dark transition-all shadow-xl shadow-red/20 flex items-center space-x-2">
          <Plus size={20} />
          <span>Register Athlete</span>
        </Link>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-surface-dark2 p-6 rounded-3xl border border-surface-3 dark:border-white/5 space-y-2">
          <div className="flex items-center space-x-3 text-red">
            <Users size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Roster Size</span>
          </div>
          <p className="text-4xl font-display">{team?.players?.length || 0}</p>
        </div>

        <div className="bg-white dark:bg-surface-dark2 p-6 rounded-3xl border border-surface-3 dark:border-white/5 space-y-2">
          <div className="flex items-center space-x-3 text-red">
            <FileText size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Missing Docs</span>
          </div>
          <p className="text-4xl font-display text-gold">4</p>
        </div>

        <div className="bg-white dark:bg-surface-dark2 p-6 rounded-3xl border border-surface-3 dark:border-white/5 space-y-2">
          <div className="flex items-center space-x-3 text-red">
            <Activity size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Next Match</span>
          </div>
          <p className="text-4xl font-display">4d</p>
        </div>
      </div>

      {/* Alerts / Tasks */}
      {team?.status !== 'VERIFIED' && (
        <div className="bg-gold/10 border border-gold/20 p-6 rounded-3xl flex items-center space-x-6 text-gold animate-pulse">
          <AlertCircle size={32} />
          <div className="space-y-1">
            <h3 className="font-display text-xl uppercase leading-none">Account Pending Approval</h3>
            <p className="text-xs font-bold uppercase tracking-widest opacity-60">Upload your club certification documents to unlock all features.</p>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Roster Preview */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-surface-3 dark:border-white/5 pb-4">
            <h2 className="text-2xl font-display uppercase tracking-tight">Recent Athletes</h2>
            <Link to="/team/players" className="text-[10px] font-bold uppercase tracking-widest text-red hover:underline">View Full Roster</Link>
          </div>
          <div className="space-y-3">
            {team?.players?.slice(0, 5).map(player => (
              <div key={player.id} className="bg-white dark:bg-surface-dark2 p-4 rounded-2xl border border-surface-3 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-surface-2 dark:bg-white/5 flex items-center justify-center overflow-hidden">
                    {player.photo ? <img src={player.photo} className="w-full h-full object-cover" /> : <Users size={16} className="opacity-20" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-tight">{player.fullName}</p>
                    <p className="text-[10px] opacity-40 uppercase tracking-widest">{player.position} • No. {player.jerseyNumber}</p>
                  </div>
                </div>
                <div className={`text-[8px] font-bold px-2 py-1 rounded-full uppercase ${player.status === 'VERIFIED' ? 'text-green' : 'text-gold'}`}>
                  {player.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Schedule Preview */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-surface-3 dark:border-white/5 pb-4">
            <h2 className="text-2xl font-display uppercase tracking-tight">Upcoming Schedule</h2>
            <Link to="/team/fixtures" className="text-[10px] font-bold uppercase tracking-widest text-red hover:underline">View Calendar</Link>
          </div>
          <div className="space-y-4">
            {fixtures?.length > 0 ? fixtures.map(f => (
              <FixtureCard key={f.id} fixture={f} showLeague={true} />
            )) : (
              <div className="py-20 text-center opacity-20 border-2 border-dashed border-surface-3 dark:border-white/5 rounded-3xl">
                <p className="font-display text-xl uppercase tracking-widest">No Matches Scheduled</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamDashboard;
