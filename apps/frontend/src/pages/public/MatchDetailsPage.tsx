import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, AlertCircle } from 'lucide-react';
import { getFixture } from '../../api/endpoints/fixtures';
import useLiveMatch from '../../hooks/useLiveMatch';
import { matchState } from '../../components/match/MatchRow';
import MatchScoreboard from '../../components/match/MatchScoreboard';
import MatchLineups from '../../components/match/MatchLineups';
import MatchStats from '../../components/match/MatchStats';
import MatchComments from '../../components/match/MatchComments';
import MatchUmugandaBanner from '../../components/umuganda/MatchUmugandaBanner';
import MatchEventTimeline from '../../components/shared/MatchEventTimeline';
import Seo from '../../components/shared/Seo';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import Button from '../../components/ui/Button';
import { useDateFormat } from '../../i18n/dateLocale';
import { useEnumLabel } from '../../i18n/enums';
import cn from '../../components/ui/cn';

/**
 * /matches/:id — the single-match page.
 *
 * WHY THIS SHAPE
 * Everything above the tabs (MatchScoreboard) never disappears: the score, the
 * state and the two clubs are what a fan re-checks constantly, live or not, so
 * they should not be one tap away behind "Summary". Below that, four underline
 * tabs — the exact tab markup SportLayout already established — hold the four
 * things a fan asks next: what happened (Summary — match details + the event
 * feed), who's playing (Lineups), the numbers (Stats), and the conversation
 * (Comments, local to this device — there is no comments API).
 *
 * Tab selection is plain component state, not a URL param: a live refetch every
 * ~20s must never knock a fan out of the tab they're reading.
 */

type TabKey = 'summary' | 'lineups' | 'stats' | 'comments';

const TabButton = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'relative flex min-h-tap shrink-0 items-center whitespace-nowrap px-0.5 text-sm font-semibold',
      'transition-colors duration-150 ease-standard',
      'after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:content-[""]',
      active ? 'text-primary after:bg-brand' : 'text-secondary after:bg-transparent hover:text-primary'
    )}
  >
    {children}
  </button>
);

const MatchDetailsPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const formatDate = useDateFormat();
  const enumLabel = useEnumLabel();
  const [tab, setTab] = useState<TabKey>('summary');

  const {
    data: fixtureRes,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['match-details', id],
    queryFn: () => getFixture(id),
    // Live matches only: a finished or upcoming fixture has nothing new to
    // pull every 20s, so polling stays off until the REST payload itself says
    // LIVE. Real-time push (see useLiveMatch) still covers the gap in between.
    refetchInterval: (query: any) => (query.state.data?.data?.status === 'LIVE' ? 20000 : false),
  });

  const m = fixtureRes?.data;
  // Pass `refetch` so a dropped socket re-syncs authoritative state instead of
  // leaving fans on a stale score. See hooks/useLiveMatch.
  const { live, connected } = useLiveMatch(id, m, refetch);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-3 px-4 pt-6 lg:max-w-6xl lg:px-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-56 w-full rounded-card" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full rounded-card" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 lg:max-w-6xl lg:px-6">
        <ErrorState title={t('match.error_title')} hint={t('match.error_hint')} onRetry={refetch} />
      </div>
    );
  }

  if (!m) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <EmptyState
          icon={AlertCircle}
          title={t('match.not_found')}
          hint={t('match.not_found_hint')}
          action={<Button to="/fixtures">{t('match.back_to_schedule')}</Button>}
        />
      </div>
    );
  }

  const state = matchState({ ...m, status: live.status || m.status });
  const isLive = state === 'live' || state === 'halftime';

  const statusText =
    state === 'live' || state === 'halftime'
      ? t('match.live')
      : state === 'fulltime'
        ? t('match.full_time')
        : state === 'upcoming'
          ? t('match.not_started')
          : enumLabel('match_status', m.status, m.status);

  const infoRows: Array<[string, React.ReactNode]> = [
    [t('match.competition'), m.league?.name || '—'],
    [t('match.status'), statusText],
    [t('match.date'), m.matchDate ? formatDate(m.matchDate, 'EEEE, d MMM yyyy') : t('common.tbd')],
    [t('match.kick_off'), m.matchDate ? formatDate(m.matchDate, 'HH:mm') : t('common.tbd')],
    [t('match.venue'), m.venue || t('common.tbd')],
    [t('match.referee'), m.referee || '—'],
    // A live feed is somebody's work. Crediting them is the point of having
    // reporters rather than an anonymous ticker.
    [t('match.reported_by', 'Reported by'),
      (m.assignedReporters || []).map((a: any) => a.user?.fullName).filter(Boolean).join(', ') || '—'],
    [t('match.matchday'), m.matchday ? `${t('match.round')} ${m.matchday}` : '—'],
    [t('match.attendance'), m.attendance ? Number(m.attendance).toLocaleString() : '—'],
  ];

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: 'summary', label: t('match.summary_accent') },
    { key: 'lineups', label: t('match.lineups') },
    { key: 'stats', label: t('match.stats') },
    { key: 'comments', label: t('match.comments') },
  ];

  return (
    <div className="min-h-screen bg-page pb-16">
      <Seo
        title={`${m.homeTeam?.name} ${t('match.versus')} ${m.awayTeam?.name}`}
        description={`${m.homeTeam?.name} vs ${m.awayTeam?.name} — ${m.league?.name || ''}`.trim()}
      />

      <div className="mx-auto max-w-3xl px-4 pt-4 lg:max-w-6xl lg:px-6 lg:pt-6">
        <Link
          to="/fixtures"
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-secondary transition-colors duration-150 ease-standard hover:text-brand-text"
        >
          <ChevronLeft size={14} aria-hidden="true" /> {t('match.back_to_schedule')}
        </Link>

        <MatchScoreboard fixture={m} live={live} connected={connected} />

        <div className="mt-4">
          <MatchUmugandaBanner fixture={m} />
        </div>

        <nav
          aria-label={t('match.section_nav')}
          className="scroll-contain mt-6 flex items-stretch gap-6 overflow-x-auto border-b border-hairline"
        >
          {tabs.map((tb) => (
            <TabButton key={tb.key} active={tab === tb.key} onClick={() => setTab(tb.key)}>
              {tb.label}
            </TabButton>
          ))}
        </nav>

        <div className="py-6">
          {tab === 'summary' && (
            <div className="space-y-6">
              <div className="rounded-card border border-hairline bg-surface p-4 sm:p-6">
                <h2 className="font-display text-lg font-bold text-primary">{t('match.match_info')}</h2>
                <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-3">
                  {infoRows.map(([k, v]) => (
                    <div key={String(k)}>
                      <dt className="text-xs text-tertiary">{k}</dt>
                      <dd className="mt-0.5 font-medium text-primary">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div>
                <h2 className="mb-3 font-display text-lg font-bold text-primary">{t('match.timeline')}</h2>
                {/* MatchEventTimeline sorts newest-first itself and owns its
                    own empty state, live or not. */}
                <MatchEventTimeline events={live.events || []} homeTeamId={m.homeTeamId} />
              </div>
            </div>
          )}

          {tab === 'lineups' && <MatchLineups fixture={m} />}

          {tab === 'stats' && <MatchStats fixture={m} live={live} isLive={isLive} connected={connected} />}

          {tab === 'comments' && <MatchComments matchId={id as string} />}
        </div>
      </div>
    </div>
  );
};

export default MatchDetailsPage;
