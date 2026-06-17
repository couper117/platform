import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { School, MapPin, Users, Trophy, ChevronLeft } from 'lucide-react';
import ResponsiveWrapper from '../../components/shared/ResponsiveWrapper';
import Skeleton from '../../components/shared/Skeleton';
import Seo from '../../components/shared/Seo';
import AmashuriFixtureCard from '../../components/amashuri/AmashuriFixtureCard';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { getSchool, getAkcFixtures } from '../../api/endpoints/amashuri';

const SchoolProfilePage = () => {
  const { t } = useTranslation();
  const { id } = useParams();

  const { data: school, isLoading } = useQuery({
    queryKey: ['amashuri-school-profile', id],
    queryFn: () => getSchool(id),
    retry: false,
  });

  const { data: fixtures } = useQuery({
    queryKey: ['amashuri-school-fixtures', id],
    queryFn: () => getAkcFixtures({ schoolId: id }),
    enabled: !!id,
    retry: false,
  });

  if (isLoading) return <div className="py-20"><ResponsiveWrapper><Skeleton type="card" /></ResponsiveWrapper></div>;

  const s = school?.data;
  const teams = s?.teams || [];
  const matches = fixtures?.data || [];

  return (
    <div className="bg-surface-2 dark:bg-surface-dark min-h-screen pb-24">
      <Seo title={`${s?.name || 'School'} — Amashuri Games`} description={`${s?.name} teams, fixtures and results in Rwanda's inter-school championships.`} />

      {/* Header */}
      <section className="bg-rwanda-blue py-16 sm:py-20 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rwanda-blue via-rwanda-blue to-[#007bb0]" />
        <div className="absolute -top-24 -right-16 w-96 h-96 rounded-full bg-rwanda-yellow/15 blur-[120px]" />
        <ResponsiveWrapper className="relative z-10">
          <Link to="/amashuri/schools" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-rwanda-yellow transition-colors mb-8">
            <ChevronLeft size={14} />
            <span>{t('amashuri.school_profile.back')}</span>
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-3xl flex items-center justify-center text-rwanda-blue shadow-2xl overflow-hidden">
                {s?.logo ? <img src={s.logo} alt={s.name} className="w-full h-full object-cover" /> : <School size={64} />}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="bg-rwanda-yellow text-rwanda-blue text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded">{s?.category}</span>
                  {s?.code && <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 italic">Code: {s.code}</span>}
                </div>
                <h1 className="text-4xl sm:text-6xl font-display uppercase tracking-tighter leading-none">{s?.name}</h1>
                <div className="flex items-center gap-2 opacity-60 text-xs font-bold uppercase tracking-widest">
                  <MapPin size={14} />
                  <span>{s?.sector || 'Rwanda'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center min-w-[96px]">
                <span className="block text-2xl font-display leading-none">{teams.length}</span>
                <span className="text-[8px] uppercase font-bold tracking-widest opacity-60">{t('amashuri.school_profile.active_teams')}</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center min-w-[96px]">
                <span className="block text-2xl font-display leading-none">{matches.length}</span>
                <span className="text-[8px] uppercase font-bold tracking-widest opacity-60">{t('amashuri.school_profile.fixtures')}</span>
              </div>
            </div>
          </div>
        </ResponsiveWrapper>
      </section>

      <ResponsiveWrapper className="mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Teams */}
          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-3xl font-display uppercase tracking-tight border-b border-surface-3 dark:border-white/5 pb-4">{t('amashuri.school_profile.teams_title')} <span className="text-rwanda-blue">{t('amashuri.school_profile.teams_accent')}</span></h2>
            {teams.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {teams.map((team) => (
                  <Card key={team.id} className="p-6 space-y-6">
                    <div className="flex justify-between items-start">
                      <span className="p-3 bg-rwanda-blue/5 rounded-2xl text-rwanda-blue"><Trophy size={20} /></span>
                      <Badge tone="blue">{team.ageCategory}</Badge>
                    </div>
                    <div>
                      <h3 className="text-xl font-display uppercase tracking-tight">{team.gender} {t('amashuri.school_profile.team')}</h3>
                      <p className="text-[10px] uppercase font-bold tracking-widest opacity-40">{t('amashuri.school_profile.coach')}: {team.coachName || 'TBD'}</p>
                    </div>
                    <div className="flex items-center gap-2 pt-4 border-t border-surface-3 dark:border-white/5">
                      <Users size={14} className="opacity-40" />
                      <span className="text-xs font-bold opacity-60">{team.players?.length || 0} {t('amashuri.school_profile.players')}</span>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState icon={Users} title={t('amashuri.school_profile.no_teams')} hint={t('amashuri.school_profile.no_teams_hint')} />
            )}
          </div>

          {/* Matches */}
          <div className="space-y-8">
            <h2 className="text-3xl font-display uppercase tracking-tight border-b border-surface-3 dark:border-white/5 pb-4">{t('amashuri.school_profile.match_center')} <span className="text-rwanda-blue">{t('amashuri.school_profile.match_center_accent')}</span></h2>
            {matches.length > 0 ? (
              <div className="space-y-6">
                {matches.slice(0, 4).map((f) => <AmashuriFixtureCard key={f.id} fixture={f} />)}
              </div>
            ) : (
              <EmptyState title={t('amashuri.school_profile.no_matches')} hint={t('amashuri.school_profile.no_matches_hint')} className="py-16" />
            )}
          </div>
        </div>
      </ResponsiveWrapper>
    </div>
  );
};

export default SchoolProfilePage;
