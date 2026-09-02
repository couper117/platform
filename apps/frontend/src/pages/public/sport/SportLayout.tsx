import React from 'react';
import { NavLink, Outlet, useOutletContext, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Trophy, Users, Calendar, Radio, AlertCircle } from 'lucide-react';
import apiClient from '../../../api/client';
import { getSport } from '../../../api/endpoints/sports';
import { getLeagues } from '../../../api/endpoints/leagues';
import { getFixtures } from '../../../api/endpoints/fixtures';
import { getNews } from '../../../api/endpoints/news';
import { SPORT_PHOTOS } from '../../../config/heroMedia';
import SportIcon from '../../../components/shared/SportIcon';
import Seo from '../../../components/shared/Seo';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';
import ErrorState from '../../../components/ui/ErrorState';
import Skeleton from '../../../components/ui/Skeleton';
import cn from '../../../components/ui/cn';
import PageAd from '../../../components/shared/PageAd';

/**
 * The shell every sport page shares: identity, the four counters, and the tabs.
 *
 * WHY THIS EXISTS
 * `/sports/:slug` used to be ONE very long page with anchor links at the top —
 * clicking "Teams" scrolled you down a screen and a half to a grid, "Standings"
 * scrolled further, and everything was mounted and fetched whether you looked at
 * it or not. Anchors are not navigation: they cannot be linked to meaningfully,
 * back does not undo them, and the page grows without limit as sections are added.
 *
 * Each tab is now a real route with its own page. The shell holds what is true on
 * all of them — which sport this is, and how much of it there is — and fetches the
 * shared data ONCE, handing it down through the outlet context so a child never
 * re-requests what its siblings already have.
 */

/* ─── shared data, fetched once for every child ─────────────────────────── */

/**
 * What every sport tab receives.
 *
 * Typed HERE rather than left as bare `useOutletContext()`. Untyped it resolves to
 * `{}`, so every child reading `live` or `teams` off it fails the typecheck and each
 * one ends up casting its way around the problem separately — which is how four
 * pages acquire four different private shapes for the same object.
 */
export type SportContext = {
  sport: any;
  sportId: any;
  slug?: string;
  leagues: any[];
  primaryLeague: any | null;
  fixtures: any[];
  live: any[];
  upcoming: any[];
  results: any[];
  news: any[];
  teams: any[];
};

export const useSport = () => useOutletContext<SportContext>();

/** @param {{ icon: any, value: any, label: any, live?: boolean }} props */
const Stat = ({ icon: Icon, value, label, live = false }) => (
  <span className="flex items-center gap-1.5">
    <Icon size={14} aria-hidden="true" className={live ? 'text-live' : 'text-tertiary'} />
    <span className={cn('text-sm font-semibold tabular-nums', live ? 'text-live' : 'text-primary')}>{value}</span>
    <span className="text-sm text-tertiary">{label}</span>
  </span>
);

/** @param {{ to: string, end?: boolean, children?: React.ReactNode }} props */
const Tab = ({ to, end = false, children }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      cn(
        'relative flex min-h-tap shrink-0 items-center whitespace-nowrap px-0.5 text-sm font-semibold',
        'transition-colors duration-150 ease-standard',
        'after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:content-[""]',
        isActive ? 'text-primary after:bg-brand' : 'text-secondary after:bg-transparent hover:text-primary'
      )
    }
  >
    {children}
  </NavLink>
);

const SportLayout = () => {
  const { t } = useTranslation();
  const { slug } = useParams();

  const { data: sportRes, isLoading, isError, refetch } = useQuery({
    queryKey: ['sport', slug],
    queryFn: () => getSport(slug),
    retry: 1,
  });
  const sport = sportRes?.data;
  const sportId = sport?.id;

  // Fetched HERE, not in each tab: the counters need all four, and a child that
  // re-requested them would double every page's network cost for nothing.
  const { data: leaguesRes } = useQuery({ queryKey: ['sport-leagues', sportId], queryFn: () => getLeagues({ sportId }), enabled: !!sportId });
  const { data: fixturesRes } = useQuery({ queryKey: ['sport-fixtures', sportId], queryFn: () => getFixtures({ sportId }), enabled: !!sportId });
  const { data: newsRes } = useQuery({ queryKey: ['sport-news', sportId], queryFn: () => getNews({ sportId }), enabled: !!sportId });
  const { data: teamsRes } = useQuery({
    queryKey: ['sport-teams', sportId],
    queryFn: async () => (await apiClient.get('/teams', { params: { sportId } })).data,
    enabled: !!sportId,
  });

  const leagues = leaguesRes?.data || [];
  const fixtures = fixturesRes?.data || [];
  const news = newsRes?.data || [];
  const teams = teamsRes?.data || [];
  const live = fixtures.filter((f) => f.status === 'LIVE');
  const upcoming = fixtures.filter((f) => f.status === 'SCHEDULED');
  const results = fixtures.filter((f) => f.status === 'COMPLETED');
  const primaryLeague = leagues[0] || null;
  const hasPhoto = SPORT_PHOTOS.has(slug);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-3 px-4 pt-6 lg:max-w-6xl lg:px-6">
        <Skeleton className="h-[220px] w-full rounded-card" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-card" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 lg:max-w-6xl lg:px-6">
        <ErrorState title={t('sporthub.error_title')} hint={t('sporthub.error_hint')} onRetry={refetch} />
      </div>
    );
  }

  if (!sport) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <EmptyState icon={AlertCircle} title={t('sporthub.not_found')} action={<Button to="/">{t('sporthub.back_home')}</Button>} />
      </div>
    );
  }

  const base = `/sports/${slug}`;

  return (
    <div className="min-h-screen bg-page">
      <Seo title={sport.name} description={t('sporthub.seo_desc', { sport: sport.name })} />

      {/* ─── IDENTITY ─── a photograph of THIS sport in Rwanda where one exists;
          the plain header where one does not. Never another sport's picture. */}
      {hasPhoto ? (
        <div className="relative h-[220px] overflow-hidden sm:h-[260px] lg:h-[300px]">
          <img src={`/hero/${slug}.jpg`} alt="" fetchpriority="high" className="absolute inset-0 h-full w-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
          <div className="relative mx-auto flex h-full max-w-3xl flex-col justify-end px-4 pb-5 lg:max-w-6xl lg:px-6 lg:pb-6">
            <Link to="/" className="mb-auto mt-4 inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-white/80 transition-colors duration-150 ease-standard hover:text-white">
              <ChevronLeft size={14} aria-hidden="true" /> {t('sporthub.all_sports')}
            </Link>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/70">{t('sporthub.rwanda')}</p>
            <h1 className="font-display text-3xl font-extrabold tracking-[-0.03em] text-white sm:text-4xl lg:text-5xl">{sport.name}</h1>
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-3xl px-4 pt-4 lg:max-w-6xl lg:px-6 lg:pt-6">
        {!hasPhoto && (
          <>
            <Link to="/" className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-secondary transition-colors duration-150 ease-standard hover:text-brand-text">
              <ChevronLeft size={14} aria-hidden="true" /> {t('sporthub.all_sports')}
            </Link>
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-hairline bg-surface-2 text-primary">
                <SportIcon slug={slug} size={16} />
              </span>
              <Badge>{t('sporthub.rwanda')}</Badge>
            </div>
            <h1 className="mb-3 font-display text-xl font-extrabold tracking-[-0.02em] text-primary sm:mb-4 sm:text-3xl">{sport.name}</h1>
          </>
        )}

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pb-4">
          <Stat icon={Trophy} value={leagues.length} label={t('sporthub.leagues')} />
          <Stat icon={Users} value={teams.length} label={t('sporthub.teams')} />
          <Stat icon={Calendar} value={upcoming.length} label={t('sporthub.upcoming')} />
          <Stat icon={Radio} value={live.length} label={t('sporthub.live_now')} live={live.length > 0} />
        </div>

        {/* Real routes, not anchors: each is linkable, and Back undoes it. */}
        <nav aria-label={t('sporthub.nav_label', 'Sport sections')} className="scroll-contain flex items-stretch gap-6 overflow-x-auto border-b border-hairline">
          <Tab to={base} end>{t('sporthub.nav_overview')}</Tab>
          <Tab to={`${base}/matches`}>{t('sporthub.nav_matches')}</Tab>
          <Tab to={`${base}/teams`}>{t('sporthub.nav_teams')}</Tab>
          <Tab to={`${base}/standings`}>{t('sporthub.nav_standings')}</Tab>
          <Tab to={`${base}/news`}>{t('sporthub.nav_news')}</Tab>
        </nav>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6 lg:max-w-6xl lg:px-6 lg:py-8">
        <Outlet context={{ sport, sportId, slug, leagues, primaryLeague, fixtures, live, upcoming, results, news, teams }} />
      </div>
      {/* Advertising sits at the FOOT of the page, after the content, never
          spliced into it. An advert dropped between two fixtures or two
          paragraphs interrupts the thing the reader came for; down here it is
          the last item on the screen and costs the page nothing. AdSlot
          collapses to nothing when the position has no inventory. */}
      <div className="mx-auto max-w-3xl px-4 pb-8 lg:max-w-6xl lg:px-6 lg:pb-12">
        <PageAd position="sport" />
      </div>
    </div>
  );
};

export default SportLayout;
