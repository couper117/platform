import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Play, Trophy, Users, Star, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getFixtures } from '../../api/endpoints/fixtures';
import { getNews } from '../../api/endpoints/news';
import ResponsiveWrapper from '../../components/shared/ResponsiveWrapper';
import FixtureCard from '../../components/shared/FixtureCard';
import NewsCard from '../../components/shared/NewsCard';
import Skeleton from '../../components/shared/Skeleton';
import LiveScoreTicker from '../../components/home/LiveScoreTicker';

const HomePage = () => {
  const { t } = useTranslation();
  
  const { data: fixtures, isLoading: fixturesLoading } = useQuery({
    queryKey: ['home-fixtures-primary'],
    queryFn: () => getFixtures({ limit: 6 }), // Fetch more to show priority
  });

  const { data: news, isLoading: newsLoading } = useQuery({
    queryKey: ['home-news-secondary'],
    queryFn: () => getNews({ limit: 3, featured: true }),
  });

  // Filter live matches to show them at the very top of the schedule
  const liveMatches = fixtures?.data?.filter(f => f.status === 'LIVE') || [];
  const upcomingMatches = fixtures?.data?.filter(f => f.status === 'SCHEDULED') || [];

  return (
    <div className="space-y-0">
      {/* 1. REAL-TIME TICKER (Top Priority) */}
      <LiveScoreTicker />

      {/* 2. REFINED HERO (Branding + Quick Stats) */}
      <section className="relative bg-surface-dark overflow-hidden py-16 sm:py-24">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-surface-dark via-surface-dark/90 to-transparent z-10" />
          <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-30 grayscale" />
        </div>

        <ResponsiveWrapper className="relative z-20">
          <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-left-4 duration-1000">
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-display text-white leading-[0.9] tracking-tighter uppercase">
              {t('home.hero_title')}
            </h1>
            <p className="text-base sm:text-lg text-white/50 max-w-lg font-light leading-relaxed">
              {t('home.hero_subtitle')}
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link to="/leagues" className="bg-red text-white font-display text-lg uppercase tracking-widest px-8 py-3.5 rounded-xl hover:bg-red-dark transition-all hover:scale-105 active:scale-95 shadow-xl shadow-red/20">
                {t('home.explore_leagues')}
              </Link>
              <div className="hidden sm:flex items-center space-x-6 text-white/30 text-[10px] uppercase font-bold tracking-widest ml-4 border-l border-white/10 pl-8">
                <div className="flex flex-col"><span className="text-white text-lg font-display tracking-tight">42</span> Leagues</div>
                <div className="flex flex-col"><span className="text-white text-lg font-display tracking-tight">850+</span> Teams</div>
              </div>
            </div>
          </div>
        </ResponsiveWrapper>
      </section>

      {/* 3. LIVE & UPCOMING MATCHES (Main Content Start) */}
      <section className="py-16 sm:py-24 bg-white dark:bg-surface-dark relative">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red/20 to-transparent" />
        
        <ResponsiveWrapper>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 space-y-4 md:space-y-0">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-red rounded-full animate-pulse" />
                <h2 className="text-[10px] uppercase font-bold tracking-[0.4em] text-red">Match Center</h2>
              </div>
              <h3 className="text-4xl sm:text-5xl font-display uppercase tracking-tight">Live & <span className="text-red">Upcoming</span></h3>
            </div>
            <Link to="/fixtures" className="group flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-surface-dark/40 dark:text-white/40 hover:text-red transition-colors">
              <span>Full Schedule</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {fixturesLoading ? (
              <Skeleton type="card" count={4} />
            ) : fixtures?.data?.length > 0 ? (
              <>
                {/* Priority display for Live Matches */}
                {liveMatches.map(fixture => (
                  <FixtureCard key={fixture.id} fixture={fixture} />
                ))}
                {/* Upcoming Matches */}
                {upcomingMatches.slice(0, 4).map(fixture => (
                  <FixtureCard key={fixture.id} fixture={fixture} />
                ))}
              </>
            ) : (
              <div className="col-span-2 py-20 bg-surface-2 dark:bg-white/5 rounded-3xl border-2 border-dashed border-surface-3 dark:border-white/5 text-center opacity-30 font-display text-2xl uppercase tracking-widest">
                {t('common.no_data')}
              </div>
            )}
          </div>
        </ResponsiveWrapper>
      </section>

      {/* 4. LATEST NEWS */}
      <section className="py-20 sm:py-32 bg-surface-2 dark:bg-white/5">
        <ResponsiveWrapper>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 space-y-4 md:space-y-0">
            <div className="space-y-2">
              <h2 className="text-[10px] uppercase font-bold tracking-[0.4em] text-red">Bulletin</h2>
              <h3 className="text-4xl sm:text-5xl font-display uppercase tracking-tight">{t('home.latest_headlines')}</h3>
            </div>
            <Link to="/news" className="group flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-surface-dark/40 dark:text-white/40 hover:text-red transition-colors">
              <span>{t('common.view_all')}</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {newsLoading ? (
              <Skeleton type="card" count={3} />
            ) : news?.data?.length > 0 ? (
              news.data.map(article => <NewsCard key={article.id} article={article} />)
            ) : (
              <div className="col-span-3 py-20 text-center opacity-30 font-display text-2xl uppercase tracking-widest">
                {t('common.no_data')}
              </div>
            )}
          </div>
        </ResponsiveWrapper>
      </section>

      {/* 5. CALL TO ACTION */}
      <section className="py-24 relative overflow-hidden bg-red">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 z-10" />
        
        <ResponsiveWrapper className="relative z-20 text-center space-y-8">
          <h2 className="text-5xl sm:text-7xl font-display text-white uppercase tracking-tighter leading-none">
            {t('home.manager_cta_title')}
          </h2>
          <p className="text-white/80 max-w-xl mx-auto text-lg">
            {t('home.manager_cta_text')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth/team/register" className="bg-white text-red font-display text-xl uppercase tracking-widest px-12 py-4 rounded-xl hover:bg-surface-2 transition-all hover:scale-105 active:scale-95 shadow-xl">
              {t('home.register_team')}
            </Link>
            <Link to="/contact" className="text-white font-display text-xl uppercase tracking-widest px-12 py-4 rounded-xl border border-white/30 hover:bg-white/10 transition-all">
              Contact Support
            </Link>
          </div>
        </ResponsiveWrapper>
      </section>
    </div>
  );
};

export default HomePage;
