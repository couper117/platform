import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { School, MapPin, Search, Filter, ChevronRight, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import ResponsiveWrapper from '../../components/shared/ResponsiveWrapper';
import Skeleton from '../../components/shared/Skeleton';
import apiClient from '../../api/client';

const SchoolDirectory = () => {
  const [filters, setFilters] = useState({ category: '', search: '' });

  const { data: schools, isLoading } = useQuery({
    queryKey: ['akc-schools-directory', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/akc3/schools', { params: filters });
      return data;
    },
  });

  return (
    <div className="bg-surface-2 dark:bg-surface-dark min-h-screen pb-24">
      <section className="bg-rwanda-blue py-16 text-white">
        <ResponsiveWrapper>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-6xl font-display uppercase tracking-tighter">School <span className="text-rwanda-yellow">Directory</span></h1>
              <p className="opacity-60 text-sm uppercase tracking-widest font-bold">Discover every institution in the Kagame Cup</p>
            </div>
            
            <div className="flex bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/20 w-full max-w-md">
              <Search className="text-white/40 ml-3 mt-2.5" size={20} />
              <input 
                type="text" 
                placeholder="Search school name or code..." 
                className="bg-transparent border-none text-white placeholder:text-white/30 focus:ring-0 w-full p-2 text-sm font-bold uppercase tracking-widest"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
          </div>
        </ResponsiveWrapper>
      </section>

      <div className="sticky top-[68px] z-40 bg-white/80 dark:bg-surface-dark2/80 backdrop-blur-xl border-b border-surface-3 dark:border-white/5 shadow-sm">
        <ResponsiveWrapper>
          <div className="flex overflow-x-auto scrollbar-hide py-4 space-x-6 items-center no-wrap">
            <div className="flex items-center space-x-3 flex-shrink-0">
              <Filter size={14} className="text-rwanda-blue" />
              <select 
                className="bg-transparent border-none text-[11px] font-bold uppercase tracking-widest focus:ring-0 cursor-pointer p-0"
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              >
                <option value="">All Categories</option>
                <option value="PRIMARY">Primary Schools</option>
                <option value="SECONDARY">Secondary Schools</option>
                <option value="TVET">TVET Institutions</option>
              </select>
            </div>
          </div>
        </ResponsiveWrapper>
      </div>

      <ResponsiveWrapper className="mt-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Skeleton type="card" count={6} />
          </div>
        ) : schools?.data?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {schools.data.map(school => (
              <Link key={school.id} to={`/akc3/schools/${school.id}`} className="group bg-white dark:bg-surface-dark2 p-8 rounded-3xl border border-surface-3 dark:border-white/5 hover:shadow-2xl transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rwanda-blue/5 -mr-16 -mt-16 rounded-full group-hover:bg-rwanda-blue/10 transition-colors" />
                
                <div className="relative z-10 space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="p-4 bg-surface-2 dark:bg-white/5 rounded-2xl text-rwanda-blue group-hover:bg-rwanda-blue group-hover:text-white transition-all shadow-sm">
                      <School size={32} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 rounded-full">
                      {school.category}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-display uppercase tracking-tight leading-tight group-hover:text-rwanda-blue transition-colors">{school.name}</h3>
                    <div className="flex items-center space-x-2 text-[10px] uppercase font-bold tracking-widest opacity-40 italic">
                      <span>Code: {school.code}</span>
                      <span>•</span>
                      <span>{school.sector || 'National'}</span>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-surface-3 dark:border-white/5 flex items-center justify-between group-hover:text-rwanda-blue transition-colors">
                    <div className="flex items-center space-x-2">
                      <GraduationCap size={16} />
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em]">View School Teams</span>
                    </div>
                    <ChevronRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-40 text-center opacity-20 space-y-4">
            <School size={64} className="mx-auto" />
            <h3 className="text-3xl font-display uppercase tracking-widest">No Schools Found</h3>
          </div>
        )}
      </ResponsiveWrapper>
    </div>
  );
};

export default SchoolDirectory;
