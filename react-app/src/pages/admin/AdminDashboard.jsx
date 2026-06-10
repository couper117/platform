import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Users, UserSquare2, FileText, Activity, ArrowUpRight, Clock, Settings } from 'lucide-react';
import { getLeagues } from '../../api/endpoints/leagues';
import { getFixtures } from '../../api/endpoints/fixtures';
import Skeleton from '../../components/shared/Skeleton';

const StatCard = ({ icon, label, value, trend, color = "red" }) => (
  <div className="bg-white dark:bg-surface-dark2 p-6 rounded-3xl border border-surface-3 dark:border-white/5 space-y-4 hover:shadow-xl transition-all group">
    <div className="flex justify-between items-start">
      <div className={`p-3 bg-${color}/5 rounded-2xl text-${color} group-hover:bg-${color} group-hover:text-white transition-all`}>
        {icon}
      </div>
      {trend && (
        <div className="flex items-center space-x-1 text-green text-[10px] font-bold uppercase tracking-widest bg-green/5 px-2 py-1 rounded-full">
          <ArrowUpRight size={10} />
          <span>{trend}%</span>
        </div>
      )}
    </div>
    <div>
      <h3 className="text-4xl font-display uppercase tracking-tight">{value}</h3>
      <p className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-40">{label}</p>
    </div>
  </div>
);

const AdminDashboard = () => {
  const { data: leagues, isLoading: leaguesLoading } = useQuery({
    queryKey: ['admin-stats-leagues'],
    queryFn: () => getLeagues(),
  });

  const { data: fixtures } = useQuery({
    queryKey: ['admin-stats-fixtures'],
    queryFn: () => getFixtures({ status: 'LIVE' }),
  });

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">