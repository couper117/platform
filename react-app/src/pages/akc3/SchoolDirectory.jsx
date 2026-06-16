import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { School, Search, Filter, ChevronRight, GraduationCap } from 'lucide-react';
import ResponsiveWrapper from '../../components/shared/ResponsiveWrapper';
import Skeleton from '../../components/shared/Skeleton';
import Seo from '../../components/shared/Seo';
import AmashuriHero from '../../components/amashuri/AmashuriHero';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { getSchools } from '../../api/endpoints/amashuri';

const SchoolDirectory = () => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({ category: '', search: '' });

  const { data: schools, isLoading } = useQuery({
    queryKey: ['amashuri-schools-directory', filters],
    queryFn: () => getSchools(filters),
    retry: false,
  });

  const list = schools?.data || [];

  return (
    <div className="bg-surface-2 dark:bg-surface-dark min-h-screen pb-24">
      <Seo title="School Directory — Amashuri Games" description="Discover every institution competing in Rwanda's inter-school championships." />

      <AmashuriHero title={t('amashuri.directory.title')} accent={t('amashuri.directory.accent')} subtitle={t('amashuri.directory.subtitle')} compact>
        <div className="flex items-center bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/20 w-full max-w-md mt-2">
          <Search className="text-white/50 ml-2" size={18} />
          <label htmlFor="school-search" className="sr-only">{t('common.search')}</label>
          <input
            id="school-search"
            type="text"
            placeholder={t('amashuri.directory.search_placeholder')}
            className="bg-transparent border-none text-white placeholder:text-white/40 focus:ring-0 focus:outline-none w-full p-2 text-sm"
            value={filters.search}
            onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
          />
        </div>
      </AmashuriHero>

      {/* Filter bar */}
      <div className="sticky top-[68px] z-40 bg-white/80 dark:bg-surface-dark2/80 backdrop-blur-xl border-b border-surface-3 dark:border-white/5 shadow-sm">
        <ResponsiveWrapper>
          <div className="flex overflow-x-auto scrollbar-hide py-4 gap-6 items-center">
            <div className="flex items-center gap-3 flex-shrink-0">
              <Filter size={14} className="text-rwanda-blue" />
              <label htmlFor="cat-filter" className="sr-only">{t('amashuri.categories')}</label>
              <select
                id="cat-filter"
                className="bg-transparent border-none text-[11px] font-bold uppercase tracking-widest focus:ring-0 cursor-pointer p-0"
                value={filters.category}