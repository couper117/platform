import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import {
  Trophy, Users, Calendar, Radio, ChevronLeft, ArrowRight, Newspaper, AlertCircle,
} from 'lucide-react';
import { getSport } from '../../api/endpoints/sports';
import { getLeagues, getLeague } from '../../api/endpoints/leagues';
import { getFixtures } from '../../api/endpoints/fixtures';
import { getNews } from '../../api/endpoints/news';
import { sportTheme } from '../../config/sportThemes';
import responsiveImage from '../../utils/responsiveImage';
import { profileFor } from '../../config/sportProfiles';
import apiClient from '../../api/client';
import SportIcon from '../../components/shared/SportIcon';
import ClubCrest from '../../components/ui/ClubCrest';
import ResponsiveWrapper from '../../components/shared/ResponsiveWrapper';
import MatchDayBrowser from '../../components/public/MatchDayBrowser';
import RaceCalendar from '../../components/public/RaceCalendar';
import ClassificationTable from '../../components/public/ClassificationTable';
import Skeleton from '../../components/shared/Skeleton';
import Seo from '../../components/shared/Seo';

/**
 * SportPage — "everything happening in this sport", not just fixtures.
 *
 * ONE generic architecture for every sport. The sections are the same
 * (hero → nav → live → match centre → standings → news); only the DATA and a few
 * type-driven choices differ. A RACING sport (cycling, athletics) swaps the
 * fixture Match Centre + league table for a race calendar + classification.
 *
 * Layout: two columns on desktop (main = live + match centre, rail = standings +
 * news); a single intentional stack on mobile in the order a fan wants —
 * hero → nav → live → match centre → standings → news.
 */

const SECTION_HEADING = 'text-[10px] font-bold uppercase tracking-[0.35em] text-brand-text';

/* ── compact stat ─────────────────────────────────────────────────────────── */
const Stat = ({ icon: Icon, value, label, accent }) => (
  <div className="flex items-center gap-2">
    <Icon size={15} style={{ color: accent }} aria-hidden="true" />
    <div className="leading-tight">
      <span className="font-display text-lg font-bold tabular-nums text-white">{value}</span>
      <span className="ml-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/55">{label}</span>
    </div>
  </div>
);

/* ── sport navigation tabs ─────────────────────────────────────────────────── */
const SportNav = ({ active, onSelect }) => {
  const TABS = [
    ['overview', 'Overview'], ['matches', 'Matches'], ['leagues', 'Leagues'],
    ['teams', 'Teams'], ['standings', 'Standings'], ['news', 'News'],
  ];
  return (
    <div className="sticky top-14 z-30 border-b border-hairline bg-surface/95 backdrop-blur-nav md:top-nav">
      <ResponsiveWrapper>
        <nav aria-label="Sport sections" className="scroll-contain flex gap-1 overflow-x-auto">
          {TABS.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={() => onSelect(id)}
              aria-current={active === id ? 'true' : undefined}
              className={`relative shrink-0 px-3 py-3.5 text-sm font-semibold transition-colors ${active === id ? 'text-primary' : 'text-secondary hover:text-primary'}`}
            >
              {label}
              {active === id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand" />}
            </a>
          ))}
        </nav>
      </ResponsiveWrapper>
    </div>
  );
};

/* ── one LIVE NOW card (sport-aware status via statusLabel) ─────────────────── */
const LiveMatchCard = ({ fx }) => (
  <Link
    to={`/matches/${fx.id}`}
    className="group block rounded-2xl border border-hairline bg-surface p-4 transition-colors hover:border-brand/40"
  >
    <div className="mb-3 flex items-center justify-between gap-2">
      <span className="truncate text-[10px] font-bold uppercase tracking-wider text-tertiary">{fx.league?.name}</span>
      <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-red/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red" /> {fx.statusLabel || 'Live'}
      </span>
    </div>
    <div className="flex items-center gap-3">
      <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center">
        <ClubCrest team={fx.homeTeam} size="md" />
        <span className="w-full truncate text-xs font-semibold text-primary">{fx.homeTeam?.name}</span>
      </div>
      <div className="shrink-0 font-display text-2xl font-bold tabular-nums text-primary">
        {fx.homeScore ?? 0} <span className="text-tertiary">-</span> {fx.awayScore ?? 0}
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center">
        <ClubCrest team={fx.awayTeam} size="md" />
        <span className="w-full truncate text-xs font-semibold text-primary">{fx.awayTeam?.name}</span>
      </div>
    </div>
    {fx.venue && <p className="mt-2.5 truncate text-center text-[11px] text-tertiary">{fx.venue}</p>}
  </Link>
);

/* ── standings preview (top rows + link to full table) ──────────────────────── */
const StandingsPreview = ({ league, accent }) => {
  const { data } = useQuery({
    queryKey: ['sport-standings', league?.id],
    queryFn: () => getLeague(league.id),
    enabled: !!league?.id,
  });
  const rows = (data?.data?.standings || []).slice(0, 5);
  if (!league) return null;
  return (
    <section id="standings" className="scroll-mt-28 rounded-2xl border border-hairline bg-surface p-5">
      <h2 className={SECTION_HEADING}>Standings</h2>
      <p className="mb-4 mt-1 font-display text-lg uppercase tracking-tight text-primary">{league.name}</p>
      {rows.length === 0 ? (
        <p className="py-4 text-sm text-tertiary">Table will appear once results are in.</p>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr className="text-[9px] font-bold uppercase tracking-widest text-tertiary">
              <th className="pb-2 pr-2 font-bold">#</th>
              <th className="pb-2 font-bold">Team</th>
              <th className="pb-2 text-right font-bold">P</th>
              <th className="pb-2 text-right font-bold">GD</th>
              <th className="pb-2 pl-2 text-right font-bold">Pts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s, i) => {
              const gd = (s.goalsFor ?? 0) - (s.goalsAgainst ?? 0);
              return (
                <tr key={s.id ?? i} className="border-t border-hairline/60">
                  <td className="py-2 pr-2 text-sm tabular-nums text-tertiary">{i + 1}</td>
                  <td className="py-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <ClubCrest team={s.team} size="sm" />
                      <span className="truncate text-sm font-medium text-primary">{s.team?.name}</span>
                    </div>
                  </td>
                  <td className="py-2 text-right text-sm tabular-nums text-secondary">{s.played}</td>
                  <td className="py-2 text-right text-sm tabular-nums text-secondary">{gd > 0 ? `+${gd}` : gd}</td>
                  <td className="py-2 pl-2 text-right text-sm font-bold tabular-nums text-primary">{s.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <Link to={`/leagues/${league.id}`} className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-text hover:gap-2.5" style={{ transition: 'gap .15s' }}>
        View full standings <ArrowRight size={13} />
      </Link>
    </section>
  );
};

/* ── latest news (compact list) ─────────────────────────────────────────────── */
const NewsRow = ({ a }) => (
  <Link to={`/news/${a.slug || a.id}`} className="group flex gap-3">
    <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-2">
      {a.coverImage && <img src={a.coverImage} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />}
    </div>
    <div className="min-w-0 flex-1">
      {a.category && <p className="text-[9px] font-bold uppercase tracking-wider text-brand-text">{String(a.category).replace(/_/g, ' ')}</p>}
      <p className="line-clamp-2 text-sm font-semibold leading-snug text-primary group-hover:text-brand-text">{a.title}</p>
      {a.createdAt && <p className="mt-0.5 text-[11px] text-tertiary">{format(new Date(a.createdAt), 'd MMM yyyy')}</p>}
    </div>
  </Link>
);

const SportHubPage = () => {
  const { t } = useTranslation();
  const { slug } = useParams();
  const theme = sportTheme(slug);
  const [active, setActive] = useState('overview');

  const { data: sportRes, isLoading, isError } = useQuery({ queryKey: ['sport', slug], queryFn: () => getSport(slug), retry: 1 });
  const sport = sportRes?.data;
  const sportId = sport?.id;

  const { data: leaguesRes } = useQuery({ queryKey: ['sport-leagues', sportId], queryFn: () => getLeagues({ sportId }), enabled: !!sportId });
  const { data: fixturesRes } = useQuery({ queryKey: ['sport-fixtures', sportId], queryFn: () => getFixtures({ sportId }), enabled: !!sportId });
  const { data: newsRes } = useQuery({ queryKey: ['sport-news', sportId], queryFn: () => getNews({ sportId }), enabled: !!sportId });
  const { data: teamsRes } = useQuery({ queryKey: ['sport-teams', sportId], queryFn: async () => (await apiClient.get('/teams', { params: { sportId } })).data, enabled: !!sportId });

  const profile = profileFor(sport?.type);
  const isRacing = sport?.type === 'RACING';
  const { data: racingRes } = useQuery({
    queryKey: ['sport-racing', sportId],
    queryFn: async () => (await apiClient.get('/races', { params: { sportId } })).data,
    enabled: isRacing && !!sportId,
  });
  const racing = racingRes?.data || { races: [], classification: null, competition: null };

  const leagues = leaguesRes?.data || [];
  const allFixtures = fixturesRes?.data || [];
  const liveFixtures = allFixtures.filter((f) => f.status === 'LIVE');
  const upcomingCount = allFixtures.filter((f) => f.status === 'SCHEDULED').length;
  const news = (newsRes?.data || []).slice(0, 4);
  const teams = teamsRes?.data || [];
  const teamCount = sport?._count?.teams ?? teams.length;
  const primaryLeague = leagues[0] || null;

  if (isLoading) {
    return <div className="py-24"><ResponsiveWrapper><Skeleton type="stat" count={3} className="mb-8" /><Skeleton type="card" count={2} /></ResponsiveWrapper></div>;
  }
  if (isError || !sport) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <AlertCircle size={40} className="text-red" />
        <p className="font-display text-3xl uppercase tracking-widest opacity-60">Sport not found</p>
        <Link to="/" className="rounded-lg bg-brand-strong px-6 py-2 font-display text-sm uppercase tracking-widest text-white">Back home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page">
      <Seo title={sport.name} description={`${sport.name} in Rwanda — live scores, fixtures, standings and news.`} image={theme.bg} />

      {/* ─── COMPACT HERO ─── */}
      <section className="relative overflow-hidden bg-surface-dark">
        <div className="absolute inset-0 z-0">
          {(sport.coverImage || theme.bg) && (
            <img {...responsiveImage(sport.coverImage || theme.bg)} alt="" loading="eager" fetchpriority="high" className="h-full w-full object-cover opacity-90" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-surface-dark via-surface-dark/85 to-surface-dark/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-dark to-transparent" />
        </div>

        <ResponsiveWrapper className="relative z-20 py-5 lg:py-7">
          <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white">
            <ChevronLeft size={13} /> All sports
          </Link>
          <div className="flex items-center gap-4 lg:gap-5">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 lg:h-20 lg:w-20" style={{ borderColor: `${theme.accent}66`, background: `${theme.accent}1a` }}>
              <SportIcon slug={slug} size={34} style={{ color: theme.accent }} />
            </span>
            <div className="min-w-0">
              <span className="inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.3em]" style={{ background: `${theme.accent}22`, color: theme.accent }}>
                Rwanda
              </span>
              <h1 className="mt-1 break-words font-display text-4xl uppercase leading-none tracking-tighter text-white sm:text-6xl">{sport.name}</h1>
            </div>
          </div>

          {/* Four dynamic stats: leagues / teams / upcoming / live now. */}
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
            <Stat icon={Trophy} value={leagues.length} label="Leagues" accent={theme.accent} />
            <Stat icon={Users} value={teamCount} label="Teams" accent={theme.accent} />
            <Stat icon={Calendar} value={upcomingCount} label="Upcoming" accent={theme.accent} />
            <Stat icon={Radio} value={liveFixtures.length} label="Live now" accent={theme.accent} />
          </div>
        </ResponsiveWrapper>
      </section>

      {/* ─── SPORT NAVIGATION ─── */}
      <SportNav active={active} onSelect={setActive} />

      {/* ─── CONTENT: two columns on desktop ─── */}
      <ResponsiveWrapper className="py-6 lg:py-9">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8">
          {/* MAIN */}
          <main className="min-w-0 space-y-8">
            {isRacing ? (
              <section id="matches" className="scroll-mt-28">
                <h2 className={SECTION_HEADING}>{racing.competition?.name || profile.competition}</h2>
                <h3 className="mb-4 mt-1 font-display text-2xl uppercase tracking-tight text-primary">{profile.eventPlural}</h3>
                <RaceCalendar races={racing.races} accent={theme.accent} />
              </section>
            ) : (
              <>
                {/* LIVE NOW */}
                {liveFixtures.length > 0 && (
                  <section id="live" className="scroll-mt-28">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Radio size={15} className="text-red" />
                        <h2 className={SECTION_HEADING}>Live Now</h2>
                        <span className="rounded-full bg-red/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red">{liveFixtures.length} Live</span>
                      </div>
                      <Link to="/live" className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-brand-text">
                        <span className="hidden sm:inline">View all live matches</span><span className="sm:hidden">View all</span> <ArrowRight size={12} />
                      </Link>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {liveFixtures.slice(0, 4).map((fx) => <LiveMatchCard key={fx.id} fx={fx} />)}
                    </div>
                  </section>
                )}

                {/* MATCH CENTRE */}
                <section id="matches" className="scroll-mt-28">
                  <h2 className={SECTION_HEADING}>{t('sporthub.match_centre')}</h2>
                  <h3 className="mb-4 mt-1 font-display text-2xl uppercase tracking-tight text-primary">{t('browser.fixtures_results')}</h3>
                  <MatchDayBrowser sportId={sportId} accent={theme.accent} leagues={leagues} showSidebar={false} />
                </section>

                {/* LEAGUES */}
                {leagues.length > 0 && (
                  <section id="leagues" className="scroll-mt-28">
                    <h2 className={SECTION_HEADING}>{t('footer.competitions')}</h2>
                    <h3 className="mb-4 mt-1 font-display text-2xl uppercase tracking-tight text-primary">Competitions</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {leagues.map((l) => (
                        <Link key={l.id} to={`/leagues/${l.id}`} className="group flex items-center gap-3 rounded-2xl border border-hairline bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-brand/40">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: theme.accent }}><Trophy size={16} /></span>
                          <div className="min-w-0">
                            <p className="truncate font-bold text-primary group-hover:text-brand-text">{l.name}</p>
                            <p className="truncate text-[11px] text-tertiary">Season {l.season} · {l._count?.teams ?? 0} teams</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {/* TEAMS */}
                {teams.length > 0 && (
                  <section id="teams" className="scroll-mt-28">
                    <h2 className={SECTION_HEADING}>Clubs</h2>
                    <h3 className="mb-4 mt-1 font-display text-2xl uppercase tracking-tight text-primary">Teams</h3>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {teams.slice(0, 12).map((tm) => (
                        <Link key={tm.id} to="/teams" className="flex items-center gap-2.5 rounded-xl border border-hairline bg-surface p-3 transition-colors hover:border-brand/40">
                          <ClubCrest team={tm} size="md" />
                          <span className="min-w-0 truncate text-sm font-semibold text-primary">{tm.name}</span>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </main>

          {/* RAIL */}
          <aside className="mt-8 space-y-6 lg:mt-0">
            {isRacing
              ? racing.classification && (
                  <section id="standings" className="scroll-mt-28">
                    <h2 className={SECTION_HEADING}>{profile.result}</h2>
                    <h3 className="mb-3 mt-1 font-display text-lg uppercase tracking-tight text-primary">{racing.classification.title}</h3>
                    <ClassificationTable classification={racing.classification} accent={theme.accent} />
                  </section>
                )
              : <StandingsPreview league={primaryLeague} accent={theme.accent} />}

            {/* LATEST NEWS */}
            <section id="news" className="scroll-mt-28 rounded-2xl border border-hairline bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Newspaper size={15} className="text-brand" />
                  <h2 className={SECTION_HEADING}>Latest News</h2>
                </div>
                <Link to="/news" className="text-xs font-bold uppercase tracking-wider text-brand-text">View all</Link>
              </div>
              {news.length === 0 ? (
                <p className="py-4 text-sm text-tertiary">No news yet for {sport.name}.</p>
              ) : (
                <div className="space-y-4">
                  {news.map((a) => <NewsRow key={a.id} a={a} />)}
                </div>
              )}
            </section>
          </aside>
        </div>
      </ResponsiveWrapper>
    </div>
  );
};

export default SportHubPage;
