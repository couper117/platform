import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Users, Calendar, ChevronLeft, ArrowRight, Newspaper, LayoutGrid, AlertCircle } from 'lucide-react';
import { getSport } from '../../api/endpoints/sports';
import { getLeagues } from '../../api/endpoints/leagues';
import { getFixtures } from '../../api/endpoints/fixtures';
import { getNews } from '../../api/endpoints/news';
import { sportTheme } from '../../config/sportThemes';
import SportIcon from '../../components/shared/SportIcon';
import ResponsiveWrapper from '../../components/shared/ResponsiveWrapper';
import FixtureCard from '../../components/shared/FixtureCard';
import NewsCard from '../../components/shared/NewsCard';
import Skeleton from '../../components/shared/Skeleton';
import Seo from '../../components/shared/Seo';

const statusPill = (status) => {
  const map = {
    ACTIVE: 'bg-green/10 text-green border-green/20',
    UPCOMING: 'bg-gold/10 text-gold border-gold/20',
    COMPLETED: 'bg-white/10 text-white/50 border-white/10',
  };
  return map[status] || 'bg-white/10 text-white/50 border-white/10';
};

const SportHubPage = () => {
  const { slug } = useParams();
  const theme = sportTheme(slug);

  const { data: sportRes, isLoading, isError } = useQuery({
    queryKey: ['sport', slug],
    queryFn: () => getSport(slug),
    retry: 1,
  });
  const sport = sportRes?.data;
  const sportId = sport?.id;

  const { data: leaguesRes } = useQuery({ queryKey: ['sport-leagues', sportId], queryFn: () => getLeagues({ sportId }), enabled: !!sportId });
  const { data: fixturesRes } = useQuery({ queryKey: ['sport-fixtures', sportId], queryFn: () => getFixtures({ sportId }), enabled: !!sportId });
  const { data: newsRes } = useQuery({ queryKey: ['sport-news', sportId], queryFn: () => getNews({ sportId }), enabled: !!sportId });

  const leagues = leaguesRes?.data || [];
  const fixtures = (fixturesRes?.data || []).filter((f) => f.status === 'SCHEDULED' || f.status === 'LIVE').slice(0, 6);
  const news = (newsRes?.data || []).slice(0, 3);
  const teamCount = sport?._count?.teams ?? leagues.reduce((n, l) => n + (l._count?.teams || 0), 0);

  if (isLoading) {
    return <div className="py-24"><ResponsiveWrapper><Skeleton type="stat" count={3} className="mb-8" /><Skeleton type="card" count={2} /></ResponsiveWrapper></div>;
  }

  if (isError || !sport) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <AlertCircle size={40} className="text-red" />
        <p className="font-display text-3xl uppercase tracking-widest opacity-60">Sport not found</p>
        <Link to="/" className="bg-red text-white px-6 py-2 rounded-lg font-display uppercase tracking-widest text-sm">Back home</Link>
      </div>
    );
  }

  const hasContent = leagues.length > 0 || fixtures.length > 0 || news.length > 0;

  return (
    <div className="bg-surface-2 dark:bg-surface-dark min-h-screen pb-24">
      <Seo title={sport.name} description={`${sport.name} in Rwanda — leagues, fixtures, standings and news.`} image={theme.bg} />

      {/* HERO — full-bleed sport pitch background */}
      <section className="relative min-h-[60vh] flex items-end overflow-hidden bg-surface-dark">
        <div className="absolute inset-0 z-0">
          <img src={sport.coverImage || theme.bg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-dark via-surface-dark/60 to-surface-dark/10" />
          <div className="absolute inset-0" style={{ background: `radial-gradient(60% 60% at 20% 100%, ${theme.accent}33, transparent)` }} />
        </div>

        <ResponsiveWrapper className="relative z-20 py-14">
          <Link to="/" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white mb-6">
            <ChevronLeft size={14} /> All Sports
          </Link>
          <div className="flex items-end gap-5 flex-wrap">
            <SportIcon slug={slug} className="text-6xl sm:text-8xl drop-shadow-2xl" style={{ color: theme.accent }} />
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.3em]" style={{ background: `${theme.accent}22`, color: theme.accent, border: `1px solid ${theme.accent}44` }}>
                Rwanda · {theme.venue}
              </div>
              <h1 className="text-5xl sm:text-7xl font-display text-white uppercase tracking-tighter leading-none">{sport.name}</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 mt-6 text-[11px] font-bold uppercase tracking-widest text-white/60">
            <span className="flex items-center gap-2"><Trophy size={14} style={{ color: theme.accent }} /> {leagues.length} {leagues.length === 1 ? 'League' : 'Leagues'}</span>
            <span className="flex items-center gap-2"><Users size={14} style={{ color: theme.accent }} /> {teamCount} Teams</span>
            <span className="flex items-center gap-2"><Calendar size={14} style={{ color: theme.accent }} /> {fixtures.length} Upcoming</span>
          </div>
        </ResponsiveWrapper>
      </section>

      {!hasContent && (
        <ResponsiveWrapper className="mt-16">
          <div className="rounded-3xl border border-surface-3 dark:border-white/10 bg-white dark:bg-surface-dark2 p-12 text-center space-y-4">
            <LayoutGrid size={40} className="mx-auto opacity-30" />
            <h3 className="font-display text-2xl uppercase tracking-widest">{sport.name} is coming soon</h3>
            <p className="opacity-60 max-w-md mx-auto">No leagues have been set up for {sport.name} yet. Be part of it — register your team and we'll get the competition rolling.</p>
            <Link to="/auth/team/register" className="inline-flex items-center gap-2 bg-red text-white px-6 py-3 rounded-xl font-display uppercase tracking-widest text-sm">Register a Team <ArrowRight size={16} /></Link>
          </div>
        </ResponsiveWrapper>
      )}

      {/* LEAGUES */}
      {leagues.length > 0 && (
        <ResponsiveWrapper className="mt-16">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-[10px] uppercase font-bold tracking-[0.4em]" style={{ color: theme.accent }}>Competitions</h2>
              <h3 className="text-3xl sm:text-4xl font-display uppercase tracking-tight">{sport.name} Leagues</h3>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {leagues.map((l) => (
              <Link key={l.id} to={`/leagues/${l.id}`} className="group bg-white dark:bg-surface-dark2 rounded-2xl border border-surface-3 dark:border-white/5 p-6 hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white" style={{ background: theme.accent }}><Trophy size={18} /></div>
                  <span className={`text-[9px] font-bold px-2 py-1 rounded border uppercase ${statusPill(l.status)}`}>{l.status}</span>
                </div>
                <h4 className="font-display text-xl uppercase tracking-tight leading-tight group-hover:text-red transition-colors">{l.name}</h4>
                <p className="text-[10px] uppercase font-bold tracking-widest opacity-40 mt-2">Season {l.season} · {l._count?.teams ?? 0} teams</p>
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest mt-4" style={{ color: theme.accent }}>
                  View standings <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </ResponsiveWrapper>
      )}

      {/* UPCOMING FIXTURES */}
      {fixtures.length > 0 && (
        <ResponsiveWrapper className="mt-16">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-[10px] uppercase font-bold tracking-[0.4em]" style={{ color: theme.accent }}>Match Centre</h2>
              <h3 className="text-3xl sm:text-4xl font-display uppercase tracking-tight">Upcoming & Live</h3>
            </div>
            <Link to="/fixtures" className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-40 hover:text-red transition-colors">
              All fixtures <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {fixtures.map((f) => <FixtureCard key={f.id} fixture={f} showLeague />)}
          </div>
        </ResponsiveWrapper>
      )}

      {/* NEWS */}
      {news.length > 0 && (
        <ResponsiveWrapper className="mt-16">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-[10px] uppercase font-bold tracking-[0.4em]" style={{ color: theme.accent }}>Bulletin</h2>
              <h3 className="text-3xl sm:text-4xl font-display uppercase tracking-tight flex items-center gap-3"><Newspaper size={26} /> {sport.name} News</h3>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {news.map((a) => <NewsCard key={a.id} article={a} />)}
          </div>
        </ResponsiveWrapper>
      )}
    </div>
  );
};

export default SportHubPage;
