import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { School, Users, Trophy, MapPin, GraduationCap, ChevronRight, Layers } from 'lucide-react';
import { getSchools, getChampionships } from '../../api/endpoints/amashuri';
import ResponsiveWrapper from '../../components/shared/ResponsiveWrapper';
import Skeleton from '../../components/shared/Skeleton';
import Seo from '../../components/shared/Seo';
import AmashuriHero from '../../components/amashuri/AmashuriHero';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import SectionHeading from '../../components/ui/SectionHeading';
import EmptyState from '../../components/ui/EmptyState';

const LEVEL_KEYS = ['cell', 'sector', 'district', 'province', 'national'];

const AkcHome = () => {
  const { t } = useTranslation();
  const { data: schools, isLoading: schoolsLoading } = useQuery({
    queryKey: ['amashuri-schools-summary'],
    queryFn: () => getSchools(),
    retry: false,
  });
  const { data: comps } = useQuery({
    queryKey: ['amashuri-comps-summary'],
    queryFn: () => getChampionships(),
    retry: false,
  });

  const schoolList = schools?.data || [];
  const championships = comps?.data || [];

  // Real, honest counts derived from live data (no hardcoded numbers).
  const stats = [
    { label: t('amashuri.schools'), value: schoolList.length, icon: <School size={16} /> },
    { label: t('amashuri.championships'), value: championships.length, icon: <Trophy size={16} /> },
    { label: t('amashuri.categories'), value: 3, icon: <Layers size={16} /> },
  ];

  return (
    <div className="bg-surface-2 dark:bg-surface-dark min-h-screen pb-24">
      <Seo title="Amashuri Games — Rwanda Inter-School Sports" description="The home of every Rwandan school championship, from the Kagame Cup to district and provincial leagues." />

      <AmashuriHero
        title="Amashuri"
        accent="Games"
        subtitle={t('amashuri.subtitle')}
      >
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button to="/amashuri/schools" variant="secondary" size="md" className="!bg-white !text-rwanda-blue hover:!bg-surface-2">
            {t('amashuri.find_school')}
          </Button>
          <Button to="/amashuri/championships" variant="blue" size="md" icon={Trophy}>
            {t('amashuri.view_championships')}
          </Button>
        </div>
      </AmashuriHero>

      {/* Competition levels ladder — a school-specific differentiator */}
      <section className="py-12 border-b border-surface-3 dark:border-white/5 bg-white dark:bg-surface-dark2">
        <ResponsiveWrapper>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-rwanda-blue mb-6 text-center">{t('amashuri.road_to_nationals')}</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {LEVEL_KEYS.map((levelKey, i) => (
              <div key={levelKey} className="relative flex flex-col items-center text-center p-4 border border-surface-3 dark:border-white/5 rounded-2xl bg-surface-2 dark:bg-white/5">
                <span className="text-[10px] font-display text-rwanda-blue mb-1">{t('amashuri.stage')} {i + 1}</span>
                <span className="text-sm font-bold uppercase tracking-widest opacity-70">{t(`amashuri.level.${levelKey}`)}</span>
                {i < LEVEL_KEYS.length - 1 && (
                  <ChevronRight size={16} className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-rwanda-blue/40" />
                )}
              </div>
            ))}
          </div>
        </ResponsiveWrapper>
      </section>

      <ResponsiveWrapper className="mt-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Schools overview */}
          <div className="lg:col-span-2 space-y-8">
            <SectionHeading eyebrow={t('amashuri.participating')} title={t('amashuri.schools')} action={t('amashuri.view_directory')} actionTo="/amashuri/schools" className="!mb-0" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {schoolsLoading ? (
                <Skeleton type="card" count={2} />
              ) : schoolList.length > 0 ? (
                schoolList.slice(0, 4).map((school) => (
                  <Card key={school.id} hover to={`/amashuri/schools/${school.id}`} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <span className="w-12 h-12 bg-surface-2 dark:bg-white/5 rounded-xl flex items-center justify-center text-rwanda-blue">
                        <School size={24} />
                      </span>