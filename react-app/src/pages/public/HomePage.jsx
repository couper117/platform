import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Play, Trophy, Users, Star, Activity, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getFixtures } from '../../api/endpoints/fixtures';
import { getNews } from '../../api/endpoints/news';
import { getSports } from '../../api/endpoints/sports';
import { sportTheme, HERO_BG } from '../../config/sportThemes';
import responsiveImage from '../../utils/responsiveImage';
import SportIcon from '../../components/shared/SportIcon';
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

  const { data: sportsRes } = useQuery({ queryKey: ['home-sports'], queryFn: getSports });
  const sports = sportsRes?.data || [];

  const liveMatches = fixtures?.data?.filter(f => f.status === 'LIVE') || [];
  const upcomingMatches = fixtures?.data?.filter(f => f.status === 'SCHEDULED') || [];
  const heroMatches = [...liveMatches, ...upcomingMatches].slice(0, 1);

  return (
    <div className="space-y-0">
      <Seo title="Home" description="Experience the heartbeat of Rwandan sports." />
      {/* HERO — full-bleed image with dark overlay (isengesho-style) */}
      <section className="relative min-h-[60vh] sm:min-h-[78vh] flex items-center overflow-hidden bg-surface-dark">
        {/* Background image + overlays */}
        <div className="absolute inset-0 z-0">
          <img
            {...responsiveImage(HERO_BG)}
            alt=""
            loading="eager"
            // lowercase: React 18 does not recognise the camelCase form
            fetchpriority="high"
            className="w-full h-full object-cover object-center"
          />
          {/* Dark wash for legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-surface-dark via-surface-dark/85 to-surface-dark/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-surface-dark/95 via-surface-dark/55 to-transparent" />
          {/* Red glow accent */}
          <div className="absolute -top-32 -right-24 w-[36rem] h-[36rem] rounded-full bg-red/20 blur-[130px]" />
        </div>

        <ResponsiveWrapper className="relative z-20 py-16 sm:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-end">
            {/* Left: Content */}
            <div className="lg:col-span-7 space-y-6 animate-in fade-in slide-in-from-left-4 duration-1000">
              <div className="inline-flex items-center gap-2 bg-red/15 border border-red/30 px-4 py-1.5 rounded-full backdrop-blur-sm">
                <span className="w-2 h-2 bg-red rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-red uppercase tracking-[0.3em] italic">RwaSport Official</span>
              </div>

              <h1 className="text-5xl sm:text-6xl md:text-7xl xl:text-8xl font-display text-white leading-[0.85] tracking-tighter uppercase whitespace-pre-line drop-shadow-2xl">
                {t('home.hero_title')}
              </h1>

              <p className="text-lg sm:text-xl text-white/70 max-w-xl font-light leading-relaxed">
                {t('home.hero_subtitle')}
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <Link to="/leagues" className="bg-red text-white font-display text-xl uppercase tracking-widest px-10 py-4 rounded-xl hover:bg-red-dark transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-red/40 flex items-center justify-center gap-2">
                  <Trophy size={20} /> {t('home.explore_leagues')}
                </Link>
                <Link to="/fixtures" className="border border-white/30 text-white font-display text-xl uppercase tracking-widest px-10 py-4 rounded-xl hover:bg-white/10 hover:border-white/50 transition-all flex items-center justify-center gap-2 backdrop-blur-sm">
                  <Play size={18} /> {t('nav.fixtures')}
                </Link>
              </div>
            </div>

            {/* Right: Match spotlight card overlay */}
            <div className="lg:col-span-5 animate-in fade-in slide-in-from-right-4 duration-1000 delay-300">
              <div className="bg-surface-dark2/80 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.35em] text-white/50">Match Spotlight</h3>
                  {liveMatches.length > 0 && (
                    <span className="flex items-center gap-1.5 text-[9px] font-bold text-red uppercase tracking-widest">
                      <span className="w-1.5 h-1.5 bg-red rounded-full animate-pulse" /> Live
                    </span>
                  )}
                </div>
                {fixturesLoading ? (
                  <Skeleton type="card" count={1} className="!bg-white/5" />
                ) : heroMatches.length > 0 ? (
                  heroMatches.map(fixture => (
                    <div key={fixture.id} className="transform transition-all hover:scale-[1.02]">
                      <FixtureCard fixture={fixture} showLeague={true} />
                    </div>
                  ))
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-center gap-3 text-white/30">
                    <Activity size={32} />
                    <span className="font-display text-xl uppercase tracking-widest">No Active Matches</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ResponsiveWrapper>
      </section>

      {/* Ad space below hero */}
      <AdBanner position="HOME_BANNER" />

      {/* PICK YOUR SPORT — tap a game to open its own hub (great on mobile) */}
      <section className="py-14 sm:py-20 bg-white dark:bg-surface-dark">
        <ResponsiveWrapper>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
            <div className="space-y-2">
              <h2 className="text-[10px] uppercase font-bold tracking-[0.4em] text-red">Choose your game</h2>
              <h3 className="text-4xl sm:text-5xl font-display uppercase tracking-tight">Explore by sport</h3>
            </div>
            <p className="text-sm opacity-50 max-w-xs">Pick a sport to dive into its leagues, fixtures, standings and news.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {sports.map((s) => {
              const theme = sportTheme(s.slug);
              return (
                <Link
                  key={s.id}
                  to={`/sports/${s.slug}`}
                  className="group relative overflow-hidden rounded-3xl border border-surface-3 dark:border-white/10 bg-surface-2 dark:bg-surface-dark2 p-6 min-h-[140px] flex flex-col justify-between hover:-translate-y-1 hover:shadow-2xl transition-all"
                >
                  <div
                    className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"
                    style={{ background: theme.accent }}
                  />
                  <SportIcon slug={s.slug} className="relative z-10 text-4xl sm:text-5xl" style={{ color: theme.accent }} />
                  <div className="relative z-10">
                    <h4 className="font-display text-lg sm:text-xl uppercase tracking-tight leading-none group-hover:text-red transition-colors">{s.name}</h4>
                    <p className="text-[9px] uppercase font-bold tracking-widest opacity-40 mt-1.5">
                      {(s._count?.leagues ?? 0)} leagues · {(s._count?.teams ?? 0)} teams
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </ResponsiveWrapper>
      </section>

      {/* 3. SECONDARY AD SPOTLIGHT */}
      <section className="py-12 bg-surface-2 dark:bg-surface-dark">
        <ResponsiveWrapper>
            <AdBanner position="SPOTLIGHT_BANNER" />
        </ResponsiveWrapper>
      </section>

      {/* 4. LATEST NEWS */}
      <section className="py-20 sm:py-32 bg-white dark:bg-surface-dark">
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
    </div>
  );
};

export default HomePage;
