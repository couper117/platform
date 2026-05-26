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
import LiveScoreTicker from '../../components/home/LiveScoreTicker';

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
  const heroMatches = [...liveMatches, ...upcomingMatches].slice(0, 2);

  return (
    <div className="space-y-0">
      {/* 1. REAL-TIME TICKER */}
      <LiveScoreTicker />

      {/* 2. DYNAMIC HERO WITH INTEGRATED MATCHES */}
      <section className="relative bg-surface-dark overflow-hidden py-16 sm:py-24 lg:py-32">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-surface-dark via-surface-dark/95 to-red/10 z-10" />
          <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-20 grayscale" />
        </div>

        <ResponsiveWrapper className="relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
            {/* Left: Content */}
            <div className="lg:col-span-7 space-y-8 animate-in fade-in slide-in-from-left-6 duration-1000">
              <div className="inline-flex items-center space-x-2 bg-red/10 border border-red/20 px-4 py-1.5 rounded-full">
                <span className="w-2 h-2 bg-red rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-red uppercase tracking-widest italic">RwaSport Official</span>
              </div>
              
              <h1 className="text-6xl sm:text-8xl md:text-9xl font-display text-white leading-[0.85] tracking-tighter uppercase">
                {t('home.hero_title')}
              </h1>

              <p className="text-lg sm:text-xl text-white/50 max-w-xl font-light leading-relaxed">
                {t('home.hero_subtitle')}
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                <Link to="/leagues" className="w-full sm:w-auto bg-red text-white font-display text-xl uppercase tracking-widest px-12 py-5 rounded-2xl hover:bg-red-dark transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-red/40 flex items-center justify-center">
                  {t('home.explore_leagues')}
                </Link>
                <Link to="/fixtures" className="w-full sm:w-auto text-white/60 font-display text-lg uppercase tracking-widest px-8 py-5 hover:text-white transition-colors flex items-center justify-center space-x-2">
                  <Activity size={18} className="text-red" />
                  <span>Full Schedule</span>
                </Link>
              </div>
            </div>

            {/* Right: Integrated Matches (Directly near the button) */}
            <div className="lg:col-span-5 space-y-6 animate-in fade-in slide-in-from-right-6 duration-1000 delay-300">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/40">Match Spotlight</h3>
                {heroMatches.length > 0 && (
                  <div className="flex items-center space-x-1 text-[10px] font-bold text-red uppercase tracking-tighter">
                    <span className="w-1 h-1 bg-red rounded-full animate-pulse" />
                    <span>Real-time</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {fixturesLoading ? (
                  <Skeleton type="card" count={2} className="!bg-white/5" />
                ) : heroMatches.length > 0 ? (
                  heroMatches.map(fixture => (
                    <div key={fixture.id} className="transform transition-all hover:scale-[1.02] active:scale-[0.98]">
                      <FixtureCard fixture={fixture} showLeague={true} />
                    </div>
                  ))
                ) : (
                  <div className="py-12 bg-white/5 rounded-3xl border border-white/10 flex flex-col items-center justify-center text-center space-y-3 opacity-30">
                    <Activity size={32} />
                    <span className="font-display text-xl uppercase tracking-widest">No Active Matches</span>
                  </div>
                )}
              </div>

              {heroMatches.length > 0 && (
                <Link to="/fixtures" className="flex items-center justify-center w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-white/60 hover:bg-white/10 hover:text-white transition-all">
                  <span>Explore More Matches</span>
                  <ChevronRight size={14} className="ml-2" />
                </Link>
              )}
            </div>
          </div>
        </ResponsiveWrapper>
      </section>

      {/* 3. LATEST NEWS */}
      <section className="py-24 bg-white dark:bg-surface-dark relative">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red/20 to-transparent" />
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

      {/* 4. STATISTICS */}
      <section className="bg-surface-2 dark:bg-white/5 py-16 border-y border-surface-3 dark:border-white/5">
        <ResponsiveWrapper>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: <Trophy className="text-red" />, label: 'Active Leagues', value: '42' },
              { icon: <Users className="text-red" />, label: 'Registered Teams', value: '850+' },
              { icon: <Star className="text-red" />, label: 'Elite Athletes', value: '12K+' },
              { icon: <Play className="text-red" />, label: 'Live Stream', value: 'Available' },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center text-center space-y-2">
                <div className="p-3 bg-white dark:bg-surface-dark2 rounded-2xl shadow-sm border border-surface-3 dark:border-white/5">
                  {stat.icon}
                </div>
                <span className="text-3xl font-display text-surface-dark dark:text-white leading-none">{stat.value}</span>
                <span className="text-[10px] uppercase font-bold tracking-widest opacity-40">{stat.label}</span>
              </div>
            ))}
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
