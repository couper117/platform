import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { School, Users, Trophy, MapPin, Search, ArrowRight, GraduationCap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ResponsiveWrapper from '../../components/shared/ResponsiveWrapper';
import Skeleton from '../../components/shared/Skeleton';
import apiClient from '../../api/client';

const AkcHome = () => {
  const { t } = useTranslation();

  const { data: schools, isLoading: schoolsLoading } = useQuery({
    queryKey: ['akc-schools-summary'],
    queryFn: async () => {
      const { data } = await apiClient.get('/akc3/schools');
      return data;
    },
  });

  return (
    <div className="bg-surface-2 dark:bg-surface-dark min-h-screen pb-24">
      {/* Hero */}
      <section className="bg-rwanda-blue py-24 relative overflow-hidden text-white">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] opacity-10" />
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-rwanda-yellow/20 to-transparent" />
        
        <ResponsiveWrapper className="relative z-10">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center space-x-2 bg-white/10 border border-white/20 px-4 py-1.5 rounded-full">
              <GraduationCap size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Interschool Excellence</span>
            </div>
            <h1 className="text-5xl sm:text-7xl font-display uppercase tracking-tighter leading-none">
              Amashuri <br /> <span className="text-rwanda-yellow">Kagame Cup</span>
            </h1>
            <p className="text-lg opacity-80 max-w-xl font-light">
              The premier national platform for school sports development. Nurturing the next generation of Rwandan champions from Primary to TVET.
            </p>
            <div className="flex gap-4 pt-4">
              <Link to="/akc3/schools" className="bg-white text-rwanda-blue font-display text-lg uppercase tracking-widest px-10 py-4 rounded-xl hover:bg-surface-2 transition-all">
                Find Your School
              </Link>
            </div>
          </div>
        </ResponsiveWrapper>
      </section>

      {/* Levels Info */}
      <section className="py-12 border-b border-surface-3 dark:border-white/5 bg-white dark:bg-surface-dark2">
        <ResponsiveWrapper>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {['Cell', 'Sector', 'District', 'Province', 'National'].map((level, i) => (
              <div key={level} className="flex flex-col items-center text-center p-4 border border-surface-3 dark:border-white/5 rounded-2xl bg-surface-2 dark:bg-white/5">
                <span className="text-xs font-display text-rwanda-blue mb-1">Level {i+1}</span>
                <span className="text-sm font-bold uppercase tracking-widest opacity-60">{level}</span>
              </div>
            ))}
          </div>
        </ResponsiveWrapper>
      </section>

      {/* Main Grid */}
      <ResponsiveWrapper className="mt-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Schools Overview */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-display uppercase tracking-tight">Participating <span className="text-rwanda-blue">Schools</span></h2>
              <Link to="/akc3/schools" className="text-[10px] font-bold uppercase tracking-widest text-rwanda-blue hover:underline">View All Directory</Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {schoolsLoading ? (
                <Skeleton type="card" count={2} />
              ) : schools?.data?.slice(0, 4).map(school => (
                <Link key={school.id} to={`/akc3/schools/${school.id}`} className="group bg-white dark:bg-surface-dark2 p-6 rounded-2xl border border-surface-3 dark:border-white/5 hover:shadow-xl transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-surface-2 dark:bg-white/5 rounded-xl flex items-center justify-center text-rwanda-blue group-hover:bg-rwanda-blue group-hover:text-white transition-all">
                      <School size={24} />
                    </div>
                    <span className="text-[8px] font-bold uppercase tracking-widest bg-rwanda-blue/5 text-rwanda-blue px-2 py-1 rounded border border-rwanda-blue/10">
                      {school.category}
                    </span>
                  </div>
                  <h3 className="font-display text-xl uppercase tracking-tight mb-2 group-hover:text-rwanda-blue transition-colors">{school.name}</h3>
                  <div className="flex items-center space-x-2 text-[10px] uppercase font-bold tracking-widest opacity-40">
                    <MapPin size={12} />
                    <span>School Code: {school.code}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Side Info / Stats */}
          <div className="space-y-8">
            <div className="bg-surface-dark p-8 rounded-3xl text-white space-y-6 relative overflow-hidden shadow-2xl shadow-rwanda-blue/20">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rwanda-blue opacity-20 -mr-8 -mt-8 rounded-full blur-3xl" />
              <h3 className="font-display text-2xl uppercase tracking-tight">AKC3 <span className="text-rwanda-blue">Live Data</span></h3>
              <div className="space-y-6">
                {[
                  { label: 'Schools', value: '1,240', icon: <School size={16} /> },
                  { label: 'Athletes', value: '18,500', icon: <Users size={16} /> },
                  { label: 'Competitions', value: '45', icon: <Trophy size={16} /> },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div className="flex items-center space-x-3 opacity-60">
                      {stat.icon}
                      <span className="text-[10px] font-bold uppercase tracking-widest">{stat.label}</span>
                    </div>
                    <span className="text-2xl font-display">{stat.value}</span>
                  </div>
                ))}
              </div>
              <button className="w-full bg-rwanda-blue py-4 rounded-xl font-display text-lg uppercase tracking-widest hover:bg-blue-600 transition-all">Download Regulations</button>
            </div>
          </div>
        </div>
      </ResponsiveWrapper>
    </div>
  );
};

export default AkcHome;
