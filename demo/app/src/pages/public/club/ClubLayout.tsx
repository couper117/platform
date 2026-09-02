import React from 'react';
import { NavLink, Outlet, useOutletContext, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, MapPin, Calendar, Landmark, Users } from 'lucide-react';
import { getTeam } from '../../../api/endpoints/teams';
import { getFixtures } from '../../../api/endpoints/fixtures';
import Seo from '../../../components/shared/Seo';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import ClubCrest from '../../../components/ui/ClubCrest';
import EmptyState from '../../../components/ui/EmptyState';
import ErrorState from '../../../components/ui/ErrorState';
import Skeleton from '../../../components/ui/Skeleton';
import cn from '../../../components/ui/cn';
import PageAd from '../../../components/shared/PageAd';

/**
 * The shell every club page shares: identity, meta and the tab bar.
 *
 * WHY THIS EXISTS
 * `/teams/:id` used to be one long page — record, results, fixtures, squad and
 * standings all stacked on top of each other. That is the exact complaint a club
 * would raise about its own page: everything slammed in one place with no picture
 * and no separate pages for "team", "matches", "wins & losses", "stats" and
 * "players". Same fix as the sport section: a shell that fetches the shared data
 * ONCE, and five real routes underneath it, each linkable and each able to be
 * left without carrying the weight of the other four.
 */

/**
 * What every club tab receives.
 *
 * Typed HERE, not left as bare `useOutletContext()`, for the same reason
 * SportContext is typed: untyped it resolves to `{}` and every child ends up
 * casting its own way around the problem.
 */
export type ClubContext = {
  team: any;
  teamId: string;
  fixtures: any[];
  completed: any[];
  scheduled: any[];
  isTeamHome: (fixture: any) => boolean;
};

export const useClub = () => useOutletContext<ClubContext>();

/** @param {{ to: string, end?: boolean, children?: React.ReactNode }} props */
const Tab = ({ to, end = false, children }: { to: string; end?: boolean; children?: React.ReactNode }) => (
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

const HeaderSkeleton = () => (
  <>
    <Skeleton className="mb-4 h-4 w-24" />
    <div className="mb-3 flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-control" />
      <Skeleton className="h-5 w-20" />
    </div>
    <Skeleton className="mb-4 h-7 w-2/3 sm:h-9" />
    <Skeleton className="mb-6 h-4 w-1/2" />
  </>
);

const ClubLayout = () => {
  const { t } = useTranslation();
  const { id } = useParams();

  const {
    data: teamRes,
    isLoading: teamLoading,
    isError: teamIsError,
    refetch: refetchTeam,
  } = useQuery({
    queryKey: ['team-detail', id],
    queryFn: () => getTeam(id),
    enabled: !!id,
  });
  const team = teamRes?.data;

  // Fetched HERE, not in each tab: matches, record and stats all reduce over the
  // same fixture list, and a child that re-requested it would triple the network
  // cost of this page for data the shell already holds.
  const { data: fixturesRes } = useQuery({
    queryKey: ['team-fixtures', id],
    queryFn: () => getFixtures({ teamId: id }),
    enabled: !!id,
  });
  const fixtures = fixturesRes?.data || [];

  const teamId = id != null ? String(id) : '';
  const isTeamHome = (f: any) => String(f.homeTeamId ?? f.homeTeam?.id) === teamId;
  const completed = fixtures.filter((f: any) => f.status === 'COMPLETED');
  const scheduled = fixtures.filter((f: any) => f.status === 'SCHEDULED');

  if (teamLoading) {
    return (
      <div className="min-h-screen bg-page">
        <div className="mx-auto max-w-3xl px-4 pb-10 pt-4 lg:max-w-6xl lg:px-6 lg:pb-14 lg:pt-6">
          <HeaderSkeleton />
          <Skeleton className="h-64 w-full rounded-card" />
        </div>
      </div>
    );
  }

  if (teamIsError) {
    return (
      <div className="min-h-screen bg-page">
        <div className="mx-auto max-w-3xl px-4 pt-4 lg:max-w-6xl lg:px-6 lg:pt-6">
          <Link
            to="/teams"
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-secondary transition-colors duration-150 ease-standard hover:text-brand-text"
          >
            <ChevronLeft size={14} aria-hidden="true" /> {t('team.back_to_teams')}
          </Link>
          <ErrorState title={t('team.detail_error_title')} hint={t('team.detail_error_hint')} onRetry={refetchTeam} />
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <EmptyState
          icon={Users}
          title={t('team.not_found_title')}
          hint={t('team.not_found_hint')}
          action={<Button to="/teams">{t('team.back_to_teams')}</Button>}
        />
      </div>
    );
  }

  // No photo/banner field exists on the team record (mockData's team shape carries
  // only `logo`, `primaryColor` and `secondaryColor` — see src/api/demo/mockData.ts).
  // The crest IS the club's picture here; nothing is invented behind it.
  const locationLine = [team.city, team.district].filter(Boolean).join(', ');
  const base = `/teams/${id}`;

  return (
    <div className="min-h-screen bg-page">
      <Seo title={team.name} description={t('team.seo_desc', { team: team.name })} />

      <div className="mx-auto max-w-3xl px-4 pt-4 lg:max-w-6xl lg:px-6 lg:pt-6">
        <Link
          to="/teams"
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-secondary transition-colors duration-150 ease-standard hover:text-brand-text"
        >
          <ChevronLeft size={14} aria-hidden="true" /> {t('team.back_to_teams')}
        </Link>

        <div className="mb-2 flex items-center gap-3">
          <ClubCrest team={team} size="lg" />
          {team.sport?.name && <Badge>{team.sport.name}</Badge>}
        </div>

        <h1 className="mb-3 font-display text-xl font-extrabold tracking-[-0.02em] text-primary sm:mb-4 sm:text-3xl">
          {team.name}
        </h1>

        <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-secondary">
          {locationLine && (
            <span className="flex items-center gap-1.5">
              <MapPin size={14} className="text-tertiary" aria-hidden="true" />
              {locationLine}
            </span>
          )}
          {team.foundedYear && (
            <span className="flex items-center gap-1.5">
              <Calendar size={14} className="text-tertiary" aria-hidden="true" />
              {t('team.founded_year', { year: team.foundedYear })}
            </span>
          )}
          {team.homeVenue && (
            <span className="flex items-center gap-1.5">
              <Landmark size={14} className="text-tertiary" aria-hidden="true" />
              {team.homeVenue}
            </span>
          )}
        </div>

        {/* Real routes, not anchors: each is linkable, and Back undoes it. */}
        <nav
          aria-label={t('team.nav_label', 'Team sections')}
          className="scroll-contain flex items-stretch gap-6 overflow-x-auto border-b border-hairline"
        >
          <Tab to={base} end>{t('team.nav_overview')}</Tab>
          <Tab to={`${base}/matches`}>{t('team.nav_matches')}</Tab>
          <Tab to={`${base}/record`}>{t('team.nav_record')}</Tab>
          <Tab to={`${base}/stats`}>{t('team.nav_stats')}</Tab>
          <Tab to={`${base}/players`}>{t('team.nav_players')}</Tab>
        </nav>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6 lg:max-w-6xl lg:px-6 lg:py-8">
        <Outlet context={{ team, teamId, fixtures, completed, scheduled, isTeamHome }} />
      </div>
      {/* Advertising sits at the FOOT of the page, after the content, never
          spliced into it. An advert dropped between two fixtures or two
          paragraphs interrupts the thing the reader came for; down here it is
          the last item on the screen and costs the page nothing. AdSlot
          collapses to nothing when the position has no inventory. */}
      <div className="mx-auto max-w-3xl px-4 pb-8 lg:max-w-6xl lg:px-6 lg:pb-12">
        <PageAd position="club" />
      </div>
    </div>
  );
};

export default ClubLayout;
