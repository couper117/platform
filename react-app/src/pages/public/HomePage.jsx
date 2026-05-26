import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Play, Trophy, Users, Star } from 'lucide-react';
import { getFixtures } from '../../api/endpoints/fixtures';
import { getNews } from '../../api/endpoints/news';
import ResponsiveWrapper from '../../components/shared/ResponsiveWrapper';
import FixtureCard from '../../components/shared/FixtureCard';
import NewsCard from '../../components/shared/NewsCard';
import Skeleton from '../../components/shared/Skeleton';
import LiveScoreTicker from '../../components/home/LiveScoreTicker';

const HomePage = () => {
  const { data: fixtures, isLoading: fixturesLoading } = useQuery({
    queryKey: ['home-fixtures'],
    queryFn: () => getFixtures({ limit: 4 }),
  });

  const { data: news, isLoading: newsLoading } = useQuery({
    queryKey: ['home-news'],
    queryFn: () => getNews({ limit: 3, featured: true }),
  });

  return (
    <div className="space-y-0">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center bg-surface-dark overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-surface-dark via-surface-dark/80 to-transparent z-10" />
          {/* Use a placeholder image or patterned background */}
          <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-40 grayscale hover:grayscale-0 transition-all duration-1000 scale-105" />
        </div>

        <ResponsiveWrapper className="relative z-20">
          <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000">
            <div className="inline-flex items-center space-x-2 bg-red/10 border border-red/20 px-4 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-red rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-red uppercase tracking-widest">Official Rwanda Sports Platform</span>
            </div>
            
            <h1 className="text-6xl sm:text-8xl md:text-9xl font-display text-white leading-[0.85] tracking-tighter uppercase">
              Fueling the <br />
              <span className="text-red drop-shadow-2xl">Spirit</span> of <br />
              Rwanda
            </h1>

            <p className="text-lg sm:text-xl text-white/60 max-w-xl font-light leading-relaxed">
              Experience the heartbeat of Rwandan sports. Real-time scores, in-depth league management, and the journey of every national athlete.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link to="/leagues" className="bg-red text-white font-display text-xl uppercase tracking-widest px-10 py-4 rounded-xl hover:bg-red-dark transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-red/40 flex items-center justify-center">
                Explore Leagues
              </Link>
              <Link to="/fixtures" className="bg-white/5 backdrop-blur-md border border-white/10 text-white font-display text-xl uppercase tracking-widest px-10 py-4 rounded-xl hover:bg-white/10 transition-all flex items-center justify-center space-x-3">
                <Play size={20} className="fill-white" />
                <span>Live Scores</span>
              </Link>
            </div>
          </div>
        </ResponsiveWrapper>

        {/* Decorative Vertical Text */}
        <div className="absolute right-0 bottom-24 hidden xl:block">
          <span className="font-display text-[180px] leading-none text-white/5 uppercase select-none origin-bottom-right rotate-90 whitespace-nowrap">
            EXCELLENCE • PASSION
          </span>
        </div>
      </section>

      {/* Live Score Ticker */}
      <LiveScoreTicker />

      {/* Stats Section (Brief) */}
      <section className="bg-surface-2 dark:bg-white/5 py-12 border-b border-surface-3 dark:border-white/5">
        <ResponsiveWrapper>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: <Trophy className="text-red" />, label: 'Active Leagues', value: '42' },
              { icon: <Users className="text-red" />, label: 'Registered Teams', value: '850+' },
              { icon: <Star className="text-red" />, label: 'Elite Athletes', value: '12K+' },
              { icon: <Play className="text-red" />, label: 'Live Matches', value: 'Active' },
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

      {/* Latest News Section */}
      <section className="py-24 bg-white dark:bg-surface-dark">
        <ResponsiveWrapper>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 space-y-4 md:space-y-0">
            <div className="space-y-2">
              <h2 className="text-[10px] uppercase font-bold tracking-[0.4em] text-red">Bulletin</h2>
              <h3 className="text-4xl sm:text-5xl font-display uppercase tracking-tight">Latest Headlines</h3>
            </div>
            <Link to="/news" className="group flex items-center space-x-2 text-[10px] uppercase font-bold tracking-widest text-surface-dark/40 dark:text-white/40 hover:text-red transition-colors">
              <span>View All News</span>
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
                No featured news available
              </div>
            )}
          </div>
        </ResponsiveWrapper>
      </section>

      {/* Upcoming Fixtures Section */}
      <section className="py-24 bg-surface-2 dark:bg-white/5">
        <ResponsiveWrapper>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 space-y-4 md:space-y-0">
            <div className="space-y-2">
              <h2 className="text-[10px] uppercase font-bold tracking-[0.4em] text-red">Schedule</h2>
              <h3 className="text-4xl sm:text-5xl font-display uppercase tracking-tight">Upcoming Matches</h3>
            </div>
            <Link to="/fixtures" className="group flex items-center space-x-2 text-[10px] uppercase font-bold tracking-widest text-surface-dark/40 dark:text-white/40 hover:text-red transition-colors">
              <span>Full Schedule</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {fixturesLoading ? (
              <Skeleton type="card" count={4} />
            ) : fixtures?.data?.length > 0 ? (
              fixtures.data.map(fixture => <FixtureCard key={fixture.id} fixture={fixture} />)
            ) : (
              <div className="col-span-2 py-20 text-center opacity-30 font-display text-2xl uppercase tracking-widest">
                No upcoming matches scheduled
              </div>
            )}
          </div>
        </ResponsiveWrapper>
      </section>

      {/* Call to Action */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-red z-0" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 z-10" />
        
        <ResponsiveWrapper className="relative z-20 text-center space-y-8">
          <h2 className="text-5xl sm:text-7xl font-display text-white uppercase tracking-tighter leading-none">
            Are you a <br />Sports Manager?
          </h2>
          <p className="text-white/80 max-w-xl mx-auto text-lg">
            Join the national platform to manage your team, track athlete progress, and compete in official leagues.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth/team/register" className="bg-white text-red font-display text-xl uppercase tracking-widest px-12 py-4 rounded-xl hover:bg-surface-2 transition-all hover:scale-105 active:scale-95 shadow-xl">
              Register Your Team
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
