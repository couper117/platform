import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Play, Trophy, Users, Star, Activity, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getFixtures } from '../../api/endpoints/fixtures';
import { getNews } from '../../api/endpoints/news';
import ResponsiveWrapper from '../../components/shared/ResponsiveWrapper';
import FixtureCard from '../../components/shared/FixtureCard';
import NewsCard from '../../components/shared/NewsCard';
import Skeleton from '../../components/shared/Skeleton';
import AdBanner from '../../components/shared/AdBanner';
import Seo from '../../components/shared/Seo';

const HomePage = () => {
  const { t } = useTranslation();
  
  const { data: fixtures, isLoading: fixturesLoading } = useQuery({
    queryKey: ['home-fixtures-hero'],
    queryFn: () => getFixtures({ limit: 6 }),
  });

  const { data: news, isLoading: newsLoading } = useQuery({
    queryKey: ['home-news-home'],
    queryFn: () => getNews({ limit: 3, featured: true }),
  });

  const liveMatches = fixtures?.data?.filter(f => f.status === 'LIVE') || [];
  const upcomingMatches = fixtures?.data?.filter(f => f.status === 'SCHEDULED') || [];
  const heroMatches = [...liveMatches, ...upcomingMatches].slice(0, 1);

  return (
    <div className="space-y-0">
      <Seo title="Home" description="Experience the heartbeat of Rwandan sports." />
      {/* 1. AD SPACE BELOW NAV */}
      <AdBanner position="HOME_BANNER" />

      {/* 2. HERO SECTION */}
      <section className="relative bg-surface-dark overflow-hidden py-16 sm:py-24 lg:py-32">
        <div className="absolute inset-0 z-0">
          {/* Branded gradient wash */}
          <div className="absolute inset-0 bg-gradient-to-br from-surface-dark via-surface-dark to-surface-dark2" />
          {/* Red glow + Rwanda-blue accent orbs */}
          <div className="absolute -top-40 -right-32 w-[36rem] h-[36rem] rounded-full bg-red/20 blur-[120px]" />
          <div className="absolute -bottom-40 -left-24 w-[32rem] h-[32rem] rounded-full bg-rwanda-blue/10 blur-[120px]" />
          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
              backgroundSize: '56px 56px',
              maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
              WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
            }}
          />
        </div>

        <ResponsiveWrapper className="relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
            {/* Left: Content */}
            <div className="lg:col-span-7 space-y-8 animate-in fade-in slide-in-from-left-4 duration-1000">
              <div className="inline-flex items-center space-x-2 bg-red/10 border border-red/20 px-4 py-1.5 rounded-full">
                <span className="w-2 h-2 bg-red rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-red uppercase tracking-widest italic">RwaSport Official</span>
              </div>
              
              <h1 className="text-6xl sm:text-8xl md:text-9xl font-display text-white leading-[0.85] tracking-tighter uppercase whitespace-pre-line">
                {t('home.hero_title')}
              </h1>

              <p className="text-lg sm:text-xl text-white/50 max-w-xl font-light leading-relaxed">
                {t('home.hero_subtitle')}
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                <Link to="/leagues" className="w-full sm:w-auto bg-red text-white font-display text-xl uppercase tracking-widest px-12 py-4 rounded-xl hover:bg-red-dark transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-red/40 flex items-center justify-center">
                  {t('home.explore_leagues')}
                </Link>
              </div>
            </div>

            {/* Right: Integrated Matches */}
            <div className="lg:col-span-5 space-y-6 animate-in fade-in slide-in-from-right-4 duration-1000 delay-300">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/40 border-b border-white/10 pb-3">Match Spotlight</h3>

              <div className="space-y-4">
                {fixturesLoading ? (
                  <Skeleton type="card" count={1} className="!bg-white/5" />
                ) : heroMatches.length > 0 ? (
                  heroMatches.map(fixture => (
                    <div key={fixture.id} className="transform transition-all hover:scale-[1.02] active:scale-[0.98]">
                      <FixtureCard fixture={fixture} showLeague={true} />
                    </div>
                  ))
                ) : (
                  <div className="py-12 bg-white/5 rounded-3xl border border-white/10 flex flex-col items-center justify-center text-center space-y-3 opacity-30">
                    <Activity size={32} />