import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { School, MapPin, Users, Trophy, GraduationCap, ChevronLeft, Calendar } from 'lucide-react';
import ResponsiveWrapper from '../../components/shared/ResponsiveWrapper';
import FixtureCard from '../../components/shared/FixtureCard';
import Skeleton from '../../components/shared/Skeleton';
import apiClient from '../../api/client';

const SchoolProfilePage = () => {
  const { id } = useParams();

  const { data: school, isLoading } = useQuery({
    queryKey: ['akc-school-profile', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/akc3/schools/${id}`);
      return data;
    },
  });

  if (isLoading) return <div className="py-20"><ResponsiveWrapper><Skeleton type="card" /></ResponsiveWrapper></div>;

  const schoolData = school?.data;

  return (
    <div className="bg-surface-2 dark:bg-surface-dark min-h-screen pb-24">
      {/* Header */}
      <section className="bg-rwanda-blue py-20 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent" />
        <ResponsiveWrapper className="relative z-10">
          <Link to="/akc3/schools" className="inline-flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-rwanda-yellow transition-colors mb-8">
            <ChevronLeft size={14} />
            <span>Back to Directory</span>
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-3xl flex items-center justify-center text-rwanda-blue shadow-2xl">
                <School size={64} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="bg-rwanda-yellow text-rwanda-blue text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded">
                    {schoolData?.category}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 italic">Code: {schoolData?.code}</span>
                </div>
                <h1 className="text-4xl sm:text-6xl font-display uppercase tracking-tighter leading-none">{schoolData?.name}</h1>
                <div className="flex items-center space-x-4 opacity-60 text-xs font-bold uppercase tracking-widest">
                  <div className="flex items-center space-x-1">
                    <MapPin size={14} />
                    <span>{schoolData?.sector || 'Unknown'}, Rwanda</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
                <span className="block text-2xl font-display leading-none">{schoolData?.teams?.length || 0}</span>
                <span className="text-[8px] uppercase font-bold tracking-widest opacity-60">Active Teams</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
                <span className="block text-2xl font-display leading-none">0</span>
                <span className="text-[8px] uppercase font-bold tracking-widest opacity-60">Trophies</span>
              </div>
            </div>
          </div>
        </ResponsiveWrapper>
      </section>

      {/* Teams & Fixtures */}
      <ResponsiveWrapper className="mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Active Teams */}
          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-3xl font-display uppercase tracking-tight border-b border-surface-3 dark:border-white/5 pb-4">School <span className="text-rwanda-blue">Teams</span></h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {schoolData?.teams?.map(team => (
                <div key={team.id} className="bg-white dark:bg-surface-dark2 p-6 rounded-3xl border border-surface-3 dark:border-white/5 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-rwanda-blue/5 rounded-2xl text-rwanda-blue">
                      <Trophy size={20} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">AKC {team.ageCategory}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-display uppercase tracking-tight">{team.gender} Team</h3>
                    <p className="text-[10px] uppercase font-bold tracking-widest opacity-40">Coach: {team.coachName || 'TBD'}</p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-surface-3 dark:border-white/5">
                    <div className="flex items-center space-x-2">
                      <Users size={14} className="opacity-40" />
                      <span className="text-xs font-bold opacity-60">{team.players?.length || 0} Players</span>
                    </div>
                    <button className="text-[10px] font-bold uppercase tracking-widest text-rwanda-blue hover:underline">View Roster</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent/Upcoming Matches */}
          <div className="space-y-8">
            <h2 className="text-3xl font-display uppercase tracking-tight border-b border-surface-3 dark:border-white/5 pb-4">Match <span className="text-rwanda-blue">Center</span></h2>
            <div className="space-y-4 opacity-40 text-center py-20 border-2 border-dashed border-surface-3 dark:border-white/5 rounded-3xl">
              <Calendar size={32} className="mx-auto" />
              <p className="text-xs uppercase font-bold tracking-widest">No Recent Matches</p>
            </div>
          </div>
        </div>
      </ResponsiveWrapper>
    </div>
  );
};

export default SchoolProfilePage;
